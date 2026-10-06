// filepath: rotompc-client/src/hooks/useRotomAILauncherCycle.js

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
   RESPONSIVE BREAKPOINT

   Both mobile and desktop use the SAME dock layout:

          [ ROTOM ]
               ↓
            small gap
               ↓
          [ BUDDY ]

   Their RIGHT edges are aligned.

   The breakpoint is now only used to determine Rotom size.
========================================================= */

const DESKTOP_BREAKPOINT = 768;

/* =========================================================
   ROTOM SIZE

   Keep synchronized with rotom-ai.css.

   Mobile:
   58px

   Desktop:
   68px
========================================================= */

const MOBILE_ROTOM_SIZE = 58;

const DESKTOP_ROTOM_SIZE = 68;

/* =========================================================
   FALLBACK BUDDY SIZE

   These are only used briefly before the real Buddy
   launcher can be measured.

   The actual Buddy button remains authoritative.
========================================================= */

const MOBILE_BUDDY_FALLBACK_WIDTH = 132;

const MOBILE_BUDDY_FALLBACK_HEIGHT = 56;

const DESKTOP_BUDDY_FALLBACK_WIDTH = 150;

const DESKTOP_BUDDY_FALLBACK_HEIGHT = 64;

/* =========================================================
   SPACING
========================================================= */

const EDGE_PADDING = 12;

/*
 * Small vertical gap between Rotom and Buddy.
 *
 * This is intentionally the same on desktop and mobile.
 */
const BUDDY_VERTICAL_GAP = 6;

/* =========================================================
   HELPERS
========================================================= */

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

/* =========================================================
   VIEWPORT
========================================================= */

const isMobileViewport = () => {
  if (!isBrowser()) {
    return false;
  }

  return window.innerWidth < DESKTOP_BREAKPOINT;
};

/* =========================================================
   DEFAULT ROTOM SIZE
========================================================= */

const getDefaultRotomSize = () =>
  isMobileViewport() ? MOBILE_ROTOM_SIZE : DESKTOP_ROTOM_SIZE;

/* =========================================================
   REAL ROTOM DIMENSIONS

   Prefer the real rendered launcher dimensions.

   This keeps docking correct if CSS sizing changes later.
========================================================= */

const getRotomDimensions = () => {
  const fallback = getDefaultRotomSize();

  if (!isBrowser()) {
    return {
      width: fallback,

      height: fallback,
    };
  }

  const element = document.querySelector(".rotom-ai-launcher");

  if (!element) {
    return {
      width: fallback,

      height: fallback,
    };
  }

  const rect = element.getBoundingClientRect();

  return {
    width: rect.width > 0 ? rect.width : fallback,

    height: rect.height > 0 ? rect.height : fallback,
  };
};

/* =========================================================
   CLAMP
========================================================= */

const clamp = (value, minimum, maximum) =>
  Math.min(
    Math.max(value, minimum),

    maximum,
  );

/* =========================================================
   SAFE SCREEN POSITION

   Used for:
   - random teleport locations
   - Rotom when Buddy is not available

   Docked Rotom uses its own Buddy-aware positioning.
========================================================= */

const clampPosition = (x, y, width, height = width) => {
  if (!isBrowser()) {
    return {
      x: 24,

      y: 120,
    };
  }

  const maxX = Math.max(
    EDGE_PADDING,

    window.innerWidth - width - EDGE_PADDING,
  );

  const maxY = Math.max(
    EDGE_PADDING,

    window.innerHeight - height - EDGE_PADDING,
  );

  return {
    x: clamp(x, EDGE_PADDING, maxX),

    y: clamp(y, EDGE_PADDING, maxY),
  };
};

/* =========================================================
   RANDOM TELEPORT POSITION
========================================================= */

const getRandomPosition = () => {
  const { width, height } = getRotomDimensions();

  if (!isBrowser()) {
    return {
      x: 24,

      y: 120,
    };
  }

  const minX = EDGE_PADDING;

  const maxX = Math.max(
    minX,

    window.innerWidth - width - EDGE_PADDING,
  );

  const minY = EDGE_PADDING;

  const maxY = Math.max(
    minY,

    window.innerHeight - height - EDGE_PADDING,
  );

  return {
    x:
      minX +
      Math.random() *
        Math.max(
          1,

          maxX - minX,
        ),

    y:
      minY +
      Math.random() *
        Math.max(
          1,

          maxY - minY,
        ),
  };
};

/* =========================================================
   FIND BUDDY LAUNCHER

   Preferred selector comes from Layout.jsx:

   data-buddy-launcher="true"
========================================================= */

