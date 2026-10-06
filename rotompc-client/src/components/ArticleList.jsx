// filepath: rotompc-client/src/components/ArticleList.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import TrainerProfilePicture from "@/components/profile/TrainerProfilePicture";
import TrainerProfileModal from "@/components/social/TrainerProfileModal";

import * as articleService from "@/services/ArticleService";

/* =========================================================
   CONFIG
========================================================= */

const FALLBACK_IMAGE =
  "https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png";

/* =========================================================
   HELPERS
========================================================= */

const getLikesCount = (article) => {
  if (typeof article?.likesCount === "number") {
    return article.likesCount;
  }

  if (Array.isArray(article?.likes)) {
    return article.likes.length;
  }

  if (typeof article?.likes === "number") {
    return article.likes;
  }

  return 0;
};

const getOwnerId = (article) => {
  if (!article?.userId) {
    return "";
  }

  if (typeof article.userId === "object") {
    return article.userId._id || article.userId.id || "";
  }

  return article.userId;
};

const getRelativeTime = (value) => {
  const raw = value?.$date || value;

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "RECENT";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) {
    return "JUST NOW";
  }

  const units = [
    ["YEAR", 31536000],
    ["MONTH", 2592000],
    ["WEEK", 604800],
    ["DAY", 86400],
    ["HOUR", 3600],
    ["MIN", 60],
  ];

  for (const [label, amount] of units) {
    if (seconds >= amount) {
      const total = Math.floor(seconds / amount);

      return `${total} ${label}${total === 1 ? "" : "S"} AGO`;
    }
  }

  return "RECENT";
};

/* =========================================================
   ARTICLE IMAGE

   IMPORTANT:
   - Outer image box keeps the existing 16 / 10 size.
   - Original image ratio is preserved.
   - Images are never cropped.
   - Empty space is intentional.
   - Image has an inset border with padding.
========================================================= */

const ArticleImage = ({ article, getImage }) => {
  const [failed, setFailed] = useState(false);

  const imageSource = getImage
    ? getImage(article)
    : article?.imageUrl || article?.image || FALLBACK_IMAGE;

  useEffect(() => {
    setFailed(false);
  }, [imageSource, article?._id]);

  return (
    <div
      className="
        relative
        aspect-[16/10]
        overflow-hidden
        border-b-[3px]
        border-zinc-950
        bg-zinc-200
        p-3
      "
    >
      <div
        className="
          relative
          h-full
          w-full
          overflow-hidden
          rounded-xl
          border-[3px]
          border-zinc-950
          bg-white
          p-2
          shadow-[3px_3px_0_rgba(24,24,27,0.18)]
        "
      >
        {!failed ? (
          <img
            src={imageSource || FALLBACK_IMAGE}
            alt={article?.title || "PokéSocial report"}
            loading="lazy"
            onError={() => setFailed(true)}
            className="
              block
              h-full
              w-full
              object-contain
              object-center
              transition-transform
              duration-500
              group-hover:scale-[1.015]
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              rounded-lg
              bg-zinc-100
              text-4xl
              font-black
              text-zinc-400
            "
          >
            R
          </div>
        )}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-2
            rounded-lg
            bg-gradient-to-t
            from-black/[0.04]
            via-transparent
            to-white/[0.04]
          "
        />
      </div>
    </div>
  );
};

/* =========================================================
   ARTICLE LIST
========================================================= */

