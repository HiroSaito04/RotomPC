// rotompc-server/controllers/userController.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const { validateUserInput } = require("../validators/userValidator");

const {
  createUniqueTrainerCode,
  createUniqueUsername,
} = require("../utils/userHelpers");

/* =========================================================
   SAFE ACCOUNT SERIALIZER
========================================================= */

const serializeUser = (user) => ({
  id: user._id,

  firstName: user.firstName || "",

  lastName: user.lastName || "",

  age: user.age ?? null,

  gender: user.gender || "",

  contactNumber: user.contactNumber || "",

  email: user.email,

  username: user.username,

  role: user.role,

  address: user.address || "",

  isActive: user.isActive,

  trainerCode: user.trainerCode || "",

  profileCompleted: user.profileCompleted !== false,

  createdAt: user.createdAt,

  updatedAt: user.updatedAt,
});

/* =========================================================
   GET USERS — ADMIN
========================================================= */

const getUsers = async (req, res) => {
  try {
    /*
     * Route should also use
     * requireRole('admin').
     */
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    const users = await User.find()
      .select(
        [
          "firstName",
          "lastName",
          "age",
          "gender",
          "contactNumber",
          "email",
          "role",
          "username",
          "address",
          "isActive",
          "trainerCode",
          "profileCompleted",
          "createdAt",
          "updatedAt",
        ].join(" "),
      )
      .sort({
        createdAt: -1,
      });

    return res.json({
      users: users.map(serializeUser),
    });
  } catch (error) {
    console.error("getUsers error:", error);

    return res.status(500).json({
      message: "Unable to load users.",
    });
  }
};

/* =========================================================
   PUBLIC REGISTRATION
========================================================= */

const createUser = async (req, res) => {
  try {
    const firstName = String(req.body.firstName || "").trim();

    const lastName = String(req.body.lastName || "").trim();

    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();

    const password = String(req.body.password || "");

    const age = req.body.age;

    const gender = String(req.body.gender || "")
      .toLowerCase()
      .trim();

    const contactNumber = String(req.body.contactNumber || "").trim();

    const requestedUsername = String(req.body.username || "").trim();

    const address = String(req.body.address || "")
      .trim()
      .slice(0, 200);

    /*
     * Username is optional in your
     * React registration form.
     */
    const username =
      requestedUsername ||
      (await createUniqueUsername(`${firstName}.${lastName}`));

    const validationErrors = validateUserInput(
      {
        firstName,
        lastName,
        email,
        password,
        age,
        gender,
        contactNumber,
        username,
      },

      {
        update: false,
      },
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: validationErrors.join(" "),
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.email === email
            ? "Email address is already registered."
            : "Username is already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const trainerCode = await createUniqueTrainerCode();

    const user = await User.create({
      firstName,
      lastName,

      age: Number.parseInt(age, 10),

      gender,

      contactNumber,

      email,
      username,

      password: hashedPassword,

      address,

      /*
       * NEVER trust a role sent
       * by public registration.
       */
      role: "trainer",

      isActive: true,

      profileCompleted: true,

      trainerCode,

      bio: "",
      region: "",

      favoritePokemon: {
        id: null,
        name: "",
      },

      favoriteType: "",

      profileVisibility: "public",
    });

    return res.status(201).json({
      message: "Trainer account created successfully.",

      userId: user._id,

      trainerCode: user.trainerCode,

      username: user.username,
    });
  } catch (error) {
    console.error("createUser error:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        message: duplicateField
          ? `${duplicateField} is already in use.`
          : "Account information is already in use.",
      });
    }

    return res.status(500).json({
      message: "Unable to create trainer account.",
    });
  }
};

/* =========================================================
   UPDATE ACCOUNT
========================================================= */

const updateUser = async (req, res) => {
  try {
    const requesterId = String(req.user.id);

    const targetId = String(req.params.id);

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const isAdmin = req.user.role === "admin";

    const isSelf = requesterId === targetId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        message: "You cannot modify another user.",
      });
    }

    /*
     * General account fields.
     * Pokémon/social profile fields
     * must use /me/profile.
     */
    const allowedFields = [
      "firstName",
      "lastName",
      "age",
      "gender",
      "contactNumber",
      "email",
      "username",
      "address",
      "password",
    ];

    /*
     * Admin-only account settings.
     */
    if (isAdmin) {
      allowedFields.push("role", "isActive");
    }

    const update = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    /* -----------------------------------------------------
       NORMALIZATION
    ----------------------------------------------------- */

    if (update.firstName !== undefined) {
      update.firstName = String(update.firstName).trim();
    }

    if (update.lastName !== undefined) {
      update.lastName = String(update.lastName).trim();
    }

    if (update.email !== undefined) {
      update.email = String(update.email).toLowerCase().trim();
    }

    if (update.username !== undefined) {
      update.username = String(update.username).trim();
    }

    if (update.gender !== undefined) {
      update.gender = String(update.gender).toLowerCase().trim();
    }

    if (update.contactNumber !== undefined) {
      update.contactNumber = String(update.contactNumber).trim();
    }

    if (update.address !== undefined) {
      update.address = String(update.address).trim().slice(0, 200);
    }

    if (update.age !== undefined) {
      update.age = Number.parseInt(update.age, 10);
    }

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    const validationErrors = validateUserInput(update, {
      update: true,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: validationErrors.join(" "),
      });
    }

    /* -----------------------------------------------------
       PASSWORD
    ----------------------------------------------------- */

    if (update.password !== undefined) {
      const password = String(update.password || "");

      if (!password.trim()) {
        delete update.password;
      } else {
        update.password = await bcrypt.hash(password, 10);
      }
    }

    /* -----------------------------------------------------
       ADMIN FIELDS
    ----------------------------------------------------- */

    if (update.role !== undefined) {
      const role = String(update.role).toLowerCase().trim();

      const validRoles = ["admin", "professor", "trainer", "editor"];

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid user role.",
        });
      }

      update.role = role;
    }

    if (update.isActive !== undefined) {
      if (typeof update.isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive must be true or false.",
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      targetId,

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
        message: "User not found.",
      });
    }

    return res.json({
      message: "User updated successfully.",

      user: serializeUser(user),
    });
  } catch (error) {
    console.error("updateUser error:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        message: duplicateField
          ? `${duplicateField} is already in use.`
          : "Email or username already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to update user.",
    });
  }
};

/* =========================================================
   DELETE USER — ADMIN
========================================================= */

const deleteUser = async (req, res) => {
  try {
    const requesterId = String(req.user.id);

    const targetId = String(req.params.id);

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (requesterId === targetId) {
      return res.status(400).json({
        message: "You cannot delete your own account from this session.",
      });
    }

    const deletedUser = await User.findByIdAndDelete(targetId);

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    /*
     * Remove deleted trainer from all
     * social relationship arrays.
     */
    await User.updateMany(
      {
        $or: [
          {
            followers: deletedUser._id,
          },

          {
            following: deletedUser._id,
          },
        ],
      },

      {
        $pull: {
          followers: deletedUser._id,

          following: deletedUser._id,
        },
      },
    );

    return res.json({
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("deleteUser error:", error);

    return res.status(500).json({
      message: "Unable to delete user.",
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