const findBuddyLauncher = () => {
  if (!isBrowser()) {
    return null;
  }

  return (
    document.querySelector('[data-buddy-launcher="true"]') ||
    document.querySelector('[aria-label="Open Buddy Pokémon"]') ||
    document.querySelector('[aria-label="Open Buddy"]')
  );
};

/* =========================================================
   REAL BUDDY RECT
========================================================= */

const getBuddyRect = () => {
  const buddy = findBuddyLauncher();

  if (!buddy) {
    return null;
  }

  const rect = buddy.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return rect;
};

/* =========================================================
   BUDDY DOCK

   SAME ON MOBILE AND DESKTOP:

            ┌─────────┐
            │ ROTOMAI │
            └─────────┘
                  ↓ 6px
      ┌───────────────────┐
      │       BUDDY       │
      └───────────────────┘
                         ↑
                 RIGHT EDGES ALIGN


   Rotom X:
   Buddy.right - Rotom.width

   Rotom Y:
   Buddy.top - Rotom.height - gap

   Therefore:
   - Rotom stays above Buddy.
   - Rotom cannot overlap Buddy vertically.
   - Rotom's right edge aligns with Buddy's right edge.
========================================================= */

const getBuddyDockPosition = (buddyRect) => {
  const { width: rotomWidth, height: rotomHeight } = getRotomDimensions();

  /* -------------------------------------------------------
     RIGHT ALIGNMENT

     Rotom right:
     buddy.right

     Therefore:
     Rotom left =
     buddy.right - Rotom width
  ------------------------------------------------------- */

  const rawX = buddyRect.right - rotomWidth;

  /* -------------------------------------------------------
     ABOVE BUDDY

     Rotom bottom:
     Buddy top - gap
  ------------------------------------------------------- */

  const rawY = buddyRect.top - rotomHeight - BUDDY_VERTICAL_GAP;

  /* -------------------------------------------------------
     HORIZONTAL SCREEN SAFETY

     Normally Buddy itself is already safely inside the
     viewport, so this will preserve exact right alignment.

     This just protects unusually narrow layouts.
  ------------------------------------------------------- */

  const maxScreenX = Math.max(
    EDGE_PADDING,

    window.innerWidth - rotomWidth - EDGE_PADDING,
  );

  const x = clamp(rawX, EDGE_PADDING, maxScreenX);

  /* -------------------------------------------------------
     VERTICAL NON-OVERLAP

     Do NOT use a normal Y clamp that could push Rotom
     downward into Buddy.

     Buddy.top - Rotom.height - gap remains the maximum Y.
  ------------------------------------------------------- */

  const maximumYWithoutOverlap =
    buddyRect.top - rotomHeight - BUDDY_VERTICAL_GAP;

  const y = Math.min(
    Math.max(rawY, EDGE_PADDING),

    maximumYWithoutOverlap,
  );

  return {
    x,

    y,
  };
};

/* =========================================================
   FALLBACK BUDDY RECT

   Used before the actual Buddy button is measurable.

   Layout places Buddy at the lower-right, so this creates
   an approximate equivalent rectangle until the real
   element becomes available.
========================================================= */

const getFallbackBuddyRect = () => {
  if (!isBrowser()) {
    return null;
  }

  const mobile = isMobileViewport();

  const width = mobile
    ? MOBILE_BUDDY_FALLBACK_WIDTH
    : DESKTOP_BUDDY_FALLBACK_WIDTH;

  const height = mobile
    ? MOBILE_BUDDY_FALLBACK_HEIGHT
    : DESKTOP_BUDDY_FALLBACK_HEIGHT;

  /*
   * Match the responsive placement of the global
   * Buddy launcher:
   *
   * mobile:
   * right-3 / bottom-4
   *
   * sm:
   * right-6 / bottom-6
   *
   * lg:
   * right-8 / bottom-8
   */

  let right = 12;

  let bottom = 16;

  if (window.innerWidth >= 640) {
    right = 24;

    bottom = 24;
  }

  if (window.innerWidth >= 1024) {
    right = 32;

    bottom = 32;
  }

  const left = window.innerWidth - right - width;

  const top = window.innerHeight - bottom - height;

  return {
    left,

    right: left + width,

    top,

    bottom: top + height,

    width,

    height,
  };
};

/* =========================================================
   FALLBACK DOCK
========================================================= */

const getFallbackDockPosition = ({ buddyVisible }) => {
  if (!isBrowser()) {
    return {
      x: 24,

      y: 120,
    };
  }

  const { width, height } = getRotomDimensions();

  /* -------------------------------------------------------
     NO BUDDY

     Keep Rotom in the lower-right when Buddy is not
     supposed to exist.
  ------------------------------------------------------- */

  if (!buddyVisible) {
    return clampPosition(
      window.innerWidth - width - EDGE_PADDING,

      window.innerHeight - height - EDGE_PADDING,

      width,

      height,
    );
  }

  /* -------------------------------------------------------
     ESTIMATED BUDDY
  ------------------------------------------------------- */

  const buddyRect = getFallbackBuddyRect();

  if (!buddyRect) {
    return {
      x: 24,

      y: 120,
    };
  }

  return getBuddyDockPosition(buddyRect);
};

