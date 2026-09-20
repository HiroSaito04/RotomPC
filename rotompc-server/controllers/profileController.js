// rotompc-server/controllers/profileController.js

const User = require("../models/User");

const { POKEMON_TYPES } = require("../constants/pokemon");

const { ensureTrainerCode } = require("../utils/userHelpers");

/* =========================================================
   PROFILE COMPLETION VALIDATION
========================================================= */

const validateCompletedProfile = ({
  firstName,
  lastName,
  age,
  gender,
  contactNumber,
}) => {
  const errors = [];

  const nameRegex = /^[A-Za-z\s\-']+$/;

  const normalizedFirstName = String(firstName || "").trim();

  const normalizedLastName = String(lastName || "").trim();

  if (
    normalizedFirstName.length < 2 ||
    normalizedFirstName.length > 50 ||
    !nameRegex.test(normalizedFirstName)
  ) {
    errors.push("First name must contain 2-50 letters.");
  }

  if (
    normalizedLastName.length < 2 ||
    normalizedLastName.length > 50 ||
    !nameRegex.test(normalizedLastName)
  ) {
    errors.push("Last name must contain 2-50 letters.");
  }

  const parsedAge = Number.parseInt(age, 10);

  if (Number.isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100) {
    errors.push("Age must be between 18 and 100.");
  }

  const normalizedGender = String(gender || "")
    .toLowerCase()
    .trim();

  if (!["male", "female", "other"].includes(normalizedGender)) {
    errors.push("Gender must be Male, Female, or Other.");
  }

  if (!/^09\d{9}$/.test(String(contactNumber || ""))) {
    errors.push("Contact number must contain 11 digits starting with 09.");
  }

  return errors;
};

/* =========================================================
   PRIVATE CURRENT-USER RESPONSE
========================================================= */

const serializeMyProfile = (user) => ({
  id: user._id,

  firstName: user.firstName || "",

  lastName: user.lastName || "",

  username: user.username,

  email: user.email,

  age: user.age ?? null,

  gender: user.gender || "",

  contactNumber: user.contactNumber || "",

  address: user.address || "",

  role: user.role,

  isActive: user.isActive,

  trainerCode: user.trainerCode || "",

  bio: user.bio || "",

  region: user.region || "",

  favoritePokemon: user.favoritePokemon || {
    id: null,
    name: "",
  },

  favoriteType: user.favoriteType || "",

  followersCount: user.followers?.length || 0,

  followingCount: user.following?.length || 0,

  profileVisibility: user.profileVisibility || "public",

  profileCompleted: user.profileCompleted !== false,

  createdAt: user.createdAt,

  updatedAt: user.updatedAt,
});

/* =========================================================
   CURRENT TRAINER
========================================================= */

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    await ensureTrainerCode(user);

    return res.json({
      user: serializeMyProfile(user),
    });
  } catch (error) {
    console.error("getMyProfile error:", error);

    return res.status(500).json({
      message: "Unable to load trainer profile.",
    });
  }
};

/* =========================================================
   UPDATE TRAINER PROFILE
========================================================= */

