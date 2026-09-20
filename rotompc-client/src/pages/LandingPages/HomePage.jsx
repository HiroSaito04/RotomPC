// rotompc-client/src/pages/LandingPages/HomePage.jsx

import { useEffect, useState } from "react";

import Button from "@/components/Button";

import { KANTO_MAX_ID, MAX_POKEMON_ID } from "@/constants/pokemon";

import {
  fetchPokemonBatch,
  fetchRandomKantoPokemon,
} from "@/services/PokemonService";

import {
  formatPokemonName,
  getPokemonImages,
  getPokemonTypeStyles,
  normalizeCarouselPokemon,
} from "@/utils/pokemonHelpers";

/* =========================================================
   HOME PAGE
========================================================= */

const HomePage = () => {
  /* =======================================================
     SCANNER STATE
  ======================================================= */

  const [scannerMon, setScannerMon] = useState(null);

  const [scannerLoading, setScannerLoading] = useState(true);

  const [scannerTilted, setScannerTilted] = useState(false);

  /* =======================================================
     CAROUSEL STATE
  ======================================================= */

  const [carouselPokemon, setCarouselPokemon] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(1);

  const [loadingCarousel, setLoadingCarousel] = useState(true);

  /* =======================================================
     RANDOM SCANNER POKEMON
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadScannerPokemon = async () => {
      try {
        const pokemon = await fetchRandomKantoPokemon();

        if (!active) {
          return;
        }

        const images = getPokemonImages(pokemon);

        /*
         * Scanner priority:
         *
         * 1. Black / White animated GIF
         * 2. Showdown animated GIF
         * 3. Generic animated resolver
         * 4. GBA sprite
         * 5. Default sprite
         * 6. Raw fallback
         * 7. Official artwork
         *
         * We intentionally DO NOT use images.primary
         * because primary is GBA/static-first.
         */
        const spriteSources = [
          images.blackWhiteAnimated,
          images.showdownAnimated,
          images.animatedPrimary,
          images.gba,
          images.standard,
          images.original,
          images.officialArtwork,
        ].filter(
          (source, index, array) => source && array.indexOf(source) === index,
        );

        const primaryType = pokemon.types?.[0]?.type?.name || "normal";

        const design = getPokemonTypeStyles(primaryType);

        setScannerMon({
          id: pokemon.id,

          name: pokemon.name,

          displayName: formatPokemonName(pokemon.name),

          type: primaryType,

          grad: design.grad,

          spriteSources,

          spriteIndex: 0,
        });
      } catch (error) {
        console.error("Scanner stream drop:", error);
      } finally {
        if (active) {
          setScannerLoading(false);
        }
      }
    };

    /*
     * Initial scan.
     */
    loadScannerPokemon();

    /*
     * Change Pokémon every five seconds.
     */
    const scannerInterval = window.setInterval(loadScannerPokemon, 5000);

    return () => {
      active = false;

      window.clearInterval(scannerInterval);
    };
  }, []);

  /* =======================================================
     SCANNER SPRITE FALLBACK
  ======================================================= */

  const handleScannerSpriteError = () => {
    setScannerMon((current) => {
      if (!current) {
        return current;
      }

      const nextIndex = current.spriteIndex + 1;

      if (nextIndex >= current.spriteSources.length) {
        return current;
      }

      return {
        ...current,
        spriteIndex: nextIndex,
      };
    });
  };

  /* =======================================================
     KANTO CAROUSEL
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadCarousel = async () => {
      try {
        setLoadingCarousel(true);

        const ids = [currentIndex, currentIndex + 1, currentIndex + 2].filter(
          (id) => id <= KANTO_MAX_ID,
        );

        const results = await fetchPokemonBatch(ids);

        if (!active) {
          return;
        }

        const normalized = results
          .map(({ pokemon, species }) =>
            normalizeCarouselPokemon(pokemon, species),
          )
          .filter(Boolean);

        setCarouselPokemon(normalized);
      } catch (error) {
        console.error("Carousel vector loading failure:", error);

        if (active) {
          setCarouselPokemon([]);
        }
      } finally {
        if (active) {
          setLoadingCarousel(false);
        }
      }
    };

    loadCarousel();

    return () => {
      active = false;
    };
  }, [currentIndex]);

  /* =======================================================
     CAROUSEL CONTROLS
  ======================================================= */

  const handlePrev = () => {
    setCurrentIndex((previous) => Math.max(1, previous - 3));
  };

  const handleNext = () => {
    setCurrentIndex((previous) => Math.min(KANTO_MAX_ID - 2, previous + 3));
  };

  /* =======================================================
     SYSTEM STATS
  ======================================================= */

  const stats = [
    {
      label: "National Dex",

      value: String(MAX_POKEMON_ID),

      color: "bg-indigo-600",

      icon: "🌐",
    },

    {
      label: "Kanto Entries",

      value: String(KANTO_MAX_ID),

      color: "bg-red-500",

      icon: "🗺️",
    },

    {
      label: "Regions",

      value: "09",

      color: "bg-emerald-500",

      icon: "🏔️",
    },

    {
      label: "Types",

      value: "18",

      color: "bg-amber-500",

      icon: "🧬",
    },
  ];

  /* =======================================================
     CURRENT SCANNER SPRITE
  ======================================================= */

  const scannerImage =
    scannerMon?.spriteSources?.[scannerMon.spriteIndex] || null;

  /*
   * If the URL is a GIF, the Pokémon has
   * real frame animation.
   *
   * Static fallback sprites get subtle CSS
   * movement so they do not look frozen.
   */
  const scannerImageIsAnimated = Boolean(
    scannerImage?.toLowerCase().includes(".gif"),
  );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div
      className="
        min-h-screen
        bg-[#e5e7eb]
        pb-20
        font-sans
        text-zinc-900
        selection:bg-[#ff1c1c]
        selection:text-white
      "
    >
      {/* ===================================================
          HERO
      ==================================================== */}

      <section
        className="
          relative
          overflow-hidden
          border-b-[10px]
          border-zinc-950
          bg-[#ff1c1c]
          text-white
        "
      >
        {/* BACKGROUND GRID */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-10
            bg-[radial-gradient(#fff_1px,transparent_1px)]
            [background-size:20px_20px]
          "
        />

        {/* DECORATIVE RING */}

        <div
          className="
            pointer-events-none
            absolute
            -right-32
            -top-32
            h-[430px]
            w-[430px]
            rounded-full
            border-[42px]
            border-white/5
          "
        />

        <div
          className="
            relative
            z-10
            mx-auto
            grid
            max-w-7xl
            gap-12
            px-4
            py-12
            sm:px-6
            sm:py-16
            lg:grid-cols-2
            lg:items-center
            lg:px-8
            lg:py-20
          "
        >
          {/* ===============================================
              HERO COPY
          ================================================ */}

          <div
            className="
              flex
              flex-col
              items-center
              text-center
              lg:items-start
              lg:text-left
            "
          >
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border-2
                border-zinc-950
                bg-zinc-900
                px-3
                py-2
                shadow-[3px_3px_0_#18181b]
              "
            >
              <span
                className="
                  h-2.5
                  w-2.5
                  animate-pulse
                  rounded-full
                  bg-green-400
                  shadow-[0_0_10px_#4ade80]
                "
              />

              <span
                className="
                  font-mono
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-yellow-400
                  sm:text-[10px]
                "
              >
                Rotom Mainframe Online
              </span>
            </div>

            <h1
              className="
                mt-6
                text-[clamp(3.1rem,12vw,6rem)]
                font-black
                uppercase
                italic
                leading-[0.86]
                tracking-[-0.055em]
                drop-shadow-[4px_4px_0_rgba(0,0,0,0.25)]
              "
            >
              Gotta Catch
              <span
                className="
                  mt-2
                  block
                  text-zinc-950
                  underline
                  decoration-yellow-400
                  decoration-[6px]
                  underline-offset-[8px]
                "
              >
                'Em All!
              </span>
            </h1>

            <p
              className="
                mx-auto
                mt-8
                max-w-xl
                border-t-4
                border-yellow-400
                pt-5
                text-sm
                font-semibold
                leading-7
                text-red-50
                sm:text-base
                lg:mx-0
                lg:border-l-4
                lg:border-t-0
                lg:pl-5
                lg:pt-0
              "
            >
              Welcome to the RotomPC Pokémon database. Scan live Pokédex
              records, browse regional entries, and access field data across the
              Pokémon world.
            </p>

            <div
              className="
                mt-8
                flex
                w-full
                flex-col
                gap-3
                sm:w-auto
                sm:flex-row
              "
            >
              <Button
                to="/about"
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
              >
                See Trainer ID
              </Button>

              <Button
                to="/pokedex"
                variant="secondary"
                size="md"
                className="
    w-full
    sm:w-auto

    !border-zinc-950
    !bg-white
    !text-zinc-950

    hover:!bg-zinc-100
    hover:!text-zinc-950
  "
              >
                Open RotomDex
              </Button>
            </div>

            <div
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/20
                bg-white/10
                px-4
                py-2
              "
            >
              <span
                className="
                  relative
                  flex
                  h-2.5
                  w-2.5
                "
              >
                <span
                  className="
                    absolute
                    inline-flex
                    h-full
                    w-full
                    animate-ping
                    rounded-full
                    bg-green-300
                    opacity-70
                  "
                />

                <span
                  className="
                    relative
                    inline-flex
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-green-400
                  "
                />
              </span>

              <span
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.15em]
                  text-white
                "
              >
                Rotom Network Online
              </span>
            </div>
          </div>

          {/* ===============================================
              ROTOM SCANNER
          ================================================ */}

          <div
            className="
              group
              relative
              mx-auto
              w-full
              max-w-[430px]
            "
          >
            {/* =============================================
                MOBILE TILT BUTTON

                Desktop:
                hover tilts the scanner.

                Mobile/tablet:
                tapping this button toggles tilt.
            ============================================== */}

            <button
              type="button"
              onClick={() => setScannerTilted((current) => !current)}
              aria-label="Toggle scanner angle"
              aria-pressed={scannerTilted}
              className="
                absolute
                -right-2
                -top-4
                z-50
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                border-[3px]
                border-zinc-950
                bg-yellow-400
                text-lg
                font-black
                text-zinc-950
                shadow-[3px_3px_0_#18181b]
                transition-all
                duration-200
                hover:bg-yellow-300
                active:translate-x-0.5
                active:translate-y-0.5
                active:shadow-[1px_1px_0_#18181b]
                lg:hidden
              "
            >
              <span
                className={`
                  block
                  transition-transform
                  duration-300

                  ${scannerTilted ? "rotate-[135deg]" : "-rotate-45"}
                `}
              >
                ➜
              </span>
            </button>

            {/* =============================================
                HARDWARE BODY
            ============================================== */}

            <div
              className={`
                relative
                rounded-[2rem]
                border-[10px]
                border-zinc-950
                bg-zinc-800
                p-3
                shadow-[12px_14px_0_rgba(24,24,27,0.35)]
                transition-transform
                duration-300
                ease-out
                sm:p-4

                lg:group-hover:rotate-[1.5deg]
                lg:group-hover:scale-[1.015]

                ${
                  scannerTilted
                    ? "rotate-[1.5deg] scale-[1.015]"
                    : "rotate-0 scale-100"
                }
              `}
            >
              {/* ===========================================
                  HARDWARE LIGHTS
              ============================================ */}

              <div
                className="
                  mb-3
                  flex
                  items-center
                  justify-between
                  px-2
                "
              >
                <div className="flex gap-2">
                  <span
                    className="
                      h-3
                      w-3
                      rounded-full
                      border
                      border-black
                      bg-blue-400
                      shadow-[0_0_8px_#60a5fa]
                    "
                  />

                  <span
                    className="
                      h-3
                      w-3
                      rounded-full
                      border
                      border-black
                      bg-yellow-400
                    "
                  />

                  <span
                    className="
                      h-3
                      w-3
                      rounded-full
                      border
                      border-black
                      bg-green-400
                    "
                  />
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      animate-pulse
                      rounded-full
                      bg-green-400
                      shadow-[0_0_6px_#4ade80]
                    "
                  />

                  <span
                    className="
                      font-mono
                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      text-zinc-500
                    "
                  >
                    SCAN // ACTIVE
                  </span>
                </div>
              </div>

              {/* ===========================================
                  SCANNER SCREEN
              ============================================ */}

              <div
                className={`
                  relative
                  aspect-square
                  overflow-hidden
                  rounded-[1.4rem]
                  border-4
                  border-zinc-950
                  bg-gradient-to-b

                  ${scannerMon?.grad || "from-blue-400 to-blue-800"}
                `}
              >
                {/* LCD GRID */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-10
                    bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
                    bg-[size:20px_20px]
                  "
                />

                {/* SCANLINES */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    z-30
                    opacity-20
                    bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,#000_3px,#000_5px)]
                  "
                />

                {/* =========================================
                    RADAR CIRCLE
                ========================================== */}

                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    flex
                    h-[74%]
                    w-[74%]
                    -translate-x-1/2
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border-4
                    border-white/15
                    bg-white/5
                    shadow-inner
                  "
                >
                  {/* ROTATING OUTER RING */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      inset-[7%]
                      animate-[spin_8s_linear_infinite]
                      rounded-full
                      border-2
                      border-dashed
                      border-yellow-300/40
                    "
                  />

                  {/* INNER TARGET RING */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      inset-[22%]
                      rounded-full
                      border
                      border-white/15
                    "
                  />

                  {/* HORIZONTAL AXIS */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      left-1/2
                      top-1/2
                      h-px
                      w-[105%]
                      -translate-x-1/2
                      bg-white/15
                    "
                  />

                  {/* VERTICAL AXIS */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      left-1/2
                      top-1/2
                      h-[105%]
                      w-px
                      -translate-y-1/2
                      bg-white/15
                    "
                  />

                  {/* =======================================
                      CONSISTENT POKEMON BOX

                      Every Pokémon uses exactly the
                      same display dimensions.

                      The sprite itself uses object-contain
                      so proportions stay correct.
                  ======================================== */}

                  <div
                    className="
                      relative
                      z-20
                      flex
                      h-[60%]
                      w-[60%]
                      items-center
                      justify-center
                    "
                  >
                    {scannerLoading ? (
                      <div
                        className="
                          h-10
                          w-10
                          animate-spin
                          rounded-full
                          border-4
                          border-white/20
                          border-t-yellow-300
                        "
                      />
                    ) : scannerMon && scannerImage ? (
                      <img
                        /*
                         * A new key guarantees
                         * a freshly-mounted GIF
                         * whenever the scanner
                         * changes Pokémon or
                         * fallback source.
                         */
                        key={`${scannerMon.id}-${scannerMon.spriteIndex}-${scannerImage}`}
                        src={scannerImage}
                        alt={scannerMon.displayName}
                        onError={handleScannerSpriteError}
                        className={`
                          block
                          h-full
                          w-full
                          object-contain
                          object-center
                          drop-shadow-[0_8px_8px_rgba(0,0,0,0.28)]

                          ${
                            scannerImageIsAnimated
                              ? ""
                              : "animate-[bounce_2.8s_ease-in-out_infinite]"
                          }
                        `}
                        style={{
                          imageRendering: "pixelated",
                        }}
                      />
                    ) : (
                      <span
                        className="
                          text-6xl
                          font-black
                          text-white/30
                        "
                      >
                        ?
                      </span>
                    )}
                  </div>
                </div>

                {/* =========================================
                    POKEMON NAME

                    "Target Found" removed.
                ========================================== */}

                {scannerMon && (
                  <div
                    className="
                      absolute
                      bottom-4
                      left-1/2
                      z-40
                      -translate-x-1/2
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        whitespace-nowrap
                        rounded-lg
                        border-2
                        border-zinc-950
                        bg-zinc-950/90
                        px-3
                        py-2
                        shadow-[3px_3px_0_rgba(0,0,0,0.25)]
                        backdrop-blur-sm
                      "
                    >
                      <span
                        className="
                          max-w-[130px]
                          truncate
                          text-[10px]
                          font-black
                          uppercase
                          italic
                          tracking-[0.08em]
                          text-yellow-400
                          sm:max-w-[175px]
                          sm:text-xs
                        "
                      >
                        {scannerMon.displayName}
                      </span>

                      <span
                        className="
                          rounded
                          bg-white
                          px-1.5
                          py-0.5
                          text-[7px]
                          font-black
                          uppercase
                          tracking-wide
                          text-zinc-950
                        "
                      >
                        {scannerMon.type}
                      </span>
                    </div>
                  </div>
                )}

                {/* =========================================
                    SCREEN CORNERS
                ========================================== */}

                <span
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-3
                    h-4
                    w-4
                    border-l-2
                    border-t-2
                    border-white/30
                  "
                />

                <span
                  className="
                    pointer-events-none
                    absolute
                    right-3
                    top-3
                    h-4
                    w-4
                    border-r-2
                    border-t-2
                    border-white/30
                  "
                />

                <span
                  className="
                    pointer-events-none
                    absolute
                    bottom-3
                    left-3
                    h-4
                    w-4
                    border-b-2
                    border-l-2
                    border-white/30
                  "
                />

                <span
                  className="
                    pointer-events-none
                    absolute
                    bottom-3
                    right-3
                    h-4
                    w-4
                    border-b-2
                    border-r-2
                    border-white/30
                  "
                />
              </div>

              {/* ===========================================
                  LOWER HARDWARE

                  No Auto Scan / 5s text.
              ============================================ */}

              <div
                className="
                  mt-4
                  flex
                  items-center
                  justify-between
                  px-2
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      h-4
                      w-4
                      rounded-full
                      border-2
                      border-zinc-950
                      bg-red-500
                    "
                  />

                  <span
                    className="
                      h-1.5
                      w-8
                      rounded-full
                      bg-zinc-950
                    "
                  />
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-1
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-8
                      rounded-full
                      bg-zinc-950
                    "
                  />

                  <span
                    className="
                      h-1.5
                      w-5
                      rounded-full
                      bg-zinc-600
                    "
                  />

                  <span
                    className="
                      h-1.5
                      w-3
                      rounded-full
                      bg-zinc-600
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          SYSTEM STATS
      ==================================================== */}

      <section
        className="
          relative
          z-20
          mx-auto
          -mt-7
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            grid
            grid-cols-2
            gap-3
            lg:grid-cols-4
          "
        >
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="
                  rounded-2xl
                  border-[3px]
                  border-zinc-950
                  bg-white
                  p-4
                  shadow-[5px_5px_0_#18181b]
                  transition
                  hover:-translate-y-1
                  sm:p-5
                "
            >
              <div
                className={`
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-lg
                    border-2
                    border-zinc-950
                    text-lg
                    shadow-[2px_2px_0_#18181b]

                    ${stat.color}
                  `}
              >
                {stat.icon}
              </div>

              <p
                className="
                    mt-4
                    text-3xl
                    font-black
                    tracking-tight
                    text-zinc-950
                  "
              >
                {stat.value}
              </p>

              <p
                className="
                    mt-1
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.13em]
                    text-zinc-400
                    sm:text-[10px]
                  "
              >
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ===================================================
          KANTO DATABASE
      ==================================================== */}

      <section
        className="
          mx-auto
          mt-12
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            flex-col
            gap-3
            border-b-4
            border-zinc-300
            pb-5
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                font-mono
                text-[9px]
                font-black
                uppercase
                tracking-[0.18em]
                text-[#cc0000]
              "
            >
              Database Stream // Kanto
            </p>

            <h2
              className="
                mt-1
                text-3xl
                font-black
                uppercase
                italic
                tracking-tight
                text-zinc-950
                sm:text-4xl
              "
            >
              Chronological Index
            </h2>
          </div>

          <p
            className="
              max-w-md
              text-xs
              font-semibold
              leading-5
              text-zinc-500
              sm:text-sm
            "
          >
            Sequential Pokémon records retrieved from the Rotom mainframe
            database.
          </p>
        </div>

        {/* ===============================================
            CAROUSEL
        ================================================ */}

        <div className="mt-7">
          {loadingCarousel ? (
            <div
              className="
                flex
                min-h-[360px]
                items-center
                justify-center
              "
            >
              <div className="text-center">
                <div
                  className="
                    mx-auto
                    h-12
                    w-12
                    animate-spin
                    rounded-full
                    border-4
                    border-zinc-300
                    border-t-[#ff1c1c]
                  "
                />

                <p
                  className="
                    mt-4
                    font-mono
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-zinc-400
                  "
                >
                  Retrieving Database...
                </p>
              </div>
            </div>
          ) : (
            <div
              className="
                grid
                gap-5
                md:grid-cols-3
              "
            >
              {carouselPokemon.map((poke) => (
                <article
                  key={poke.id}
                  className={`
                      group
                      overflow-hidden
                      rounded-[1.7rem]
                      border-4
                      border-zinc-950
                      shadow-[6px_6px_0_#18181b]
                      transition-all
                      duration-200
                      hover:-translate-y-1
                      hover:shadow-[8px_8px_0_#18181b]

                      ${poke.bg}
                    `}
                >
                  <div className="p-4">
                    {/* IMAGE */}

                    <div
                      className={`
                          relative
                          flex
                          aspect-video
                          items-center
                          justify-center
                          overflow-hidden
                          rounded-2xl
                          border-4
                          border-zinc-950
                          bg-gradient-to-b

                          ${poke.grad}
                        `}
                    >
                      <div
                        className="
                            pointer-events-none
                            absolute
                            inset-0
                            opacity-15
                            bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_4px)]
                          "
                      />

                      <div
                        className="
                            flex
                            h-28
                            w-28
                            items-center
                            justify-center
                          "
                      >
                        <img
                          src={poke.image}
                          alt={poke.displayName || poke.name}
                          onError={(event) => {
                            if (poke.fallbackImage) {
                              event.currentTarget.src = poke.fallbackImage;
                            }
                          }}
                          className="
                              h-full
                              w-full
                              object-contain
                              transition-transform
                              duration-300
                              group-hover:scale-110
                            "
                          style={{
                            imageRendering: "pixelated",
                          }}
                        />
                      </div>
                    </div>

                    {/* INFO */}

                    <div
                      className="
                          mt-4
                          flex
                          items-start
                          justify-between
                          gap-3
                        "
                    >
                      <div className="min-w-0">
                        <span
                          className="
                              font-mono
                              text-[9px]
                              font-black
                              uppercase
                              tracking-[0.13em]
                              text-zinc-400
                            "
                        >
                          No. {poke.no}
                        </span>

                        <h3
                          className="
                              mt-1
                              truncate
                              text-2xl
                              font-black
                              uppercase
                              italic
                              tracking-tight
                              text-zinc-950
                            "
                        >
                          {poke.displayName || poke.name}
                        </h3>
                      </div>

                      <span
                        className="
                            shrink-0
                            rounded-lg
                            border-2
                            border-zinc-950
                            bg-white
                            px-2.5
                            py-1
                            text-[9px]
                            font-black
                            uppercase
                            text-zinc-950
                            shadow-[2px_2px_0_#18181b]
                          "
                      >
                        {poke.type}
                      </span>
                    </div>

                    {/* DESCRIPTION */}

                    <p
                      className="
                          mt-3
                          line-clamp-3
                          min-h-[60px]
                          text-sm
                          font-medium
                          leading-5
                          text-zinc-600
                        "
                    >
                      {poke.desc}
                    </p>

                    {/* ACTION */}

                    <Button
                      to={`/pokedex/${poke.name}`}
                      variant="secondary"
                      size="sm"
                      className="mt-5 w-full"
                    >
                      Open Data Log
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* ===============================================
              CAROUSEL NAVIGATION
          ================================================ */}

          <div
            className="
              mt-7
              grid
              grid-cols-2
              gap-3
              sm:flex
              sm:items-center
              sm:justify-center
            "
          >
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 1}
              className="
                min-h-11
                rounded-xl
                border-4
                border-zinc-950
                bg-white
                px-6
                text-xs
                font-black
                uppercase
                text-zinc-950
                shadow-[4px_4px_0_#18181b]
                transition-all
                active:translate-x-0.5
                active:translate-y-0.5
                active:shadow-[2px_2px_0_#18181b]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              ◀ Prev
            </button>

            <div
              className="
                hidden
                rounded-xl
                border-2
                border-zinc-300
                bg-zinc-100
                px-5
                py-3
                font-mono
                text-[10px]
                font-black
                uppercase
                tracking-[0.13em]
                text-zinc-500
                sm:block
              "
            >
              {String(currentIndex).padStart(3, "0")}

              {" — "}

              {String(Math.min(currentIndex + 2, KANTO_MAX_ID)).padStart(
                3,
                "0",
              )}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex + 2 >= KANTO_MAX_ID}
              className="
                min-h-11
                rounded-xl
                border-4
                border-zinc-950
                bg-zinc-900
                px-6
                text-xs
                font-black
                uppercase
                text-white
                shadow-[4px_4px_0_#ff1c1c]
                transition-all
                active:translate-x-0.5
                active:translate-y-0.5
                active:shadow-[2px_2px_0_#ff1c1c]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              Next ▶
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
          ROTOMDEX CTA
      ==================================================== */}

      <section
        className="
          mx-auto
          mt-14
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            relative
            overflow-hidden
            rounded-[2rem]
            border-4
            border-zinc-950
            bg-zinc-900
            p-6
            text-white
            shadow-[8px_8px_0_#ff1c1c]
            sm:p-8
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-5
              bg-[radial-gradient(#fff_1px,transparent_1px)]
              [background-size:18px_18px]
            "
          />

          <div
            className="
              relative
              z-10
              flex
              flex-col
              items-center
              justify-between
              gap-6
              text-center
              md:flex-row
              md:text-left
            "
          >
            <div>
              <p
                className="
                  font-mono
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-yellow-400
                "
              >
                Full Database Access
              </p>

              <h2
                className="
                  mt-2
                  text-3xl
                  font-black
                  uppercase
                  italic
                  tracking-tight
                "
              >
                Explore the Complete RotomDex
              </h2>

              <p
                className="
                  mt-3
                  max-w-xl
                  text-sm
                  font-medium
                  leading-6
                  text-zinc-400
                "
              >
                Search generations, filter Pokémon by type, and inspect complete
                Pokédex profiles.
              </p>
            </div>

            <Button
              to="/pokedex"
              variant="primary"
              size="lg"
              className="
                w-full
                shrink-0
                md:w-auto
              "
            >
              Access RotomDex
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
