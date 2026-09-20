// rotompc-client/src/constants/pokemon.js

/* =========================================================
   API
========================================================= */

export const POKE_API_BASE_URL = "https://pokeapi.co/api/v2";

export const POKE_SPRITE_BASE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/* =========================================================
   DEX LIMITS
========================================================= */

export const MAX_POKEMON_ID = 1025;

export const KANTO_MAX_ID = 151;

/* =========================================================
   GENERATIONS
========================================================= */

export const POKEMON_GENERATIONS = {
  GEN1: {
    label: "GEN I (KANTO)",
    offset: 0,
    limit: 151,
  },

  GEN2: {
    label: "GEN II (JOHTO)",
    offset: 151,
    limit: 100,
  },

  GEN3: {
    label: "GEN III (HOENN)",
    offset: 251,
    limit: 135,
  },

  GEN4: {
    label: "GEN IV (SINNOH)",
    offset: 386,
    limit: 107,
  },

  GEN5: {
    label: "GEN V (UNOVA)",
    offset: 493,
    limit: 156,
  },

  GEN6: {
    label: "GEN VI (KALOS)",
    offset: 649,
    limit: 72,
  },

  GEN7: {
    label: "GEN VII (ALOLA)",
    offset: 721,
    limit: 88,
  },

  GEN8: {
    label: "GEN VIII (GALAR/HISUI)",
    offset: 809,
    limit: 96,
  },

  GEN9: {
    label: "GEN IX (PALDEA)",
    offset: 905,
    limit: 120,
  },

  FORMS: {
    label: "REGIONAL & SPECIAL FORMS",
    offset: 1025,
    limit: 300,
  },
};

/* =========================================================
   TYPE FILTERS
========================================================= */

export const POKEMON_TYPE_FILTERS = [
  "ALL",
  "NORMAL",
  "FIRE",
  "WATER",
  "ELECTRIC",
  "GRASS",
  "ICE",
  "FIGHTING",
  "POISON",
  "GROUND",
  "FLYING",
  "PSYCHIC",
  "BUG",
  "ROCK",
  "GHOST",
  "DRAGON",
  "DARK",
  "STEEL",
  "FAIRY",
];
