// rotompc-server/controllers/buddyController.js

const {
  BuddyError,
  getBuddyState,
  serializeBuddyState,
  setBuddyPokemon,
  petBuddy,
  playWithBuddy,
  feedBuddy,
} = require("../services/buddyService");

const sendError = (res, error) => {
  console.error("Buddy controller:", error);

  if (error instanceof BuddyError) {
    return res.status(error.status).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: "Unable to update Buddy.",
  });
};

/* =========================================================
   GET
========================================================= */

const getBuddy = async (req, res) => {
  try {
    const state = await getBuddyState(req.user.id);

    return res.json({
      buddy: serializeBuddyState(state),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/* =========================================================
   SELECT BUDDY
========================================================= */

const selectBuddy = async (req, res) => {
  try {
    const { pokemon } = req.body;

    const state = await setBuddyPokemon(req.user.id, pokemon ?? null);

    return res.json({
      message: state.pokemon?.id ? "Buddy updated." : "Buddy cleared.",

      buddy: serializeBuddyState(state),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/* =========================================================
   PET
========================================================= */

const pet = async (req, res) => {
  try {
    const state = await petBuddy(req.user.id);

    return res.json({
      message: state.restingUntil
        ? "Your Buddy used its remaining energy and is now resting."
        : "Your Buddy enjoyed being petted.",

      buddy: serializeBuddyState(state),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/* =========================================================
   PLAY
========================================================= */

const play = async (req, res) => {
  try {
    const state = await playWithBuddy(req.user.id);

    return res.json({
      message: state.restingUntil
        ? "Your Buddy got tired and is now resting."
        : "Your Buddy had fun playing!",

      buddy: serializeBuddyState(state),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/* =========================================================
   FEED
========================================================= */

const feed = async (req, res) => {
  try {
    const state = await feedBuddy(req.user.id, req.body.berry);

    return res.json({
      message: `${req.body.berry} berry eaten!`,

      buddy: serializeBuddyState(state),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getBuddy,
  selectBuddy,
  pet,
  play,
  feed,
};
