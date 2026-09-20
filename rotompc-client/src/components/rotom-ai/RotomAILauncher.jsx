// rotompc-client/src/components/rotom-ai/RotomAILauncher.jsx

import { ROTOM_AI_ICON } from "@/constants/rotomAI";

import { ROTOM_PHASE } from "@/hooks/useRotomAILauncherCycle";

/* =========================================================
   ELECTRICITY
========================================================= */

const RotomElectricField = () => (
  <span className="rotom-ai-electric" aria-hidden="true">
    <span className="rotom-ai-electric__glow" />

    <span className="rotom-ai-electric__ring rotom-ai-electric__ring--one" />

    <span className="rotom-ai-electric__ring rotom-ai-electric__ring--two" />

    <span className="rotom-ai-electric__bolt rotom-ai-electric__bolt--1" />

    <span className="rotom-ai-electric__bolt rotom-ai-electric__bolt--2" />

    <span className="rotom-ai-electric__bolt rotom-ai-electric__bolt--3" />

    <span className="rotom-ai-electric__bolt rotom-ai-electric__bolt--4" />

    <span className="rotom-ai-electric__bolt rotom-ai-electric__bolt--5" />

    <span className="rotom-ai-electric__bolt rotom-ai-electric__bolt--6" />

    <span className="rotom-ai-electric__spark rotom-ai-electric__spark--1" />

    <span className="rotom-ai-electric__spark rotom-ai-electric__spark--2" />

    <span className="rotom-ai-electric__spark rotom-ai-electric__spark--3" />

    <span className="rotom-ai-electric__spark rotom-ai-electric__spark--4" />
  </span>
);

/* =========================================================
   LAUNCHER
========================================================= */

const RotomAILauncher = ({
  phase,

  position,

  teleporting,

  teleportKey,

  bubbleText,

  buddyVisible,

  onOpen,
}) => {
  const isDocked = phase === ROTOM_PHASE.DOCKED;

  const launcherStyle = isDocked
    ? undefined
    : {
        left: `${position.x}px`,

        top: `${position.y}px`,
      };

  return (
    <div
      key={teleportKey}
      style={launcherStyle}
      className={`
        rotom-ai-launcher

        ${
          isDocked ? "rotom-ai-launcher--docked" : "rotom-ai-launcher--teleport"
        }

        ${isDocked && !buddyVisible ? "rotom-ai-launcher--solo" : ""}

        ${teleporting ? "rotom-ai-launcher--teleporting" : ""}
      `}
    >
      {/* ===============================================
          ELECTRICITY

          ONLY DURING TELEPORT MODE
      ================================================ */}

      {!isDocked && <RotomElectricField />}

      {/* ===============================================
          CHAT BUBBLE

          ONLY WHILE DOCKED
      ================================================ */}

      {isDocked && (
        <div className="rotom-ai-nudge" aria-hidden="true">
          <span className="rotom-ai-nudge__text">{bubbleText}</span>
        </div>
      )}

      {/* ===============================================
          ROTOM

          NO BOX
          NO BACKGROUND
          NO BORDER
      ================================================ */}

      <button
        type="button"
        onClick={onOpen}
        aria-label="Open RotomAI"
        title="RotomAI"
        className="rotom-ai-launcher__button"
      >
        <img
          src={ROTOM_AI_ICON}
          alt=""
          draggable="false"
          className="rotom-ai-launcher__icon"
        />
      </button>
    </div>
  );
};

export default RotomAILauncher;
