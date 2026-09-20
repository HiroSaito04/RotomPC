// rotompc-client/src/utils/pokemonHelpers.js

import { POKE_SPRITE_BASE_URL } from "@/constants/pokemon";

/* =========================================================
   TYPE DESIGN MATRIX
========================================================= */

const TYPE_STYLES = {
  normal: {
    bg: "bg-zinc-100",
    grad: "from-zinc-300 to-zinc-500",
    accent: "bg-zinc-400",
    badge: "bg-zinc-200 text-zinc-900",
  },

  fire: {
    bg: "bg-orange-50",
    grad: "from-orange-400 to-red-600",
    accent: "bg-orange-500",
    badge: "bg-orange-500 text-white",
  },

  water: {
    bg: "bg-blue-50",
    grad: "from-blue-400 to-blue-700",
    accent: "bg-blue-500",
    badge: "bg-blue-500 text-white",
  },

  electric: {
    bg: "bg-yellow-50",
    grad: "from-yellow-300 to-amber-500",
    accent: "bg-yellow-400",
    badge: "bg-yellow-400 text-zinc-950",
  },

  grass: {
    bg: "bg-green-50",
    grad: "from-green-400 to-green-700",
    accent: "bg-green-500",
    badge: "bg-green-500 text-white",
  },

  ice: {
    bg: "bg-cyan-50",
    grad: "from-cyan-300 to-cyan-500",
    accent: "bg-cyan-400",
    badge: "bg-cyan-300 text-zinc-950",
  },

  fighting: {
    bg: "bg-red-50",
    grad: "from-red-600 to-red-900",
    accent: "bg-red-600",
    badge: "bg-red-700 text-white",
  },

  poison: {
    bg: "bg-purple-50",
    grad: "from-purple-400 to-purple-700",
    accent: "bg-purple-500",
    badge: "bg-purple-500 text-white",
  },

  ground: {
    bg: "bg-amber-50",
    grad: "from-amber-500 to-amber-800",
    accent: "bg-amber-600",
    badge: "bg-amber-600 text-white",
  },

  flying: {
    bg: "bg-sky-50",
    grad: "from-sky-300 to-indigo-400",
    accent: "bg-sky-400",
    badge: "bg-sky-300 text-zinc-950",
  },

  psychic: {
    bg: "bg-pink-50",
    grad: "from-pink-400 to-rose-600",
    accent: "bg-pink-500",
    badge: "bg-pink-500 text-white",
  },

  bug: {
    bg: "bg-lime-50",
    grad: "from-lime-400 to-lime-700",
    accent: "bg-lime-500",
    badge: "bg-lime-500 text-zinc-950",
  },

  rock: {
    bg: "bg-stone-100",
    grad: "from-stone-500 to-stone-700",
    accent: "bg-stone-500",
    badge: "bg-stone-500 text-white",
  },

  ghost: {
    bg: "bg-indigo-50",
    grad: "from-indigo-500 to-purple-900",
    accent: "bg-indigo-600",
    badge: "bg-indigo-700 text-white",
  },

  dragon: {
    bg: "bg-violet-50",
    grad: "from-violet-500 to-indigo-800",
    accent: "bg-violet-600",
    badge: "bg-violet-700 text-white",
  },

  dark: {
    bg: "bg-neutral-200",
    grad: "from-neutral-600 to-neutral-950",
    accent: "bg-neutral-700",
    badge: "bg-zinc-800 text-white",
  },

  steel: {
    bg: "bg-slate-100",
    grad: "from-slate-400 to-slate-600",
    accent: "bg-slate-500",
    badge: "bg-slate-400 text-zinc-950",
  },

  fairy: {
    bg: "bg-pink-50",
    grad: "from-pink-300 to-pink-500",
    accent: "bg-pink-400",
    badge: "bg-pink-300 text-zinc-950",
  },
};

const DEFAULT_TYPE_STYLE = {
  bg: "bg-zinc-50",
  grad: "from-zinc-400 to-zinc-600",
  accent: "bg-zinc-500",
  badge: "bg-zinc-200 text-zinc-900",
};

/* =========================================================
   TYPE HELPERS
========================================================= */

export const getPokemonTypeStyles = (type) => {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();

  return TYPE_STYLES[normalized] || DEFAULT_TYPE_STYLE;
};

/* =========================================================
   NAME HELPERS
========================================================= */

