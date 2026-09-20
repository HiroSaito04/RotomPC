// rotompc-client/src/pages/LandingPages/AboutPage.jsx

import { useCallback, useEffect, useState } from "react";

import Button from "@/components/Button";
import BuddyCard from "@/components/profile/BuddyCard";

import * as articleService from "@/services/ArticleService";
import * as userService from "@/services/UserService";
import * as buddyService from "@/services/BuddyService";

import { fetchPokemon } from "@/services/PokemonService";

import { POKEMON_TYPE_FILTERS } from "@/constants/pokemon";

import {
  formatPokemonName,
  getPokemonTypeStyles,
} from "@/utils/pokemonHelpers";

/* =========================================================
   STORAGE
========================================================= */

const PROFILE_STORAGE_KEY = "user";

/* =========================================================
   TRAINER SPRITES
========================================================= */

const TRAINER_SPRITES = {
  male: "https://ik.imagekit.io/ytwzizvepv/RotomPC/TrainerAvatar/Trainer03.png?updatedAt=1778900538799",

  female:
    "https://ik.imagekit.io/ytwzizvepv/RotomPC/TrainerAvatar/Trainer04.png?updatedAt=1778900558997",
};

/* =========================================================
   TYPES
========================================================= */

const POKEMON_TYPES = POKEMON_TYPE_FILTERS.filter((type) => type !== "ALL").map(
  (type) => type.toLowerCase(),
);

/* =========================================================
   THEMES
========================================================= */

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
    deep: "#a67e00",
    soft: "#FFF8D1",
    glow: "#FFE66A",
  },

  grass: {
    primary: "#7AC74C",
    deep: "#397b21",
    soft: "#EDF8E7",
    glow: "#A7E87D",
  },

  ice: {
    primary: "#96D9D6",
    deep: "#428c89",
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
    deep: "#8d6c1f",
    soft: "#FFF7DF",
    glow: "#F3D68A",
  },

  flying: {
    primary: "#A98FF3",
    deep: "#654bb6",
    soft: "#F2EEFF",
    glow: "#C8B7FF",
  },

  psychic: {
    primary: "#F95587",
    deep: "#a72651",
    soft: "#FFE8EF",
    glow: "#FF91B1",
  },

  bug: {
    primary: "#A6B91A",
    deep: "#63700c",
    soft: "#F3F6DD",
    glow: "#D0DF5E",
  },

  rock: {
    primary: "#B6A136",
    deep: "#6d5e19",
    soft: "#F7F2DC",
    glow: "#D9C661",
  },

  ghost: {
    primary: "#735797",
    deep: "#3c294f",
    soft: "#EFEAF5",
    glow: "#9B7BC3",
  },

  dragon: {
    primary: "#6F35FC",
    deep: "#36109b",
    soft: "#EEE8FF",
    glow: "#9C77FF",
  },

  dark: {
    primary: "#705746",
    deep: "#34271f",
    soft: "#EEE9E6",
    glow: "#A48773",
  },

  steel: {
    primary: "#B7B7CE",
    deep: "#67677e",
    soft: "#F0F0F7",
    glow: "#D4D4E7",
  },

  fairy: {
    primary: "#D685AD",
    deep: "#94466c",
    soft: "#FCECF4",
    glow: "#F1B4D1",
  },

  default: {
    primary: "#FF1C1C",
    deep: "#A70707",
    soft: "#FFEAEA",
    glow: "#FF7777",
  },
};

/* =========================================================
   DEFAULT USER
========================================================= */

const DEFAULT_USER = {
  id: null,

  firstName: "",
  lastName: "",

  username: "",
  role: "",
  gender: "",

  trainerCode: "",

  bio: "",
  region: "",

  favoriteType: "",

  followersCount: 0,
  followingCount: 0,

  profileVisibility: "public",

  createdAt: null,
};

/* =========================================================
   LOCAL PROFILE CACHE
========================================================= */

const readStoredProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const sessionId = localStorage.getItem("id");

    const cachedId = parsed.id || parsed._id || null;

    if (sessionId && cachedId && String(sessionId) !== String(cachedId)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const removeUndefinedValues = (value = {}) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
};

const normalizeProfile = (profile = {}, cachedProfile = {}) => {
  const cleanProfile = removeUndefinedValues(profile || {});

  const cleanCache = removeUndefinedValues(cachedProfile || {});

  const merged = {
    ...DEFAULT_USER,
    ...cleanCache,
    ...cleanProfile,
  };

  const id =
    cleanProfile.id ||
    cleanProfile._id ||
    cleanCache.id ||
    cleanCache._id ||
    localStorage.getItem("id") ||
    null;

  const username =
    cleanProfile.username ||
    cleanCache.username ||
    cleanProfile.name ||
    cleanCache.name ||
    cleanProfile.firstName ||
    cleanCache.firstName ||
    localStorage.getItem("firstName") ||
    "Trainer";

  const followersCount =
    cleanProfile.followersCount ??
    cleanProfile.followers?.length ??
    cleanCache.followersCount ??
    cleanCache.followers?.length ??
    0;

  const followingCount =
    cleanProfile.followingCount ??
    cleanProfile.following?.length ??
    cleanCache.followingCount ??
    cleanCache.following?.length ??
    0;

  return {
    ...merged,

    id,
    username,

    role:
      cleanProfile.role ||
      cleanCache.role ||
      localStorage.getItem("role") ||
      "trainer",

    followersCount,
    followingCount,

    profileVisibility:
      cleanProfile.profileVisibility ??
      cleanCache.profileVisibility ??
      "public",
  };
};

const storeProfile = (profile) => {
  if (!profile || !profile.id) {
    return;
  }

  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

    localStorage.setItem("id", String(profile.id));

    if (profile.firstName) {
      localStorage.setItem("firstName", profile.firstName);
    }

    if (profile.role) {
      localStorage.setItem("role", profile.role);
    }
  } catch (error) {
    console.error("Unable to cache trainer profile:", error);
  }
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

