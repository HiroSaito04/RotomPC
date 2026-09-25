// rotompc-client/src/components/profile/BuddyCard.jsx

import { useCallback, useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

import { fetchPokemon } from "@/services/PokemonService";
import * as buddyService from "@/services/BuddyService";
import { fetchBerryCatalog } from "@/services/BerryService";

import {
  getPokemonTypeStyles,
  normalizeFavoritePokemon,
} from "@/utils/pokemonHelpers";

/* =========================================================
   DEFAULT THEME
========================================================= */

const DEFAULT_THEME = {
  primary: "#ef4444",
  deep: "#991b1b",
  soft: "#fee2e2",
  glow: "#fca5a5",
};

/* =========================================================
   DEFAULT BUDDY RULES

   These are frontend fallbacks only.

   The backend response is authoritative and overrides
   these values whenever Buddy state is loaded.
========================================================= */

const DEFAULT_BUDDY_RULES = {
  maxEnergy: 100,
  maxAffection: 100,

  startingBerries: 5,

  petEnergyCost: 5,
  playEnergyCost: 10,

  berryEnergyGain: 15,

  wakeEnergy: 10,

  restMs: 2 * 60 * 1000,

  rewards: {
    like: 1,
    follow: 5,
    post: 10,
  },
};

/* =========================================================
   HELPERS
========================================================= */

const getBuddyRules = (buddy) => ({
  ...DEFAULT_BUDDY_RULES,

  ...(buddy?.rules || {}),

  rewards: {
    ...DEFAULT_BUDDY_RULES.rewards,

    ...(buddy?.rules?.rewards || {}),
  },
});

const getBerriesToFull = (rules) => {
  const gain = Number(rules?.berryEnergyGain) || 1;

  const missingEnergy = Math.max(
    0,
    (Number(rules?.maxEnergy) || 100) - (Number(rules?.wakeEnergy) || 0),
  );

  return Math.ceil(missingEnergy / gain);
};

const getPercent = (value, maximum) => {
  const max = Number(maximum) || 100;

  return Math.max(0, Math.min(100, ((Number(value) || 0) / max) * 100));
};

/* =========================================================
   ICONS
========================================================= */

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
    <path
      d="M4 20h4L19 9a2.2 2.2 0 0 0 0-3.1l-.9-.9a2.2 2.2 0 0 0-3.1 0L4 16v4Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />

    <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="2.2" />
  </svg>
);

const InfoIcon = () => (
  <span aria-hidden="true" className="font-mono text-sm font-black">
    ?
  </span>
);

/* =========================================================
   RULES MODAL
========================================================= */

