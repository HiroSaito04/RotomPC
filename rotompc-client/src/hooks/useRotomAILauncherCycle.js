// rotompc-client/src/hooks/useRotomAILauncherCycle.js

import { useEffect, useRef, useState } from "react";

import {
  ROTOM_AI_BUBBLE_INTERVAL,
  ROTOM_AI_DOCK_DURATION,
  ROTOM_AI_TELEPORT_INTERVAL,
  ROTOM_AI_TELEPORTS_PER_CYCLE,
} from "@/constants/rotomAI";

import { getRandomRotomBubble, getSafeRotomPosition } from "@/utils/rotomAI";

/* =========================================================
   PHASES
========================================================= */

export const ROTOM_PHASE = {
  TELEPORT: "teleport",

  DOCKED: "docked",
};

/* =========================================================
   HOOK
========================================================= */

const useRotomAILauncherCycle = ({ isOpen }) => {
  const [phase, setPhase] = useState(ROTOM_PHASE.TELEPORT);

  const [position, setPosition] = useState(() => getSafeRotomPosition());

  const [teleporting, setTeleporting] = useState(false);

  const [teleportKey, setTeleportKey] = useState(0);

  const [bubbleText, setBubbleText] = useState(() => getRandomRotomBubble());

  const teleportCountRef = useRef(0);

  /* =====================================================
       TELEPORT / DOCK LOOP
    ===================================================== */

  useEffect(() => {
    if (isOpen) {
      return undefined;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /*
     * Reduced motion users simply
     * get docked Rotom.
     */
    if (reduceMotion) {
      if (phase !== ROTOM_PHASE.DOCKED) {
        setPhase(ROTOM_PHASE.DOCKED);
      }

      setTeleporting(false);

      return undefined;
    }

    /* ---------------------------------------------------
         TELEPORT PHASE
      --------------------------------------------------- */

    if (phase === ROTOM_PHASE.TELEPORT) {
      teleportCountRef.current = 0;

      const timers = new Set();

      let intervalId = null;

      const schedule = (callback, delay) => {
        const id = window.setTimeout(() => {
          timers.delete(id);

          callback();
        }, delay);

        timers.add(id);

        return id;
      };

      const teleport = () => {
        teleportCountRef.current += 1;

        const finalTeleport =
          teleportCountRef.current >= ROTOM_AI_TELEPORTS_PER_CYCLE;

        setTeleporting(true);

        /*
         * Collapse first, then
         * appear elsewhere.
         */
        schedule(() => {
          setPosition(getSafeRotomPosition());

          setTeleportKey((current) => current + 1);
        }, 125);

        schedule(() => {
          setTeleporting(false);

          /*
           * After teleport #5
           * immediately dock.
           */
          if (finalTeleport) {
            setPhase(ROTOM_PHASE.DOCKED);
          }
        }, 360);

        if (finalTeleport && intervalId) {
          window.clearInterval(intervalId);
        }
      };

      intervalId = window.setInterval(teleport, ROTOM_AI_TELEPORT_INTERVAL);

      return () => {
        if (intervalId) {
          window.clearInterval(intervalId);
        }

        timers.forEach((timer) => window.clearTimeout(timer));

        timers.clear();
      };
    }

    /* ---------------------------------------------------
         DOCK PHASE
      --------------------------------------------------- */

    setTeleporting(false);

    setBubbleText((previous) => getRandomRotomBubble(previous));

    const bubbleInterval = window.setInterval(() => {
      setBubbleText((previous) => getRandomRotomBubble(previous));
    }, ROTOM_AI_BUBBLE_INTERVAL);

    const dockTimer = window.setTimeout(() => {
      teleportCountRef.current = 0;

      setPhase(ROTOM_PHASE.TELEPORT);
    }, ROTOM_AI_DOCK_DURATION);

    return () => {
      window.clearInterval(bubbleInterval);

      window.clearTimeout(dockTimer);
    };
  }, [phase, isOpen]);

  /* =====================================================
       RESIZE
    ===================================================== */

  useEffect(() => {
    const handleResize = () => {
      if (phase === ROTOM_PHASE.TELEPORT) {
        setPosition(getSafeRotomPosition());
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
    teleporting,
    teleportKey,
    bubbleText,
  };
};

export default useRotomAILauncherCycle;