const PencilButton = ({ onClick, label = "Edit profile" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="
      flex
      h-10
      w-10
      shrink-0
      items-center
      justify-center

      rounded-xl

      border-[3px]
      border-zinc-950

      bg-yellow-400

      text-zinc-950

      shadow-[3px_3px_0_#18181b]

      transition

      hover:-translate-y-0.5
      hover:bg-yellow-300

      active:translate-x-0.5
      active:translate-y-0.5
      active:shadow-[1px_1px_0_#18181b]
    "
  >
    <PencilIcon />
  </button>
);

/* =========================================================
   ARTICLE IMAGE
========================================================= */

const ArticleImage = ({ article }) => {
  const [failed, setFailed] = useState(false);

  let image = null;

  if (article?.imageUrl) {
    image = article.imageUrl;
  } else if (article?._id) {
    image = articleService.getArticleImageUrl(article._id);
  }

  if (!image || failed) {
    return (
      <div
        className="
          flex
          h-full
          w-full
          flex-col
          items-center
          justify-center

          bg-zinc-100

          text-zinc-400
        "
      >
        <span
          className="
            text-3xl
            font-black
          "
        >
          R
        </span>

        <span
          className="
            mt-2

            font-mono

            text-[8px]
            font-black
            uppercase
            tracking-[0.15em]
          "
        >
          Report
        </span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={article.title || "Report"}
      loading="lazy"
      onError={() => setFailed(true)}
      className="
        h-full
        w-full
        object-cover

        transition-transform
        duration-500

        group-hover:scale-105
      "
    />
  );
};

/* =========================================================
   ABOUT PAGE
========================================================= */

const AboutPage = () => {
  /* =======================================================
     PROFILE
  ======================================================= */

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return DEFAULT_USER;
    }

    const cached = readStoredProfile();

    return cached ? normalizeProfile(cached, cached) : DEFAULT_USER;
  });

  const [profileLoading, setProfileLoading] = useState(true);

  const [trainerSprite, setTrainerSprite] = useState(null);

  /* =======================================================
     BUDDY
  ======================================================= */

  const [buddyState, setBuddyState] = useState(null);

  const [buddyRefreshKey, setBuddyRefreshKey] = useState(0);

  /* =======================================================
     ARTICLES
  ======================================================= */

  const [userArticles, setUserArticles] = useState([]);

  const [articlesLoading, setArticlesLoading] = useState(false);

  /* =======================================================
     EDITOR
  ======================================================= */

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [editError, setEditError] = useState("");

  const [editSuccess, setEditSuccess] = useState("");

  const [profileForm, setProfileForm] = useState({
    bio: "",
    region: "",
    buddyPokemon: "",
    favoriteType: "",
    profileVisibility: "public",
  });

  /* =======================================================
     SOCIAL
  ======================================================= */

  const [socialModal, setSocialModal] = useState(null);

  const [socialList, setSocialList] = useState([]);

  const [socialLoading, setSocialLoading] = useState(false);

  const isAuthenticated = Boolean(user.id);

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatRole = (role) => {
    if (!role) {
      return "";
    }

    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatGender = (gender) => {
    if (!gender) {
      return "";
    }

    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const formatTrainerSince = (date) => {
    if (!date) {
      return null;
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat("en", {
      month: "short",

      year: "numeric",
    }).format(parsed);
  };

  const getRelativeTime = (createdAt) => {
    if (!createdAt) {
      return "Recently";
    }

    try {
      const raw =
        typeof createdAt === "object" && createdAt.$date
          ? createdAt.$date
          : createdAt;

      const date = new Date(raw);

      if (Number.isNaN(date.getTime())) {
        return "Recently";
      }

      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

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

  const updateTrainerSprite = useCallback((profile) => {
    const gender = String(profile?.gender || "")
      .toLowerCase()
      .trim();

    setTrainerSprite(TRAINER_SPRITES[gender] || null);
  }, []);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(DEFAULT_USER);

      setTrainerSprite(null);

      setProfileLoading(false);

      return;
    }

    const cachedProfile = readStoredProfile() || {};

    try {
      setProfileLoading(true);

      const response = await userService.fetchMyProfile();

      const profile =
        response.data?.user || response.data?.profile || response.data;

      if (!profile) {
        throw new Error("Trainer profile unavailable.");
      }

      const normalized = normalizeProfile(profile, cachedProfile);

      setUser(normalized);

      updateTrainerSprite(normalized);

      storeProfile(normalized);
    } catch (error) {
      console.error("Unable to load trainer profile:", error);

      if (Object.keys(cachedProfile).length) {
        const fallback = normalizeProfile(cachedProfile, cachedProfile);

        setUser(fallback);

        updateTrainerSprite(fallback);
      } else {
        const fallback = {
          ...DEFAULT_USER,

          id: localStorage.getItem("id") || null,

          firstName: localStorage.getItem("firstName") || "",

          username: localStorage.getItem("firstName") || "Trainer",

          role: localStorage.getItem("role") || "trainer",
        };

        setUser(fallback);

        updateTrainerSprite(fallback);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [updateTrainerSprite]);

  useEffect(() => {
    loadProfile();

    window.addEventListener("storage", loadProfile);

    window.addEventListener("local-auth-update", loadProfile);

    return () => {
      window.removeEventListener("storage", loadProfile);

      window.removeEventListener("local-auth-update", loadProfile);
    };
  }, [loadProfile]);

  /* =======================================================
     ARTICLES
  ======================================================= */

  useEffect(() => {
    const load = async () => {
      if (!user.id) {
        setUserArticles([]);

        return;
      }

      try {
        setArticlesLoading(true);

        const response = await articleService.fetchUserArticles(user.id, 4);

        const articles = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.articles)
            ? response.data.articles
            : [];

        setUserArticles(articles.slice(0, 4));
      } catch (error) {
        console.error("Unable to load reports:", error);

        setUserArticles([]);
      } finally {
        setArticlesLoading(false);
      }
    };

    load();
  }, [user.id]);

  /* =======================================================
     PROFILE EDIT
  ======================================================= */

  const openEditor = () => {
    setEditError("");

    setEditSuccess("");

    setProfileForm({
      bio: user.bio || "",

      region: user.region || "",

      buddyPokemon: buddyState?.pokemon?.name || buddyState?.pokemon?.id || "",

      favoriteType: user.favoriteType || "",

      profileVisibility: user.profileVisibility || "public",
    });

    setEditing(true);
  };

  const closeEditor = () => {
    if (saving) {
      return;
    }

    setEditing(false);

    setEditError("");

    setEditSuccess("");
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,

      [name]: value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    setSaving(true);

    setEditError("");

    setEditSuccess("");

    try {
      let pokemon = null;

      const buddyInput = String(profileForm.buddyPokemon || "")
        .trim()
        .toLowerCase();

      if (buddyInput) {
        try {
          const data = await fetchPokemon(buddyInput);

          pokemon = {
            id: data.id,

            name: data.name,
          };
        } catch {
          throw new Error("That Buddy Pokémon could not be found.");
        }
      }

      const updatePayload = {
        bio: profileForm.bio.trim(),

        region: profileForm.region.trim(),

        favoriteType: profileForm.favoriteType,

        profileVisibility: profileForm.profileVisibility,
      };

      const updateResponse =
        await userService.updateTrainerProfile(updatePayload);

      const returnedProfile =
        updateResponse?.data?.user ||
        updateResponse?.data?.profile ||
        (updateResponse?.data && typeof updateResponse.data === "object"
          ? updateResponse.data
          : {});

      const optimisticProfile = normalizeProfile(
        {
          ...user,

          ...updatePayload,

          ...removeUndefinedValues(returnedProfile),
        },
        user,
      );

      setUser(optimisticProfile);

      updateTrainerSprite(optimisticProfile);

      storeProfile(optimisticProfile);

      const buddyResponse = await buddyService.setBuddyPokemon(pokemon);

      setBuddyState(buddyResponse.data?.buddy || null);

      setBuddyRefreshKey((current) => current + 1);

      await loadProfile();

      setEditSuccess("Trainer profile updated.");

      window.setTimeout(() => {
        setEditing(false);

        setEditSuccess("");
      }, 650);
    } catch (error) {
      setEditError(
        error.response?.data?.message ||
          error.message ||
          "Unable to update trainer profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     SOCIAL
  ======================================================= */

  const openSocialList = async (type) => {
    if (!user.id) {
      return;
    }

    setSocialModal(type);

    setSocialList([]);

    setSocialLoading(true);

    try {
      const response =
        type === "followers"
          ? await userService.fetchFollowers(user.id)
          : await userService.fetchFollowing(user.id);

      const rows =
        type === "followers"
          ? response.data?.followers
          : response.data?.following;

      setSocialList(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Unable to load social list:", error);

      setSocialList([]);
    } finally {
      setSocialLoading(false);
    }
  };

  /* =======================================================
     DERIVED
  ======================================================= */

  const favoriteTypeKey = String(user.favoriteType || "")
    .trim()
    .toLowerCase();

  const trainerTheme =
    TRAINER_THEMES[favoriteTypeKey] || TRAINER_THEMES.default;

  const favoriteTypeLabel = user.favoriteType
    ? formatPokemonName(user.favoriteType)
    : "Pokemon ";

  const trainerSince = formatTrainerSince(user.createdAt);

  const profileData = [
    {
      label: "Trainer Code",

      value: user.trainerCode || "—",
    },

    {
      label: "Region",

      value: user.region || "—",
    },

    {
      label: "Gender",

      value: user.gender ? formatGender(user.gender) : "—",
    },

    {
      label: "Role",

      value: user.role ? formatRole(user.role) : "Trainer",
    },

    {
      label: "Trainer Since",

      value: trainerSince || "—",
    },
  ];

  /* =======================================================
     LOADING
  ======================================================= */

  if (profileLoading) {
    return (
      <div
        className="
          flex
          min-h-[70vh]
          items-center
          justify-center

          bg-zinc-100
        "
      >
        <div
          className="
            text-center
          "
        >
          <div
            className="
              mx-auto

              h-11
              w-11

              animate-spin

              rounded-full

              border-4
              border-zinc-300
              border-t-red-500
            "
          />

          <p
            className="
              mt-4

              font-mono

              text-[9px]
              font-black
              uppercase
              tracking-[0.16em]

              text-zinc-500
            "
          >
            Loading Trainer Data
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div
      className="
        min-h-screen
        overflow-x-hidden

        pb-16

        font-sans

        text-zinc-900
      "
      style={{
        background: `
          radial-gradient(
            circle at 12% 8%,
            ${trainerTheme.glow}55,
            transparent 24%
          ),
          radial-gradient(
            circle at 92% 28%,
            ${trainerTheme.primary}30,
            transparent 27%
          ),
          linear-gradient(
            180deg,
            ${trainerTheme.soft},
            #f4f4f5 44%,
            #e4e4e7
          )
        `,
      }}
    >
      {/* ===================================================
          HERO
      ==================================================== */}

      <section
        className="
          relative

          overflow-hidden

          border-b-[6px]
          border-zinc-950

          text-white
        "
        style={{
          background: `
            radial-gradient(
              circle at 84% 18%,
              ${trainerTheme.glow}75,
              transparent 27%
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
          className="
            pointer-events-none

            absolute
            inset-0

            opacity-10

            bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]

            bg-[size:22px_22px]
          "
        />

        <div
          className="
            pointer-events-none

            absolute
            -right-24
            -top-24

            h-96
            w-96

            rounded-full

            border-[40px]
            border-white/5
          "
        />

        <div
          className="
            relative
            z-10

            mx-auto

            grid
            w-full
            max-w-7xl
            gap-7

            px-4
            py-7

            sm:px-6
            sm:py-9

            lg:grid-cols-[280px_minmax(0,1fr)]
            lg:items-center
            lg:gap-10
            lg:px-8
            lg:py-10

            xl:grid-cols-[300px_minmax(0,1fr)]
            xl:gap-14
          "
        >
          {/* ===============================================
              TRAINER ID CARD
          ================================================ */}

          <div
            className="
              mx-auto

              w-full
              max-w-[290px]

              sm:max-w-[310px]

              lg:mx-0
              lg:max-w-none
            "
          >
            <div
              className="
                overflow-hidden

                rounded-[1.55rem]

                border-[5px]
                border-zinc-950

                bg-zinc-900

                shadow-[6px_7px_0_rgba(24,24,27,0.3)]
              "
            >
              {/* HARDWARE TOP */}

              <div
                className="
                  flex
                  items-center
                  justify-between

                  border-b-[3px]
                  border-zinc-950

                  bg-zinc-800

                  px-3
                  py-2
                "
              >
                <div
                  className="
                    flex
                    gap-1.5
                  "
                >
                  <span
                    className="
                      h-2.5
                      w-2.5

                      rounded-full

                      bg-blue-400

                      shadow-[0_0_7px_#60a5fa]
                    "
                  />

                  <span
                    className="
                      h-2.5
                      w-2.5

                      rounded-full

                      bg-yellow-400
                    "
                  />

                  <span
                    className="
                      h-2.5
                      w-2.5

                      rounded-full

                      bg-green-400
                    "
                  />
                </div>

                <span
                  className="
                    font-mono

                    text-[7px]
                    font-black
                    uppercase
                    tracking-[0.15em]

                    text-zinc-400
                  "
                >
                  TRAINER ID
                </span>
              </div>

              {/* TRAINER IMAGE */}

              <div
                className="
                  relative

                  aspect-[4/4.15]

                  overflow-hidden
                "
                style={{
                  background: `
                    radial-gradient(
                      circle at 50% 48%,
                      ${trainerTheme.glow}80,
                      transparent 50%
                    ),
                    linear-gradient(
                      180deg,
                      ${trainerTheme.primary},
                      ${trainerTheme.deep}
                    )
                  `,
                }}
              >
                <div
                  className="
                    absolute
                    inset-0

                    opacity-10

                    bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]

                    bg-[size:18px_18px]
                  "
                />

                {isAuthenticated ? (
                  <>
                    <div
                      className="
                        absolute
                        left-3
                        top-3
                        z-30

                        rounded-lg

                        border-2
                        border-zinc-950

                        bg-zinc-950/85

                        px-2.5
                        py-1
                      "
                    >
                      <p
                        className="
                          font-mono

                          text-[7px]
                          font-black
                          uppercase
                          tracking-[0.12em]

                          text-yellow-400
                        "
                      >
                        {favoriteTypeLabel} TRAINER
                      </p>
                    </div>

                    {trainerSprite ? (
                      <div
                        className="
                          absolute

                          inset-x-2
                          bottom-0
                          top-9

                          flex
                          items-end
                          justify-center
                        "
                      >
                        <img
                          src={trainerSprite}
                          alt={`${user.username} trainer`}
                          className="
                            max-h-full
                            max-w-full

                            object-contain
                            object-bottom
                          "
                          style={{
                            imageRendering: "pixelated",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="
                          absolute
                          inset-0

                          flex
                          items-center
                          justify-center
                        "
                      >
                        <div
                          className="
                            flex
                            h-24
                            w-24
                            items-center
                            justify-center

                            rounded-full

                            border-4
                            border-white/30

                            bg-white/15

                            text-4xl
                            font-black
                            uppercase
                          "
                        >
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}

                    <div
                      className="
                        absolute

                        bottom-2
                        left-1/2

                        h-5
                        w-32

                        -translate-x-1/2

                        rounded-[100%]

                        bg-black/25

                        blur-md
                      "
                    />
                  </>
                ) : (
                  <div
                    className="
                      absolute
                      inset-0

                      flex
                      flex-col
                      items-center
                      justify-center

                      px-6

                      text-center
                    "
                  >
                    <span
                      className="
                        text-5xl
                        font-black

                        text-white/30
                      "
                    >
                      ?
                    </span>

                    <p
                      className="
                        mt-4

                        text-sm
                        font-black
                        uppercase
                      "
                    >
                      No Trainer Connected
                    </p>
                  </div>
                )}
              </div>

              {/* TRAINER CARD DATA */}

              {isAuthenticated && (
                <div
                  className="
                    border-t-[3px]
                    border-zinc-950

                    bg-zinc-950

                    p-3

                    text-white
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                  >
                    <div
                      className="
                        min-w-0
                      "
                    >
                      <p
                        className="
                          truncate

                          text-lg
                          font-black
                          uppercase
                          italic
                          leading-none
                        "
                      >
                        {user.username}
                      </p>

                      <p
                        className="
                          mt-1
                          truncate

                          font-mono

                          text-[7px]
                          font-bold
                          uppercase
                          tracking-[0.1em]

                          text-zinc-500
                        "
                      >
                        {user.trainerCode || "UNREGISTERED"}
                      </p>
                    </div>

                    <span
                      className="
                        rounded-md

                        bg-yellow-400

                        px-2
                        py-1

                        text-[7px]
                        font-black
                        uppercase

                        text-zinc-950
                      "
                    >
                      {formatRole(user.role || "trainer")}
                    </span>
                  </div>

                  <div
                    className="
                      mt-3

                      grid
                      grid-cols-3
                      gap-2

                      border-t
                      border-white/10

                      pt-3
                    "
                  >
                    <div>
                      <p
                        className="
                          text-[6px]
                          font-black
                          uppercase

                          text-zinc-600
                        "
                      >
                        Region
                      </p>

                      <p
                        className="
                          mt-1
                          truncate

                          text-[8px]
                          font-black
                        "
                      >
                        {user.region || "—"}
                      </p>
                    </div>

                    <div>
                      <p
                        className="
                          text-[6px]
                          font-black
                          uppercase

                          text-zinc-600
                        "
                      >
                        Followers
                      </p>

                      <p
                        className="
                          mt-1

                          text-[8px]
                          font-black
                        "
                      >
                        {user.followersCount}
                      </p>
                    </div>

                    <div>
                      <p
                        className="
                          text-[6px]
                          font-black
                          uppercase

                          text-zinc-600
                        "
                      >
                        Buddy
                      </p>

                      <p
                        className="
                          mt-1
                          truncate

                          text-[8px]
                          font-black
                        "
                      >
                        {buddyState?.pokemon?.name
                          ? formatPokemonName(buddyState.pokemon.name)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===============================================
              IDENTITY
          ================================================ */}

          <div
            className="
              min-w-0

              text-center

              lg:text-left
            "
          >
            <div
              className="
                inline-flex
                items-center
                gap-2

                rounded-full

                border
                border-white/20

                bg-black/20

                px-3
                py-1.5

                backdrop-blur-sm
              "
            >
              <span
                className={`
                  h-2
                  w-2

                  rounded-full

                  ${
                    isAuthenticated
                      ? "bg-green-400 shadow-[0_0_7px_#4ade80]"
                      : "bg-zinc-500"
                  }
                `}
              />

              <p
                className="
                  font-mono

                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.15em]

                  text-yellow-300

                  sm:text-[9px]
                "
              >
                {isAuthenticated ? "Trainer Online" : "Guest Session"}
              </p>
            </div>

            {isAuthenticated ? (
              <>
                <div
                  className="
                    mt-4

                    flex
                    items-start
                    justify-center
                    gap-3

                    lg:justify-start
                  "
                >
                  <div
                    className="
                      min-w-0
                    "
                  >
                    <p
                      className="
                        font-mono

                        text-[9px]
                        font-black
                        uppercase
                        tracking-[0.16em]

                        text-white/55

                        sm:text-[10px]
                      "
                    >
                      Certified RotomPC Trainer
                    </p>

                    <h1
                      className="
                        mt-2

                        break-words

                        text-4xl
                        font-black
                        uppercase
                        italic
                        leading-[0.9]
                        tracking-[-0.045em]

                        text-white

                        drop-shadow-[4px_4px_0_rgba(0,0,0,.25)]

                        sm:text-5xl

                        lg:text-[3.35rem]

                        xl:text-[4rem]
                      "
                    >
                      {user.username}
                    </h1>
                  </div>

                  <PencilButton onClick={openEditor} />
                </div>

                <div
                  className="
                    mt-4

                    flex
                    flex-wrap
                    items-center
                    justify-center
                    gap-2

                    lg:justify-start
                  "
                >
                  <span
                    className="
                      rounded-lg

                      border-2
                      border-zinc-950

                      bg-yellow-400

                      px-3
                      py-1.5

                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.1em]

                      text-zinc-950

                      shadow-[2px_2px_0_#18181b]

                      sm:text-[9px]
                    "
                  >
                    {favoriteTypeLabel}
                  </span>

                  {user.region && (
                    <span
                      className="
                        rounded-lg

                        border
                        border-white/20

                        bg-white/10

                        px-3
                        py-1.5

                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.1em]

                        sm:text-[9px]
                      "
                    >
                      📍 {user.region}
                    </span>
                  )}

                  {user.trainerCode && (
                    <span
                      className="
                        rounded-lg

                        border
                        border-white/20

                        bg-black/20

                        px-3
                        py-1.5

                        font-mono

                        text-[8px]
                        font-black
                        tracking-[0.1em]

                        sm:text-[9px]
                      "
                    >
                      #{user.trainerCode}
                    </span>
                  )}
                </div>

                {/* =====================================================
                    TRAINER BIO
                ===================================================== */}

                <div
                  className="
                    mx-auto
                    mt-5
                    w-full
                    max-w-2xl

                    lg:mx-0
                  "
                >
                  <div
                    className="
                      relative
                      overflow-hidden

                      rounded-2xl

                      border-[3px]
                      border-zinc-950

                      bg-white/95

                      text-left
                      text-zinc-950

                      shadow-[4px_4px_0_rgba(24,24,27,.35)]

                      backdrop-blur-sm
                    "
                  >
                    {/* THEMED ACCENT */}

                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-y-0
                        left-0

                        w-1.5
                      "
                      style={{
                        background: trainerTheme.glow,
                      }}
                    />

                    <div
                      className="
                        relative

                        px-4
                        py-4
                        pl-5

                        sm:px-5
                        sm:py-5
                        sm:pl-6
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
                        <p
                          className="
                            font-sans

                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.08em]

                            text-zinc-500

                            sm:text-xs
                          "
                        >
                          Trainer Bio
                        </p>

                        <span
                          aria-hidden="true"
                          className="
                            h-2
                            w-2
                            shrink-0

                            rounded-full
                          "
                          style={{
                            background: trainerTheme.primary,

                            boxShadow: `0 0 7px ${trainerTheme.glow}`,
                          }}
                        />
                      </div>

                      {user.bio ? (
                        <p
                          className="
                            mt-2.5

                            whitespace-pre-wrap
                            break-words

                            font-sans

                            text-sm
                            font-medium
                            leading-6

                            tracking-normal

                            text-zinc-800

                            sm:text-[15px]
                            sm:leading-7
                          "
                        >
                          {user.bio}
                        </p>
                      ) : (
                        <p
                          className="
                            mt-2.5

                            font-sans

                            text-sm
                            font-medium
                            leading-6

                            tracking-normal

                            text-zinc-400
                          "
                        >
                          No bio added yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1
                  className="
                    mt-5

                    text-4xl
                    font-black
                    uppercase
                    italic
                    tracking-[-0.04em]

                    sm:text-5xl
                  "
                >
                  Trainer Profile
                </h1>

                <p
                  className="
                    mx-auto
                    mt-4
                    max-w-lg

                    text-sm
                    font-medium
                    leading-6

                    text-white/80

                    lg:mx-0
                  "
                >
                  Sign in to access your trainer identity and Buddy Pokémon.
                </p>

                <div
                  className="
                    mt-6

                    flex
                    justify-center
                    gap-3

                    lg:justify-start
                  "
                >
                  <Button to="/auth/signin" variant="primary" size="sm">
                    Sign In
                  </Button>

                  <Button to="/auth/signup" variant="secondary" size="sm">
                    Register
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          AUTHENTICATED CONTENT
      ==================================================== */}

      {isAuthenticated && (
        <main
          className="
            relative
            z-20

            mx-auto

            w-full
            max-w-7xl

            space-y-6

            px-3
            py-6

            sm:px-6
            sm:py-8

            lg:px-8
            lg:py-8
          "
        >
          {/* ===============================================
              SUMMARY
          ================================================ */}

          <section
            className="
              grid
              grid-cols-2
              gap-3

              lg:grid-cols-4
            "
          >
            <button
              type="button"
              onClick={() => openSocialList("followers")}
              className="
                rounded-2xl

                border-[3px]
                border-zinc-950

                bg-white

                p-4

                text-left

                shadow-[4px_4px_0_#18181b]

                transition

                hover:-translate-y-0.5
              "
            >
              <p
                className="
                  text-2xl
                  font-black

                  sm:text-3xl
                "
              >
                {user.followersCount}
              </p>

              <p
                className="
                  mt-1

                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.12em]

                  text-zinc-400

                  sm:text-[9px]
                "
              >
                Followers
              </p>
            </button>

            <button
              type="button"
              onClick={() => openSocialList("following")}
              className="
                rounded-2xl

                border-[3px]
                border-zinc-950

                bg-white

                p-4

                text-left

                shadow-[4px_4px_0_#18181b]

                transition

                hover:-translate-y-0.5
              "
            >
              <p
                className="
                  text-2xl
                  font-black

                  sm:text-3xl
                "
              >
                {user.followingCount}
              </p>

              <p
                className="
                  mt-1

                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.12em]

                  text-zinc-400

                  sm:text-[9px]
                "
              >
                Following
              </p>
            </button>

            <div
              className="
                relative

                overflow-hidden

                rounded-2xl

                border-[3px]
                border-zinc-950

                bg-white

                p-4

                shadow-[4px_4px_0_#18181b]
              "
            >
              <div
                className="
                  absolute

                  -right-5
                  -top-5

                  h-16
                  w-16

                  rounded-full

                  opacity-25
                "
                style={{
                  background: trainerTheme.primary,
                }}
              />

              <p
                className="
                  relative
                  truncate

                  text-lg
                  font-black
                  capitalize

                  sm:text-xl
                "
              >
                {favoriteTypeLabel}
              </p>

              <p
                className="
                  relative
                  mt-1

                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.12em]

                  text-zinc-400

                  sm:text-[9px]
                "
              >
                Favorite Type
              </p>
            </div>

            <div
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
                  truncate

                  text-lg
                  font-black

                  sm:text-xl
                "
              >
                {user.region || "—"}
              </p>

              <p
                className="
                  mt-1

                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.12em]

                  text-zinc-400

                  sm:text-[9px]
                "
              >
                Region
              </p>
            </div>
          </section>

          {/* ===============================================
              TRAINER DATA
          ================================================ */}

          <section
            className="
              overflow-hidden

              rounded-[1.6rem]

              border-4
              border-zinc-950

              bg-white

              shadow-[6px_6px_0_#18181b]
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4

                border-b-[3px]
                border-zinc-950

                bg-zinc-950

                px-4
                py-3

                text-white

                sm:px-5
              "
            >
              <div>
                <p
                  className="
                    font-mono

                    text-[7px]
                    font-black
                    uppercase
                    tracking-[0.16em]
                  "
                  style={{
                    color: trainerTheme.glow,
                  }}
                >
                  TRAINER RECORD //
                </p>

                <h2
                  className="
                    mt-0.5

                    text-lg
                    font-black
                    uppercase
                    tracking-tight

                    sm:text-xl
                  "
                >
                  Trainer Data
                </h2>
              </div>

              <PencilButton onClick={openEditor} label="Edit trainer data" />
            </div>

            <div
              className="
                grid
                grid-cols-2

                gap-px

                bg-zinc-200

                sm:grid-cols-3

                lg:grid-cols-5
              "
            >
              {profileData.map((field) => (
                <div
                  key={field.label}
                  className="
                      relative

                      min-w-0
                      overflow-hidden

                      bg-white

                      p-4

                      sm:p-5
                    "
                >
                  <div
                    className="
                        absolute

                        -right-6
                        -top-6

                        h-16
                        w-16

                        rounded-full

                        opacity-[0.12]
                      "
                    style={{
                      background: trainerTheme.primary,
                    }}
                  />

                  <p
                    className="
                        relative

                        text-[7px]
                        font-black
                        uppercase
                        tracking-[0.12em]

                        text-zinc-400

                        sm:text-[8px]
                      "
                  >
                    {field.label}
                  </p>

                  <p
                    className="
                        relative

                        mt-1.5
                        truncate

                        text-sm
                        font-black

                        text-zinc-950

                        sm:text-base
                      "
                    title={String(field.value)}
                  >
                    {field.value}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="
                flex
                flex-col
                gap-3

                border-t-[3px]
                border-zinc-950

                bg-zinc-50

                px-4
                py-3

                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:px-5
              "
            >
              <div>
                <p
                  className="
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.12em]

                    text-zinc-500
                  "
                >
                  Profile Visibility
                </p>

                <p
                  className="
                    mt-1

                    text-[10px]
                    font-semibold

                    text-zinc-400

                    sm:text-xs
                  "
                >
                  Controls access to your public trainer profile.
                </p>
              </div>

              <span
                className={`
                  w-fit

                  rounded-full

                  border-2
                  border-zinc-950

                  px-3
                  py-1.5

                  text-[8px]
                  font-black
                  uppercase

                  ${
                    user.profileVisibility === "private"
                      ? "bg-zinc-200 text-zinc-700"
                      : "bg-green-100 text-green-700"
                  }
                `}
              >
                {user.profileVisibility || "public"}
              </span>
            </div>
          </section>

          {/* ===============================================
              BUDDY
          ================================================ */}

          <section
            className="
              mx-auto

              w-full
              max-w-6xl
            "
          >
            <BuddyCard
              theme={trainerTheme}
              onEdit={openEditor}
              refreshKey={buddyRefreshKey}
              onStateChange={setBuddyState}
            />
          </section>

          {/* ===============================================
              REPORTS
          ================================================ */}

          <section
            className="
              rounded-[1.7rem]

              border-4
              border-zinc-950

              bg-white

              p-4

              shadow-[6px_6px_0_#18181b]

              sm:p-6
            "
          >
            <div
              className="
                flex
                items-end
                justify-between
                gap-4

                border-b-2
                border-zinc-100

                pb-4
              "
            >
              <div>
                <p
                  className="
                    font-mono

                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.16em]
                  "
                  style={{
                    color: trainerTheme.deep,
                  }}
                >
                  PokéSocial
                </p>

                <h2
                  className="
                    mt-1

                    text-xl
                    font-black
                    uppercase
                    tracking-tight

                    sm:text-2xl
                  "
                >
                  Recent Reports
                </h2>
              </div>

              <span
                className="
                  flex
                  h-9
                  min-w-9
                  items-center
                  justify-center

                  rounded-xl

                  border-2
                  border-zinc-950

                  px-2

                  text-xs
                  font-black

                  shadow-[2px_2px_0_#18181b]
                "
                style={{
                  background: trainerTheme.glow,
                }}
              >
                {userArticles.length}
              </span>
            </div>

            {articlesLoading ? (
              <div
                className="
                  flex
                  min-h-[220px]
                  items-center
                  justify-center
                "
              >
                <div
                  className="
                    h-10
                    w-10

                    animate-spin

                    rounded-full

                    border-4
                    border-zinc-200
                  "
                  style={{
                    borderTopColor: trainerTheme.primary,
                  }}
                />
              </div>
            ) : userArticles.length > 0 ? (
              <div
                className="
                  mt-5

                  grid
                  gap-4

                  sm:grid-cols-2

                  xl:grid-cols-4
                "
              >
                {userArticles.map((article, index) => (
                  <article
                    key={article._id || article.id || index}
                    className="
                        group

                        flex
                        h-full
                        min-w-0
                        flex-col

                        overflow-hidden

                        rounded-2xl

                        border-[3px]
                        border-zinc-950

                        bg-white

                        shadow-[4px_4px_0_#18181b]

                        transition

                        hover:-translate-y-0.5
                      "
                  >
                    <div
                      className="
                          aspect-[16/10]

                          overflow-hidden

                          border-b-[3px]
                          border-zinc-950
                        "
                    >
                      <ArticleImage article={article} />
                    </div>

                    <div
                      className="
                          flex
                          flex-1
                          flex-col

                          p-4
                        "
                    >
                      <span
                        className="
                            font-mono

                            text-[7px]
                            font-bold
                            uppercase
                            tracking-[0.1em]

                            text-zinc-400
                          "
                      >
                        {getRelativeTime(article.createdAt)}
                      </span>

                      <h3
                        className="
                            mt-2

                            line-clamp-2

                            text-base
                            font-black
                            uppercase
                            tracking-tight
                          "
                      >
                        {article.title}
                      </h3>

                      {article.desc && (
                        <p
                          className="
                              mt-2

                              line-clamp-3
                              whitespace-pre-wrap

                              text-xs
                              font-medium
                              leading-5

                              text-zinc-500
                            "
                        >
                          {article.desc}
                        </p>
                      )}

                      <div
                        className="
                            mt-auto

                            pt-4
                          "
                      >
                        <Button
                          to={
                            article.name
                              ? `/articles/${article.name}`
                              : "/articles"
                          }
                          variant="secondary"
                          size="sm"
                          className="
                              w-full
                            "
                        >
                          View Report
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div
                className="
                  mt-5

                  flex
                  min-h-[200px]
                  flex-col
                  items-center
                  justify-center

                  rounded-2xl

                  border-2
                  border-dashed
                  border-zinc-300

                  bg-zinc-50

                  px-5

                  text-center
                "
              >
                <span
                  className="
                    text-4xl
                    font-black

                    text-zinc-300
                  "
                >
                  R
                </span>

                <h3
                  className="
                    mt-3

                    text-lg
                    font-black
                    uppercase
                  "
                >
                  No Reports Yet
                </h3>

                <p
                  className="
                    mt-2
                    max-w-sm

                    text-xs
                    font-medium
                    leading-5

                    text-zinc-500
                  "
                >
                  Reports published to PokéSocial appear here.
                </p>

                <Button
                  to="/articles"
                  variant="primary"
                  size="sm"
                  className="
                    mt-4
                  "
                >
                  Open PokéSocial
                </Button>
              </div>
            )}
          </section>
        </main>
      )}

      {/* ===================================================
          EDIT PROFILE MODAL
      ==================================================== */}

      {editing && (
        <div
          className="
            fixed
            inset-0
            z-[150]

            flex
            items-end
            justify-center

            bg-black/70

            backdrop-blur-sm

            sm:items-center
            sm:p-5
          "
        >
          <div
            className="
              max-h-[92dvh]
              w-full

              overflow-y-auto

              rounded-t-[2rem]

              border-4
              border-zinc-950

              bg-white

              shadow-2xl

              sm:max-w-xl
              sm:rounded-[2rem]
            "
          >
            {/* HEADER */}

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

                px-5
                py-4

                text-white
              "
              style={{
                background: trainerTheme.primary,
              }}
            >
              <div>
                <p
                  className="
                    font-mono

                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.15em]

                    text-white/65
                  "
                >
                  Trainer Settings
                </p>

                <h2
                  className="
                    text-xl
                    font-black
                    uppercase
                  "
                >
                  Edit Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center

                  rounded-xl

                  border-2
                  border-zinc-950

                  bg-white

                  text-lg
                  font-black

                  text-zinc-950
                "
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={saveProfile}
              className="
                space-y-5

                p-5

                sm:p-6
              "
            >
              {/* =================================================
                  BIO
              ================================================== */}

              <div>
                <div
                  className="
                    overflow-hidden

                    rounded-2xl

                    border-[3px]
                    border-zinc-950

                    bg-white

                    shadow-[3px_3px_0_#18181b]

                    transition

                    focus-within:-translate-y-0.5
                    focus-within:shadow-[4px_4px_0_#18181b]
                  "
                >
                  {/* THEMED ACCENT */}

                  <div
                    className="
                      h-1.5
                      w-full
                    "
                    style={{
                      background: trainerTheme.primary,
                    }}
                  />

                  {/* LABEL + COUNT */}

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3

                      border-b-2
                      border-zinc-200

                      bg-zinc-50

                      px-4
                      py-3
                    "
                  >
                    <label
                      htmlFor="bio"
                      className="
                        font-sans

                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.08em]

                        text-zinc-900

                        sm:text-xs
                      "
                    >
                      Trainer Bio
                    </label>

                    <span
                      className={`
                        font-sans

                        text-[10px]
                        font-bold
                        tracking-normal

                        ${
                          profileForm.bio.length >= 145
                            ? "text-red-600"
                            : "text-zinc-400"
                        }
                      `}
                    >
                      {profileForm.bio.length}
                      /160
                    </span>
                  </div>

                  {/* TEXTAREA */}

                  <textarea
                    id="bio"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    maxLength={160}
                    rows={5}
                    placeholder={`Water-type trainer.\nExplorer from Kanto.\n\nAlways looking for battles!`}
                    className="
                      block

                      min-h-[132px]
                      w-full
                      resize-y

                      border-0

                      bg-white

                      px-4
                      py-4

                      font-sans

                      text-sm
                      font-medium
                      leading-6

                      tracking-normal

                      text-zinc-900

                      outline-none

                      placeholder:font-normal
                      placeholder:text-zinc-400

                      sm:text-[15px]
                      sm:leading-7
                    "
                  />

                  {/* NOTE */}

                  <div
                    className="
                      border-t-2
                      border-zinc-100

                      bg-zinc-50

                      px-4
                      py-2.5
                    "
                  >
                    <p
                      className="
                        font-sans

                        text-[10px]
                        font-medium
                        leading-4

                        tracking-normal

                        text-zinc-400
                      "
                    >
                      Line breaks are preserved.
                    </p>
                  </div>
                </div>
              </div>

              {/* REGION */}

              <div>
                <label
                  htmlFor="region"
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-wide
                  "
                >
                  Region
                </label>

                <input
                  id="region"
                  name="region"
                  value={profileForm.region}
                  onChange={handleProfileChange}
                  maxLength={30}
                  placeholder="Kanto, Johto, Hoenn..."
                  className="
                    mt-2

                    min-h-12
                    w-full

                    rounded-xl

                    border-2
                    border-zinc-300

                    bg-zinc-50

                    px-4

                    text-sm
                    font-bold

                    outline-none

                    focus:border-zinc-950
                  "
                />
              </div>

              {/* BUDDY */}

              <div>
                <label
                  htmlFor="buddyPokemon"
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-wide
                  "
                >
                  Buddy Pokémon
                </label>

                <input
                  id="buddyPokemon"
                  name="buddyPokemon"
                  value={profileForm.buddyPokemon}
                  onChange={handleProfileChange}
                  placeholder="Pikachu or 25"
                  className="
                    mt-2

                    min-h-12
                    w-full

                    rounded-xl

                    border-2
                    border-zinc-300

                    bg-zinc-50

                    px-4

                    text-sm
                    font-bold

                    outline-none

                    focus:border-zinc-950
                  "
                />

                <p
                  className="
                    mt-2

                    text-[10px]
                    font-medium
                    leading-5

                    text-zinc-400
                  "
                >
                  Changing Buddy resets affection, pet count, energy, and play
                  stats. Berry inventory stays with your trainer.
                </p>
              </div>

              {/* FAVORITE TYPE */}

              <div>
                <label
                  htmlFor="favoriteType"
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-wide
                  "
                >
                  Favorite Type
                </label>

                <select
                  id="favoriteType"
                  name="favoriteType"
                  value={profileForm.favoriteType}
                  onChange={handleProfileChange}
                  className="
                    mt-2

                    min-h-12
                    w-full

                    rounded-xl

                    border-2
                    border-zinc-300

                    bg-zinc-50

                    px-4

                    text-sm
                    font-bold
                    capitalize

                    outline-none

                    focus:border-zinc-950
                  "
                >
                  <option value="">None selected</option>

                  {POKEMON_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {formatPokemonName(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* VISIBILITY */}

              <div>
                <label
                  htmlFor="profileVisibility"
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-wide
                  "
                >
                  Profile Visibility
                </label>

                <select
                  id="profileVisibility"
                  name="profileVisibility"
                  value={profileForm.profileVisibility}
                  onChange={handleProfileChange}
                  className="
                    mt-2

                    min-h-12
                    w-full

                    rounded-xl

                    border-2
                    border-zinc-300

                    bg-zinc-50

                    px-4

                    text-sm
                    font-bold

                    outline-none

                    focus:border-zinc-950
                  "
                >
                  <option value="public">Public</option>

                  <option value="private">Private</option>
                </select>
              </div>

              {/* ERROR */}

              {editError && (
                <div
                  className="
                    rounded-xl

                    border-2
                    border-red-200

                    bg-red-50

                    p-3

                    text-sm
                    font-bold

                    text-red-700
                  "
                >
                  {editError}
                </div>
              )}

              {/* SUCCESS */}

              {editSuccess && (
                <div
                  className="
                    rounded-xl

                    border-2
                    border-green-200

                    bg-green-50

                    p-3

                    text-sm
                    font-bold

                    text-green-700
                  "
                >
                  {editSuccess}
                </div>
              )}

              {/* ACTIONS */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3

                  border-t-2
                  border-zinc-100

                  pt-5
                "
              >
                <Button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  variant="primary"
                  size="md"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          SOCIAL MODAL
      ==================================================== */}

      {socialModal && (
        <div
          className="
            fixed
            inset-0
            z-[140]

            flex
            items-center
            justify-center

            bg-black/70

            p-4

            backdrop-blur-sm
          "
          onClick={() => setSocialModal(null)}
        >
          <div
            className="
              w-full
              max-w-md

              overflow-hidden

              rounded-[1.7rem]

              border-4
              border-zinc-950

              bg-white

              shadow-2xl
            "
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              className="
                flex
                items-center
                justify-between

                border-b-4
                border-zinc-950

                px-5
                py-4

                text-white
              "
              style={{
                background: trainerTheme.primary,
              }}
            >
              <div>
                <p
                  className="
                    font-mono

                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.15em]

                    text-white/60
                  "
                >
                  PokéSocial
                </p>

                <h2
                  className="
                    text-xl
                    font-black
                    uppercase
                  "
                >
                  {socialModal === "followers" ? "Followers" : "Following"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSocialModal(null)}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center

                  rounded-lg

                  border-2
                  border-zinc-950

                  bg-white

                  text-lg
                  font-black

                  text-zinc-950
                "
              >
                ×
              </button>
            </div>

            {/* SOCIAL CONTENT */}

            <div
              className="
                max-h-[60dvh]

                overflow-y-auto

                p-4
              "
            >
              {socialLoading ? (
                <div
                  className="
                    flex
                    min-h-48
                    items-center
                    justify-center
                  "
                >
                  <div
                    className="
                      h-9
                      w-9

                      animate-spin

                      rounded-full

                      border-4
                      border-zinc-200
                      border-t-zinc-950
                    "
                  />
                </div>
              ) : socialList.length > 0 ? (
                <div
                  className="
                    space-y-3
                  "
                >
                  {socialList.map((trainer) => (
                    <div
                      key={trainer._id || trainer.id}
                      className="
                          flex
                          items-center
                          gap-3

                          rounded-xl

                          border-2
                          border-zinc-200

                          bg-zinc-50

                          p-3
                        "
                    >
                      <div
                        className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center

                            rounded-full

                            border-2
                            border-zinc-950

                            text-sm
                            font-black
                            uppercase
                          "
                        style={{
                          background: trainerTheme.glow,
                        }}
                      >
                        {trainer.username?.charAt(0).toUpperCase()}
                      </div>

                      <div
                        className="
                            min-w-0
                            flex-1
                          "
                      >
                        <p
                          className="
                              truncate

                              text-sm
                              font-black
                            "
                        >
                          {trainer.username}
                        </p>

                        <div
                          className="
                              mt-1

                              flex
                              flex-wrap
                              gap-2
                            "
                        >
                          {trainer.favoriteType && (
                            <span
                              className={`
                                  rounded-md

                                  px-2
                                  py-0.5

                                  text-[7px]
                                  font-black
                                  uppercase

                                  ${
                                    getPokemonTypeStyles(trainer.favoriteType)
                                      .badge
                                  }
                                `}
                            >
                              {trainer.favoriteType}
                            </span>
                          )}

                          {trainer.region && (
                            <span
                              className="
                                  text-[8px]
                                  font-bold

                                  text-zinc-400
                                "
                            >
                              {trainer.region}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="
                    flex
                    min-h-48
                    flex-col
                    items-center
                    justify-center

                    text-center
                  "
                >
                  <p
                    className="
                      text-lg
                      font-black
                      uppercase
                    "
                  >
                    No Trainers Yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutPage;
