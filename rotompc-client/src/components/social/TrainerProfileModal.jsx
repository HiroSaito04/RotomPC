// filepath: rotompc-client/src/components/social/TrainerProfileModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import * as socialService from "@/services/SocialService";
import * as articleService from "@/services/ArticleService";

import { fetchPublicBuddy } from "@/services/PublicBuddyService";
import { fetchPokemon } from "@/services/PokemonService";

import { normalizeFavoritePokemon } from "@/utils/pokemonHelpers";

import TrainerAvatar from "@/components/profile/TrainerAvatar";

const TRAINER_THEMES = {
  normal: {
    primary: "#A8A77A",
    deep: "#5f5f43",
    soft: "#F4F4E8",
    glow: "#D9D8A7",
  },
  fire: {
    primary: "#EE8130",
    deep: "#9d3011",
    soft: "#FFF0E6",
    glow: "#FFB477",
  },
  water: {
    primary: "#6390F0",
    deep: "#254cac",
    soft: "#EAF1FF",
    glow: "#93B5FF",
  },
  electric: {
    primary: "#F7D02C",
    deep: "#A67E00",
    soft: "#FFF8D1",
    glow: "#FFE66A",
  },
  grass: {
    primary: "#7AC74C",
    deep: "#397B21",
    soft: "#EDF8E7",
    glow: "#A7E87D",
  },
  ice: {
    primary: "#96D9D6",
    deep: "#428C89",
    soft: "#EAF9F8",
    glow: "#C3F4F1",
  },
  fighting: {
    primary: "#C22E28",
    deep: "#711713",
    soft: "#FBE7E6",
    glow: "#E76B66",
  },
  poison: {
    primary: "#A33EA1",
    deep: "#652064",
    soft: "#F6E8F6",
    glow: "#CF7ECD",
  },
  ground: {
    primary: "#E2BF65",
    deep: "#8D6C1F",
    soft: "#FFF7DF",
    glow: "#F3D68A",
  },
  flying: {
    primary: "#A98FF3",
    deep: "#654BB6",
    soft: "#F2EEFF",
    glow: "#C8B7FF",
  },
  psychic: {
    primary: "#F95587",
    deep: "#A72651",
    soft: "#FFE8EF",
    glow: "#FF91B1",
  },
  bug: {
    primary: "#A6B91A",
    deep: "#63700C",
    soft: "#F3F6DD",
    glow: "#D0DF5E",
  },
  rock: {
    primary: "#B6A136",
    deep: "#6D5E19",
    soft: "#F7F2DC",
    glow: "#D9C661",
  },
  ghost: {
    primary: "#735797",
    deep: "#3C294F",
    soft: "#EFEAF5",
    glow: "#9B7BC3",
  },
  dragon: {
    primary: "#6F35FC",
    deep: "#36109B",
    soft: "#EEE8FF",
    glow: "#9C77FF",
  },
  dark: {
    primary: "#705746",
    deep: "#34271F",
    soft: "#EEE9E6",
    glow: "#A48773",
  },
  steel: {
    primary: "#B7B7CE",
    deep: "#67677E",
    soft: "#F0F0F7",
    glow: "#D4D4E7",
  },
  fairy: {
    primary: "#D685AD",
    deep: "#94466C",
    soft: "#FCECF4",
    glow: "#F1B4D1",
  },
  default: {
    primary: "#E63946",
    deep: "#8F1723",
    soft: "#FFF0F1",
    glow: "#FF737D",
  },
};

const TRAINER_REFERENCE_HEIGHT_METERS = 1.7;
const TRAINER_REFERENCE_PIXEL_HEIGHT = 188;

const SCENE_HEIGHT = 285;
const GROUND_LINE = 23;

const ALWAYS_AIRBORNE = new Set([
  "gastly",
  "haunter",
  "gengar",
  "magnemite",
  "magneton",
  "magnezone",
  "mew",
  "mewtwo",
  "celebi",
  "jirachi",
  "unown",
  "solrock",
  "lunatone",
  "castform",
  "chimecho",
  "rotom",
  "rotom-heat",
  "rotom-wash",
  "rotom-frost",
  "rotom-fan",
  "rotom-mow",
  "uxie",
  "mesprit",
  "azelf",
  "cresselia",
]);

const GROUNDED_FLYING = new Set([
  "doduo",
  "dodrio",
  "farfetchd",
  "sirfetchd",
  "hawlucha",
  "delibird",
]);

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const getTrainerId = (trainer) => trainer?.id || trainer?._id || "";

const formatName = (value) => {
  const text = String(value || "")
    .trim()
    .replace(/-/g, " ");

  if (!text) {
    return "—";
  }

  return text
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatJoinedDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
};

