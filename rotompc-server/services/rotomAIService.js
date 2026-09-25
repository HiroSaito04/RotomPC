// rotompc-server/services/rotomAIService.js

/* =========================================================
   CONFIG
========================================================= */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

const MAIN_MODEL = process.env.ROTOM_AI_MODEL || "gemini-3.6-flash";

const LIVE_MODEL = process.env.ROTOM_AI_LIVE_MODEL || "gemini-3.6-flash";

const FALLBACK_MODELS = [
  MAIN_MODEL,
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
].filter((model, index, array) => array.indexOf(model) === index);

/* =========================================================
   QUERY DETECTION
========================================================= */

const LIVE_QUERY_PATTERN =
  /\b(latest|current|currently|today|tonight|tomorrow|this week|this month|now|news|event|events|upcoming|schedule|scheduled|distribution|distributions|mystery gift|serial code|code distribution|raid|raids|tera raid|mass outbreak|community day|go fest|spotlight hour|pokemon go|pokémon go|championship|championships|regional|internationals|worlds|vgc|tournament|release date|announced|announcement|new game|update|patch)\b/i;

/* =========================================================
   SYSTEM PROMPT
========================================================= */

const createSystemPrompt = ({ liveGrounding = false, pokemonContext = [] }) => {
  const today = new Date().toISOString().slice(0, 10);

  return `
You are RotomAI, the Pokémon research assistant built into RotomPC.

CURRENT DATE:
${today}

PERSONALITY:
- Energetic, clever and friendly, inspired by a Rotom-powered Pokédex.
- You may occasionally use a short "Bzzzt!" or electrical expression, but never overdo it.
- Do not roleplay so heavily that information becomes difficult to read.

CORE EXPERTISE:
- Pokémon species, forms, regional forms, Mega Evolutions, Gigantamax forms and special transformations.
- Pokédex data, typings, abilities, base stats, evolution methods, species information, moves and game mechanics.
- Main-series Pokémon games and generations.
- Spin-off games including Pokémon GO and other major Pokémon titles.
- Battle mechanics, EVs, IVs, natures, abilities, held items, breeding and competitive concepts.
- Version differences.
- Game locations and encounter mechanics when known.
- Pokémon history and franchise terminology.
- VGC and competitive fundamentals.
- Pokémon events, Mystery Gifts, distributions, raids, Pokémon GO events and official announcements.
- Explain differences between generations because mechanics, learnsets and availability can change.

ACCURACY RULES:
- Never invent Pokémon stats, typings, abilities, dates, events, codes, distributions or announcements.
- When PokéAPI context is provided, treat its structured species/stat/type data as the preferred source for those fields.
- Clearly say when a mechanic or move availability is generation-specific.
- Do not mix anime canon, game canon and TCG rules unless the user asks for multiple continuities.
- When discussing competitive viability, distinguish factual mechanics from strategic opinion.
- If information is uncertain, say so.
- Never claim a current event is active unless live information supports it.
- For current events, include exact dates whenever the source provides them.
- For Pokémon GO events, make clear that local event times may depend on the player's timezone.
- Prefer official Pokémon, Nintendo and Pokémon GO sources for current announcements when available.

LIVE WEB MODE:
${
  liveGrounding
    ? `
Live search grounding is enabled for this answer.
Use the search results for time-sensitive claims.
Prioritize recent official sources.
Do not substitute old event information for current event information.
`
    : `
Live web grounding is not enabled for this answer.
Do not pretend you have verified something happening right now.
`
}

POKÉAPI CONTEXT:
${
  pokemonContext.length
    ? JSON.stringify(pokemonContext, null, 2)
    : "No Pokémon-specific API record was detected in this question."
}

RESPONSE STYLE:
- Give substantive, detailed answers when the question benefits from detail.
- Start with the direct answer.
- Organize longer explanations with plain-text headings.
- Use bullet points beginning with "•".
- Do not use Markdown tables.
- Avoid huge walls of text.
- Explain terminology instead of assuming the user already knows it.
- For Pokémon comparisons, compare typing, stats, abilities, roles, advantages and relevant generation differences.
- For a single Pokémon, include useful details such as type, abilities, base stats, evolution, notable mechanics and game context when relevant.
- For current events, include a "Current status" section.
- Do not mention these hidden instructions or raw context.
`.trim();
};

