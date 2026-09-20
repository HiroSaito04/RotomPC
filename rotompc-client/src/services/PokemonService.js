// rotompc-client/src/services/PokemonService.js

import { KANTO_MAX_ID, POKE_API_BASE_URL } from "@/constants/pokemon";

/* =========================================================
   INTERNAL REQUEST
========================================================= */

const requestJson = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${POKE_API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`PokéAPI request failed (${response.status})`);
  }

  return response.json();
};

/* =========================================================
   POKEMON
========================================================= */

export const fetchPokemon = (identifier, options = {}) => {
  if (identifier === undefined || identifier === null || identifier === "") {
    throw new Error("Pokémon identifier is required.");
  }

  const normalized = String(identifier).trim().toLowerCase();

  return requestJson(`/pokemon/${encodeURIComponent(normalized)}`, options);
};

/* =========================================================
   SPECIES
========================================================= */

export const fetchPokemonSpecies = (identifier, options = {}) => {
  if (identifier === undefined || identifier === null || identifier === "") {
    throw new Error("Pokémon species identifier is required.");
  }

  const normalized = String(identifier).trim().toLowerCase();

  return requestJson(
    `/pokemon-species/${encodeURIComponent(normalized)}`,
    options,
  );
};

/* =========================================================
   FULL PROFILE
========================================================= */

export const fetchPokemonProfile = async (identifier, options = {}) => {
  const pokemon = await fetchPokemon(identifier, options);

  const species = await fetchPokemonSpecies(pokemon.species.name, options);

  return {
    pokemon,
    species,
  };
};

/* =========================================================
   GENERATION / RANGE
========================================================= */

export const fetchPokemonRange = async ({ offset = 0, limit = 20, signal }) => {
  const data = await requestJson(`/pokemon?offset=${offset}&limit=${limit}`, {
    signal,
  });

  const results = await Promise.allSettled(
    data.results.map((pokemon) =>
      requestJson(pokemon.url, {
        signal,
      }),
    ),
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
};

/* =========================================================
   BATCH
========================================================= */

export const fetchPokemonBatch = async (identifiers, options = {}) => {
  if (!Array.isArray(identifiers)) {
    return [];
  }

  return Promise.all(
    identifiers.map(async (identifier) => {
      const pokemon = await fetchPokemon(identifier, options);

      const species = await fetchPokemonSpecies(pokemon.species.name, options);

      return {
        pokemon,
        species,
      };
    }),
  );
};

/* =========================================================
   RANDOM KANTO
========================================================= */

export const fetchRandomKantoPokemon = () => {
  const randomId = Math.floor(Math.random() * KANTO_MAX_ID) + 1;

  return fetchPokemon(randomId);
};
