// rotompc-server/utils/userHelpers.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateTrainerCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "RTC-";

  for (let index = 0; index < 8; index += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

const createUniqueTrainerCode = async () => {
  let trainerCode;

  do {
    trainerCode = generateTrainerCode();
  } while (
    await User.exists({
      trainerCode,
    })
  );

  return trainerCode;
};

const ensureTrainerCode = async (user) => {
  if (user.trainerCode) {
    return user.trainerCode;
  }

  user.trainerCode = await createUniqueTrainerCode();

  await user.save();

  return user.trainerCode;
};

const createUniqueUsername = async (source) => {
  let base = String(source || "trainer")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 22);

  if (base.length < 3) {
    base = "trainer";
  }

  let username = base;

  while (
    await User.exists({
      username,
    })
  ) {
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 30);
  }

  return username;
};

const makeSessionResponse = (user) => {
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "1h",
    },
  );

  return {
    message: "Authentication successful.",

    token,

    id: user._id,

    username: user.username,

    role: user.role,

    firstName: user.firstName || "",

    lastName: user.lastName || "",

    gender: user.gender || "",

    trainerCode: user.trainerCode || "",

    bio: user.bio || "",

    region: user.region || "",

    favoritePokemon: user.favoritePokemon || {
      id: null,
      name: "",
    },

    favoriteType: user.favoriteType || "",

    profileVisibility: user.profileVisibility || "public",

    profileCompleted: user.profileCompleted !== false,
  };
};

module.exports = {
  createUniqueTrainerCode,
  ensureTrainerCode,
  createUniqueUsername,
  makeSessionResponse,
};