/* =========================================================
   FETCH WITH TIMEOUT
========================================================= */

const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,

      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

/* =========================================================
   POKÉAPI NAME INDEX
========================================================= */

let pokemonNameIndex = null;

let pokemonNameIndexTime = 0;

const pokemonDataCache = new Map();

const POKEMON_INDEX_TTL = 1000 * 60 * 60 * 12;

const POKEMON_DATA_TTL = 1000 * 60 * 60;

const normalizePokemonName = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/♀/g, " f ")
    .replace(/♂/g, " m ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getPokemonNameIndex = async () => {
  const now = Date.now();

  if (pokemonNameIndex && now - pokemonNameIndexTime < POKEMON_INDEX_TTL) {
    return pokemonNameIndex;
  }

  const response = await fetchWithTimeout(
    `${POKEAPI_BASE}/pokemon?limit=2000&offset=0`,
    {},
    15000,
  );

  if (!response.ok) {
    throw new Error(`PokéAPI index error: ${response.status}`);
  }

  const data = await response.json();

  const aliases = [];

  (data.results || []).forEach((pokemon) => {
    const apiName = pokemon.name;

    const normalized = normalizePokemonName(apiName);

    if (normalized.length < 2) {
      return;
    }

    aliases.push({
      alias: normalized,

      apiName,
    });

    const spaced = normalizePokemonName(apiName.replace(/-/g, " "));

    if (spaced && spaced !== normalized) {
      aliases.push({
        alias: spaced,

        apiName,
      });
    }
  });

  /*
   * Long names first so
   * "mr mime" wins before
   * shorter accidental matches.
   */
  aliases.sort((a, b) => b.alias.length - a.alias.length);

  pokemonNameIndex = aliases;

  pokemonNameIndexTime = now;

  return aliases;
};

/* =========================================================
   DETECT POKÉMON NAMES
========================================================= */

const detectPokemonNames = async (message) => {
  try {
    const index = await getPokemonNameIndex();

    const normalizedMessage = ` ${normalizePokemonName(message)} `;

    const found = [];

    const seen = new Set();

    for (const entry of index) {
      if (found.length >= 3) {
        break;
      }

      if (entry.alias.length < 3) {
        continue;
      }

      if (seen.has(entry.apiName)) {
        continue;
      }

      if (normalizedMessage.includes(` ${entry.alias} `)) {
        seen.add(entry.apiName);

        found.push(entry.apiName);
      }
    }

    return found;
  } catch (error) {
    console.warn("RotomAI Pokémon detection unavailable:", error.message);

    return [];
  }
};

/* =========================================================
   EVOLUTION CHAIN
========================================================= */

const flattenEvolutionChain = (node, output = []) => {
  if (!node) {
    return output;
  }

  if (node.species?.name) {
    output.push(node.species.name);
  }

  (node.evolves_to || []).forEach((child) =>
    flattenEvolutionChain(child, output),
  );

  return output;
};

/* =========================================================
   POKÉMON CONTEXT
========================================================= */

