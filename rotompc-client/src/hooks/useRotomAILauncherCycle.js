// rotompc-client/src/hooks/useRotomAILauncherCycle.js

import { useCallback, useEffect, useRef, useState } from "react";

import { ROTOM_AI_DOCK_MESSAGES } from "@/constants/rotomAI";

/* =========================================================
   TIMING
========================================================= */

const TELEPORT_COUNT = 5;

const TELEPORT_INTERVAL_MS = 1000;

const SETTLE_DELAY_MS = 220;

const SETTLE_DURATION_MS = 720;

const DOCK_DURATION_MS = 20000;

/* =========================================================
   BREAKPOINT

   Below 768:
   Rotom stacks ABOVE Buddy.

   768+:
   Rotom sits BESIDE Buddy.
========================================================= */

const MOBILE_BREAKPOINT = 768;

/* =========================================================
   SIZE
========================================================= */

const MOBILE_LAUNCHER_SIZE = 58;

const DESKTOP_LAUNCHER_SIZE = 68;

const MOBILE_BUDDY_FALLBACK_SIZE = 56;

const DESKTOP_BUDDY_FALLBACK_SIZE = 64;

/* =========================================================
   SPACING
========================================================= */

const EDGE_PADDING = 16;

const MOBILE_STACK_GAP = 10;

const DESKTOP_SIDE_GAP = 14;

/* =========================================================
   HELPERS
========================================================= */

const isMobileViewport = () => window.innerWidth < MOBILE_BREAKPOINT;

const getLauncherSize = () =>
  isMobileViewport() ? MOBILE_LAUNCHER_SIZE : DESKTOP_LAUNCHER_SIZE;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/* =========================================================
   SAFE POSITION
========================================================= */

const clampPosition = (x, y, size) => {
  const maxX = Math.max(EDGE_PADDING, window.innerWidth - size - EDGE_PADDING);

  const maxY = Math.max(EDGE_PADDING, window.innerHeight - size - EDGE_PADDING);

  return {
    x: clamp(x, EDGE_PADDING, maxX),

    y: clamp(y, EDGE_PADDING, maxY),
  };
};

/* =========================================================
   RANDOM POSITION
========================================================= */

const getRandomPosition = () => {
  const size = getLauncherSize();

  const maxX = Math.max(EDGE_PADDING, window.innerWidth - size - EDGE_PADDING);

  const maxY = Math.max(EDGE_PADDING, window.innerHeight - size - EDGE_PADDING);

  const x = EDGE_PADDING + Math.random() * Math.max(1, maxX - EDGE_PADDING);

  const y = EDGE_PADDING + Math.random() * Math.max(1, maxY - EDGE_PADDING);

  return clampPosition(x, y, size);
};

/* =========================================================
   FIND BUDDY BUTTON
========================================================= */

const findBuddyLauncher = () => {
  /*
   * Preferred:
   *
   * data-buddy-launcher="true"
   *
   * The aria selectors below are fallbacks
   * so the layout still works while migrating.
   */

  return (
    document.querySelector('[data-buddy-launcher="true"]') ||
    document.querySelector('[aria-label="Open Buddy"]') ||
    document.querySelector('[aria-label="Open Buddy Pokémon"]')
  );
};

/* =========================================================
   FALLBACK DOCK
========================================================= */

const getFallbackDockPosition = ({ buddyVisible }) => {
  const mobile = isMobileViewport();

  const size = getLauncherSize();

  /*
   * No Buddy visible:
   * Rotom owns the bottom-right corner.
   */

  if (!buddyVisible) {
    return clampPosition(
      window.innerWidth - size - EDGE_PADDING,

      window.innerHeight - size - EDGE_PADDING,

      size,
    );
  }

  /*
   * Buddy visible:
   * estimate its bottom-right position if its
   * actual element cannot be found.
   */

  if (mobile) {
    const buddySize = MOBILE_BUDDY_FALLBACK_SIZE;

    return clampPosition(
      window.innerWidth - size - EDGE_PADDING,

      window.innerHeight - EDGE_PADDING - buddySize - MOBILE_STACK_GAP - size,

      size,
    );
  }

  const buddySize = DESKTOP_BUDDY_FALLBACK_SIZE;

  return clampPosition(
    window.innerWidth - EDGE_PADDING - buddySize - DESKTOP_SIDE_GAP - size,

    window.innerHeight - EDGE_PADDING - buddySize / 2 - size / 2,

    size,
  );
};

/* =========================================================
   DOCK POSITION
========================================================= */

const getDockPosition = ({ buddyVisible }) => {
  const size = getLauncherSize();

  const buddy = buddyVisible ? findBuddyLauncher() : null;

  if (!buddy) {
    return getFallbackDockPosition({
      buddyVisible,
    });
  }

  const rect = buddy.getBoundingClientRect();

  /*
   * MOBILE
   *
   * Align Rotom's right edge with Buddy's
   * right edge and place it directly above.
   */

  if (isMobileViewport()) {
    return clampPosition(
      rect.right - size,

      rect.top - size - MOBILE_STACK_GAP,

      size,
    );
  }

  /*
   * TABLET / DESKTOP
   *
   * Put Rotom directly beside Buddy,
   * vertically centered.
   */

  return clampPosition(
    rect.left - size - DESKTOP_SIDE_GAP,

    rect.top + rect.height / 2 - size / 2,

    size,
  );
};