/* =========================================================
   RESPONSIVE DOCK POSITION

   There is no longer a different desktop arrangement.

   MOBILE:
   Rotom above Buddy.

   DESKTOP:
   Rotom above Buddy.

   BOTH:
   right-aligned.
========================================================= */

const getDockPosition = ({ buddyVisible }) => {
  if (!isBrowser()) {
    return {
      x: 24,

      y: 120,
    };
  }

  /* -------------------------------------------------------
     BUDDY NOT PRESENT
  ------------------------------------------------------- */

  if (!buddyVisible) {
    return getFallbackDockPosition({
      buddyVisible: false,
    });
  }

  /* -------------------------------------------------------
     REAL BUDDY
  ------------------------------------------------------- */

  const buddyRect = getBuddyRect();

  if (!buddyRect) {
    return getFallbackDockPosition({
      buddyVisible: true,
    });
  }

  return getBuddyDockPosition(buddyRect);
};

/* =========================================================
   RANDOM DOCK MESSAGE
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

  /*
   * false:
   * splash/loading screen is active.
   *
   * true:
   * application is ready.
   */
  appReady = true,

  buddyVisible = false,
} = {}) => {
  /* =======================================================
     STATE
  ======================================================= */

  const [phase, setPhase] = useState("waiting");

  const [position, setPosition] = useState(() => ({
    x: 24,

    y: 120,
  }));

  const [bubble, setBubble] = useState("");

  const [teleportKey, setTeleportKey] = useState(0);

  /* =======================================================
     REFS
  ======================================================= */

  const timersRef = useRef([]);

  const cycleRef = useRef(0);

  const pausedRef = useRef(paused);

  const appReadyRef = useRef(appReady);

  const buddyVisibleRef = useRef(buddyVisible);

  /* =======================================================
     KEEP PAUSED CURRENT
  ======================================================= */

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* =======================================================
     KEEP APP READY CURRENT
  ======================================================= */

  useEffect(() => {
    appReadyRef.current = appReady;
  }, [appReady]);

  /* =======================================================
     KEEP BUDDY VISIBILITY CURRENT
  ======================================================= */

  useEffect(() => {
    buddyVisibleRef.current = buddyVisible;
  }, [buddyVisible]);

  /* =======================================================
     BLOCK STATUS
  ======================================================= */

  const isBlocked = useCallback(
    () => pausedRef.current || !appReadyRef.current,

    [],
  );

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
     INVALIDATE CURRENT CYCLE
  ======================================================= */

  const invalidateCycle = useCallback(() => {
    cycleRef.current += 1;

    clearTimers();
  }, [clearTimers]);

  /* =======================================================
     SCHEDULE
  ======================================================= */

  const schedule = useCallback(
    (callback, delay) => {
      const timer = window.setTimeout(callback, delay);

      timersRef.current.push(timer);

      return timer;
    },

    [],
  );

  /* =======================================================
     START ROTOM CYCLE
  ======================================================= */

  const startCycle = useCallback(() => {
    if (!isBrowser() || isBlocked()) {
      return;
    }

    clearTimers();

    const cycleId = cycleRef.current + 1;

    cycleRef.current = cycleId;

    setBubble("");

    setPhase("teleporting");

    /* ---------------------------------------------------
         FIRST TELEPORT
      --------------------------------------------------- */

    setPosition(getRandomPosition());

    setTeleportKey((current) => current + 1);

    /* ---------------------------------------------------
         REMAINING TELEPORTS
      --------------------------------------------------- */

    for (let index = 1; index < TELEPORT_COUNT; index += 1) {
      schedule(
        () => {
          if (cycleRef.current !== cycleId || isBlocked()) {
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

    /* ---------------------------------------------------
         SETTLING
      --------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || isBlocked()) {
          return;
        }

        setPhase("settling");
      },

      settleStart,
    );

    /* ---------------------------------------------------
         MOVE TOWARD BUDDY
      --------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || isBlocked()) {
          return;
        }

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (cycleRef.current !== cycleId || isBlocked()) {
              return;
            }

            setPosition(
              getDockPosition({
                buddyVisible: buddyVisibleRef.current,
              }),
            );
          });
        });
      },

      settleStart + 32,
    );

    /* ---------------------------------------------------
         DOCKED
      --------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || isBlocked()) {
          return;
        }

        setPosition(
          getDockPosition({
            buddyVisible: buddyVisibleRef.current,
          }),
        );

        setPhase("docked");

        setBubble(getRandomBubble());
      },

      settleStart + SETTLE_DURATION_MS,
    );

    /* ---------------------------------------------------
         NEXT CYCLE
      --------------------------------------------------- */

    schedule(
      () => {
        if (cycleRef.current !== cycleId || isBlocked()) {
          return;
        }

        startCycle();
      },

      settleStart + SETTLE_DURATION_MS + DOCK_DURATION_MS,
    );
  }, [clearTimers, isBlocked, schedule]);

  /* =======================================================
     INITIALIZE
  ======================================================= */

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    if (paused || !appReady) {
      invalidateCycle();

      setBubble("");

      setPhase("waiting");

      return undefined;
    }

    startCycle();

    return () => {
      invalidateCycle();
    };
  }, [appReady, paused, invalidateCycle, startCycle]);

  /* =======================================================
     VIEWPORT CHANGES

     The docking orientation no longer changes at 768px.

     Only the Rotom size changes.

     In both modes:

          ROTOM
            ↓
          BUDDY
  ======================================================= */

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    const reposition = () => {
      if (phase !== "docked" && phase !== "settling") {
        return;
      }

      window.requestAnimationFrame(() => {
        setPosition(
          getDockPosition({
            buddyVisible: buddyVisibleRef.current,
          }),
        );
      });
    };

    window.addEventListener("resize", reposition);

    window.addEventListener("orientationchange", reposition);

    window.visualViewport?.addEventListener("resize", reposition);

    window.visualViewport?.addEventListener("scroll", reposition);

    return () => {
      window.removeEventListener("resize", reposition);

      window.removeEventListener("orientationchange", reposition);

      window.visualViewport?.removeEventListener("resize", reposition);

      window.visualViewport?.removeEventListener("scroll", reposition);
    };
  }, [phase]);

  /* =======================================================
     BUDDY VISIBILITY CHANGE
  ======================================================= */

  useEffect(() => {
    if (phase !== "docked" && phase !== "settling") {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      setPosition(
        getDockPosition({
          buddyVisible,
        }),
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [buddyVisible, phase]);

  /* =======================================================
     LIVE BUDDY SYNCHRONIZATION

     While docked, Rotom continuously follows the ACTUAL
     Buddy launcher.

     This protects alignment when:
     - Buddy mounts after Rotom
     - Buddy width changes
     - viewport width changes
     - mobile browser chrome moves
     - orientation changes
     - responsive CSS changes
========================================================= */

  useEffect(() => {
    if (phase !== "docked" || !buddyVisible) {
      return undefined;
    }

    let observer = null;

    let observedBuddy = null;

    let animationFrame = null;

    /* -------------------------------------------------------
       UPDATE
    ------------------------------------------------------- */

    const updatePosition = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        const next = getDockPosition({
          buddyVisible: true,
        });

        setPosition((current) => {
          const sameX = Math.abs(current.x - next.x) < 0.5;

          const sameY = Math.abs(current.y - next.y) < 0.5;

          if (sameX && sameY) {
            return current;
          }

          return next;
        });

        /* -----------------------------------------
                 OBSERVE REAL BUDDY
              ----------------------------------------- */

        const buddy = findBuddyLauncher();

        if (
          buddy &&
          buddy !== observedBuddy &&
          typeof ResizeObserver !== "undefined"
        ) {
          observer?.disconnect();

          observedBuddy = buddy;

          observer = new ResizeObserver(updatePosition);

          observer.observe(buddy);
        }
      });
    };

    /* -------------------------------------------------------
       IMMEDIATE CORRECTION
    ------------------------------------------------------- */

    updatePosition();

    /* -------------------------------------------------------
       CONTINUOUS SYNCHRONIZATION

       This also catches movement caused by transforms where
       ResizeObserver alone may not fire.
    ------------------------------------------------------- */

    const interval = window.setInterval(updatePosition, 150);

    window.addEventListener("resize", updatePosition);

    window.addEventListener("orientationchange", updatePosition);

    window.visualViewport?.addEventListener("resize", updatePosition);

    window.visualViewport?.addEventListener("scroll", updatePosition);

    return () => {
      observer?.disconnect();

      window.clearInterval(interval);

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("resize", updatePosition);

      window.removeEventListener("orientationchange", updatePosition);

      window.visualViewport?.removeEventListener("resize", updatePosition);

      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [buddyVisible, phase]);

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    phase,

    position,

    bubble,

    teleportKey,

    isWaiting: phase === "waiting",

    isTeleporting: phase === "teleporting",

    isSettling: phase === "settling",

    isDocked: phase === "docked",
  };
};

export default useRotomAILauncherCycle;
