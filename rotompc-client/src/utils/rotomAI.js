// rotompc-client/src/utils/rotomAI.js

import {
  ROTOM_AI_BUBBLE_MESSAGES,
  ROTOM_AI_MAX_HISTORY,
  ROTOM_AI_SESSION_KEY,
} from "@/constants/rotomAI";

/* =========================================================
   MESSAGE ID
========================================================= */

export const createRotomMessageId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

/* =========================================================
   GREETING
========================================================= */

export const createRotomGreeting = () => ({
  id: "rotom-greeting",

  role: "assistant",

  local: true,

  content:
    "Bzzzt! RotomAI online!\n\nAsk me about Pokémon, Pokédex data, game mechanics, moves, abilities, evolutions, competitive play, game history, current events, distributions, raids, Pokémon GO, VGC, or anything else from the Pokémon world.",

  sources: [],

  pokemonData: [],

  model: null,

  grounded: false,
});

/* =========================================================
   READ CHAT
========================================================= */

export const readRotomMessages = () => {
  try {
    const raw = sessionStorage.getItem(ROTOM_AI_SESSION_KEY);

    if (!raw) {
      return [createRotomGreeting()];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createRotomGreeting()];
    }

    return [
      createRotomGreeting(),

      ...parsed.filter((message) => !message?.local),
    ].slice(-ROTOM_AI_MAX_HISTORY);
  } catch {
    return [createRotomGreeting()];
  }
};

/* =========================================================
   STORE CHAT
========================================================= */

export const storeRotomMessages = (messages) => {
  try {
    const storable = messages
      .filter((message) => !message.local)
      .slice(-ROTOM_AI_MAX_HISTORY);

    sessionStorage.setItem(
      ROTOM_AI_SESSION_KEY,

      JSON.stringify(storable),
    );
  } catch (error) {
    console.warn("Unable to persist RotomAI chat:", error);
  }
};

/* =========================================================
   RANDOM BUBBLE
========================================================= */

export const getRandomRotomBubble = (previous = "") => {
  const alternatives = ROTOM_AI_BUBBLE_MESSAGES.filter(
    (message) => message !== previous,
  );

  const pool = alternatives.length ? alternatives : ROTOM_AI_BUBBLE_MESSAGES;

  return pool[Math.floor(Math.random() * pool.length)];
};

/* =========================================================
   SAFE TELEPORT POSITION
========================================================= */

export const getSafeRotomPosition = () => {
  if (typeof window === "undefined") {
    return {
      x: 24,
      y: 160,
    };
  }

  const rotomSize = window.innerWidth < 640 ? 82 : 94;

  const margin = 18;

  /*
   * Keeps Rotom below the
   * fixed navbar.
   */
  const safeTop = window.innerWidth < 640 ? 125 : 105;

  /*
   * Avoid browser chrome,
   * Buddy launcher and footer.
   */
  const safeBottom = 120;

  const maxX = Math.max(
    margin,

    window.innerWidth - rotomSize - margin,
  );

  const maxY = Math.max(
    safeTop,

    window.innerHeight - rotomSize - safeBottom,
  );

  let x = margin + Math.random() * Math.max(1, maxX - margin);

  let y = safeTop + Math.random() * Math.max(1, maxY - safeTop);

  /*
   * While teleporting, don't
   * land directly over Buddy.
   */
  const insideBuddyZone =
    x > window.innerWidth - 210 && y > window.innerHeight - 210;

  if (insideBuddyZone) {
    x = margin + Math.random() * Math.max(1, window.innerWidth * 0.48);
  }

  return {
    x: Math.round(x),

    y: Math.round(y),
  };
};
