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
   SAFE AREA
========================================================= */

const EDGE_PADDING = 22;

const LAUNCHER_SIZE = 72;

/* =========================================================
   RANDOM POSITION
========================================================= */

const getRandomPosition = () => {
  const width = window.innerWidth;

  const height = window.innerHeight;

  const maxX = Math.max(EDGE_PADDING, width - LAUNCHER_SIZE - EDGE_PADDING);

  const maxY = Math.max(EDGE_PADDING, height - LAUNCHER_SIZE - EDGE_PADDING);

  return {
    x: EDGE_PADDING + Math.random() * Math.max(1, maxX - EDGE_PADDING),

    y: EDGE_PADDING + Math.random() * Math.max(1, maxY - EDGE_PADDING),
  };
};

/* =========================================================
   DOCK POSITION
========================================================= */

const getDockPosition = () => {
  const buddy = document.querySelector('[data-buddy-launcher="true"]');

  /*
   * Fallback if Buddy is temporarily
   * unavailable.
   */

  if (!buddy) {
    return {
      x: Math.max(18, window.innerWidth - 178),

      y: Math.max(18, window.innerHeight - 105),
    };
  }

  const rect = buddy.getBoundingClientRect();

  const isMobile = window.innerWidth < 640;

  /* -----------------------------------------------------
     MOBILE

     Sit centered above Buddy.
  ----------------------------------------------------- */

  if (isMobile) {
    return {
      x: rect.left + rect.width / 2 - LAUNCHER_SIZE / 2,

      y: rect.top - LAUNCHER_SIZE - 12,
    };
  }

  /* -----------------------------------------------------
     DESKTOP

     Sit slightly left of Buddy.
  ----------------------------------------------------- */

  return {
    x: rect.left - LAUNCHER_SIZE - 26,

    y: rect.top + rect.height / 2 - LAUNCHER_SIZE / 2,
  };
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

const useRotomAILauncherCycle = ({ paused = false } = {}) => {
  const [phase, setPhase] = useState("teleporting");

  const [position, setPosition] = useState(() => ({
    x: 28,
    y: 120,
  }));

  const [bubble, setBubble] = useState("");

  const [teleportKey, setTeleportKey] = useState(0);

  const timersRef = useRef([]);

  const cycleRef = useRef(0);

  /* =======================================================
     CLEAR TIMERS
  ======================================================= */

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
    });

    timersRef.current = [];
  }, []);

  /* =======================================================
     TIMER HELPER
  ======================================================= */

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(callback, delay);

    timersRef.current.push(timer);

    return timer;
  }, []);

  /* =======================================================
     START CYCLE
  ======================================================= */

  const startCycle = useCallback(() => {
    clearTimers();

    const cycleId = cycleRef.current + 1;

    cycleRef.current = cycleId;

    setBubble("");

    setPhase("teleporting");

    /*
     * Start somewhere random.
     */

    setPosition(getRandomPosition());

    setTeleportKey((current) => current + 1);

    /* ---------------------------------------------------
         TELEPORTS
      --------------------------------------------------- */

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

    /* ---------------------------------------------------
         FINAL TELEPORT FINISH

         Do NOT immediately snap to dock.
         First enter "settling".
      --------------------------------------------------- */

    const teleportEnd = TELEPORT_COUNT * TELEPORT_INTERVAL_MS;

    schedule(
      () => {
        if (cycleRef.current !== cycleId || paused) {
          return;
        }

        setPhase("settling");
      },

      teleportEnd - TELEPORT_INTERVAL_MS + SETTLE_DELAY_MS,
    );

    /* ---------------------------------------------------
         GLIDE TO BUDDY

         Keep current position during the phase change.
         Then update position on the next frame so CSS
         can animate from the current teleport location
         to the dock location.
      --------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || paused) {
          return;
        }

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setPosition(getDockPosition());
          });
        });
      },

      teleportEnd - TELEPORT_INTERVAL_MS + SETTLE_DELAY_MS + 32,
    );

    /* ---------------------------------------------------
         DOCKED
      --------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || paused) {
          return;
        }

        setPhase("docked");

        setBubble(getRandomBubble());
      },

      teleportEnd - TELEPORT_INTERVAL_MS + SETTLE_DELAY_MS + SETTLE_DURATION_MS,
    );

    /* ---------------------------------------------------
         RESTART
      --------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || paused) {
          return;
        }

        startCycle();
      },

      teleportEnd -
        TELEPORT_INTERVAL_MS +
        SETTLE_DELAY_MS +
        SETTLE_DURATION_MS +
        DOCK_DURATION_MS,
    );
  }, [clearTimers, paused, schedule]);

  /* =======================================================
     INITIALIZE
  ======================================================= */

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

  /* =======================================================
     RESIZE

     Keep docked Rotom attached to Buddy.
  ======================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (phase === "docked" || phase === "settling") {
        setPosition(getDockPosition());
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [phase]);

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