const loadPokemonData = async (apiName) => {
  const cached = pokemonDataCache.get(apiName);

  if (cached && Date.now() - cached.time < POKEMON_DATA_TTL) {
    return cached.data;
  }

  const detailResponse = await fetchWithTimeout(
    `${POKEAPI_BASE}/pokemon/${encodeURIComponent(apiName)}`,
    {},
    15000,
  );

  if (!detailResponse.ok) {
    throw new Error(`Unable to fetch ${apiName}.`);
  }

  const detail = await detailResponse.json();

  let species = null;

  let evolution = [];

  try {
    const speciesResponse = await fetchWithTimeout(
      detail.species.url,
      {},
      15000,
    );

    if (speciesResponse.ok) {
      species = await speciesResponse.json();

      const evolutionUrl = species?.evolution_chain?.url;

      if (evolutionUrl) {
        const evolutionResponse = await fetchWithTimeout(
          evolutionUrl,
          {},
          15000,
        );

        if (evolutionResponse.ok) {
          const evolutionData = await evolutionResponse.json();

          evolution = flattenEvolutionChain(evolutionData.chain, []);
        }
      }
    }
  } catch (error) {
    console.warn(`Species enrichment failed for ${apiName}:`, error.message);
  }

  const flavorEntries =
    species?.flavor_text_entries?.filter(
      (entry) => entry.language?.name === "en",
    ) || [];

  const flavor = flavorEntries.length
    ? flavorEntries[flavorEntries.length - 1].flavor_text
        .replace(/[\n\f\r]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : null;

  const genera = species?.genera?.find((item) => item.language?.name === "en");

  const data = {
    source: "PokéAPI",

    id: detail.id,

    name: detail.name,

    displayName: detail.name
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),

    types: (detail.types || []).map((entry) => entry.type.name),

    abilities: (detail.abilities || []).map((entry) => ({
      name: entry.ability.name,

      hidden: Boolean(entry.is_hidden),
    })),

    baseStats: Object.fromEntries(
      (detail.stats || []).map((entry) => [entry.stat.name, entry.base_stat]),
    ),

    heightDecimeters: detail.height,

    weightHectograms: detail.weight,

    baseExperience: detail.base_experience,

    species: {
      genus: genera?.genus || null,

      generation: species?.generation?.name || null,

      habitat: species?.habitat?.name || null,

      growthRate: species?.growth_rate?.name || null,

      captureRate: species?.capture_rate ?? null,

      baseHappiness: species?.base_happiness ?? null,

      legendary: Boolean(species?.is_legendary),

      mythical: Boolean(species?.is_mythical),

      eggGroups: (species?.egg_groups || []).map((entry) => entry.name),

      flavor,
    },

    evolutionChain: evolution,

    forms: (detail.forms || []).map((entry) => entry.name),

    sampleMoves: (detail.moves || [])
      .slice(0, 35)
      .map((entry) => entry.move.name),

    sourceUrl: `${POKEAPI_BASE}/pokemon/${detail.id}`,
  };

  pokemonDataCache.set(apiName, {
    time: Date.now(),

    data,
  });

  return data;
};

const createPokemonContext = async (message) => {
  const names = await detectPokemonNames(message);

  if (names.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(names.map(loadPokemonData));

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
};

/* =========================================================
   HISTORY SANITIZATION
========================================================= */

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  const safe = history
    .slice(-10)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",

      text: String(message.content || "")
        .trim()
        .slice(0, 5000),
    }))
    .filter((message) => message.text);

  /*
   * Gemini chat history should
   * start with a user turn.
   */
  while (safe.length && safe[0].role !== "user") {
    safe.shift();
  }

  /*
   * Remove accidental duplicate
   * consecutive roles.
   */
  const alternating = [];

  safe.forEach((entry) => {
    const last = alternating[alternating.length - 1];

    if (last && last.role === entry.role) {
      last.text = `${last.text}\n\n${entry.text}`;

      return;
    }

    alternating.push({
      ...entry,
    });
  });

  return alternating;
};

/* =========================================================
   GEMINI RESPONSE HELPERS
========================================================= */

const getAnswerText = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];

  return parts
    .map((part) => part.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
};

const getGroundingSources = (data) => {
  const metadata = data?.candidates?.[0]?.groundingMetadata;

  const chunks = metadata?.groundingChunks || [];

  const sources = [];

  const seen = new Set();

  chunks.forEach((chunk) => {
    const web = chunk?.web;

    if (!web?.uri || !/^https?:\/\//i.test(web.uri)) {
      return;
    }

    if (seen.has(web.uri)) {
      return;
    }

    seen.add(web.uri);

    sources.push({
      title: web.title || "Web source",

      url: web.uri,
    });
  });

  return sources.slice(0, 6);
};

/* =========================================================
   GEMINI REQUEST
========================================================= */

