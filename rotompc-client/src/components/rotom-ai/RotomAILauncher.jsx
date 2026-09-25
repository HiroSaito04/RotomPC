import { ROTOM_AI_ICON } from "@/constants/rotomAI";

import useRotomAILauncherCycle from "@/hooks/useRotomAILauncherCycle";

/* =========================================================
   LAUNCHER
========================================================= */

const RotomAILauncher = ({ onOpen, open = false }) => {
  const {
    phase,

    position,

    bubble,

    teleportKey,
  } = useRotomAILauncherCycle({
    paused: open,
  });

  return (
    <div
      className={`
        rotom-ai-launcher

        rotom-ai-launcher--${phase}
      `}
      style={{
        "--rotom-x": `${position.x}px`,

        "--rotom-y": `${position.y}px`,
      }}
    >
      {/* =================================================
          ELECTRIC FIELD
      ================================================== */}

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

      {/* =================================================
          TELEPORT FLASH

          Re-mounts every jump.
      ================================================== */}

      {phase === "teleporting" && (
        <span
          key={teleportKey}
          className="rotom-ai-launcher__teleport-flash"
          aria-hidden="true"
        />
      )}

      {/* =================================================
          CHAT BUBBLE
      ================================================== */}

      {phase === "docked" && bubble && (
        <div className="rotom-ai-launcher__bubble">{bubble}</div>
      )}

      {/* =================================================
          BUTTON
      ================================================== */}

      <button
        type="button"
        onClick={onOpen}
        aria-label="Open RotomAI"
        className="rotom-ai-launcher__button"
      >
        <span className="rotom-ai-launcher__icon-wrap">
          <img src={ROTOM_AI_ICON} alt="" className="rotom-ai-launcher__icon" />
        </span>
      </button>
    </div>
  );
};

export default RotomAILauncher;