/* =========================================================
   RANDOM BUBBLE
========================================================= */

const getRandomBubble = () => {
  if (
    !Array.isArray(ROTOM_AI_DOCK_MESSAGES) ||
    ROTOM_AI_DOCK_MESSAGES.length === 0
  ) {
    return "";
  }

  return ROTOM_AI_DOCK_MESSAGES[
    Math.floor(Math.random() * ROTOM_AI_DOCK_MESSAGES.length)
  ];
};

/* =========================================================
   HOOK
========================================================= */

const useRotomAILauncherCycle = ({
  paused = false,

  buddyVisible = false,
} = {}) => {
  const [phase, setPhase] = useState("teleporting");

  const [position, setPosition] = useState(() => ({
    x: 28,
    y: 120,
  }));

  const [bubble, setBubble] = useState("");

  const [teleportKey, setTeleportKey] = useState(0);

  const timersRef = useRef([]);

  const cycleRef = useRef(0);

  /* =====================================================
       CLEAR TIMERS
    ===================================================== */

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
    });

    timersRef.current = [];
  }, []);

  /* =====================================================
       SCHEDULE
    ===================================================== */

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(callback, delay);

    timersRef.current.push(timer);

    return timer;
  }, []);

  /* =====================================================
       START CYCLE
    ===================================================== */

  const startCycle = useCallback(() => {
    clearTimers();

    const cycleId = cycleRef.current + 1;

    cycleRef.current = cycleId;

    setBubble("");

    setPhase("teleporting");

    setPosition(getRandomPosition());

    setTeleportKey((current) => current + 1);

    /* -------------------------------------------------
           TELEPORTS
        ------------------------------------------------- */

    for (let index = 1; index < TELEPORT_COUNT; index += 1) {
      schedule(
        () => {
          if (cycleRef.current !== cycleId || paused) {
            return;
          }

          setPosition(getRandomPosition());

          setTeleportKey((current) => current + 1);
        },

        index * TELEPORT_INTERVAL_MS,
      );
    }

    const teleportEnd = TELEPORT_COUNT * TELEPORT_INTERVAL_MS;

    const settleStart = teleportEnd - TELEPORT_INTERVAL_MS + SETTLE_DELAY_MS;

    /* -------------------------------------------------
           SETTLING
        ------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || paused) {
          return;
        }

        setPhase("settling");
      },

      settleStart,
    );

    /* -------------------------------------------------
           GLIDE TO BUDDY
        ------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || paused) {
          return;
        }

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setPosition(
              getDockPosition({
                buddyVisible,
              }),
            );
          });
        });
      },

      settleStart + 32,
    );

    /* -------------------------------------------------
           DOCK
        ------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || paused) {
          return;
        }

        setPosition(
          getDockPosition({
            buddyVisible,
          }),
        );

        setPhase("docked");

        setBubble(getRandomBubble());
      },

      settleStart + SETTLE_DURATION_MS,
    );

    /* -------------------------------------------------
           RESTART
        ------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || paused) {
          return;
        }

        startCycle();
      },

      settleStart + SETTLE_DURATION_MS + DOCK_DURATION_MS,
    );
  }, [buddyVisible, clearTimers, paused, schedule]);

  /* =====================================================
       INITIALIZE
    ===================================================== */

  useEffect(() => {
    if (paused) {
      clearTimers();

      return undefined;
    }

    startCycle();

    return () => {
      cycleRef.current += 1;

      clearTimers();
    };
  }, [clearTimers, paused, startCycle]);

  /* =====================================================
       RESIZE / ORIENTATION

       Reattach Rotom immediately if device orientation
       or viewport dimensions change.
    ===================================================== */

  useEffect(() => {
    const handleResize = () => {
      if (phase === "docked" || phase === "settling") {
        setPosition(
          getDockPosition({
            buddyVisible,
          }),
        );
      }
    };

    window.addEventListener("resize", handleResize);

    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      window.removeEventListener("orientationchange", handleResize);
    };
  }, [buddyVisible, phase]);

  /* =====================================================
       BUDDY VISIBILITY CHANGE
    ===================================================== */

  useEffect(() => {
    if (phase !== "docked" && phase !== "settling") {
      return;
    }

    setPosition(
      getDockPosition({
        buddyVisible,
      }),
    );
  }, [buddyVisible, phase]);

  return {
    phase,

    position,

    bubble,

    teleportKey,

    isTeleporting: phase === "teleporting",

    isSettling: phase === "settling",

    isDocked: phase === "docked",
  };
};

export default useRotomAILauncherCycle;