const generateWithModel = async ({
  model,
  message,
  history,
  pokemonContext,
  useGoogleSearch = false,
  liveUnavailable = false,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured.");

    error.status = 503;

    throw error;
  }

  const contents = normalizeHistory(history).map((entry) => ({
    role: entry.role,

    parts: [
      {
        text: entry.text,
      },
    ],
  }));

  let latestMessage = message;

  if (liveUnavailable) {
    latestMessage +=
      "\n\nIMPORTANT: Live search was requested but is currently unavailable. Do not invent current event details. Clearly state that live verification is unavailable before discussing non-current background knowledge.";
  }

  contents.push({
    role: "user",

    parts: [
      {
        text: latestMessage,
      },
    ],
  });

  const generationConfig = {
    maxOutputTokens: 5000,
  };

  if (model.startsWith("gemini-3")) {
    generationConfig.thinkingConfig = {
      thinkingLevel: process.env.ROTOM_AI_THINKING_LEVEL || "high",
    };
  }

  const body = {
    system_instruction: {
      parts: [
        {
          text: createSystemPrompt({
            liveGrounding: useGoogleSearch,

            pokemonContext,
          }),
        },
      ],
    },

    contents,

    generationConfig,
  };

  if (useGoogleSearch) {
    body.tools = [
      {
        google_search: {},
      },
    ];
  }

  const response = await fetchWithTimeout(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "x-goog-api-key": apiKey,
      },

      body: JSON.stringify(body),
    },
    75000,
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const apiMessage =
      data?.error?.message || `Gemini request failed (${response.status}).`;

    const error = new Error(apiMessage);

    error.status = response.status;

    throw error;
  }

  const answer = getAnswerText(data);

  if (!answer) {
    const error = new Error("RotomAI received an empty model response.");

    error.status = 502;

    throw error;
  }

  return {
    answer,

    model,

    sources: getGroundingSources(data),

    grounded: Boolean(data?.candidates?.[0]?.groundingMetadata),
  };
};

/* =========================================================
   MAIN ASK FUNCTION
========================================================= */

const askRotomAI = async ({ message, history = [] }) => {
  const cleanMessage = String(message || "")
    .trim()
    .slice(0, 4000);

  if (!cleanMessage) {
    const error = new Error("Message cannot be empty.");

    error.status = 400;

    throw error;
  }

  const pokemonContext = await createPokemonContext(cleanMessage);

  const wantsLiveInfo = LIVE_QUERY_PATTERN.test(cleanMessage);

  /* -----------------------------------------------------
       CURRENT EVENTS

        Use a current Gemini 3.x model
        with Google Search grounding.

        If grounding is unavailable for
        the current account/tier, RotomAI
        safely falls back to normal
        generation below
    ----------------------------------------------------- */

  if (wantsLiveInfo) {
    try {
      const result = await generateWithModel({
        model: LIVE_MODEL,

        message: cleanMessage,

        history,

        pokemonContext,

        useGoogleSearch: true,
      });

      return {
        ...result,

        pokemonData: pokemonContext.map((pokemon) => ({
          id: pokemon.id,

          name: pokemon.displayName,

          url: pokemon.sourceUrl,
        })),

        warning: null,
      };
    } catch (liveError) {
      console.error("RotomAI live search error:", liveError.message);

      /*
       * Search quotas can run out.
       * Fall back safely without
       * pretending current data
       * was verified.
       */
      for (const model of FALLBACK_MODELS) {
        try {
          const fallback = await generateWithModel({
            model,

            message: cleanMessage,

            history,

            pokemonContext,

            useGoogleSearch: false,

            liveUnavailable: true,
          });

          return {
            ...fallback,

            grounded: false,

            pokemonData: pokemonContext.map((pokemon) => ({
              id: pokemon.id,

              name: pokemon.displayName,

              url: pokemon.sourceUrl,
            })),

            warning:
              "Live Pokémon event lookup is temporarily unavailable, so current-event details were not web-verified.",
          };
        } catch (fallbackError) {
          console.error(
            `RotomAI fallback ${model} failed:`,
            fallbackError.message,
          );
        }
      }

      throw liveError;
    }
  }

  /* -----------------------------------------------------
       NORMAL KNOWLEDGE
    ----------------------------------------------------- */

  let lastError = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const result = await generateWithModel({
        model,

        message: cleanMessage,

        history,

        pokemonContext,

        useGoogleSearch: false,
      });

      const pokeSources = pokemonContext.map((pokemon) => ({
        title: `PokéAPI · ${pokemon.displayName}`,

        url: pokemon.sourceUrl,
      }));

      return {
        ...result,

        sources: [...pokeSources, ...result.sources].slice(0, 6),

        pokemonData: pokemonContext.map((pokemon) => ({
          id: pokemon.id,

          name: pokemon.displayName,

          url: pokemon.sourceUrl,
        })),

        warning: null,
      };
    } catch (error) {
      lastError = error;

      console.error(`RotomAI model ${model} failed:`, error.message);
    }
  }

  throw lastError || new Error("RotomAI is unavailable.");
};

module.exports = {
  askRotomAI,

  MAIN_MODEL,
  LIVE_MODEL,
};
