// rotompc-server/services/buddyService.js

const User = require("../models/User");

const BuddyState = require("../models/BuddyState");

const BuddyReward = require("../models/BuddyReward");

const {
  BUDDY_MAX_ENERGY,
  BUDDY_MAX_AFFECTION,
  BUDDY_STARTING_BERRIES,
  BUDDY_PET_ENERGY_COST,
  BUDDY_PLAY_ENERGY_COST,
  BUDDY_BERRY_ENERGY_GAIN,
  BUDDY_WAKE_ENERGY,
  BUDDY_REST_MS,
  POKESOCIAL_BERRY_REWARDS,
  ALLOWED_BERRIES,
} = require("../constants/buddy");

/* =========================================================
   DOMAIN ERROR
========================================================= */

class BuddyError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = "BuddyError";

    this.status = status;
  }
}

/* =========================================================
   HELPERS
========================================================= */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hasPokemon = (state) =>
  Boolean(state?.pokemon?.id && state?.pokemon?.name);

/* =========================================================
   INITIAL STATE
========================================================= */

const ensureBuddyState = async (userId) => {
  let state = await BuddyState.findOne({
    user: userId,
  });

  if (state) {
    /*
     * Protect older MongoDB rows if fields
     * were added after deployment.
     */

    let changed = false;

    if (state.berries === undefined || state.berries === null) {
      state.berries = BUDDY_STARTING_BERRIES;

      changed = true;
    }

    if (state.energy === undefined || state.energy === null) {
      state.energy = BUDDY_MAX_ENERGY;

      changed = true;
    }

    if (state.affection === undefined || state.affection === null) {
      state.affection = 0;

      changed = true;
    }

    if (state.petCount === undefined || state.petCount === null) {
      state.petCount = 0;

      changed = true;
    }

    if (state.totalPlays === undefined || state.totalPlays === null) {
      state.totalPlays = 0;

      changed = true;
    }

    if (state.totalBerriesFed === undefined || state.totalBerriesFed === null) {
      state.totalBerriesFed = 0;

      changed = true;
    }

    if (changed) {
      await state.save();
    }

    return state;
  }

  const user = await User.findById(userId).select("favoritePokemon isActive");

  if (!user) {
    throw new BuddyError("Trainer not found.", 404);
  }

  if (user.isActive === false) {
    throw new BuddyError("Trainer account is inactive.", 403);
  }

  /*
   * Migration bridge:
   *
   * Existing Favorite Pokémon becomes
   * the Trainer's initial Buddy.
   */

  const legacyPokemon = user.favoritePokemon?.id
    ? {
        id: Number(user.favoritePokemon.id),

        name: String(user.favoritePokemon.name || "")
          .trim()
          .toLowerCase(),
      }
    : {
        id: null,

        name: "",
      };

  try {
    state = await BuddyState.create({
      user: user._id,

      pokemon: legacyPokemon,

      affection: 0,

      petCount: 0,

      energy: BUDDY_MAX_ENERGY,

      berries: BUDDY_STARTING_BERRIES,

      totalPlays: 0,

      totalBerriesFed: 0,

      restingUntil: null,

      lastInteractionAt: null,
    });
  } catch (error) {
    /*
     * Two concurrent initial requests
     * can race against the unique user
     * index.
     *
     * Load whichever request created
     * the state first.
     */

    if (error?.code === 11000) {
      state = await BuddyState.findOne({
        user: user._id,
      });
    } else {
      throw error;
    }
  }

  if (!state) {
    throw new BuddyError("Unable to initialize Buddy.", 500);
  }

  return state;
};

/* =========================================================
   REST TIMER
========================================================= */

const refreshRestState = async (state) => {
  if (!state) {
    return state;
  }

  if (
    state.restingUntil &&
    new Date(state.restingUntil).getTime() <= Date.now()
  ) {
    /*
     * The server controls recovery.
     *
     * After the 2-minute rest,
     * Buddy wakes with 10 energy.
     *
     * Current berry gain:
     *
     * 10 + (6 × 15) = 100
     */

    state.restingUntil = null;

    state.energy = BUDDY_WAKE_ENERGY;

    await state.save();
  }

  return state;
};

/* =========================================================
   START REST
========================================================= */

const startRestIfNeeded = (state) => {
  if (state.energy > 0) {
    return;
  }

  state.energy = 0;

  state.restingUntil = new Date(Date.now() + BUDDY_REST_MS);
};

/* =========================================================
   REQUIRE BUDDY
========================================================= */

