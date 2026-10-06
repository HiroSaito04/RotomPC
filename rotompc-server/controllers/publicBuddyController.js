// filepath: rotompc-server/controllers/publicBuddyController.js

const mongoose = require("mongoose");

const User = require("../models/User");
const BuddyState = require("../models/BuddyState");

/* =========================================================
   HELPERS
========================================================= */

const normalizeId = (value) => String(value || "").trim();

const serializePokemon = (pokemon) => {
  if (!pokemon?.id) {
    return {
      id: null,
      name: "",
    };
  }

  return {
    id: Number(pokemon.id),
    name: String(pokemon.name || "")
      .trim()
      .toLowerCase(),
  };
};

/* =========================================================
   PUBLIC BUDDY

   IMPORTANT:

   This endpoint intentionally exposes ONLY
   the Buddy Pokémon identity.

   It does not expose:
   - affection
   - energy
   - berries
   - pet count
   - play count
   - resting state

   Public Trainer Profile petting is visual-only.
========================================================= */

const getPublicBuddy = async (req, res) => {
  try {
    const userId = normalizeId(req.params.userId || req.params.id);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const user = await User.findById(userId)
      .select("_id isActive profileVisibility favoritePokemon")
      .lean();

    if (!user || user.isActive === false) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (user.profileVisibility === "private") {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    const state = await BuddyState.findOne({
      user: userId,
    })
      .select("pokemon")
      .lean();

    /*
     * BuddyState is authoritative.
     *
     * favoritePokemon is only a migration
     * fallback for older accounts that have
     * not initialized BuddyState yet.
     */
    const pokemon = state?.pokemon?.id
      ? state.pokemon
      : user.favoritePokemon?.id
        ? user.favoritePokemon
        : null;

    return res.json({
      buddy: {
        pokemon: serializePokemon(pokemon),
      },
    });
  } catch (error) {
    console.error("getPublicBuddy error:", error);

    return res.status(500).json({
      message: "Unable to load Trainer Buddy.",
    });
  }
};

module.exports = {
  getPublicBuddy,
};
