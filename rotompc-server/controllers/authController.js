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

/* =========================================================
   GOOGLE CLIENT
========================================================= */

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =========================================================
   SOCIAL NAME SANITIZER
========================================================= */

const sanitizeSocialName = (value) =>
  String(value || "")
    .replace(/[^A-Za-z\s\-']/g, "")
    .trim()
    .slice(0, 50);

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
      $or: [
        {
          googleId,
        },

        {
          email,
        },
      ],
    });

    /* -----------------------------------------------------
         NEW GOOGLE USER
      ----------------------------------------------------- */

    if (!user) {
      const username = await createUniqueUsername(email.split("@")[0]);

      const trainerCode = await createUniqueTrainerCode();

      user = await User.create({
        firstName: sanitizeSocialName(payload.given_name),

        lastName: sanitizeSocialName(payload.family_name),

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
         * Google does not
         * supply the remaining
         * required Trainer data.
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

      if (!user.firstName && payload.given_name) {
        user.firstName = sanitizeSocialName(payload.given_name);
      }

      if (!user.lastName && payload.family_name) {
        user.lastName = sanitizeSocialName(payload.family_name);
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
   FACEBOOK CONFIG
========================================================= */

const getFacebookConfig = () => {
  const appId = String(process.env.FACEBOOK_APP_ID || "").trim();

  const appSecret = String(process.env.FACEBOOK_APP_SECRET || "").trim();

  const graphVersion = String(process.env.FACEBOOK_GRAPH_VERSION || "").trim();

  if (!appId || !appSecret || !graphVersion) {
    const error = new Error("Facebook authentication is not configured.");

    error.code = "FACEBOOK_CONFIG";

    throw error;
  }

  if (!/^v\d+\.\d+$/.test(graphVersion)) {
    const error = new Error("FACEBOOK_GRAPH_VERSION is invalid.");

    error.code = "FACEBOOK_CONFIG";

    throw error;
  }

  return {
    appId,

    appSecret,

    graphVersion,
  };
};

/* =========================================================
   FACEBOOK FETCH JSON
========================================================= */

const facebookFetchJson = async (url) => {
  const response = await fetch(url, {
    method: "GET",

    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  return {
    response,

    data,
  };
};

/* =========================================================
   VERIFY FACEBOOK ACCESS TOKEN
========================================================= */

const verifyFacebookAccessToken = async (accessToken) => {
  const {
    appId,

    appSecret,

    graphVersion,
  } = getFacebookConfig();

  const appAccessToken = `${appId}|${appSecret}`;

  /* -----------------------------------------------------
       DEBUG USER TOKEN
    ----------------------------------------------------- */

  const debugUrl = new URL(
    `https://graph.facebook.com/${graphVersion}/debug_token`,
  );

  debugUrl.searchParams.set(
    "input_token",

    accessToken,
  );

  debugUrl.searchParams.set(
    "access_token",

    appAccessToken,
  );

  const {
    response: debugResponse,

    data: debugResult,
  } = await facebookFetchJson(debugUrl);

  const debugData = debugResult?.data;

  if (
    !debugResponse.ok ||
    !debugData?.is_valid ||
    !debugData?.user_id ||
    String(debugData.app_id) !== String(appId)
  ) {
    const error = new Error("Facebook access token is invalid.");

    error.code = "FACEBOOK_TOKEN";

    throw error;
  }

  /* -----------------------------------------------------
       LOAD USER PROFILE
    ----------------------------------------------------- */

  const profileUrl = new URL(`https://graph.facebook.com/${graphVersion}/me`);

  profileUrl.searchParams.set(
    "fields",

    ["id", "first_name", "last_name", "name", "email"].join(","),
  );

  profileUrl.searchParams.set(
    "access_token",

    accessToken,
  );

  const {
    response: profileResponse,

    data: profile,
  } = await facebookFetchJson(profileUrl);

  if (!profileResponse.ok || !profile?.id) {
    const error = new Error("Facebook profile could not be loaded.");

    error.code = "FACEBOOK_TOKEN";

    throw error;
  }

  /*
   * The profile returned by /me
   * must belong to the user ID
   * from /debug_token.
   */

  if (String(profile.id) !== String(debugData.user_id)) {
    const error = new Error(
      "Facebook identity did not match the verified access token.",
    );

    error.code = "FACEBOOK_TOKEN";

    throw error;
  }

  return profile;
};

/* =========================================================
   FACEBOOK AUTH
========================================================= */

const facebookAuth = async (req, res) => {
  try {
    const accessToken = String(req.body?.accessToken || "").trim();

    if (!accessToken) {
      return res.status(400).json({
        message: "Facebook access token is required.",
      });
    }

    /* ---------------------------------------------------
         VALIDATE TOKEN WITH META
      --------------------------------------------------- */

    const profile = await verifyFacebookAccessToken(accessToken);

    const facebookId = String(profile.id);

    const email = String(profile.email || "")
      .toLowerCase()
      .trim();

    /*
     * RotomPC requires email
     * as the unique account
     * identity.
     */

    if (!email) {
      return res.status(400).json({
        message:
          "Facebook did not provide an email address. Please allow email access and try again.",
      });
    }

    let user = await User.findOne({
      $or: [
        {
          facebookId,
        },

        {
          email,
        },
      ],
    });

    /* -----------------------------------------------------
         NEW FACEBOOK USER
      ----------------------------------------------------- */

    if (!user) {
      const username = await createUniqueUsername(email.split("@")[0]);

      const trainerCode = await createUniqueTrainerCode();

      user = await User.create({
        firstName: sanitizeSocialName(profile.first_name),

        lastName: sanitizeSocialName(profile.last_name),

        email,

        username,

        facebookId,

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
         * Facebook does not
         * provide RotomPC's
         * age/gender/contact
         * requirements.
         */
        profileCompleted: false,
      });
    } else {
      /* ---------------------------------------------------
           LINK FACEBOOK TO EXISTING ACCOUNT
        --------------------------------------------------- */

      if (user.facebookId && String(user.facebookId) !== facebookId) {
        return res.status(409).json({
          message:
            "This email is already connected to another Facebook account.",
        });
      }

      if (!user.facebookId) {
        user.facebookId = facebookId;
      }

      if (!user.firstName && profile.first_name) {
        user.firstName = sanitizeSocialName(profile.first_name);
      }

      if (!user.lastName && profile.last_name) {
        user.lastName = sanitizeSocialName(profile.last_name);
      }

      if (!user.trainerCode) {
        user.trainerCode = await createUniqueTrainerCode();
      }

      await user.save();
    }

    /* ---------------------------------------------------
         ACTIVE ACCOUNT
      --------------------------------------------------- */

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact support.",
      });
    }

    /* ---------------------------------------------------
         ROTOMPC SESSION
      --------------------------------------------------- */

    return res.json(makeSessionResponse(user));
  } catch (error) {
    console.error("facebookAuth error:", error);

    if (error.code === "FACEBOOK_CONFIG") {
      return res.status(500).json({
        message: "Facebook authentication is not configured.",
      });
    }

    return res.status(401).json({
      message: "Facebook authentication failed.",
    });
  }
};

/* =========================================================
   EMAIL / USERNAME + PASSWORD LOGIN
========================================================= */

const loginUser = async (req, res) => {
  try {
    const {
      email,

      password,
    } = req.body;

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

    /* ---------------------------------------------------
         SOCIAL-ONLY ACCOUNT
      --------------------------------------------------- */

    if (!user.password) {
      let provider = "social authentication";

      if (user.googleId) {
        provider = "Google Sign-In";
      } else if (user.facebookId) {
        provider = "Facebook Sign-In";
      }

      return res.status(400).json({
        message: `This account uses ${provider}.`,
      });
    }

    const validPassword = await bcrypt.compare(
      password,

      user.password,
    );

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

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  loginUser,

  googleAuth,

  facebookAuth,
};