const requireBuddyPokemon = (state) => {
  if (!hasPokemon(state)) {
    throw new BuddyError("Choose a Buddy Pokémon first.", 409);
  }
};

/* =========================================================
   REQUIRE AWAKE
========================================================= */

const requireAwakeBuddy = (state) => {
  requireBuddyPokemon(state);

  if (
    state.restingUntil &&
    new Date(state.restingUntil).getTime() > Date.now()
  ) {
    throw new BuddyError("Your Buddy is resting.", 423);
  }
};

/* =========================================================
   SERIALIZER
========================================================= */

const serializeBuddyState = (state) => {
  const now = Date.now();

  const restingUntil = state.restingUntil ? new Date(state.restingUntil) : null;

  const isResting = Boolean(restingUntil && restingUntil.getTime() > now);

  return {
    pokemon: {
      id: state.pokemon?.id || null,

      name: state.pokemon?.name || "",
    },

    affection: clamp(
      state.affection || 0,

      0,

      BUDDY_MAX_AFFECTION,
    ),

    petCount: clamp(
      state.petCount || 0,

      0,

      BUDDY_MAX_AFFECTION,
    ),

    energy: clamp(
      state.energy || 0,

      0,

      BUDDY_MAX_ENERGY,
    ),

    berries: Math.max(
      0,

      state.berries || 0,
    ),

    totalPlays: state.totalPlays || 0,

    totalBerriesFed: state.totalBerriesFed || 0,

    isResting,

    restingUntil: isResting ? restingUntil.toISOString() : null,

    restRemainingMs: isResting
      ? Math.max(
          0,

          restingUntil.getTime() - now,
        )
      : 0,

    lastInteractionAt: state.lastInteractionAt || null,

    /*
     * Let the frontend display the
     * exact server-authoritative rules.
     *
     * The client no longer needs to
     * duplicate 5 / 10 / 15.
     */

    rules: {
      maxEnergy: BUDDY_MAX_ENERGY,

      maxAffection: BUDDY_MAX_AFFECTION,

      startingBerries: BUDDY_STARTING_BERRIES,

      petEnergyCost: BUDDY_PET_ENERGY_COST,

      playEnergyCost: BUDDY_PLAY_ENERGY_COST,

      berryEnergyGain: BUDDY_BERRY_ENERGY_GAIN,

      wakeEnergy: BUDDY_WAKE_ENERGY,

      restMs: BUDDY_REST_MS,

      rewards: {
        ...POKESOCIAL_BERRY_REWARDS,
      },
    },
  };
};

/* =========================================================
   GET STATE
========================================================= */

const getBuddyState = async (userId) => {
  let state = await ensureBuddyState(userId);

  state = await refreshRestState(state);

  return state;
};

/* =========================================================
   SET BUDDY
========================================================= */

const setBuddyPokemon = async (userId, pokemon) => {
  const state = await getBuddyState(userId);

  /* -----------------------------------------------------
       CLEAR
    ----------------------------------------------------- */

  if (pokemon === null || pokemon === undefined) {
    state.pokemon = {
      id: null,

      name: "",
    };

    state.affection = 0;

    state.petCount = 0;

    state.energy = BUDDY_MAX_ENERGY;

    state.restingUntil = null;

    state.totalPlays = 0;

    state.totalBerriesFed = 0;

    state.lastInteractionAt = null;

    await state.save();

    return state;
  }

  /* -----------------------------------------------------
       VALIDATE
    ----------------------------------------------------- */

  const pokemonId = Number(pokemon.id);

  const pokemonName = String(pokemon.name || "")
    .trim()
    .toLowerCase();

  if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 1025) {
    throw new BuddyError("Buddy Pokémon ID must be between 1 and 1025.");
  }

  if (!pokemonName || pokemonName.length > 50) {
    throw new BuddyError("Buddy Pokémon name is invalid.");
  }

  /* -----------------------------------------------------
       SAME BUDDY
    ----------------------------------------------------- */

  const sameBuddy =
    Number(state.pokemon?.id) === pokemonId &&
    String(state.pokemon?.name || "") === pokemonName;

  if (sameBuddy) {
    return state;
  }

  /* -----------------------------------------------------
       NEW BUDDY
    ----------------------------------------------------- */

  state.pokemon = {
    id: pokemonId,

    name: pokemonName,
  };

  /*
   * A new Buddy starts a new
   * relationship.
   *
   * Berry inventory belongs to
   * the Trainer, so berries are
   * intentionally NOT reset.
   */

  state.affection = 0;

  state.petCount = 0;

  state.energy = BUDDY_MAX_ENERGY;

  state.restingUntil = null;

  state.totalPlays = 0;

  state.totalBerriesFed = 0;

  state.lastInteractionAt = null;

  await state.save();

  return state;
};