const getRelativeTime = (createdAt) => {
  if (!createdAt) {
    return "Recently";
  }

  try {
    const rawDate =
      typeof createdAt === "object" && createdAt?.$date
        ? createdAt.$date
        : createdAt;

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000),
    );

    if (seconds < 60) {
      return "Just now";
    }

    const intervals = [
      ["year", 31536000],
      ["month", 2592000],
      ["week", 604800],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
    ];

    for (const [label, interval] of intervals) {
      const count = Math.floor(seconds / interval);

      if (count >= 1) {
        return new Intl.RelativeTimeFormat("en", {
          numeric: "auto",
        }).format(-count, label);
      }
    }

    return "Recently";
  } catch {
    return "Recently";
  }
};

const normalizeScenePokemon = (rawPokemon) => {
  if (!rawPokemon) {
    return null;
  }

  const normalized = normalizeFavoritePokemon(rawPokemon);

  const types = Array.isArray(rawPokemon.types)
    ? rawPokemon.types.map((entry) => entry?.type?.name).filter(Boolean)
    : [];

  const abilities = Array.isArray(rawPokemon.abilities)
    ? rawPokemon.abilities.map((entry) => entry?.ability?.name).filter(Boolean)
    : [];

  return {
    ...normalized,
    rawName: rawPokemon.name || normalized?.name || "",
    heightDecimetres: Number(rawPokemon.height) || 10,
    types,
    abilities,
  };
};

const isPokemonAirborne = (pokemon) => {
  if (!pokemon) {
    return false;
  }

  const pokemonName = String(
    pokemon.rawName || pokemon.name || "",
  ).toLowerCase();

  if (ALWAYS_AIRBORNE.has(pokemonName)) {
    return true;
  }

  if (pokemon.abilities?.includes("levitate")) {
    return true;
  }

  if (pokemon.types?.includes("flying") && !GROUNDED_FLYING.has(pokemonName)) {
    return true;
  }

  return false;
};