const BuddyRulesModal = ({ onClose, rules = DEFAULT_BUDDY_RULES }) => {
  const berriesToFull = getBerriesToFull(rules);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
        flex
        items-end
        justify-center
        bg-black/70
        p-0
        backdrop-blur-sm

        sm:items-center
        sm:p-5
      "
      onClick={onClose}
    >
      <div
        className="
          max-h-[88dvh]
          w-full
          overflow-y-auto
          rounded-t-[2rem]
          border-4
          border-zinc-950
          bg-[#f4f4f5]
          shadow-[0_-8px_30px_rgba(0,0,0,.35)]

          sm:max-w-xl
          sm:rounded-[2rem]
          sm:shadow-[10px_10px_0_#18181b]
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className="
            sticky
            top-0
            z-10
            flex
            items-center
            justify-between
            border-b-4
            border-zinc-950
            bg-zinc-950
            px-5
            py-4
            text-white
          "
        >
          <div>
            <p
              className="
                font-mono
                text-[8px]
                font-black
                uppercase
                tracking-[0.18em]
                text-yellow-400
              "
            >
              ROTOM HELP FILE
            </p>

            <h2 className="mt-1 text-xl font-black uppercase tracking-tight">
              Buddy Rules
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Buddy rules"
            title="Close"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border-2
              border-white/30
              bg-white
              text-zinc-950
              shadow-[2px_2px_0_#000]
              transition

              hover:-translate-y-0.5
              hover:bg-yellow-300

              active:translate-x-0.5
              active:translate-y-0.5
              active:shadow-none
            "
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {/* =================================================
              AFFECTION
          ================================================== */}

          <section
            className="
              rounded-2xl
              border-[3px]
              border-zinc-950
              bg-pink-100
              p-4
              shadow-[4px_4px_0_#18181b]
            "
          >
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.15em]
                text-pink-700
              "
            >
              Affection
            </p>

            <h3 className="mt-1 text-lg font-black uppercase text-zinc-950">
              Pet Your Buddy
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-zinc-700">
              Every successful pet gives +1 affection and costs{" "}
              <strong>{rules.petEnergyCost} energy</strong>.
            </p>

            <div
              className="
                mt-3
                rounded-xl
                border-2
                border-pink-300
                bg-white/70
                p-3
              "
            >
              <p className="font-mono text-xs font-black text-zinc-800">
                {rules.maxAffection} PETS = {rules.maxAffection} AFFECTION
              </p>
            </div>
          </section>

          {/* =================================================
              ENERGY
          ================================================== */}

          <section
            className="
              rounded-2xl
              border-[3px]
              border-zinc-950
              bg-cyan-100
              p-4
              shadow-[4px_4px_0_#18181b]
            "
          >
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.15em]
                text-cyan-700
              "
            >
              Energy
            </p>

            <h3 className="mt-1 text-lg font-black uppercase text-zinc-950">
              Keep Them Active
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div
                className="
                  rounded-xl
                  border-2
                  border-zinc-950
                  bg-white
                  p-3
                  text-center
                "
              >
                <p className="text-lg font-black text-pink-500">
                  −{rules.petEnergyCost}
                </p>

                <p
                  className="
                    mt-1
                    text-[8px]
                    font-black
                    uppercase
                    text-zinc-500
                  "
                >
                  Pet
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  border-2
                  border-zinc-950
                  bg-white
                  p-3
                  text-center
                "
              >
                <p className="text-lg font-black text-blue-500">
                  −{rules.playEnergyCost}
                </p>

                <p
                  className="
                    mt-1
                    text-[8px]
                    font-black
                    uppercase
                    text-zinc-500
                  "
                >
                  Play
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm font-medium leading-6 text-zinc-700">
              When energy reaches zero, your Buddy temporarily leaves the active
              card and rests.
            </p>
          </section>

          {/* =================================================
              REST
          ================================================== */}

          <section
            className="
              rounded-2xl
              border-[3px]
              border-zinc-950
              bg-violet-100
              p-4
              shadow-[4px_4px_0_#18181b]
            "
          >
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.15em]
                text-violet-700
              "
            >
              Rest
            </p>

            <h3 className="mt-1 text-lg font-black uppercase text-zinc-950">
              {Math.round(rules.restMs / 60000)} Minute Recovery
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-zinc-700">
              A resting Buddy cannot be petted, played with, or fed until the
              server-controlled recovery timer finishes.
            </p>

            <p className="mt-3 font-mono text-xs font-black text-violet-800">
              WAKE ENERGY: {rules.wakeEnergy} / {rules.maxEnergy}
            </p>
          </section>

          {/* =================================================
              BERRIES
          ================================================== */}

          <section
            className="
              rounded-2xl
              border-[3px]
              border-zinc-950
              bg-yellow-100
              p-4
              shadow-[4px_4px_0_#18181b]
            "
          >
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.15em]
                text-amber-700
              "
            >
              Berries
            </p>

            <h3 className="mt-1 text-lg font-black uppercase text-zinc-950">
              Feed Whenever Energy Is Missing
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-zinc-700">
              You do not need to pet or play with your Buddy before feeding it.
              If your Buddy is awake and below full energy, drag a berry onto
              your Buddy.
            </p>

            <div
              className="
                mt-3
                rounded-xl
                border-2
                border-zinc-950
                bg-white
                p-3
              "
            >
              <p className="font-mono text-xs font-black text-zinc-900">
                1 BERRY = +{rules.berryEnergyGain} ENERGY
              </p>

              <p className="mt-1 text-xs font-semibold text-zinc-500">
                A Buddy waking at {rules.wakeEnergy} energy needs{" "}
                {berriesToFull} berries to reach {rules.maxEnergy}.
              </p>
            </div>
          </section>

          {/* =================================================
              POKESOCIAL
          ================================================== */}

          <section
            className="
              rounded-2xl
              border-[3px]
              border-zinc-950
              bg-white
              p-4
              shadow-[4px_4px_0_#18181b]
            "
          >
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.15em]
                text-red-500
              "
            >
              PokéSocial Rewards
            </p>

            <h3 className="mt-1 text-lg font-black uppercase text-zinc-950">
              Earn More Berries
            </h3>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div
                className="
                  rounded-xl
                  border-2
                  border-zinc-950
                  bg-zinc-100
                  p-3
                  text-center
                "
              >
                <p className="text-xl font-black text-zinc-950">
                  +{rules.rewards.like}
                </p>

                <p
                  className="
                    mt-1
                    text-[8px]
                    font-black
                    uppercase
                    text-zinc-500
                  "
                >
                  Like
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  border-2
                  border-zinc-950
                  bg-zinc-100
                  p-3
                  text-center
                "
              >
                <p className="text-xl font-black text-zinc-950">
                  +{rules.rewards.follow}
                </p>

                <p
                  className="
                    mt-1
                    text-[8px]
                    font-black
                    uppercase
                    text-zinc-500
                  "
                >
                  Follow
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  border-2
                  border-zinc-950
                  bg-zinc-100
                  p-3
                  text-center
                "
              >
                <p className="text-xl font-black text-zinc-950">
                  +{rules.rewards.post}
                </p>

                <p
                  className="
                    mt-1
                    text-[8px]
                    font-black
                    uppercase
                    text-zinc-500
                  "
                >
                  Post
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-zinc-500">
              New trainers start with {rules.startingBerries} berries. Re-liking
              or re-following the same target does not grant the reward again.
            </p>
          </section>

          {/* =================================================
              SERVER AUTHORITY
          ================================================== */}

          <div
            className="
              rounded-xl
              border-2
              border-zinc-300
              bg-zinc-200/60
              p-4
            "
          >
            <p
              className="
                font-mono
                text-[9px]
                font-black
                uppercase
                tracking-[0.12em]
                text-zinc-600
              "
            >
              Server Enforced
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-zinc-500">
              Affection, energy, berries, rest timers, and PokéSocial rewards
              are validated and saved by the backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const BuddyCard = ({
  theme = DEFAULT_THEME,
  onEdit,
  refreshKey = 0,
  onStateChange,
  variant = "page",
}) => {
  /* =======================================================
     BUDDY
  ======================================================= */

  const [buddy, setBuddy] = useState(null);

  const [pokemon, setPokemon] = useState(null);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [message, setMessage] = useState("Buddy link initializing...");

  const [actionEffect, setActionEffect] = useState(null);

  const [effectKey, setEffectKey] = useState(0);

  const [showRules, setShowRules] = useState(false);

  /* =======================================================
     SERVER RULES
  ======================================================= */

  const rules = getBuddyRules(buddy);

  const berriesToFull = getBerriesToFull(rules);

  /* =======================================================
     BERRIES
  ======================================================= */

  const [berries, setBerries] = useState([]);

  const [selectedBerryIndex, setSelectedBerryIndex] = useState(0);

  const selectedBerry = berries[selectedBerryIndex] || null;

  /* =======================================================
     THROW
  ======================================================= */

  const targetRef = useRef(null);

  const berryRef = useRef(null);

  const dragStartRef = useRef({
    x: 0,
    y: 0,
  });

  const [berryDrag, setBerryDrag] = useState({
    x: 0,
    y: 0,

    dragging: false,
    throwing: false,
  });

  /* =======================================================
     REST
  ======================================================= */

  const [restRemaining, setRestRemaining] = useState(0);

  /* =======================================================
     APPLY SERVER STATE
  ======================================================= */

  const applyBuddy = useCallback(
    (nextBuddy) => {
      setBuddy(nextBuddy);

      onStateChange?.(nextBuddy);
    },
    [onStateChange],
  );

  /* =======================================================
     LOAD BUDDY
  ======================================================= */

  const loadBuddy = useCallback(async () => {
    try {
      setLoading(true);

      const response = await buddyService.fetchBuddy();

      const nextBuddy = response.data?.buddy || null;

      applyBuddy(nextBuddy);

      if (nextBuddy?.pokemon?.id) {
        const data = await fetchPokemon(nextBuddy.pokemon.id);

        setPokemon(normalizeFavoritePokemon(data));
      } else {
        setPokemon(null);
      }

      if (nextBuddy?.isResting) {
        setMessage("Your Buddy is resting.");
      } else if (nextBuddy?.pokemon?.id) {
        setMessage("Your Buddy is ready.");
      } else {
        setMessage("Choose a Buddy Pokémon.");
      }
    } catch (error) {
      console.error("Buddy load failed:", error);

      setMessage(error.response?.data?.message || "Buddy link unavailable.");
    } finally {
      setLoading(false);
    }
  }, [applyBuddy]);

  useEffect(() => {
    loadBuddy();
  }, [loadBuddy, refreshKey]);

  /* =======================================================
     BERRY CATALOG
  ======================================================= */

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const catalog = await fetchBerryCatalog();

        if (active) {
          setBerries(catalog);
        }
      } catch (error) {
        console.error("Unable to load berries:", error);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     KEEP SELECTED BERRY VALID
  ======================================================= */

  useEffect(() => {
    if (berries.length > 0 && selectedBerryIndex >= berries.length) {
      setSelectedBerryIndex(0);
    }
  }, [berries, selectedBerryIndex]);

  /* =======================================================
     REST TIMER
  ======================================================= */

  useEffect(() => {
    if (!buddy?.isResting || !buddy?.restingUntil) {
      setRestRemaining(0);

      return undefined;
    }

    let refreshed = false;

    const tick = () => {
      const remaining = Math.max(
        0,

        new Date(buddy.restingUntil).getTime() - Date.now(),
      );

      setRestRemaining(remaining);

      if (remaining <= 0 && !refreshed) {
        refreshed = true;

        loadBuddy();
      }
    };

    tick();

    const interval = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [buddy?.isResting, buddy?.restingUntil, loadBuddy]);

  /* =======================================================
     REST TEXT
  ======================================================= */

  const totalSeconds = Math.ceil(restRemaining / 1000);

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  const formattedRest = `${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;

  /* =======================================================
     EFFECTS
  ======================================================= */

  const triggerEffect = (effect) => {
    setActionEffect(effect);

    setEffectKey((value) => value + 1);

    window.setTimeout(() => {
      setActionEffect(null);
    }, 850);
  };

  /* =======================================================
     PET / PLAY
  ======================================================= */

  const runAction = async (type) => {
    if (actionLoading || buddy?.isResting) {
      return;
    }

    try {
      setActionLoading(true);

      const response =
        type === "pet"
          ? await buddyService.petBuddy()
          : await buddyService.playWithBuddy();

      const nextBuddy = response.data?.buddy;

      if (nextBuddy) {
        applyBuddy(nextBuddy);
      }

      setMessage(response.data?.message || "Buddy interaction complete.");

      triggerEffect(nextBuddy?.isResting ? "sleep" : type);
    } catch (error) {
      setMessage(error.response?.data?.message || "Buddy interaction failed.");

      if (error.response?.status === 423) {
        loadBuddy();
      }
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     RESET BERRY
  ======================================================= */

  const resetBerry = () => {
    setBerryDrag({
      x: 0,
      y: 0,

      dragging: false,
      throwing: false,
    });
  };

  /* =======================================================
     BERRY POINTER DOWN

     Feeding does NOT require petting or playing first.

     Requirements:
     - Buddy awake
     - Berry selected
     - Berry inventory > 0
     - Energy below maximum
  ======================================================= */

  const handleBerryPointerDown = (event) => {
    if (
      actionLoading ||
      buddy?.isResting ||
      !selectedBerry ||
      (buddy?.berries || 0) <= 0 ||
      (buddy?.energy || 0) >= rules.maxEnergy
    ) {
      return;
    }

    event.preventDefault();

    event.currentTarget.setPointerCapture?.(event.pointerId);

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    setBerryDrag({
      x: 0,
      y: 0,

      dragging: true,
      throwing: false,
    });
  };

  /* =======================================================
     BERRY POINTER MOVE
  ======================================================= */

  const handleBerryPointerMove = (event) => {
    if (!berryDrag.dragging) {
      return;
    }

    event.preventDefault();

    setBerryDrag((current) => ({
      ...current,

      x: event.clientX - dragStartRef.current.x,

      y: event.clientY - dragStartRef.current.y,
    }));
  };

  /* =======================================================
     FEED AFTER THROW
  ======================================================= */

  const feedAfterThrow = async () => {
    if (!selectedBerry) {
      resetBerry();

      return;
    }

    try {
      setActionLoading(true);

      const response = await buddyService.feedBuddy(selectedBerry.name);

      const nextBuddy = response.data?.buddy;

      if (nextBuddy) {
        applyBuddy(nextBuddy);
      }

      setMessage(
        `${pokemon?.displayName || "Buddy"} ate the ${
          selectedBerry.displayName
        }!`,
      );

      triggerEffect("eat");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "The berry could not be used.",
      );

      if (error.response?.status === 423) {
        loadBuddy();
      }
    } finally {
      setActionLoading(false);

      window.setTimeout(resetBerry, 240);
    }
  };

  /* =======================================================
     BERRY POINTER UP
  ======================================================= */

  const handleBerryPointerUp = (event) => {
    if (!berryDrag.dragging) {
      return;
    }

    const target = targetRef.current;

    const berry = berryRef.current;

    if (!target || !berry) {
      resetBerry();

      return;
    }

    const targetRect = target.getBoundingClientRect();

    const berryRect = berry.getBoundingClientRect();

    const hit =
      event.clientX >= targetRect.left - 35 &&
      event.clientX <= targetRect.right + 35 &&
      event.clientY >= targetRect.top - 35 &&
      event.clientY <= targetRect.bottom + 35;

    if (!hit) {
      resetBerry();

      return;
    }

    const targetX = targetRect.left + targetRect.width / 2;

    const targetY = targetRect.top + targetRect.height / 2;

    const berryX = berryRect.left + berryRect.width / 2;

    const berryY = berryRect.top + berryRect.height / 2;

    setBerryDrag((current) => ({
      x: current.x + targetX - berryX,

      y: current.y + targetY - berryY,

      dragging: false,
      throwing: true,
    }));

    window.setTimeout(feedAfterThrow, 240);
  };

  /* =======================================================
     CARD CLASS
  ======================================================= */

  const cardClass =
    variant === "modal"
      ? `
          w-full
          overflow-hidden
          rounded-[1.7rem]
          border-[3px]
          border-zinc-950
          bg-zinc-950
        `
      : `
          w-full
          overflow-hidden
          rounded-[1.7rem]
          border-4
          border-zinc-950
          bg-zinc-950
          shadow-[6px_6px_0_#18181b]

          sm:rounded-[2rem]
          sm:shadow-[8px_8px_0_#18181b]
        `;

  /* =======================================================
     HEADER
  ======================================================= */

  const CardHeader = ({ status = "Linked" }) => (
    <div
      className="
        flex
        items-center
        justify-between
        gap-3
        border-b-[3px]
        border-zinc-950
        bg-zinc-950
        px-4
        py-3

        sm:px-5
        sm:py-4
      "
    >
      <div className="min-w-0">
        <p
          className="
            font-mono
            text-[7px]
            font-black
            uppercase
            tracking-[0.16em]
            text-yellow-400

            sm:text-[9px]
          "
        >
          ROTOM BUDDY LINK
        </p>

        <h2
          className="
            mt-0.5
            truncate
            text-lg
            font-black
            uppercase
            tracking-tight
            text-white

            sm:text-2xl
          "
        >
          Buddy Pokémon
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className="
            hidden
            items-center
            gap-2
            rounded-full
            border
            border-white/10
            bg-white/5
            px-3
            py-1.5
            font-mono
            text-[7px]
            font-black
            uppercase
            text-zinc-400

            sm:flex
          "
        >
          <span
            className={`
              h-2
              w-2
              rounded-full

              ${
                buddy?.isResting
                  ? "bg-violet-400"
                  : "bg-green-400 shadow-[0_0_7px_#4ade80]"
              }
            `}
          />

          {status}
        </span>

        <button
          type="button"
          onClick={() => setShowRules(true)}
          aria-label="Buddy rules"
          title="Buddy rules"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            border-2
            border-white/15
            bg-white
            text-zinc-950
            shadow-[2px_2px_0_#000]
            transition

            hover:-translate-y-0.5
            hover:bg-yellow-300
          "
        >
          <InfoIcon />
        </button>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Change Buddy"
            title="Change Buddy"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              border-2
              border-zinc-950
              bg-yellow-400
              text-zinc-950
              shadow-[2px_2px_0_#000]
              transition

              hover:-translate-y-0.5
              hover:bg-yellow-300
            "
          >
            <PencilIcon />
          </button>
        )}
      </div>
    </div>
  );

  /* =======================================================
     RULES MODAL INSTANCE
  ======================================================= */

  const rulesModal = showRules ? (
    <BuddyRulesModal rules={rules} onClose={() => setShowRules(false)} />
  ) : null;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <section className={cardClass}>
          <CardHeader status="Syncing" />

          <div
            className="
              flex
              min-h-[280px]
              items-center
              justify-center
              bg-zinc-900

              sm:min-h-[360px]
            "
          >
            <div className="text-center">
              <div
                className="
                  mx-auto
                  h-10
                  w-10
                  animate-spin
                  rounded-full
                  border-4
                  border-white/20
                  border-t-yellow-400
                "
              />

              <p
                className="
                  mt-4
                  font-mono
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.17em]
                  text-zinc-400
                "
              >
                Syncing Buddy
              </p>
            </div>
          </div>
        </section>

        {rulesModal}
      </>
    );
  }

  /* =======================================================
     NO BUDDY
  ======================================================= */

  if (!buddy?.pokemon?.id || !pokemon) {
    return (
      <>
        <section className={cardClass}>
          <CardHeader status="Offline" />

          <div
            className="
              relative
              flex
              min-h-[300px]
              flex-col
              items-center
              justify-center
              overflow-hidden
              px-5
              py-10
              text-center
              text-white

              sm:min-h-[400px]
            "
            style={{
              background: `
                radial-gradient(
                  circle at center,
                  ${theme.glow}75,
                  transparent 32%
                ),
                linear-gradient(
                  135deg,
                  ${theme.primary},
                  ${theme.deep}
                )
              `,
            }}
          >
            <div
              className="
                absolute
                inset-0
                opacity-10
                bg-[radial-gradient(#fff_1px,transparent_1px)]
                [background-size:18px_18px]
              "
            />

            <div
              className="
                relative
                flex
                h-24
                w-24
                items-center
                justify-center
                rounded-full
                border-4
                border-dashed
                border-white/30
                bg-black/10
                text-4xl
                font-black

                sm:h-28
                sm:w-28
              "
            >
              ?
            </div>

            <h3 className="relative mt-5 text-xl font-black uppercase sm:text-2xl">
              No Buddy Registered
            </h3>

            <p
              className="
                relative
                mt-2
                max-w-sm
                text-xs
                font-semibold
                leading-5
                text-white/70

                sm:text-sm
                sm:leading-6
              "
            >
              Choose a Pokémon to create your Buddy Link.
            </p>

            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="
                  relative
                  mt-6
                  rounded-xl
                  border-[3px]
                  border-zinc-950
                  bg-yellow-400
                  px-5
                  py-3
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wide
                  text-zinc-950
                  shadow-[4px_4px_0_#18181b]
                  transition

                  hover:-translate-y-0.5
                  hover:bg-yellow-300
                "
              >
                Choose Buddy
              </button>
            )}
          </div>
        </section>

        {rulesModal}
      </>
    );
  }

  /* =======================================================
     RESTING
  ======================================================= */

  if (buddy.isResting) {
    return (
      <>
        <section className={cardClass}>
          <CardHeader status="Resting" />

          <div
            className="
              relative
              flex
              min-h-[350px]
              flex-col
              items-center
              justify-center
              overflow-hidden
              px-5
              py-10
              text-center
              text-white

              sm:min-h-[440px]
            "
            style={{
              background: `
                radial-gradient(
                  circle at center,
                  ${theme.glow}30,
                  transparent 26%
                ),
                linear-gradient(
                  155deg,
                  #18181b,
                  ${theme.deep}
                )
              `,
            }}
          >
            <div
              className="
                absolute
                inset-0
                opacity-[0.08]
                bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
                bg-[size:20px_20px]
              "
            />

            <div
              className="
                relative
                flex
                h-32
                w-32
                items-center
                justify-center
                rounded-full
                border-4
                border-dashed
                border-white/15
                bg-black/20

                sm:h-40
                sm:w-40
              "
            >
              <span
                className="
                  text-5xl
                  font-black
                  text-white/25

                  sm:text-6xl
                "
              >
                Z
              </span>

              <span
                className="
                  absolute
                  right-4
                  top-3
                  animate-pulse
                  text-2xl
                  font-black
                  text-white/40
                "
              >
                z
              </span>

              <span
                className="
                  absolute
                  right-0
                  top-0
                  animate-pulse
                  text-lg
                  font-black
                  text-white/25
                "
              >
                z
              </span>
            </div>

            <h3
              className="
                relative
                mt-6
                text-2xl
                font-black
                uppercase
                italic

                sm:text-4xl
              "
            >
              {pokemon.displayName} is resting
            </h3>

            <p
              className="
                relative
                mt-2
                max-w-md
                text-xs
                font-medium
                leading-5
                text-white/60

                sm:text-sm
                sm:leading-6
              "
            >
              Your Buddy used all of its energy and temporarily left the active
              Buddy Link.
            </p>

            <div
              className="
                relative
                mt-5
                rounded-2xl
                border-2
                border-white/10
                bg-black/25
                px-6
                py-4
              "
            >
              <p
                className="
                  font-mono
                  text-[7px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white/40
                "
              >
                Wake Timer
              </p>

              <p
                className="
                  mt-1
                  font-mono
                  text-3xl
                  font-black
                  text-yellow-300

                  sm:text-4xl
                "
              >
                {formattedRest}
              </p>
            </div>

            <p
              className="
                relative
                mt-4
                text-[8px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-white/40

                sm:text-[10px]
              "
            >
              Wakes with {rules.wakeEnergy} energy
              {" • "}
              {berriesToFull} berries to full
            </p>
          </div>
        </section>

        {rulesModal}
      </>
    );
  }

  /* =======================================================
     ACTIVE
  ======================================================= */

  return (
    <>
      <section className={cardClass}>
        <CardHeader />

        <div
          className="
            relative
            overflow-hidden
            px-3
            py-4

            sm:px-5
            sm:py-6

            lg:px-7
            lg:py-7
          "
          style={{
            background: `
              radial-gradient(
                circle at 27% 28%,
                ${theme.glow}b8,
                transparent 24%
              ),
              radial-gradient(
                circle at 92% 8%,
                rgba(255,255,255,.2),
                transparent 18%
              ),
              linear-gradient(
                145deg,
                ${theme.primary},
                ${theme.deep}
              )
            `,
          }}
        >
          {/* =================================================
              BACKGROUND DETAILS
          ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-[0.08]
              bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
              bg-[size:20px_20px]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-10
              opacity-[0.05]
              bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,#000_3px,#000_5px)]
            "
          />

          {/* =================================================
              MAIN
          ================================================== */}

          <div
            className="
              relative
              z-20
              grid
              min-w-0
              gap-5

              md:grid-cols-[minmax(0,1fr)_minmax(240px,0.72fr)]
              md:items-center

              xl:gap-8
            "
          >
            {/* =================================================
                BUDDY SIDE
            ================================================== */}

            <div className="min-w-0">
              {/* ===============================================
                  POKÉMON HABITAT
              ================================================ */}

              <div
                className="
                  relative
                  mx-auto
                  flex
                  h-[220px]
                  w-full
                  max-w-[360px]
                  items-center
                  justify-center

                  sm:h-[270px]

                  lg:h-[300px]
                "
              >
                <div
                  className="
                    absolute
                    h-[190px]
                    w-[190px]
                    rounded-full
                    border-[3px]
                    border-white/20
                    bg-white/[0.05]

                    sm:h-[230px]
                    sm:w-[230px]

                    lg:h-[255px]
                    lg:w-[255px]
                  "
                />

                <div
                  className="
                    absolute
                    h-[170px]
                    w-[170px]
                    animate-[spin_22s_linear_infinite]
                    rounded-full
                    border-2
                    border-dashed
                    border-white/25

                    sm:h-[210px]
                    sm:w-[210px]

                    lg:h-[235px]
                    lg:w-[235px]
                  "
                />

                <div
                  className="
                    absolute
                    h-36
                    w-36
                    rounded-full
                    bg-white/20
                    blur-3xl
                  "
                />

                <div
                  className="
                    absolute
                    bottom-6
                    h-7
                    w-36
                    rounded-[100%]
                    bg-black/25
                    blur-md

                    sm:w-44
                  "
                />

                {/* =============================================
                    EFFECTS
                ============================================== */}

                {actionEffect && (
                  <div
                    key={effectKey}
                    className="
                      pointer-events-none
                      absolute
                      inset-0
                      z-50
                    "
                  >
                    {actionEffect === "pet" && (
                      <>
                        <span
                          className="
                            absolute
                            left-[17%]
                            top-[22%]
                            animate-ping
                            text-xl
                            text-pink-100
                          "
                        >
                          ♥
                        </span>

                        <span
                          className="
                            absolute
                            right-[17%]
                            top-[25%]
                            animate-ping
                            text-lg
                            text-pink-100
                            [animation-delay:120ms]
                          "
                        >
                          ♥
                        </span>

                        <span
                          className="
                            absolute
                            left-[31%]
                            top-[8%]
                            animate-ping
                            text-lg
                            text-yellow-100
                            [animation-delay:200ms]
                          "
                        >
                          ✦
                        </span>
                      </>
                    )}

                    {actionEffect === "play" && (
                      <>
                        <span
                          className="
                            absolute
                            left-[10%]
                            top-[27%]
                            animate-bounce
                            text-2xl
                            text-yellow-100
                          "
                        >
                          ★
                        </span>

                        <span
                          className="
                            absolute
                            right-[12%]
                            top-[13%]
                            animate-bounce
                            text-xl
                            text-white
                            [animation-delay:120ms]
                          "
                        >
                          ✦
                        </span>

                        <span
                          className="
                            absolute
                            bottom-[18%]
                            right-[22%]
                            animate-bounce
                            text-xl
                            text-yellow-100
                            [animation-delay:220ms]
                          "
                        >
                          ★
                        </span>
                      </>
                    )}

                    {actionEffect === "eat" && (
                      <>
                        <span
                          className="
                            absolute
                            left-[20%]
                            top-[17%]
                            animate-ping
                            text-xl
                          "
                        >
                          ✨
                        </span>

                        <span
                          className="
                            absolute
                            right-[18%]
                            top-[22%]
                            animate-ping
                            text-xl
                            [animation-delay:120ms]
                          "
                        >
                          ✨
                        </span>

                        <span
                          className="
                            absolute
                            left-1/2
                            top-[4%]
                            -translate-x-1/2
                            rounded-lg
                            border-2
                            border-zinc-950
                            bg-zinc-950
                            px-3
                            py-1
                            font-mono
                            text-[8px]
                            font-black
                            text-yellow-300
                          "
                        >
                          YUM!
                        </span>
                      </>
                    )}

                    {actionEffect === "sleep" && (
                      <>
                        <span
                          className="
                            absolute
                            right-[20%]
                            top-[12%]
                            animate-pulse
                            text-2xl
                            font-black
                            text-white/70
                          "
                        >
                          Z
                        </span>

                        <span
                          className="
                            absolute
                            right-[13%]
                            top-[4%]
                            animate-pulse
                            text-lg
                            font-black
                            text-white/45
                            [animation-delay:180ms]
                          "
                        >
                          z
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* =============================================
                    POKÉMON

                    Clicking Pokémon = pet.
                ============================================== */}

                <button
                  ref={targetRef}
                  type="button"
                  onClick={() => runAction("pet")}
                  disabled={actionLoading}
                  aria-label={`Pet ${pokemon.displayName}`}
                  className="
                    relative
                    z-30
                    flex
                    h-[175px]
                    w-[175px]
                    items-center
                    justify-center
                    rounded-full
                    outline-none
                    transition

                    active:scale-95

                    focus-visible:ring-4
                    focus-visible:ring-yellow-300

                    disabled:cursor-wait

                    sm:h-[210px]
                    sm:w-[210px]

                    lg:h-[230px]
                    lg:w-[230px]
                  "
                >
                  <img
                    src={
                      pokemon.sprite || pokemon.animatedImage || pokemon.image
                    }
                    alt={pokemon.displayName}
                    draggable={false}
                    className={`
                      h-full
                      w-full
                      select-none
                      object-contain
                      object-center
                      drop-shadow-[0_14px_8px_rgba(0,0,0,0.3)]
                      transition-all
                      duration-300

                      ${actionEffect === "pet" ? "scale-95 rotate-[-2deg]" : ""}

                      ${
                        actionEffect === "play"
                          ? "-translate-y-3 scale-110 rotate-[4deg]"
                          : ""
                      }

                      ${actionEffect === "eat" ? "scale-110" : ""}
                    `}
                    style={{
                      imageRendering: "pixelated",
                    }}
                  />
                </button>
              </div>

              {/* ===============================================
                  MESSAGE
              ================================================ */}

              <div
                className="
                  relative
                  mx-auto
                  mt-1
                  w-full
                  max-w-md
                  rounded-xl
                  border-[3px]
                  border-zinc-950
                  bg-zinc-950/90
                  px-3
                  py-3
                  text-center
                  shadow-[3px_3px_0_rgba(0,0,0,.25)]

                  sm:px-4
                "
              >
                <div
                  className="
                    absolute
                    -top-2
                    left-1/2
                    h-4
                    w-4
                    -translate-x-1/2
                    rotate-45
                    border-l-[3px]
                    border-t-[3px]
                    border-zinc-950
                    bg-zinc-950
                  "
                />

                <p
                  className="
                    relative
                    text-[10px]
                    font-black
                    leading-5
                    text-white

                    sm:text-xs
                  "
                >
                  {message}
                </p>
              </div>

              {/* ===============================================
                  PET / PLAY
              ================================================ */}

              <div
                className="
                  mx-auto
                  mt-3
                  grid
                  w-full
                  max-w-md
                  grid-cols-2
                  gap-2

                  sm:gap-3
                "
              >
                <button
                  type="button"
                  onClick={() => runAction("pet")}
                  disabled={actionLoading}
                  className="
                    min-h-11
                    rounded-xl
                    border-[3px]
                    border-zinc-950
                    bg-pink-300
                    px-2
                    py-2.5
                    text-zinc-950
                    shadow-[3px_3px_0_#18181b]
                    transition

                    hover:-translate-y-0.5
                    hover:bg-pink-200

                    disabled:cursor-not-allowed
                    disabled:opacity-40

                    sm:px-4
                  "
                >
                  <span className="text-base">♥</span>

                  <span
                    className="
                      ml-1.5
                      text-[8px]
                      font-black
                      uppercase
                      tracking-wide

                      sm:text-[9px]
                    "
                  >
                    Pet −{rules.petEnergyCost}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => runAction("play")}
                  disabled={actionLoading}
                  className="
                    min-h-11
                    rounded-xl
                    border-[3px]
                    border-zinc-950
                    bg-blue-300
                    px-2
                    py-2.5
                    text-zinc-950
                    shadow-[3px_3px_0_#18181b]
                    transition

                    hover:-translate-y-0.5
                    hover:bg-blue-200

                    disabled:cursor-not-allowed
                    disabled:opacity-40

                    sm:px-4
                  "
                >
                  <span className="text-base">★</span>

                  <span
                    className="
                      ml-1.5
                      text-[8px]
                      font-black
                      uppercase
                      tracking-wide

                      sm:text-[9px]
                    "
                  >
                    Play −{rules.playEnergyCost}
                  </span>
                </button>
              </div>

              {/* ===============================================
                  BERRY BAG
              ================================================ */}

              <div
                className="
                  mx-auto
                  mt-4
                  w-full
                  max-w-md
                  rounded-2xl
                  border-[3px]
                  border-zinc-950
                  bg-zinc-950/85
                  p-3
                  shadow-[3px_3px_0_rgba(0,0,0,.25)]

                  sm:p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <div className="min-w-0">
                    <p
                      className="
                        font-mono
                        text-[7px]
                        font-black
                        uppercase
                        tracking-[0.16em]
                        text-yellow-400

                        sm:text-[8px]
                      "
                    >
                      Berry Bag
                    </p>

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[8px]
                        font-semibold
                        text-zinc-400

                        sm:text-[10px]
                      "
                    >
                      Drag onto Buddy • +{rules.berryEnergyGain} energy
                    </p>
                  </div>

                  <span
                    className="
                      shrink-0
                      rounded-lg
                      border
                      border-white/10
                      bg-white/10
                      px-2.5
                      py-1
                      font-mono
                      text-xs
                      font-black
                      text-white
                    "
                  >
                    ×{buddy.berries}
                  </span>
                </div>

                {/* =============================================
                    BERRY SELECTOR
                ============================================== */}

                <div
                  className="
                    mt-3
                    flex
                    gap-1.5
                    overflow-x-auto
                    pb-2
                  "
                >
                  {berries.map((berry, index) => (
                    <button
                      key={berry.name}
                      type="button"
                      onClick={() => {
                        setSelectedBerryIndex(index);
                      }}
                      title={berry.displayName}
                      className={`
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        border-2
                        border-zinc-950
                        bg-white
                        shadow-[2px_2px_0_#18181b]
                        transition

                        hover:-translate-y-0.5

                        sm:h-11
                        sm:w-11

                        ${
                          index === selectedBerryIndex
                            ? "-translate-y-0.5 ring-2 ring-yellow-300 opacity-100"
                            : "opacity-70 hover:opacity-100"
                        }
                      `}
                    >
                      <img
                        src={berry.sprite}
                        alt={berry.displayName}
                        draggable={false}
                        className="
                          h-8
                          w-8
                          object-contain
                        "
                        style={{
                          imageRendering: "pixelated",
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* =============================================
                    THROW AREA
                ============================================== */}

                <div
                  className="
                    relative
                    mt-1
                    flex
                    min-h-[74px]
                    items-center
                    justify-center
                    overflow-visible
                    rounded-xl
                    border-2
                    border-dashed
                    border-white/10
                    bg-black/20
                  "
                >
                  {selectedBerry ? (
                    <button
                      ref={berryRef}
                      type="button"
                      disabled={
                        buddy.berries <= 0 ||
                        buddy.energy >= rules.maxEnergy ||
                        actionLoading
                      }
                      onPointerDown={handleBerryPointerDown}
                      onPointerMove={handleBerryPointerMove}
                      onPointerUp={handleBerryPointerUp}
                      onPointerCancel={resetBerry}
                      aria-label={`Throw ${selectedBerry.displayName} to ${pokemon.displayName}`}
                      className="
                        relative
                        z-[80]
                        flex
                        h-14
                        w-14
                        touch-none
                        items-center
                        justify-center
                        rounded-full
                        outline-none

                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                      style={{
                        transform: `translate3d(
                          ${berryDrag.x}px,
                          ${berryDrag.y}px,
                          0
                        ) scale(${
                          berryDrag.dragging
                            ? 1.15
                            : berryDrag.throwing
                              ? 0.58
                              : 1
                        })`,

                        transition: berryDrag.dragging
                          ? "none"
                          : "transform 240ms cubic-bezier(.2,.8,.2,1)",
                      }}
                    >
                      <img
                        src={selectedBerry.sprite}
                        alt={selectedBerry.displayName}
                        draggable={false}
                        className="
                          h-12
                          w-12
                          select-none
                          object-contain
                          drop-shadow-[0_4px_3px_rgba(0,0,0,.4)]
                        "
                        style={{
                          imageRendering: "pixelated",
                        }}
                      />
                    </button>
                  ) : (
                    <span
                      className="
                        font-mono
                        text-[8px]
                        font-black
                        uppercase
                        text-zinc-600
                      "
                    >
                      Loading Berries
                    </span>
                  )}
                </div>

                {/* =============================================
                    FEED STATUS
                ============================================== */}

                <div className="mt-2 text-center">
                  {buddy.berries <= 0 ? (
                    <p
                      className="
                        font-mono
                        text-[7px]
                        font-black
                        uppercase
                        tracking-wide
                        text-red-300
                      "
                    >
                      Berry Bag Empty
                    </p>
                  ) : buddy.energy >= rules.maxEnergy ? (
                    <p
                      className="
                        font-mono
                        text-[7px]
                        font-black
                        uppercase
                        tracking-wide
                        text-green-300
                      "
                    >
                      Buddy Energy Full
                    </p>
                  ) : (
                    <p
                      className="
                        font-mono
                        text-[7px]
                        font-black
                        uppercase
                        tracking-wide
                        text-zinc-500
                      "
                    >
                      No Pet Or Play Required To Feed
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                DATA SIDE
            ================================================== */}

            <div
              className="
                min-w-0
                rounded-2xl
                border-2
                border-white/15
                bg-black/15
                p-4
                text-center
                text-white
                backdrop-blur-[2px]

                sm:p-5

                md:text-left
              "
            >
              {/* ===============================================
                  NUMBER
              ================================================ */}

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border-2
                  border-zinc-950
                  bg-zinc-950/85
                  px-2.5
                  py-1.5
                  shadow-[2px_2px_0_rgba(0,0,0,.28)]
                "
              >
                <span
                  className="
                    font-mono
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.13em]
                    text-yellow-400
                  "
                >
                  No. {String(pokemon.id).padStart(4, "0")}
                </span>

                {pokemon.hasAnimatedSprite && (
                  <span
                    className="
                      rounded
                      bg-green-400
                      px-1.5
                      py-0.5
                      font-mono
                      text-[6px]
                      font-black
                      uppercase
                      text-zinc-950
                    "
                  >
                    Live
                  </span>
                )}
              </div>

              {/* ===============================================
                  NAME
              ================================================ */}

              <h3
                className="
                  mt-4
                  break-words
                  text-3xl
                  font-black
                  uppercase
                  italic
                  leading-[0.9]
                  tracking-[-0.045em]
                  drop-shadow-[3px_3px_0_rgba(0,0,0,.28)]

                  sm:text-4xl

                  lg:text-5xl
                "
              >
                {pokemon.displayName}
              </h3>

              {/* ===============================================
                  TYPES
              ================================================ */}

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  justify-center
                  gap-1.5

                  md:justify-start
                "
              >
                {pokemon.types.map((type) => (
                  <span
                    key={type}
                    className={`
                      rounded-lg
                      border-2
                      border-zinc-950
                      px-2.5
                      py-1
                      text-[7px]
                      font-black
                      uppercase
                      shadow-[2px_2px_0_#18181b]

                      sm:text-[8px]

                      ${getPokemonTypeStyles(type).badge}
                    `}
                  >
                    {type}
                  </span>
                ))}
              </div>

              {/* ===============================================
                  STATS
              ================================================ */}

              <div className="mt-5 space-y-4">
                {/* =============================================
                    AFFECTION
                ============================================== */}

                <div>
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <span
                      className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.13em]
                        text-white/65
                      "
                    >
                      Affection
                    </span>

                    <span
                      className="
                        font-mono
                        text-[9px]
                        font-black
                        text-pink-200
                      "
                    >
                      {buddy.affection}/{rules.maxAffection}
                    </span>
                  </div>

                  <div
                    className="
                      mt-2
                      h-3
                      overflow-hidden
                      rounded-full
                      border
                      border-black/40
                      bg-black/30
                    "
                  >
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-gradient-to-r
                        from-pink-400
                        via-red-400
                        to-yellow-300
                        transition-all
                        duration-500
                      "
                      style={{
                        width: `${getPercent(
                          buddy.affection,
                          rules.maxAffection,
                        )}%`,
                      }}
                    />
                  </div>

                  <p
                    className="
                      mt-1.5
                      text-[7px]
                      font-bold
                      uppercase
                      tracking-wide
                      text-white/40
                    "
                  >
                    {buddy.petCount}/{rules.maxAffection} pettings
                  </p>
                </div>

                {/* =============================================
                    ENERGY
                ============================================== */}

                <div>
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <span
                      className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.13em]
                        text-white/65
                      "
                    >
                      Energy
                    </span>

                    <span
                      className="
                        font-mono
                        text-[9px]
                        font-black
                        text-cyan-200
                      "
                    >
                      {buddy.energy}/{rules.maxEnergy}
                    </span>
                  </div>

                  <div
                    className="
                      mt-2
                      h-3
                      overflow-hidden
                      rounded-full
                      border
                      border-black/40
                      bg-black/30
                    "
                  >
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-gradient-to-r
                        from-cyan-400
                        to-blue-500
                        transition-all
                        duration-500
                      "
                      style={{
                        width: `${getPercent(buddy.energy, rules.maxEnergy)}%`,
                      }}
                    />
                  </div>

                  <p
                    className="
                      mt-1.5
                      text-[7px]
                      font-bold
                      uppercase
                      tracking-wide
                      text-white/40
                    "
                  >
                    Pet −{rules.petEnergyCost}
                    {" • "}
                    Play −{rules.playEnergyCost}
                    {" • "}
                    Berry +{rules.berryEnergyGain}
                  </p>
                </div>
              </div>

              {/* ===============================================
                  QUICK STATS
              ================================================ */}

              <div
                className="
                  mt-5
                  grid
                  grid-cols-2
                  gap-2
                  border-t
                  border-white/10
                  pt-4
                "
              >
                <div
                  className="
                    rounded-xl
                    bg-white/10
                    p-3
                    text-center

                    md:text-left
                  "
                >
                  <p
                    className="
                      text-[7px]
                      font-black
                      uppercase
                      tracking-wide
                      text-white/40
                    "
                  >
                    Berry Bag
                  </p>

                  <p
                    className="
                      mt-1
                      font-mono
                      text-lg
                      font-black
                      text-yellow-300
                    "
                  >
                    ×{buddy.berries}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    bg-white/10
                    p-3
                    text-center

                    md:text-left
                  "
                >
                  <p
                    className="
                      text-[7px]
                      font-black
                      uppercase
                      tracking-wide
                      text-white/40
                    "
                  >
                    Plays
                  </p>

                  <p
                    className="
                      mt-1
                      font-mono
                      text-lg
                      font-black
                      text-blue-200
                    "
                  >
                    {buddy.totalPlays || 0}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    bg-white/10
                    p-3
                    text-center

                    md:text-left
                  "
                >
                  <p
                    className="
                      text-[7px]
                      font-black
                      uppercase
                      tracking-wide
                      text-white/40
                    "
                  >
                    Berries Fed
                  </p>

                  <p
                    className="
                      mt-1
                      font-mono
                      text-lg
                      font-black
                      text-green-200
                    "
                  >
                    {buddy.totalBerriesFed || 0}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    bg-white/10
                    p-3
                    text-center

                    md:text-left
                  "
                >
                  <p
                    className="
                      text-[7px]
                      font-black
                      uppercase
                      tracking-wide
                      text-white/40
                    "
                  >
                    Feed Gain
                  </p>

                  <p
                    className="
                      mt-1
                      font-mono
                      text-lg
                      font-black
                      text-cyan-200
                    "
                  >
                    +{rules.berryEnergyGain}
                  </p>
                </div>
              </div>

              {/* ===============================================
                  CURRENT RULE SUMMARY
              ================================================ */}

              <div
                className="
                  mt-4
                  rounded-xl
                  border-2
                  border-white/10
                  bg-black/15
                  p-3
                "
              >
                <p
                  className="
                    font-mono
                    text-[7px]
                    font-black
                    uppercase
                    tracking-[0.13em]
                    text-yellow-300
                  "
                >
                  Buddy Protocol
                </p>

                <div
                  className="
                    mt-2
                    grid
                    grid-cols-3
                    gap-2
                    text-center
                  "
                >
                  <div>
                    <p className="font-mono text-sm font-black text-pink-200">
                      −{rules.petEnergyCost}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[6px]
                        font-black
                        uppercase
                        text-white/35
                      "
                    >
                      Pet
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-sm font-black text-blue-200">
                      −{rules.playEnergyCost}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[6px]
                        font-black
                        uppercase
                        text-white/35
                      "
                    >
                      Play
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-sm font-black text-yellow-200">
                      +{rules.berryEnergyGain}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[6px]
                        font-black
                        uppercase
                        text-white/35
                      "
                    >
                      Berry
                    </p>
                  </div>
                </div>
              </div>

              {/* ===============================================
                  DEX LINK
              ================================================ */}

              <Link
                to={`/pokedex/${pokemon.name}`}
                className="
                  mt-4
                  flex
                  min-h-10
                  w-full
                  items-center
                  justify-center
                  rounded-xl
                  border-[3px]
                  border-zinc-950
                  bg-white
                  px-4
                  text-[8px]
                  font-black
                  uppercase
                  tracking-wide
                  text-zinc-950
                  shadow-[3px_3px_0_#18181b]
                  transition

                  hover:-translate-y-0.5
                  hover:bg-yellow-50
                "
              >
                Open Dex Log
              </Link>
            </div>
          </div>
        </div>
      </section>

      {rulesModal}
    </>
  );
};

export default BuddyCard;
