// rotompc-client/src/components/splash/RotomPCSplash.jsx

import { useEffect, useState } from "react";

import "@/assets/styles/app-splash.css";

/* =========================================================
   CONFIG
========================================================= */

const EXIT_START_MS = 2200;

const FINISH_MS = 2700;

/* =========================================================
   LIGHTNING
========================================================= */

const ElectricBolt = ({ className = "" }) => {
  return (
    <span
      aria-hidden="true"
      className={`
        rotom-splash__bolt
        ${className}
      `}
    />
  );
};

/* =========================================================
   SPARK
========================================================= */

const Spark = ({ className = "" }) => {
  return (
    <span
      aria-hidden="true"
      className={`
        rotom-splash__spark
        ${className}
      `}
    />
  );
};

/* =========================================================
   SPLASH
========================================================= */

const RotomPCSplash = ({ onFinish }) => {
  const [exiting, setExiting] = useState(false);

  /* =======================================================
     TIMING
  ======================================================= */

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, EXIT_START_MS);

    const finishTimer = window.setTimeout(() => {
      onFinish?.();
    }, FINISH_MS);

    return () => {
      window.clearTimeout(exitTimer);

      window.clearTimeout(finishTimer);

      document.body.style.overflow = previousOverflow;
    };
  }, [onFinish]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className={`
        rotom-splash
        ${exiting ? "rotom-splash--exit" : ""}
      `}
      role="status"
      aria-live="polite"
      aria-label="RotomPC is starting"
    >
      {/* ===================================================
          BACKGROUND GRID
      ==================================================== */}

      <div aria-hidden="true" className="rotom-splash__grid" />

      {/* ===================================================
          BACKGROUND ENERGY
      ==================================================== */}

      <div
        aria-hidden="true"
        className="rotom-splash__ambient rotom-splash__ambient--one"
      />

      <div
        aria-hidden="true"
        className="rotom-splash__ambient rotom-splash__ambient--two"
      />

      {/* ===================================================
          CONTENT
      ==================================================== */}

      <div className="rotom-splash__content">
        {/* ===============================================
            SYSTEM LABEL
        ================================================ */}

        <div className="rotom-splash__system">
          <span className="rotom-splash__system-dot" />

          <span>ROTOM SYSTEM // BOOT</span>
        </div>

        {/* ===============================================
            ENERGY CORE
        ================================================ */}

        <div className="rotom-splash__core">
          {/* RINGS */}

          <div
            aria-hidden="true"
            className="rotom-splash__ring rotom-splash__ring--outer"
          />

          <div
            aria-hidden="true"
            className="rotom-splash__ring rotom-splash__ring--inner"
          />

          <div aria-hidden="true" className="rotom-splash__electric-glow" />

          {/* LIGHTNING */}

          <ElectricBolt className="rotom-splash__bolt--1" />

          <ElectricBolt className="rotom-splash__bolt--2" />

          <ElectricBolt className="rotom-splash__bolt--3" />

          <ElectricBolt className="rotom-splash__bolt--4" />

          <ElectricBolt className="rotom-splash__bolt--5" />

          <ElectricBolt className="rotom-splash__bolt--6" />

          {/* SPARKS */}

          <Spark className="rotom-splash__spark--1" />

          <Spark className="rotom-splash__spark--2" />

          <Spark className="rotom-splash__spark--3" />

          <Spark className="rotom-splash__spark--4" />

          <Spark className="rotom-splash__spark--5" />

          {/* ROTOM */}

          <div className="rotom-splash__icon-shell">
            <div aria-hidden="true" className="rotom-splash__scan" />

            <img
              src="/rotompc-icon.svg"
              alt=""
              draggable="false"
              className="rotom-splash__icon"
            />
          </div>
        </div>

        {/* ===============================================
            BRAND
        ================================================ */}

        <div className="rotom-splash__brand">
          <h1>
            ROTOM
            <span>PC</span>
          </h1>

          <p>Pokémon Trainer Network</p>
        </div>

        {/* ===============================================
            BOOT STATUS
        ================================================ */}

        <div className="rotom-splash__status">
          <div className="rotom-splash__status-row">
            <span>INITIALIZING</span>

            <span className="rotom-splash__status-online">LINK ONLINE</span>
          </div>

          <div className="rotom-splash__progress">
            <span className="rotom-splash__progress-fill" />
          </div>

          <div className="rotom-splash__boot-text">
            <span>Pokédex</span>

            <span>•</span>

            <span>PokéSocial</span>

            <span>•</span>

            <span>RotomAI</span>
          </div>
        </div>

        {/* ===============================================
            LOADING DOTS
        ================================================ */}

        <div aria-hidden="true" className="rotom-splash__loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default RotomPCSplash;
