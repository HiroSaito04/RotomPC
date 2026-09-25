// rotompc-client/src/components/rotom-ai/RotomAILauncher.jsx

import { ROTOM_AI_ICON } from "@/constants/rotomAI";

/* =========================================================
   LAUNCHER
========================================================= */

const RotomAILauncher = ({
  phase = "teleporting",

  position = {
    x: 20,
    y: 120,
  },

  teleportKey = 0,

  bubbleText = "",

  buddyVisible = false,

  onOpen,
}) => {
  const energized = phase === "teleporting" || phase === "settling";

  return (
    <div
      className={`
        rotom-ai-launcher

        rotom-ai-launcher--${phase}

        ${
          buddyVisible
            ? "rotom-ai-launcher--with-buddy"
            : "rotom-ai-launcher--solo"
        }
      `}
      style={{
        "--rotom-x": `${position.x}px`,

        "--rotom-y": `${position.y}px`,
      }}
    >
      {/* =================================================
          ELECTRIC EFFECT

          Only appears while moving.

          Docked Rotom is just the transparent SVG.
      ================================================== */}

      {energized && (
        <div className="rotom-ai-launcher__electric" aria-hidden="true">
          <span className="rotom-ai-launcher__electric-ring rotom-ai-launcher__electric-ring--one" />

          <span className="rotom-ai-launcher__electric-ring rotom-ai-launcher__electric-ring--two" />

          <span className="rotom-ai-launcher__spark rotom-ai-launcher__spark--one">
            ⚡
          </span>

          <span className="rotom-ai-launcher__spark rotom-ai-launcher__spark--two">
            ⚡
          </span>

          <span className="rotom-ai-launcher__spark rotom-ai-launcher__spark--three">
            ⚡
          </span>
        </div>
      )}

      {/* =================================================
          TELEPORT FLASH
      ================================================== */}

      {phase === "teleporting" && (
        <span
          key={teleportKey}
          className="rotom-ai-launcher__teleport-flash"
          aria-hidden="true"
        />
      )}

      {/* =================================================
          BUBBLE
      ================================================== */}

      {phase === "docked" && bubbleText && (
        <div className="rotom-ai-launcher__bubble">{bubbleText}</div>
      )}

      {/* =================================================
          BUTTON

          Transparent.
          SVG only.
      ================================================== */}

      <button
        type="button"
        onClick={onOpen}
        aria-label="Open RotomAI"
        title="Open RotomAI"
        className="rotom-ai-launcher__button"
      >
        <span className="rotom-ai-launcher__icon-wrap">
          <img
            src={ROTOM_AI_ICON}
            alt=""
            draggable={false}
            className="rotom-ai-launcher__icon"
          />
        </span>
      </button>
    </div>
  );
};

export default RotomAILauncher;