const getPokemonSceneLayout = (pokemon) => {
  if (!pokemon) {
    return {
      heightMeters: 1,
      naturalPixelHeight: 110,
      pixelHeight: 110,
      isAirborne: false,
      behindTrainer: false,
      bottom: GROUND_LINE,
      right: "7%",
      width: "43%",
      zIndex: 35,
    };
  }

  const heightMeters = Math.max(0.1, Number(pokemon.heightDecimetres) / 10);

  const naturalPixelHeight =
    (heightMeters / TRAINER_REFERENCE_HEIGHT_METERS) *
    TRAINER_REFERENCE_PIXEL_HEIGHT;

  const pixelHeight = clamp(naturalPixelHeight, 35, 335);

  const isAirborne = isPokemonAirborne(pokemon);

  const behindTrainer = heightMeters >= 2.2;

  let bottom = GROUND_LINE;

  if (isAirborne) {
    if (heightMeters <= 0.6) {
      bottom = 74;
    } else if (heightMeters <= 1.4) {
      bottom = 60;
    } else {
      bottom = 45;
    }
  }

  let right = "6%";
  let width = "44%";

  if (heightMeters < 0.45) {
    right = "15%";
    width = "31%";
  } else if (heightMeters < 0.9) {
    right = "10%";
    width = "38%";
  } else if (heightMeters >= 3) {
    right = "-16%";
    width = "74%";
  } else if (heightMeters >= 2.2) {
    right = "-7%";
    width = "65%";
  } else if (heightMeters >= 1.5) {
    right = "0%";
    width = "52%";
  }

  return {
    heightMeters,
    naturalPixelHeight,
    pixelHeight,
    isAirborne,
    behindTrainer,
    bottom,
    right,
    width,
    zIndex: behindTrainer ? 12 : 38,
  };
};

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
    <path
      d="M6 6L18 18M18 6L6 18"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const ArticleImage = ({ article }) => {
  const [failed, setFailed] = useState(false);

  const imageSource = article?.imageUrl
    ? article.imageUrl
    : article?._id
      ? articleService.getArticleImageUrl(article._id)
      : "";

  useEffect(() => {
    setFailed(false);
  }, [imageSource, article?._id]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden border-b-[3px] border-zinc-950 bg-zinc-200 p-3">
      <div className="relative h-full w-full overflow-hidden rounded-xl border-[3px] border-zinc-950 bg-white p-2 shadow-[3px_3px_0_rgba(24,24,27,0.18)]">
        {imageSource && !failed ? (
          <img
            src={imageSource}
            alt={article?.title || "Report"}
            loading="lazy"
            onError={() => setFailed(true)}
            className="block h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.015]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
            <span className="text-3xl font-black">R</span>

            <span className="mt-1 font-mono text-[7px] font-black uppercase tracking-[0.15em]">
              Report
            </span>
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-lg bg-gradient-to-t from-black/[0.04] via-transparent to-white/[0.04]"
        />
      </div>
    </div>
  );
};

const PublicBuddySprite = ({ pokemon }) => {
  const [petting, setPetting] = useState(false);
  const [effectKey, setEffectKey] = useState(0);

  const timeoutRef = useRef(null);

  const layout = useMemo(() => getPokemonSceneLayout(pokemon), [pokemon]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  if (!pokemon) {
    return null;
  }

  const sprite = pokemon.sprite || pokemon.animatedImage || pokemon.image || "";

  if (!sprite) {
    return null;
  }

  const pokemonName = pokemon.displayName || formatName(pokemon.name);

  const handlePet = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setEffectKey((current) => current + 1);
    setPetting(true);

    timeoutRef.current = window.setTimeout(() => {
      setPetting(false);
    }, 580);
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-[100%] bg-black/25 blur-[5px]"
        style={{
          zIndex: 9,
          right: layout.behindTrainer ? "5%" : "12%",
          bottom: `${GROUND_LINE - 9}px`,
          width: `${clamp(
            layout.pixelHeight * (layout.isAirborne ? 0.5 : 0.72),
            25,
            145,
          )}px`,
          height: layout.isAirborne ? "9px" : "13px",
          opacity: layout.isAirborne ? 0.45 : 0.7,
        }}
      />

      <button
        type="button"
        onClick={handlePet}
        aria-label={`Pet ${pokemonName}`}
        title={`${pokemonName} • ${layout.heightMeters.toFixed(1)} m`}
        className="absolute flex items-end justify-center border-0 bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
        style={{
          right: layout.right,
          bottom: `${layout.bottom}px`,
          width: layout.width,
          height: `${layout.pixelHeight}px`,
          maxHeight: layout.behindTrainer
            ? `${SCENE_HEIGHT + 35}px`
            : `${SCENE_HEIGHT - 28}px`,
          zIndex: layout.zIndex,
        }}
      >
        <img
          src={sprite}
          alt={pokemonName}
          draggable={false}
          className={`h-full w-full select-none object-contain object-bottom drop-shadow-[0_11px_7px_rgba(0,0,0,.32)] transition-transform duration-200 ${
            petting ? "scale-[1.045]" : ""
          }`}
          style={{
            imageRendering: "pixelated",
            transformOrigin: "50% 100%",
          }}
        />

        {petting && (
          <div
            key={effectKey}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-50"
          >
            <span className="absolute left-[28%] top-[12%] animate-ping text-xl text-pink-100 drop-shadow">
              ♥
            </span>

            <span className="absolute right-[24%] top-[20%] text-lg text-yellow-100 drop-shadow">
              ✦
            </span>
          </div>
        )}
      </button>
    </>
  );
};

const TrainerBuddyStage = ({
  profile,
  pokemon,
  buddyLoading,
  theme,
  favoriteTypeLabel,
}) => {
  const profileId = getTrainerId(profile);

  const pokemonLayout = getPokemonSceneLayout(pokemon);

  return (
    <div
      className="relative h-[285px] overflow-hidden sm:h-[300px]"
      style={{
        background: `
          radial-gradient(
            circle at 48% 46%,
            ${theme.glow}90,
            transparent 52%
          ),
          linear-gradient(
            180deg,
            ${theme.primary},
            ${theme.deep}
          )
        `,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:18px_18px]"
      />

      <div className="absolute left-3 top-3 z-50 rounded-lg border-2 border-zinc-950 bg-zinc-950/85 px-2.5 py-1">
        <p className="font-mono text-[6px] font-black uppercase tracking-[0.12em] text-yellow-400">
          {favoriteTypeLabel} Trainer
        </p>
      </div>

      {pokemon && (
        <div className="absolute right-3 top-3 z-50 rounded-lg border border-white/20 bg-black/35 px-2 py-1 backdrop-blur-sm">
          <p className="font-mono text-[6px] font-black uppercase tracking-[0.08em] text-white/75">
            {pokemonLayout.heightMeters.toFixed(1)}m
            {pokemonLayout.isAirborne ? " • airborne" : ""}
          </p>
        </div>
      )}

      <div
        aria-hidden="true"
        className="absolute left-[6%] h-[3px] w-[88%] rounded-full bg-black/25"
        style={{
          bottom: `${GROUND_LINE - 1}px`,
        }}
      />

      <div
        aria-hidden="true"
        className="absolute left-[9%] h-5 w-[82%] rounded-[100%] bg-black/15 blur-md"
        style={{
          bottom: `${GROUND_LINE - 13}px`,
        }}
      />

      {pokemon && pokemonLayout.behindTrainer && (
        <PublicBuddySprite pokemon={pokemon} />
      )}

      <div
        className="absolute left-[9%] z-30 flex w-[55%] items-end justify-center"
        style={{
          bottom: `${GROUND_LINE}px`,
          height: `${TRAINER_REFERENCE_PIXEL_HEIGHT}px`,
        }}
      >
        <TrainerAvatar
          userId={profileId}
          username={profile?.username || profile?.firstName || ""}
          className="flex h-full w-full items-end justify-center overflow-visible"
          imageClassName="!h-full !w-full !max-h-full !max-w-full !p-0 object-contain object-bottom [image-rendering:pixelated] drop-shadow-[0_10px_6px_rgba(0,0,0,.32)]"
          fallbackClassName="text-4xl text-white"
        />
      </div>

      {pokemon && !pokemonLayout.behindTrainer && (
        <PublicBuddySprite pokemon={pokemon} />
      )}

      {buddyLoading && (
        <div className="absolute right-[19%] top-1/2 z-50 h-8 w-8 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
      )}

      {!buddyLoading && !pokemon && (
        <div className="absolute bottom-12 right-[9%] z-20 flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-dashed border-white/30 bg-black/10 text-white/60">
          <span className="text-3xl font-black">?</span>

          <span className="mt-1 font-mono text-[5px] font-black uppercase tracking-[0.1em]">
            No Buddy
          </span>
        </div>
      )}
    </div>
  );
};

const TrainerListItem = ({ trainer, onOpen }) => {
  const trainerId = getTrainerId(trainer);

  return (
    <button
      type="button"
      onClick={() => onOpen(trainer)}
      className="group flex w-full items-center gap-3 rounded-xl border-2 border-zinc-200 bg-white p-3 text-left transition hover:border-zinc-950 hover:bg-yellow-50 hover:shadow-[3px_3px_0_#18181b]"
    >
      <TrainerAvatar
        userId={trainerId}
        username={trainer.username || trainer.firstName || ""}
        className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 border-zinc-950 bg-gradient-to-b from-sky-100 to-blue-200 shadow-[2px_2px_0_#18181b]"
        imageClassName="p-1"
        fallbackClassName="bg-[#e63946] text-sm text-white"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">
          @{trainer.username || "trainer"}
        </p>

        <p className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-400">
          {trainer.region || "Unknown Region"}
        </p>
      </div>

      <span
        aria-hidden="true"
        className="text-lg font-black text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-950"
      >
        ›
      </span>
    </button>
  );
};

const TrainerProfileModal = ({
  open,
  trainerId = "",
  username = "",
  onClose,
}) => {
  const navigate = useNavigate();

  const [activeTrainer, setActiveTrainer] = useState({
    id: trainerId,
    username,
  });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [following, setFollowing] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [activeList, setActiveList] = useState("");
  const [socialList, setSocialList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [publicBuddy, setPublicBuddy] = useState(null);
  const [publicPokemon, setPublicPokemon] = useState(null);
  const [buddyLoading, setBuddyLoading] = useState(false);

  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  const currentUserId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const profileId = getTrainerId(profile);

  const isOwnProfile = Boolean(
    currentUserId && profileId && String(currentUserId) === String(profileId),
  );

  const fullName = useMemo(() => {
    if (!profile) {
      return "";
    }

    return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  }, [profile]);

  const favoriteTypeKey = String(profile?.favoriteType || "")
    .trim()
    .toLowerCase();

  const trainerTheme =
    TRAINER_THEMES[favoriteTypeKey] || TRAINER_THEMES.default;

  const favoriteTypeLabel = profile?.favoriteType
    ? formatName(profile.favoriteType)
    : "Pokémon";

  const buddyName =
    publicPokemon?.displayName ||
    publicPokemon?.name ||
    publicBuddy?.pokemon?.name ||
    "";

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTrainer({
      id: trainerId || "",
      username: username || "",
    });

    setProfile(null);
    setError("");
    setFeedback(null);
    setFollowing(false);
    setFollowsYou(false);

    setActiveList("");
    setSocialList([]);
    setListError("");

    setPublicBuddy(null);
    setPublicPokemon(null);

    setArticles([]);
  }, [open, trainerId, username]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return undefined;
    }

    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || (!activeTrainer.id && !activeTrainer.username)) {
      return undefined;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setFeedback(null);

        const response = await socialService.getTrainerProfile({
          userId: activeTrainer.id,
          username: activeTrainer.username,
        });

        if (cancelled) {
          return;
        }

        const nextProfile = response.data?.profile;

        if (!nextProfile) {
          throw new Error("Trainer profile is unavailable.");
        }

        setProfile(nextProfile);

        const targetId = getTrainerId(nextProfile);

        const owner = Boolean(
          currentUserId &&
          targetId &&
          String(currentUserId) === String(targetId),
        );

        if (token && targetId && !owner) {
          try {
            const statusResponse =
              await socialService.getFollowStatus(targetId);

            if (cancelled) {
              return;
            }

            const status = statusResponse.data || {};

            setFollowing(Boolean(status.following));
            setFollowsYou(Boolean(status.followsYou));

            setProfile((current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,

                followersCount:
                  status.followersCount !== undefined
                    ? Number(status.followersCount) || 0
                    : Number(current.followersCount) || 0,

                followingCount:
                  status.followingCount !== undefined
                    ? Number(status.followingCount) || 0
                    : Number(current.followingCount) || 0,
              };
            });
          } catch (statusError) {
            if (statusError.response?.status !== 401) {
              console.error("Follow status error:", statusError);
            }

            setFollowing(false);
            setFollowsYou(false);
          }
        } else {
          setFollowing(false);
          setFollowsYou(false);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Trainer profile error:", err);

        setProfile(null);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load trainer profile.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [open, activeTrainer.id, activeTrainer.username, currentUserId, token]);

  useEffect(() => {
    if (!open || !profileId) {
      return undefined;
    }

    let cancelled = false;

    const loadExtraData = async () => {
      setBuddyLoading(true);
      setArticlesLoading(true);

      const [buddyResult, articleResult] = await Promise.allSettled([
        fetchPublicBuddy(profileId),
        articleService.fetchUserArticles(profileId, 4),
      ]);

      if (cancelled) {
        return;
      }

      if (buddyResult.status === "fulfilled") {
        const nextBuddy = buddyResult.value?.data?.buddy || null;

        setPublicBuddy(nextBuddy);

        const pokemonId = nextBuddy?.pokemon?.id;

        if (pokemonId) {
          try {
            const rawPokemon = await fetchPokemon(pokemonId);

            if (!cancelled) {
              setPublicPokemon(normalizeScenePokemon(rawPokemon));
            }
          } catch (pokemonError) {
            console.error("Unable to load public Buddy Pokémon:", pokemonError);

            if (!cancelled) {
              setPublicPokemon(null);
            }
          }
        } else {
          setPublicPokemon(null);
        }
      } else {
        console.error("Unable to load public Buddy:", buddyResult.reason);

        setPublicBuddy(null);
        setPublicPokemon(null);
      }

      if (articleResult.status === "fulfilled") {
        const data = articleResult.value?.data;

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.articles)
            ? data.articles
            : [];

        setArticles(rows.slice(0, 4));
      } else {
        console.error("Unable to load Trainer reports:", articleResult.reason);

        setArticles([]);
      }

      if (!cancelled) {
        setBuddyLoading(false);
        setArticlesLoading(false);
      }
    };

    loadExtraData();

    return () => {
      cancelled = true;
    };
  }, [open, profileId]);

  const handleFollowToggle = async () => {
    if (!profileId || followLoading || isOwnProfile) {
      return;
    }

    if (!token) {
      onClose?.();
      navigate("/auth/signin");
      return;
    }

    try {
      setFollowLoading(true);
      setFeedback(null);

      const response = following
        ? await socialService.unfollowTrainer(profileId)
        : await socialService.followTrainer(profileId);

      const data = response.data || {};

      const nextFollowing = Boolean(data.following);

      setFollowing(nextFollowing);
      setFollowsYou(Boolean(data.followsYou));

      setProfile((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          followersCount:
            data.followersCount !== undefined
              ? Number(data.followersCount) || 0
              : Number(current.followersCount) || 0,

          followingCount:
            data.followingCount !== undefined
              ? Number(data.followingCount) || 0
              : Number(current.followingCount) || 0,
        };
      });

      const reward = Number(data.berryReward) || 0;

      setFeedback({
        type: reward > 0 ? "reward" : "success",

        message:
          reward > 0
            ? `Trainer followed! +${reward} berries`
            : data.message ||
              (nextFollowing ? "Trainer followed." : "Trainer unfollowed."),
      });
    } catch (err) {
      console.error("Follow trainer error:", err);

      setFeedback({
        type: "error",
        message:
          err.response?.data?.message || "Unable to update follow status.",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLoadList = async (type) => {
    if (!profileId || listLoading) {
      return;
    }

    if (activeList === type) {
      setActiveList("");
      setSocialList([]);
      setListError("");
      return;
    }

    try {
      setActiveList(type);
      setListLoading(true);
      setListError("");
      setSocialList([]);

      const response =
        type === "followers"
          ? await socialService.getFollowers(profileId)
          : await socialService.getFollowing(profileId);

      const list =
        type === "followers"
          ? response.data?.followers
          : response.data?.following;

      setSocialList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Social list error:", err);

      setListError(err.response?.data?.message || "Unable to load trainers.");
    } finally {
      setListLoading(false);
    }
  };

  const handleOpenTrainer = (trainer) => {
    const id = getTrainerId(trainer);

    if (!id) {
      return;
    }

    setActiveTrainer({
      id,
      username: trainer.username || "",
    });

    setProfile(null);
    setError("");
    setFeedback(null);

    setFollowing(false);
    setFollowsYou(false);

    setActiveList("");
    setSocialList([]);
    setListError("");

    setPublicBuddy(null);
    setPublicPokemon(null);

    setArticles([]);
  };

  const handleOpenArticle = (article) => {
    if (!article?.name) {
      return;
    }

    onClose?.();

    navigate(`/articles/${encodeURIComponent(article.name)}`);
  };

  if (!open || typeof document === "undefined") {
    return null;
  }

  const modal = (
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Trainer profile"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] border-4 border-b-0 border-zinc-950 bg-zinc-100 shadow-[0_-8px_40px_rgba(0,0,0,.4)] sm:rounded-[2rem] sm:border-b-4 sm:shadow-[10px_10px_0_#18181b]">
        <div
          className="flex shrink-0 items-center justify-between gap-4 border-b-4 border-zinc-950 px-4 py-3 text-white sm:px-5"
          style={{
            background: trainerTheme.primary,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/rotompc-icon02.svg"
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
            />

            <div className="min-w-0">
              <p className="font-mono text-[7px] font-black uppercase tracking-[0.18em] text-white/65">
                RotomPC Network
              </p>

              <h2 className="truncate text-lg font-black uppercase italic sm:text-xl">
                Trainer Profile
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close trainer profile"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-950 bg-white text-zinc-950 shadow-[2px_2px_0_#18181b] transition hover:-translate-y-0.5 hover:bg-yellow-300"
          >
            <CloseIcon />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{
            background: `
              radial-gradient(
                circle at 12% 8%,
                ${trainerTheme.glow}45,
                transparent 24%
              ),
              linear-gradient(
                180deg,
                ${trainerTheme.soft},
                #f4f4f5 42%,
                #e4e4e7
              )
            `,
          }}
        >
          {loading && (
            <div className="flex min-h-[560px] flex-col items-center justify-center gap-4">
              <div
                className="h-11 w-11 animate-spin rounded-full border-4 border-zinc-300"
                style={{
                  borderTopColor: trainerTheme.primary,
                }}
              />

              <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">
                Reading Trainer ID
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="mx-auto my-8 max-w-xl rounded-2xl border-4 border-zinc-950 bg-red-50 p-6 text-center shadow-[5px_5px_0_#18181b]">
              <p className="text-lg font-black uppercase text-red-700">
                Profile Unavailable
              </p>

              <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && profile && (
            <>
              <section
                className="relative overflow-hidden border-b-[5px] border-zinc-950 text-white"
                style={{
                  background: `
                    radial-gradient(
                      circle at 86% 12%,
                      ${trainerTheme.glow}75,
                      transparent 28%
                    ),
                    linear-gradient(
                      135deg,
                      ${trainerTheme.primary},
                      ${trainerTheme.deep}
                    )
                  `,
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:22px_22px]"
                />

                <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-7 p-4 sm:p-6 lg:grid-cols-[370px_minmax(0,1fr)] lg:items-center lg:gap-9">
                  <div className="mx-auto w-full max-w-[370px] lg:mx-0">
                    <div className="overflow-hidden rounded-[1.55rem] border-[5px] border-zinc-950 bg-zinc-900 shadow-[6px_7px_0_rgba(24,24,27,.32)]">
                      <div className="flex items-center justify-between border-b-[3px] border-zinc-950 bg-zinc-800 px-3 py-2">
                        <div className="flex gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_7px_#60a5fa]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        </div>

                        <span className="font-mono text-[7px] font-black uppercase tracking-[0.15em] text-zinc-400">
                          TRAINER ID
                        </span>
                      </div>

                      <TrainerBuddyStage
                        profile={profile}
                        pokemon={publicPokemon}
                        buddyLoading={buddyLoading}
                        theme={trainerTheme}
                        favoriteTypeLabel={favoriteTypeLabel}
                      />

                      <div className="border-t-[3px] border-zinc-950 bg-zinc-950 p-3 text-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-black uppercase italic leading-none">
                              {profile.username || "trainer"}
                            </p>

                            <p className="mt-1 truncate font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                              {profile.trainerCode || "UNREGISTERED"}
                            </p>
                          </div>

                          <span className="rounded-md bg-yellow-400 px-2 py-1 text-[6px] font-black uppercase text-zinc-950">
                            Trainer
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                          <div>
                            <p className="text-[5px] font-black uppercase text-zinc-600">
                              Region
                            </p>

                            <p className="mt-1 truncate text-[7px] font-black">
                              {profile.region || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[5px] font-black uppercase text-zinc-600">
                              Followers
                            </p>

                            <p className="mt-1 text-[7px] font-black">
                              {Number(profile.followersCount) || 0}
                            </p>
                          </div>

                          <div>
                            <p className="text-[5px] font-black uppercase text-zinc-600">
                              Buddy
                            </p>

                            <p className="mt-1 truncate text-[7px] font-black">
                              {buddyName ? formatName(buddyName) : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">
                      <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_7px_#4ade80]" />

                      <p className="font-mono text-[8px] font-black uppercase tracking-[0.15em] text-yellow-300">
                        Registered Trainer
                      </p>
                    </div>

                    <p className="mt-4 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                      Certified RotomPC Trainer
                    </p>

                    <h1 className="mt-2 break-words text-4xl font-black uppercase italic leading-[0.9] tracking-[-0.045em] drop-shadow-[4px_4px_0_rgba(0,0,0,.25)] sm:text-5xl">
                      {profile.username || "Trainer"}
                    </h1>

                    {fullName && (
                      <p className="mt-3 text-sm font-semibold text-white/70">
                        {fullName}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                      <span className="rounded-lg border-2 border-zinc-950 bg-yellow-400 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-zinc-950 shadow-[2px_2px_0_#18181b]">
                        {favoriteTypeLabel}
                      </span>

                      {profile.region && (
                        <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em]">
                          📍 {profile.region}
                        </span>
                      )}

                      {followsYou && (
                        <span className="rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em]">
                          Follows You
                        </span>
                      )}
                    </div>

                    <div className="mx-auto mt-5 max-w-2xl overflow-hidden rounded-2xl border-[3px] border-zinc-950 bg-white/95 text-left text-zinc-950 shadow-[4px_4px_0_rgba(24,24,27,.35)] lg:mx-0">
                      <div className="relative px-4 py-4 pl-5">
                        <span
                          className="absolute inset-y-0 left-0 w-1.5"
                          style={{
                            background: trainerTheme.glow,
                          }}
                        />

                        <p className="text-[9px] font-black uppercase tracking-[0.08em] text-zinc-500">
                          Trainer Bio
                        </p>

                        <p className="mt-2.5 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-zinc-800">
                          {profile.bio ||
                            "This Trainer has not added a bio yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-center lg:justify-start">
                      {!isOwnProfile ? (
                        <button
                          type="button"
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`min-h-12 min-w-[190px] rounded-xl border-[3px] border-zinc-950 px-6 text-sm font-black uppercase shadow-[4px_4px_0_#18181b] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#18181b] disabled:cursor-wait disabled:opacity-60 ${
                            following
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-[#3b4cca] text-white hover:bg-[#3040b4]"
                          }`}
                        >
                          {followLoading
                            ? "Updating..."
                            : !token
                              ? "Log In To Follow"
                              : following
                                ? "− Unfollow Trainer"
                                : "+ Follow Trainer"}
                        </button>
                      ) : (
                        <span className="rounded-xl border-2 border-white/25 bg-black/20 px-4 py-3 text-[8px] font-black uppercase tracking-[0.1em]">
                          Your Trainer Profile
                        </span>
                      )}
                    </div>

                    {feedback && (
                      <div
                        className={`mt-3 rounded-xl border-2 px-3 py-2 text-center text-[9px] font-black uppercase ${
                          feedback.type === "error"
                            ? "border-red-900 bg-red-50 text-red-700"
                            : feedback.type === "reward"
                              ? "border-green-900 bg-green-50 text-green-800"
                              : "border-blue-900 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {feedback.message}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <main className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => handleLoadList("followers")}
                    className="rounded-2xl border-[3px] border-zinc-950 bg-white p-4 text-left shadow-[4px_4px_0_#18181b] transition hover:-translate-y-0.5 hover:bg-zinc-50"
                  >
                    <p className="text-2xl font-black">
                      {Number(profile.followersCount) || 0}
                    </p>

                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">
                      Followers
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadList("following")}
                    className="rounded-2xl border-[3px] border-zinc-950 bg-white p-4 text-left shadow-[4px_4px_0_#18181b] transition hover:-translate-y-0.5 hover:bg-zinc-50"
                  >
                    <p className="text-2xl font-black">
                      {Number(profile.followingCount) || 0}
                    </p>

                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">
                      Following
                    </p>
                  </button>

                  <div className="relative overflow-hidden rounded-2xl border-[3px] border-zinc-950 bg-white p-4 shadow-[4px_4px_0_#18181b]">
                    <div
                      className="absolute -right-5 -top-5 h-16 w-16 rounded-full opacity-25"
                      style={{
                        background: trainerTheme.primary,
                      }}
                    />

                    <p className="relative truncate text-lg font-black">
                      {favoriteTypeLabel}
                    </p>

                    <p className="relative mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">
                      Favorite Type
                    </p>
                  </div>

                  <div className="rounded-2xl border-[3px] border-zinc-950 bg-white p-4 shadow-[4px_4px_0_#18181b]">
                    <p className="truncate text-lg font-black">
                      {buddyName ? formatName(buddyName) : "—"}
                    </p>

                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">
                      Buddy Pokémon
                    </p>
                  </div>
                </section>

                <section className="overflow-hidden rounded-[1.5rem] border-4 border-zinc-950 bg-white shadow-[6px_6px_0_#18181b]">
                  <div className="border-b-[3px] border-zinc-950 bg-zinc-950 px-4 py-3 text-white">
                    <p
                      className="font-mono text-[7px] font-black uppercase tracking-[0.16em]"
                      style={{
                        color: trainerTheme.glow,
                      }}
                    >
                      TRAINER RECORD //
                    </p>

                    <h3 className="mt-0.5 text-lg font-black uppercase">
                      Trainer Data
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-zinc-200 sm:grid-cols-5">
                    {[
                      {
                        label: "Trainer Code",
                        value: profile.trainerCode || "—",
                      },
                      {
                        label: "Region",
                        value: profile.region || "—",
                      },
                      {
                        label: "Gender",
                        value: formatName(profile.gender),
                      },
                      {
                        label: "Trainer Since",
                        value: formatJoinedDate(profile.createdAt),
                      },
                      {
                        label: "Buddy",
                        value: buddyName ? formatName(buddyName) : "—",
                      },
                    ].map((field) => (
                      <div key={field.label} className="min-w-0 bg-white p-4">
                        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-zinc-400">
                          {field.label}
                        </p>

                        <p
                          title={String(field.value)}
                          className="mt-1.5 truncate text-sm font-black text-zinc-950"
                        >
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {activeList && (
                  <section className="overflow-hidden rounded-[1.5rem] border-4 border-zinc-950 bg-white shadow-[5px_5px_0_#18181b]">
                    <div className="flex items-center justify-between border-b-[3px] border-zinc-950 bg-zinc-950 px-4 py-3 text-white">
                      <div>
                        <p className="font-mono text-[7px] font-black uppercase tracking-[0.13em] text-white/50">
                          PokéSocial
                        </p>

                        <h3 className="text-lg font-black uppercase">
                          {activeList === "followers"
                            ? "Followers"
                            : "Following"}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveList("");
                          setSocialList([]);
                          setListError("");
                        }}
                        className="rounded-lg border-2 border-white/20 px-3 py-1.5 text-[8px] font-black uppercase transition hover:bg-white hover:text-zinc-950"
                      >
                        Hide
                      </button>
                    </div>

                    <div className="max-h-72 space-y-2 overflow-y-auto p-3">
                      {listLoading && (
                        <div className="flex min-h-32 items-center justify-center">
                          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-950" />
                        </div>
                      )}

                      {!listLoading && listError && (
                        <p className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center text-xs font-bold text-red-700">
                          {listError}
                        </p>
                      )}

                      {!listLoading &&
                        !listError &&
                        socialList.length === 0 && (
                          <p className="py-8 text-center text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
                            No Trainers Yet
                          </p>
                        )}

                      {!listLoading &&
                        !listError &&
                        socialList.map((trainer, index) => (
                          <TrainerListItem
                            key={
                              getTrainerId(trainer) || trainer.username || index
                            }
                            trainer={trainer}
                            onOpen={handleOpenTrainer}
                          />
                        ))}
                    </div>
                  </section>
                )}

                <section className="rounded-[1.7rem] border-4 border-zinc-950 bg-white p-4 shadow-[6px_6px_0_#18181b] sm:p-6">
                  <div className="flex items-end justify-between gap-4 border-b-2 border-zinc-100 pb-4">
                    <div>
                      <p
                        className="font-mono text-[8px] font-black uppercase tracking-[0.16em]"
                        style={{
                          color: trainerTheme.deep,
                        }}
                      >
                        PokéSocial
                      </p>

                      <h3 className="mt-1 text-xl font-black uppercase sm:text-2xl">
                        Recent Reports
                      </h3>
                    </div>

                    <span
                      className="flex h-9 min-w-9 items-center justify-center rounded-xl border-2 border-zinc-950 px-2 text-xs font-black shadow-[2px_2px_0_#18181b]"
                      style={{
                        background: trainerTheme.glow,
                      }}
                    >
                      {articles.length}
                    </span>
                  </div>

                  {articlesLoading ? (
                    <div className="flex min-h-[210px] items-center justify-center">
                      <div
                        className="h-9 w-9 animate-spin rounded-full border-4 border-zinc-200"
                        style={{
                          borderTopColor: trainerTheme.primary,
                        }}
                      />
                    </div>
                  ) : articles.length > 0 ? (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {articles.map((article, index) => (
                        <article
                          key={article._id || article.id || index}
                          className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border-[3px] border-zinc-950 bg-white shadow-[4px_4px_0_#18181b] transition hover:-translate-y-0.5"
                        >
                          <ArticleImage article={article} />

                          <div className="flex flex-1 flex-col p-4">
                            <span className="font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                              {getRelativeTime(article.createdAt)}
                            </span>

                            <h4 className="mt-2 line-clamp-2 text-base font-black uppercase tracking-tight">
                              {article.title || "Untitled Report"}
                            </h4>

                            {article.desc && (
                              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs font-medium leading-5 text-zinc-500">
                                {article.desc}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenArticle(article)}
                              className="mt-auto pt-4"
                            >
                              <span className="block rounded-xl border-2 border-zinc-950 bg-zinc-950 px-3 py-2 text-center text-[8px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#3b4cca]">
                                View Report
                              </span>
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 flex min-h-[170px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-5 text-center">
                      <span className="text-4xl font-black text-zinc-300">
                        R
                      </span>

                      <h4 className="mt-3 text-lg font-black uppercase">
                        No Reports Yet
                      </h4>

                      <p className="mt-1 text-xs font-medium text-zinc-400">
                        This Trainer has not published any reports yet.
                      </p>
                    </div>
                  )}
                </section>
              </main>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default TrainerProfileModal;
