// rotompc-server/controllers/authController.js

const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");

const {
  createUniqueTrainerCode,
  createUniqueUsername,
  ensureTrainerCode,
  makeSessionResponse,
} = require("../utils/userHelpers");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =========================================================
   GOOGLE AUTH
========================================================= */

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is not configured.");

      return res.status(500).json({
        message: "Google authentication is not configured.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || payload.email_verified !== true) {
      return res.status(401).json({
        message: "Google account could not be verified.",
      });
    }

    const googleId = String(payload.sub);

    const email = String(payload.email).toLowerCase().trim();

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    /* -----------------------------------------------------
       NEW GOOGLE USER
    ----------------------------------------------------- */

    if (!user) {
      const username = await createUniqueUsername(email.split("@")[0]);

      const trainerCode = await createUniqueTrainerCode();

      user = await User.create({
        firstName: String(payload.given_name || "").trim(),

        lastName: String(payload.family_name || "").trim(),

        email,
        username,

        googleId,

        role: "trainer",
        isActive: true,

        trainerCode,

        bio: "",
        region: "",

        favoritePokemon: {
          id: null,
          name: "",
        },

        favoriteType: "",

        profileVisibility: "public",

        /*
         * Google does not provide
         * age/gender/contact details.
         */
        profileCompleted: false,
      });
    } else {
      /* ---------------------------------------------------
         LINK GOOGLE TO EXISTING ACCOUNT
      --------------------------------------------------- */

      if (user.googleId && String(user.googleId) !== googleId) {
        return res.status(409).json({
          message: "This email is already connected to another Google account.",
        });
      }

      if (!user.googleId) {
        user.googleId = googleId;
      }

      /*
       * Fill name only when currently
       * missing. Never overwrite a
       * trainer's existing name.
       */
      if (!user.firstName && payload.given_name) {
        user.firstName = String(payload.given_name).trim();
      }

      if (!user.lastName && payload.family_name) {
        user.lastName = String(payload.family_name).trim();
      }

      if (!user.trainerCode) {
        user.trainerCode = await createUniqueTrainerCode();
      }

      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact support.",
      });
    }

    return res.json(makeSessionResponse(user));
  } catch (error) {
    console.error("googleAuth error:", error);

    return res.status(401).json({
      message: "Google authentication failed.",
    });
  }
};

/* =========================================================
   APPLE AUTH HELPERS
========================================================= */

let appleJWKS = null;

const getAppleTools = async () => {
  const { SignJWT, importPKCS8, createRemoteJWKSet, jwtVerify } =
    await import("jose");

  if (!appleJWKS) {
    appleJWKS = createRemoteJWKSet(
      new URL("https://appleid.apple.com/auth/keys"),
    );
  }

  return {
    SignJWT,
    importPKCS8,
    jwtVerify,
    appleJWKS,
  };
};