/* =========================================================
   PET

   +1 affection
   -5 energy
========================================================= */

const petBuddy = async (userId) => {
  const state = await getBuddyState(userId);

  requireAwakeBuddy(state);

  /*
   * One successful pet:
   *
   * +1 affection
   * -5 energy
   */

  if (state.petCount < BUDDY_MAX_AFFECTION) {
    state.petCount += 1;

    state.affection = state.petCount;
  }

  state.energy = Math.max(
    0,

    state.energy - BUDDY_PET_ENERGY_COST,
  );

  state.lastInteractionAt = new Date();

  startRestIfNeeded(state);

  await state.save();

  return state;
};

/* =========================================================
   PLAY

   -10 energy
========================================================= */

const playWithBuddy = async (userId) => {
  const state = await getBuddyState(userId);

  requireAwakeBuddy(state);

  state.energy = Math.max(
    0,

    state.energy - BUDDY_PLAY_ENERGY_COST,
  );

  state.totalPlays += 1;

  state.lastInteractionAt = new Date();

  startRestIfNeeded(state);

  await state.save();

  return state;
};

/* =========================================================
   FEED

   +15 energy

   IMPORTANT:
   Feeding has NO pet-count requirement
   and NO play-count requirement.

   Trainer can feed immediately after
   selecting a Buddy.

   Buddy must simply:
   - exist
   - be awake
   - have at least one berry
   - not already have full energy
========================================================= */

const feedBuddy = async (userId, berryName) => {
  const state = await getBuddyState(userId);

  requireAwakeBuddy(state);

  const normalizedBerry = String(berryName || "")
    .trim()
    .toLowerCase();

  if (!ALLOWED_BERRIES.includes(normalizedBerry)) {
    throw new BuddyError("That berry cannot be used.");
  }

  if (state.berries <= 0) {
    throw new BuddyError("You do not have any berries.", 409);
  }

  if (state.energy >= BUDDY_MAX_ENERGY) {
    throw new BuddyError("Your Buddy already has full energy.", 409);
  }

  state.berries -= 1;

  state.energy = Math.min(
    BUDDY_MAX_ENERGY,

    state.energy + BUDDY_BERRY_ENERGY_GAIN,
  );

  state.totalBerriesFed += 1;

  state.lastInteractionAt = new Date();

  await state.save();

  return state;
};

/* =========================================================
   POKÉSOCIAL REWARDS
========================================================= */

const awardBerriesOnce = async (userId, action, sourceId) => {
  const amount = POKESOCIAL_BERRY_REWARDS[action];

  if (!amount) {
    throw new BuddyError("Unknown PokéSocial reward type.");
  }

  const normalizedSourceId = String(sourceId || "").trim();

  if (!normalizedSourceId) {
    throw new BuddyError("Reward source is required.");
  }

  await ensureBuddyState(userId);

  let reward;

  try {
    reward = await BuddyReward.create({
      user: userId,

      action,

      sourceId: normalizedSourceId,

      berries: amount,
    });
  } catch (error) {
    /*
     * Reward already earned.
     *
     * Unlike/re-like and
     * unfollow/re-follow cannot
     * generate the same reward again.
     */

    if (error?.code === 11000) {
      const state = await getBuddyState(userId);

      return {
        awarded: false,

        amount: 0,

        berries: state.berries,
      };
    }

    throw error;
  }

  try {
    const state = await BuddyState.findOneAndUpdate(
      {
        user: userId,
      },

      {
        $inc: {
          berries: amount,
        },
      },

      {
        new: true,
      },
    );

    if (!state) {
      throw new BuddyError("Buddy inventory could not be updated.", 500);
    }

    return {
      awarded: true,

      amount,

      berries: state.berries,
    };
  } catch (error) {
    /*
     * Inventory update failed.
     *
     * Remove the reward ledger entry
     * so the operation can safely be
     * retried.
     */

    await BuddyReward.deleteOne({
      _id: reward._id,
    });

    throw error;
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  BuddyError,

  ensureBuddyState,

  getBuddyState,

  serializeBuddyState,

  setBuddyPokemon,

  petBuddy,

  playWithBuddy,

  feedBuddy,

  awardBerriesOnce,
};