const ArticleList = ({ articles = [], getImage, onArticleUpdate }) => {
  const navigate = useNavigate();

  const [interactions, setInteractions] = useState({});

  const [pendingArticleId, setPendingArticleId] = useState("");

  const [feedback, setFeedback] = useState({});

  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );

  const currentUserId = localStorage.getItem("id");

  /* =======================================================
     AUTH SYNC
  ======================================================= */

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("storage", syncAuth);

    window.addEventListener("local-auth-update", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);

      window.removeEventListener("local-auth-update", syncAuth);
    };
  }, []);

  /* =======================================================
     SYNC BASIC COUNTS
  ======================================================= */

  useEffect(() => {
    setInteractions((current) => {
      const next = {
        ...current,
      };

      articles.forEach((article) => {
        if (!article?._id) {
          return;
        }

        const existing = current[article._id];

        next[article._id] = {
          liked: existing?.liked ?? Boolean(article.liked),

          likesCount: existing?.likesCount ?? getLikesCount(article),
        };
      });

      return next;
    });
  }, [articles]);

  /* =======================================================
     VISIBLE ARTICLE IDS
  ======================================================= */

  const ids = useMemo(
    () => articles.map((article) => article?._id).filter(Boolean),
    [articles],
  );

  const idsKey = ids.join(",");

  /* =======================================================
     LOAD LIKE STATUS
  ======================================================= */

  useEffect(() => {
    if (!isAuthenticated || ids.length === 0) {
      return undefined;
    }

    let cancelled = false;

    const loadStatuses = async () => {
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const response = await articleService.getArticleLikeStatus(id);

          return {
            id,

            liked: Boolean(response.data?.liked),

            likesCount: Number(response.data?.likesCount) || 0,
          };
        }),
      );

      if (cancelled) {
        return;
      }

      const updates = {};

      results.forEach((result) => {
        if (result.status !== "fulfilled") {
          return;
        }

        updates[result.value.id] = {
          liked: result.value.liked,

          likesCount: result.value.likesCount,
        };
      });

      setInteractions((current) => ({
        ...current,
        ...updates,
      }));
    };

    loadStatuses();

    return () => {
      cancelled = true;
    };
  }, [idsKey, isAuthenticated]);

  /* =======================================================
     FEEDBACK
  ======================================================= */

  const showFeedback = (articleId, message, type = "normal") => {
    setFeedback((current) => ({
      ...current,

      [articleId]: {
        message,
        type,
      },
    }));

    window.setTimeout(() => {
      setFeedback((current) => {
        const next = {
          ...current,
        };

        delete next[articleId];

        return next;
      });
    }, 2200);
  };

  /* =======================================================
     LIKE
  ======================================================= */

  const handleLike = async (event, article) => {
    event.stopPropagation();

    const articleId = article?._id;

    if (!articleId || pendingArticleId === articleId) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth/signin");

      return;
    }

    const ownerId = getOwnerId(article);

    if (ownerId && currentUserId && String(ownerId) === String(currentUserId)) {
      showFeedback(articleId, "You cannot like your own report.", "error");

      return;
    }

    const current = interactions[articleId] || {
      liked: false,

      likesCount: getLikesCount(article),
    };

    try {
      setPendingArticleId(articleId);

      const response = current.liked
        ? await articleService.unlikeArticle(articleId)
        : await articleService.likeArticle(articleId);

      const next = {
        liked: Boolean(response.data?.liked),

        likesCount: Number(response.data?.likesCount) || 0,
      };

      setInteractions((state) => ({
        ...state,

        [articleId]: next,
      }));

      onArticleUpdate?.(articleId, next);

      const reward = Number(response.data?.berryReward) || 0;

      if (reward > 0) {
        showFeedback(articleId, `+${reward} Berry`, "reward");
      }
    } catch (error) {
      console.error("Article like error:", error);

      showFeedback(
        articleId,
        error.response?.data?.message || "Unable to update like.",
        "error",
      );
    } finally {
      setPendingArticleId("");
    }
  };

  /* =======================================================
     TRAINER PROFILE
  ======================================================= */

  const openTrainer = (event, article) => {
    event.stopPropagation();

    const ownerId = getOwnerId(article);

    if (!ownerId) {
      return;
    }

    setSelectedTrainer({
      id: ownerId,

      username: article.author || "",
    });
  };

  /* =======================================================
     OPEN ARTICLE
  ======================================================= */

  const openArticle = (article) => {
    if (!article?.name) {
      return;
    }

    navigate(`/articles/${encodeURIComponent(article.name)}`);
  };

  /* =======================================================
     EMPTY
  ======================================================= */

  if (!Array.isArray(articles) || articles.length === 0) {
    return (
      <div
        className="
          rounded-3xl
          border-4
          border-dashed
          border-zinc-300
          bg-white
          px-6
          py-16
          text-center
        "
      >
        <p
          className="
            text-lg
            font-black
            text-zinc-950
          "
        >
          No PokéSocial reports found.
        </p>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div
        className="
          grid
          gap-5
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
        "
      >
        {articles.map((article, index) => {
          const interaction = interactions[article._id] || {
            liked: Boolean(article.liked),

            likesCount: getLikesCount(article),
          };

          const ownerId = getOwnerId(article);

          const ownArticle = Boolean(
            currentUserId &&
            ownerId &&
            String(currentUserId) === String(ownerId),
          );

          const message = feedback[article._id];

          return (
            <article
              key={article._id || article.name || index}
              className="
                group
                flex
                min-w-0
                flex-col
                overflow-hidden
                rounded-[1.7rem]
                border-[4px]
                border-zinc-950
                bg-white
                shadow-[6px_6px_0_#18181b]
                transition-all
                duration-200
                hover:-translate-y-1
                hover:shadow-[8px_8px_0_#18181b]
              "
            >
              {/* =========================================
                  HARDWARE TOP
              ========================================== */}

              <div
                className="
                  flex
                  h-3
                  items-center
                  gap-1
                  bg-zinc-950
                  px-3
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-red-500
                  "
                />

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-yellow-400
                  "
                />

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-green-500
                  "
                />
              </div>

              {/* =========================================
                  AUTHOR
              ========================================== */}

              <button
                type="button"
                disabled={!ownerId}
                onClick={(event) => openTrainer(event, article)}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  px-4
                  py-3.5
                  text-left
                  transition
                  hover:bg-yellow-50
                  disabled:cursor-default
                  disabled:hover:bg-transparent
                "
              >
                <TrainerProfilePicture
                  userId={ownerId}
                  username={article.author || ""}
                  size="sm"
                  roundedClassName="rounded-xl"
                  className="
                    shadow-[2px_2px_0_#18181b]
                  "
                  fallbackClassName={`
                    ${article.color || "bg-zinc-500"}
                    text-xs
                  `}
                />

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      truncate
                      text-[11px]
                      font-black
                      uppercase
                      text-zinc-950
                    "
                  >
                    {article.author || "Unknown Trainer"}
                  </p>

                  <p
                    className="
                      mt-1
                      text-[8px]
                      font-bold
                      uppercase
                      tracking-[0.09em]
                      text-zinc-400
                    "
                  >
                    {getRelativeTime(article.createdAt)}
                  </p>
                </div>

                {ownerId && (
                  <span
                    className="
                      text-[8px]
                      font-black
                      uppercase
                      text-[#3b4cca]
                    "
                  >
                    View
                  </span>
                )}
              </button>

              {/* =========================================
                  IMAGE
              ========================================== */}

              <ArticleImage article={article} getImage={getImage} />

              {/* =========================================
                  BODY
              ========================================== */}

              <div
                className="
                  flex
                  flex-1
                  flex-col
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-2
                  "
                >
                  <span
                    className={`
                      rounded-lg
                      border-2
                      border-zinc-950
                      ${article.color || "bg-zinc-500"}
                      px-2
                      py-1
                      text-[7px]
                      font-black
                      uppercase
                      text-white
                      shadow-[2px_2px_0_#18181b]
                    `}
                  >
                    {article.date || "RECENT"}
                  </span>

                  <span
                    className={`
                      text-[9px]
                      font-black
                      ${interaction.liked ? "text-red-500" : "text-zinc-400"}
                    `}
                  >
                    {interaction.liked ? "♥" : "♡"} {interaction.likesCount}
                  </span>
                </div>

                <h3
                  className="
                    mt-4
                    line-clamp-2
                    text-xl
                    font-black
                    uppercase
                    italic
                    leading-tight
                    text-zinc-950
                  "
                >
                  {article.title || "Untitled Report"}
                </h3>

                <p
                  className="
                    mt-2
                    line-clamp-3
                    text-sm
                    font-semibold
                    leading-5
                    text-zinc-500
                  "
                >
                  {article.desc || "Open this report to read more."}
                </p>

                <div
                  className="
                    mt-auto
                    flex
                    items-center
                    gap-2
                    pt-5
                  "
                >
                  {/* =====================================
                      OPEN REPORT
                  ====================================== */}
                  <button
                    type="button"
                    onClick={() => openArticle(article)}
                    disabled={!article.name}
                    className="
    group/open

    flex
    h-10
    min-w-0
    flex-1
    items-center
    justify-center
    gap-2.5

    rounded-xl

    border-2
    border-zinc-950

    bg-[#3b4cca]

    px-4

    font-sans
    text-[12px]
    font-extrabold
    leading-none
    tracking-[-0.01em]

    text-white

    shadow-[2px_2px_0_#18181b]

    transition-all
    duration-200

    hover:-translate-y-0.5
    hover:bg-[#3040b4]

    active:translate-x-0.5
    active:translate-y-0.5
    active:shadow-none

    disabled:cursor-not-allowed
    disabled:opacity-50
    disabled:hover:translate-y-0
  "
                  >
                    <span className="whitespace-nowrap">VIEW REPORT</span>
                  </button>
                  {/* =====================================
                      LIKE
                  ====================================== */}

                  <button
                    type="button"
                    disabled={pendingArticleId === article._id || ownArticle}
                    onClick={(event) => handleLike(event, article)}
                    aria-label={
                      ownArticle
                        ? "You cannot like your own report"
                        : interaction.liked
                          ? "Unlike report"
                          : "Like report"
                    }
                    className={`
                      flex
                      h-10
                      min-w-11
                      items-center
                      justify-center

                      rounded-xl

                      border-2
                      border-zinc-950

                      px-3

                      text-sm
                      font-black

                      shadow-[2px_2px_0_#18181b]

                      transition

                      disabled:cursor-not-allowed
                      disabled:opacity-50

                      ${
                        interaction.liked
                          ? "bg-red-500 text-white"
                          : "bg-white text-red-500"
                      }
                    `}
                  >
                    {pendingArticleId === article._id
                      ? "…"
                      : interaction.liked
                        ? "♥"
                        : "♡"}
                  </button>
                </div>

                {message && (
                  <div
                    className={`
                      mt-3

                      rounded-lg

                      border-2

                      px-3
                      py-2

                      text-center

                      text-[8px]
                      font-black
                      uppercase

                      ${
                        message.type === "reward"
                          ? "border-green-700 bg-green-50 text-green-800"
                          : message.type === "error"
                            ? "border-red-700 bg-red-50 text-red-700"
                            : "border-blue-700 bg-blue-50 text-blue-700"
                      }
                    `}
                  >
                    {message.message}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <TrainerProfileModal
        open={Boolean(selectedTrainer)}
        trainerId={selectedTrainer?.id || ""}
        username={selectedTrainer?.username || ""}
        onClose={() => setSelectedTrainer(null)}
      />
    </>
  );
};

export default ArticleList;