const validateAppleConfig = () => {
  const required = [
    "APPLE_CLIENT_ID",
    "APPLE_TEAM_ID",
    "APPLE_KEY_ID",
    "APPLE_PRIVATE_KEY",
    "APPLE_REDIRECT_URI",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing Apple configuration: ${missing.join(", ")}`);
  }
};

const createAppleClientSecret = async () => {
  validateAppleConfig();

  const { SignJWT, importPKCS8 } = await getAppleTools();

  const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");

  const key = await importPKCS8(privateKey, "ES256");

  return new SignJWT({})
    .setProtectedHeader({
      alg: "ES256",
      kid: process.env.APPLE_KEY_ID,
    })
    .setIssuer(process.env.APPLE_TEAM_ID)
    .setAudience("https://appleid.apple.com")
    .setSubject(process.env.APPLE_CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
};

const sanitizeAppleName = (value) =>
  String(value || "")
    .replace(/[^A-Za-z\s\-']/g, "")
    .trim()
    .slice(0, 50);

/* =========================================================
   APPLE AUTH
========================================================= */

const appleAuth = async (req, res) => {
  try {
    const { code, nonce, user: appleUser } = req.body;

    if (!code) {
      return res.status(400).json({
        message: "Apple authorization code is required.",
      });
    }

    validateAppleConfig();

    const clientSecret = await createAppleClientSecret();

    const body = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID,

      client_secret: clientSecret,

      code,

      grant_type: "authorization_code",

      redirect_uri: process.env.APPLE_REDIRECT_URI,
    });

    const appleResponse = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },

      body: body.toString(),
    });

    const tokenResult = await appleResponse.json();

    if (!appleResponse.ok || !tokenResult.id_token) {
      console.error("Apple token exchange error:", tokenResult);

      return res.status(401).json({
        message: "Apple authorization could not be verified.",
      });
    }

    const { jwtVerify, appleJWKS: jwks } = await getAppleTools();

    const { payload } = await jwtVerify(tokenResult.id_token, jwks, {
      issuer: "https://appleid.apple.com",

      audience: process.env.APPLE_CLIENT_ID,
    });

    if (!payload?.sub) {
      return res.status(401).json({
        message: "Apple identity is invalid.",
      });
    }

    /*
     * Verify the nonce when Apple
     * returns one.
     */
    if (nonce && String(payload.nonce || "") !== String(nonce)) {
      return res.status(401).json({
        message: "Apple authentication nonce did not match.",
      });
    }

    const appleId = String(payload.sub);

    const email = payload.email
      ? String(payload.email).toLowerCase().trim()
      : null;

    if (email) {
      const emailVerified =
        payload.email_verified === true || payload.email_verified === "true";

      if (!emailVerified) {
        return res.status(401).json({
          message: "Apple email address could not be verified.",
        });
      }
    }

    const searchConditions = [{ appleId }];

    if (email) {
      searchConditions.push({
        email,
      });
    }

    let user = await User.findOne({
      $or: searchConditions,
    });

    /* -----------------------------------------------------
       NEW APPLE USER
    ----------------------------------------------------- */

    if (!user) {
      if (!email) {
        return res.status(400).json({
          message: "Apple did not provide an email address for this account.",
        });
      }

      const username = await createUniqueUsername(email.split("@")[0]);

      const trainerCode = await createUniqueTrainerCode();

      user = await User.create({
        firstName: sanitizeAppleName(appleUser?.name?.firstName),

        lastName: sanitizeAppleName(appleUser?.name?.lastName),

        email,
        username,

        appleId,

        role: "trainer",
        isActive: true,

        trainerCode,

        bio: "",
        region: "",

        favoritePokemon: {
          id: null,
          name: "",
        },

        favoriteType: "",

        profileVisibility: "public",

        profileCompleted: false,
      });
    } else {
      /* ---------------------------------------------------
         LINK EXISTING USER
      --------------------------------------------------- */

      if (user.appleId && String(user.appleId) !== appleId) {
        return res.status(409).json({
          message: "This email is already connected to another Apple account.",
        });
      }

      if (!user.appleId) {
        user.appleId = appleId;
      }

      /*
       * Apple normally sends the name
       * only during first consent.
       */
      if (!user.firstName && appleUser?.name?.firstName) {
        user.firstName = sanitizeAppleName(appleUser.name.firstName);
      }

      if (!user.lastName && appleUser?.name?.lastName) {
        user.lastName = sanitizeAppleName(appleUser.name.lastName);
      }

      if (!user.trainerCode) {
        user.trainerCode = await createUniqueTrainerCode();
      }

      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact support.",
      });
    }

    return res.json(makeSessionResponse(user));
  } catch (error) {
    console.error("appleAuth error:", error);

    if (error.message?.startsWith("Missing Apple configuration")) {
      return res.status(500).json({
        message: "Apple authentication is not configured.",
      });
    }

    return res.status(401).json({
      message: "Apple authentication failed.",
    });
  }
};

/* =========================================================
   EMAIL / USERNAME + PASSWORD LOGIN
========================================================= */

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const identifier = String(email || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Username/email and password are required.",
      });
    }

    const user = await User.findOne({
      $or: [
        {
          email: identifier.toLowerCase(),
        },

        {
          username: identifier,
        },
      ],
    }).select("+password");

    /*
     * Same response for an unknown
     * user or incorrect password.
     */
    if (!user) {
      return res.status(401).json({
        message: "Invalid username/email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact support.",
      });
    }

    /*
     * Social-only accounts may not
     * have a local password.
     */
    if (!user.password) {
      let provider = "social authentication";

      if (user.googleId) {
        provider = "Google Sign-In";
      } else if (user.appleId) {
        provider = "Apple Sign-In";
      }

      return res.status(400).json({
        message: `This account uses ${provider}.`,
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid username/email or password.",
      });
    }

    await ensureTrainerCode(user);

    return res.json(makeSessionResponse(user));
  } catch (error) {
    console.error("loginUser error:", error);

    return res.status(500).json({
      message: "Unable to sign in.",
    });
  }
};

module.exports = {
  loginUser,
  googleAuth,
  appleAuth,
};
