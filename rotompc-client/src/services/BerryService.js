// rotompc-client/src/services/BerryService.js

import { POKE_API_BASE_URL } from "@/constants/pokemon";

export const BUDDY_BERRY_NAMES = [
  "oran",
  "pecha",
  "sitrus",
  "leppa",
  "cheri",
  "chesto",
  "lum",
];

const cache = new Map();

const requestJson = async (endpoint) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${POKE_API_BASE_URL}${endpoint}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PokéAPI request failed (${response.status}).`);
  }

  return response.json();
};

export const fetchBerryVisual = async (berryName) => {
  const name = String(berryName).trim().toLowerCase();

  if (cache.has(name)) {
    return cache.get(name);
  }

  const promise = (async () => {
    const berry = await requestJson(`/berry/${encodeURIComponent(name)}`);

    /*
     * Berry API gives us the
     * matching item resource.
     */
    const item = await requestJson(berry.item.url);

    return {
      id: berry.id,

      name: berry.name,

      displayName: `${berry.name.charAt(0).toUpperCase()}${berry.name.slice(
        1,
      )} Berry`,

      itemName: item.name,

      /*
       * Actual PokeAPI pixel
       * item artwork.
       */
      sprite: item.sprites?.default || null,
    };
  })();

  cache.set(name, promise);

  return promise;
};

export const fetchBerryCatalog = async () => {
  const results = await Promise.allSettled(
    BUDDY_BERRY_NAMES.map(fetchBerryVisual),
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((berry) => berry.sprite);
};