export const formatPokemonName = (name) => {
  if (!name) {
    return "";
  }

  return String(name)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const pokemonNameToSlug = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

/* =========================================================
   SPECIES / DEX ID
========================================================= */

export const getSpeciesDexId = (pokemon) => {
  if (!pokemon) {
    return null;
  }

  const speciesUrl = pokemon.species?.url;

  if (!speciesUrl) {
    return pokemon.id || null;
  }

  const parts = speciesUrl.split("/").filter(Boolean);

  const id = Number(parts[parts.length - 1]);

  return id || pokemon.id || null;
};

/* =========================================================
   FLAVOR TEXT
========================================================= */

export const getEnglishFlavorText = (species) => {
  const entry = species?.flavor_text_entries?.find(
    (item) => item.language?.name === "en",
  );

  if (!entry?.flavor_text) {
    return "No data entry registered.";
  }

  return entry.flavor_text
    .replace(/[\n\f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/* =========================================================
   SPECIES GENUS
========================================================= */

export const getEnglishGenus = (species) => {
  const entry = species?.genera?.find((item) => item.language?.name === "en");

  return entry?.genus || "Unknown Species";
};

/* =========================================================
   GENDER
========================================================= */

export const getGenderPercentages = (species) => {
  const genderRate = species?.gender_rate;

  if (genderRate === undefined || genderRate === null || genderRate === -1) {
    return {
      male: null,
      female: null,
    };
  }

  const female = (genderRate / 8) * 100;

  return {
    female,
    male: 100 - female,
  };
};

/* =========================================================
   SPRITE HELPERS
========================================================= */

/*
 * The important distinction:
 *
 * GBA sprites are Gen III static pixel sprites.
 *
 * Black/White animated sprites are Gen V GIFs.
 *
 * Showdown sprites are animated GIFs and provide
 * broader animated coverage.
 *
 * Newer Pokémon cannot have authentic Gen III
 * sprites because they did not exist during the
 * GBA games.
 */

const getGbaSprites = (pokemon) => {
  const generationThree = pokemon?.sprites?.versions?.["generation-iii"];

  return {
    emerald: generationThree?.emerald?.front_default || null,

    fireRedLeafGreen:
      generationThree?.["firered-leafgreen"]?.front_default || null,

    rubySapphire: generationThree?.["ruby-sapphire"]?.front_default || null,
  };
};

const getAnimatedSprites = (pokemon) => {
  const blackWhite =
    pokemon?.sprites?.versions?.["generation-v"]?.["black-white"];

  return {
    blackWhite: blackWhite?.animated?.front_default || null,

    showdown: pokemon?.sprites?.other?.showdown?.front_default || null,
  };
};

const getStaticSprites = (pokemon, speciesId) => {
  const rawFallback = speciesId
    ? `${POKE_SPRITE_BASE_URL}/${speciesId}.png`
    : null;

  return {
    default: pokemon?.sprites?.front_default || null,

    officialArtwork:
      pokemon?.sprites?.other?.["official-artwork"]?.front_default || null,

    home: pokemon?.sprites?.other?.home?.front_default || null,

    rawFallback,
  };
};

/* =========================================================
   COMPLETE IMAGE RESOLVER
========================================================= */

export const getPokemonImages = (pokemon, speciesId = null) => {
  const dexId = speciesId || getSpeciesDexId(pokemon);

  const gba = getGbaSprites(pokemon);

  const animated = getAnimatedSprites(pokemon);

  const staticSprites = getStaticSprites(pokemon, dexId);

  /*
   * GBA-first visual priority.
   *
   * This keeps the RotomPC look consistent.
   */
  const gbaPrimary =
    gba.emerald || gba.fireRedLeafGreen || gba.rubySapphire || null;

  /*
   * Best real animated sprite.
   *
   * Black/White is preferred because it has
   * that classic pixel animation.
   */
  const animatedPrimary = animated.blackWhite || animated.showdown || null;

  /*
   * Static pixel fallback.
   */
  const pixelFallback =
    gbaPrimary ||
    staticSprites.default ||
    staticSprites.rawFallback ||
    staticSprites.home ||
    staticSprites.officialArtwork ||
    null;

  /*
   * If the UI explicitly wants movement,
   * use animatedPrimary.
   *
   * Otherwise GBA is the preferred visual.
   */
  const primary =
    gbaPrimary ||
    animatedPrimary ||
    staticSprites.default ||
    staticSprites.rawFallback ||
    staticSprites.home ||
    staticSprites.officialArtwork ||
    null;

  return {
    /* -----------------------------------------
       Preferred GBA sprites
    ----------------------------------------- */

    gba: gbaPrimary,

    emerald: gba.emerald,

    fireRedLeafGreen: gba.fireRedLeafGreen,

    rubySapphire: gba.rubySapphire,

    /* -----------------------------------------
       Animated sources
    ----------------------------------------- */

    animated: animatedPrimary,

    blackWhiteAnimated: animated.blackWhite,

    showdownAnimated: animated.showdown,

    /* -----------------------------------------
       Modern/static sources
    ----------------------------------------- */

    standard: staticSprites.default,

    officialArtwork: staticSprites.officialArtwork,

    home: staticSprites.home,

    original: staticSprites.rawFallback,

    /* -----------------------------------------
       Convenience fields
    ----------------------------------------- */

    primary,

    pixelFallback,

    animatedPrimary,

    hasGbaSprite: Boolean(gbaPrimary),

    hasAnimatedSprite: Boolean(animatedPrimary),
  };
};

/* =========================================================
   DISPLAY IMAGE
========================================================= */

/*
 * Use this when you specifically want a moving Pokémon.
 *
 * It tries actual animation first, then GBA/static pixels.
 */
export const getMovingPokemonImage = (pokemon, speciesId = null) => {
  const images = getPokemonImages(pokemon, speciesId);

  return (
    images.animatedPrimary ||
    images.gba ||
    images.standard ||
    images.original ||
    images.officialArtwork ||
    null
  );
};

/*
 * Use this when GBA fidelity is more important than motion.
 */
export const getGbaPokemonImage = (pokemon, speciesId = null) => {
  const images = getPokemonImages(pokemon, speciesId);

  return (
    images.gba ||
    images.standard ||
    images.original ||
    images.animatedPrimary ||
    images.officialArtwork ||
    null
  );
};

/* =========================================================
   DEX NORMALIZER
========================================================= */

export const normalizeDexPokemon = (pokemon) => {
  if (!pokemon) {
    return null;
  }

  const types = pokemon.types?.map((entry) => entry.type.name) || [];

  const primaryType = types[0] || "normal";

  const secondaryType = types[1] || null;

  const speciesId = getSpeciesDexId(pokemon);

  const style = getPokemonTypeStyles(primaryType);

  const images = getPokemonImages(pokemon, speciesId);

  /*
   * RotomDex cards:
   *
   * Prefer animated pixels when possible.
   *
   * Otherwise keep the GBA/static pixel style.
   */
  const displayImage =
    images.animatedPrimary ||
    images.gba ||
    images.standard ||
    images.original ||
    images.officialArtwork;

  return {
    id: pokemon.id,

    speciesId,

    dexNo: String(speciesId || pokemon.id || 0).padStart(4, "0"),

    name: formatPokemonName(pokemon.name),

    rawName: pokemon.name,

    slug: pokemon.name,

    type: primaryType,

    secondaryType,

    types,

    bg: style.bg,

    grad: style.grad,

    accent: style.accent,

    badge: style.badge,

    image: displayImage,

    animatedImage: images.animatedPrimary,

    gbaImage: images.gba,

    fallbackImage: images.gba || images.standard || images.original,

    originalFallback: images.original,

    hasAnimatedSprite: images.hasAnimatedSprite,

    hasGbaSprite: images.hasGbaSprite,
  };
};

/* =========================================================
   HOME CAROUSEL NORMALIZER
========================================================= */

export const normalizeCarouselPokemon = (pokemon, species) => {
  if (!pokemon) {
    return null;
  }

  const primaryType = pokemon?.types?.[0]?.type?.name || "normal";

  const style = getPokemonTypeStyles(primaryType);

  const images = getPokemonImages(pokemon, species?.id);

  const displayImage =
    images.animatedPrimary ||
    images.gba ||
    images.standard ||
    images.original ||
    images.officialArtwork;

  return {
    id: pokemon.id,

    speciesId: species?.id || getSpeciesDexId(pokemon),

    name: pokemon.name,

    displayName: formatPokemonName(pokemon.name),

    no: String(species?.id || pokemon.id || 0).padStart(3, "0"),

    type: primaryType,

    types: pokemon.types?.map((entry) => entry.type.name) || [],

    bg: style.bg,

    grad: style.grad,

    accent: style.accent,

    badge: style.badge,

    image: displayImage,

    animatedImage: images.animatedPrimary,

    gbaImage: images.gba,

    fallbackImage: images.gba || images.standard || images.original,

    hasAnimatedSprite: images.hasAnimatedSprite,

    desc: getEnglishFlavorText(species),
  };
};

/* =========================================================
   FAVORITE POKEMON NORMALIZER
========================================================= */

export const normalizeFavoritePokemon = (pokemon) => {
  if (!pokemon) {
    return null;
  }

  const types = pokemon.types?.map((entry) => entry.type.name) || [];

  const primaryType = types[0] || "normal";

  const style = getPokemonTypeStyles(primaryType);

  const speciesId = getSpeciesDexId(pokemon);

  const images = getPokemonImages(pokemon, speciesId);

  /*
   * Favorite Pokémon should MOVE whenever possible.
   *
   * This is different from the general primary image,
   * because the profile partner benefits from animation.
   */
  const movingSprite =
    images.animatedPrimary ||
    images.gba ||
    images.standard ||
    images.original ||
    images.officialArtwork;

  /*
   * GBA-oriented static fallback.
   */
  const staticSprite =
    images.gba || images.standard || images.original || images.officialArtwork;

  return {
    id: pokemon.id,

    speciesId,

    name: pokemon.name,

    displayName: formatPokemonName(pokemon.name),

    types,

    primaryType,

    bg: style.bg,

    grad: style.grad,

    accent: style.accent,

    badge: style.badge,

    /*
     * Main partner display.
     */
    sprite: movingSprite,

    image: staticSprite,

    animatedImage: images.animatedPrimary,

    gbaImage: images.gba,

    standardImage: images.standard,

    officialArtwork: images.officialArtwork,

    fallbackImage: images.standard || images.original || images.officialArtwork,

    originalFallback: images.original,

    hasAnimatedSprite: images.hasAnimatedSprite,

    hasGbaSprite: images.hasGbaSprite,

    /*
     * Useful for UI labels.
     */
    spriteMode: images.blackWhiteAnimated
      ? "black-white-animated"
      : images.showdownAnimated
        ? "showdown-animated"
        : images.gba
          ? "gba"
          : "fallback",
  };
};