const updateTrainerProfile = async (req, res) => {
  try {
    const { bio, region, favoritePokemon, favoriteType, profileVisibility } =
      req.body;

    const update = {};

    /* -----------------------------------------------------
       BIO
    ----------------------------------------------------- */

    if (bio !== undefined) {
      const normalizedBio = String(bio).trim();

      if (normalizedBio.length > 160) {
        return res.status(400).json({
          message: "Trainer bio cannot exceed 160 characters.",
        });
      }

      update.bio = normalizedBio;
    }

    /* -----------------------------------------------------
       REGION
    ----------------------------------------------------- */

    if (region !== undefined) {
      const normalizedRegion = String(region).trim();

      if (normalizedRegion.length > 30) {
        return res.status(400).json({
          message: "Region cannot exceed 30 characters.",
        });
      }

      update.region = normalizedRegion;
    }

    /* -----------------------------------------------------
       FAVORITE POKEMON
    ----------------------------------------------------- */

    if (favoritePokemon !== undefined) {
      const shouldClear =
        favoritePokemon === null ||
        favoritePokemon === "" ||
        favoritePokemon?.id === null ||
        favoritePokemon?.id === "";

      if (shouldClear) {
        update.favoritePokemon = {
          id: null,
          name: "",
        };
      } else {
        const pokemonId = Number(favoritePokemon?.id);

        if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 1025) {
          return res.status(400).json({
            message: "Favorite Pokémon ID must be between 1 and 1025.",
          });
        }

        const pokemonName = String(favoritePokemon?.name || "")
          .toLowerCase()
          .trim();

        if (pokemonName.length > 50) {
          return res.status(400).json({
            message: "Invalid Pokémon name.",
          });
        }

        update.favoritePokemon = {
          id: pokemonId,
          name: pokemonName,
        };
      }
    }

    /* -----------------------------------------------------
       FAVORITE TYPE
    ----------------------------------------------------- */

    if (favoriteType !== undefined) {
      const normalizedType = String(favoriteType || "")
        .toLowerCase()
        .trim();

      if (normalizedType !== "" && !POKEMON_TYPES.includes(normalizedType)) {
        return res.status(400).json({
          message: "Invalid Pokémon type.",
        });
      }

      update.favoriteType = normalizedType;
    }

    /* -----------------------------------------------------
       VISIBILITY
    ----------------------------------------------------- */

    if (profileVisibility !== undefined) {
      const visibility = String(profileVisibility).toLowerCase().trim();

      if (!["public", "private"].includes(visibility)) {
        return res.status(400).json({
          message: "Profile visibility must be public or private.",
        });
      }

      update.profileVisibility = visibility;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,

      {
        $set: update,
      },

      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    await ensureTrainerCode(user);

    return res.json({
      message: "Trainer profile updated.",

      user: serializeMyProfile(user),
    });
  } catch (error) {
    console.error("updateTrainerProfile error:", error);

    return res.status(500).json({
      message: "Unable to update trainer profile.",
    });
  }
};

/* =========================================================
   COMPLETE SOCIAL AUTH PROFILE
========================================================= */

const completeProfile = async (req, res) => {
  try {
    const { firstName, lastName, age, gender, contactNumber, address } =
      req.body;

    const errors = validateCompletedProfile({
      firstName,
      lastName,
      age,
      gender,
      contactNumber,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors.join(" "),
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    user.firstName = String(firstName).trim();

    user.lastName = String(lastName).trim();

    user.age = Number.parseInt(age, 10);

    user.gender = String(gender).toLowerCase().trim();

    user.contactNumber = String(contactNumber).trim();

    user.address = String(address || "")
      .trim()
      .slice(0, 200);

    user.profileCompleted = true;

    await ensureTrainerCode(user);

    await user.save();

    return res.json({
      message: "Trainer profile completed.",

      user: serializeMyProfile(user),
    });
  } catch (error) {
    console.error("completeProfile error:", error);

    return res.status(500).json({
      message: "Unable to complete trainer profile.",
    });
  }
};

/* =========================================================
   PUBLIC TRAINER PROFILE
========================================================= */

const getPublicProfile = async (req, res) => {
  try {
    const username = String(req.params.username || "").trim();

    if (!username) {
      return res.status(400).json({
        message: "Trainer username is required.",
      });
    }

    const user = await User.findOne({
      username,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (user.profileVisibility === "private") {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    await ensureTrainerCode(user);

    return res.json({
      profile: user.toPublicProfile(),
    });
  } catch (error) {
    console.error("getPublicProfile error:", error);

    return res.status(500).json({
      message: "Unable to load trainer profile.",
    });
  }
};

module.exports = {
  getMyProfile,
  updateTrainerProfile,
  completeProfile,
  getPublicProfile,
};
