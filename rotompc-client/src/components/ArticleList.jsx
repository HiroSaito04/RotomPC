// rotompc-client/src/components/ArticleList.jsx

import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import Button from "@/components/Button";

import * as articleService from "@/services/ArticleService";

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
  if (article?.userId && typeof article.userId === "object") {
    return article.userId._id || article.userId.id || null;
  }

  return article?.userId || null;
};

/* =========================================================
   IMAGE
========================================================= */

const ArticleImage = ({ article, getImage }) => {
  const [failed, setFailed] = useState(false);

  const imageSource = getImage
    ? getImage(article)
    : article?.image || article?.imageFallbackUrl || FALLBACK_IMAGE;

  useEffect(() => {
    setFailed(false);
  }, [article?._id, imageSource]);

  return (
    <div
      className="
        relative
        aspect-[16/10]
        overflow-hidden
        border-b-[3px]
        border-zinc-950
        bg-zinc-200
      "
    >
      {!failed ? (
        <img
          src={imageSource || FALLBACK_IMAGE}
          alt={article?.title || "PokéSocial report"}
          loading="lazy"
          onError={() => setFailed(true)}
          className="
            h-full
            w-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-[1.04]
          "
        />
      ) : (
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
              text-4xl
              font-black
            "
          >
            R
          </span>

          <span
            className="
              mt-2
              text-[8px]
              font-black
              uppercase
              tracking-[0.14em]
            "
          >
            Report Image
          </span>
        </div>
      )}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-t
          from-black/20
          via-transparent
          to-transparent
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.06]
          bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.35)_50%)]
          bg-[length:100%_4px]
        "
      />
    </div>
  );
};

/* =========================================================
   ARTICLE LIST
========================================================= */

const ArticleList = ({ articles = [], getImage, onArticleUpdate }) => {
  const navigate = useNavigate();

  const [visibleArticles, setVisibleArticles] = useState([]);

  const [interactions, setInteractions] = useState({});

  const [pendingArticleId, setPendingArticleId] = useState(null);

  const [feedback, setFeedback] = useState({});

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token")),
  );

  const [currentUserId, setCurrentUserId] = useState(
    localStorage.getItem("id"),
  );

  /* =======================================================
     AUTH
  ======================================================= */

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("token")));

      setCurrentUserId(localStorage.getItem("id"));
    };

    window.addEventListener("storage", syncAuth);

    window.addEventListener("local-auth-update", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);

      window.removeEventListener("local-auth-update", syncAuth);
    };
  }, []);

  /* =======================================================
     ARTICLE SYNC
  ======================================================= */

  useEffect(() => {
    const list = Array.isArray(articles) ? articles : [];

    setVisibleArticles(list);

    setInteractions((current) => {
      const next = {
        ...current,
      };

      list.forEach((article) => {
        if (!article?._id) {
          return;
        }

        const old = current[article._id];

        next[article._id] = {
          liked: old?.liked ?? Boolean(article.liked),

          likesCount: old?.likesCount ?? getLikesCount(article),
        };
      });

      return next;
    });
  }, [articles]);

  const visibleArticleIds = useMemo(
    () => visibleArticles.map((article) => article?._id).filter(Boolean),
    [visibleArticles],
  );

  const visibleArticleKey = visibleArticleIds.join(",");

  /* =======================================================
     LIKE STATUS
  ======================================================= */

  useEffect(() => {
    if (!isAuthenticated || visibleArticleIds.length === 0) {
      return undefined;
    }

    let cancelled = false;

    const loadStatuses = async () => {
      const results = await Promise.allSettled(
        visibleArticleIds.map(async (articleId) => {
          const response = await articleService.getArticleLikeStatus(articleId);

          return {
            articleId,

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

        updates[result.value.articleId] = {
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
  }, [isAuthenticated, visibleArticleKey]);

  /* =======================================================
     TIME
  ======================================================= */

  const getRelativeTime = (value) => {
    if (!value) {
      return "RECENT";
    }

    try {
      const dateValue =
        typeof value === "object" && value.$date ? value.$date : value;

      const created = new Date(dateValue);

      if (Number.isNaN(created.getTime())) {
        return "RECENT";
      }

      const seconds = Math.max(
        0,
        Math.floor((Date.now() - created.getTime()) / 1000),
      );

      if (seconds < 60) {
        return "JUST NOW";
      }

      const intervals = [
        ["year", 31536000],
        ["month", 2592000],
        ["week", 604800],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
      ];

      for (const [label, amount] of intervals) {
        const count = Math.floor(seconds / amount);

        if (count >= 1) {
          return new Intl.RelativeTimeFormat("en", {
            numeric: "always",
          })
            .format(-count, label)
            .toUpperCase();
        }
      }

      return "JUST NOW";
    } catch {
      return "RECENT";
    }
  };

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
    }, 2000);
  };

  /* =======================================================
     LIKE
  ======================================================= */

  const handleLikeToggle = async (article) => {
    if (!article?._id) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth/signin");

      return;
    }

    const ownerId = getOwnerId(article);

    if (ownerId && currentUserId && String(ownerId) === String(currentUserId)) {
      showFeedback(article._id, "You cannot like your own report", "error");

      return;
    }

    if (pendingArticleId === article._id) {
      return;
    }

    const currentState = interactions[article._id] || {
      liked: Boolean(article.liked),

      likesCount: getLikesCount(article),
    };

    setPendingArticleId(article._id);

    try {
      const response = currentState.liked
        ? await articleService.unlikeArticle(article._id)
        : await articleService.likeArticle(article._id);

      const nextState = {
        liked: Boolean(response.data?.liked),

        likesCount: Number(response.data?.likesCount) || 0,
      };

      setInteractions((current) => ({
        ...current,

        [article._id]: nextState,
      }));

      setVisibleArticles((current) =>
        current.map((item) =>
          String(item._id) === String(article._id)
            ? {
                ...item,
                ...nextState,
              }
            : item,
        ),
      );

      if (typeof onArticleUpdate === "function") {
        onArticleUpdate(article._id, nextState);
      }

      const berryReward = Number(response.data?.berryReward) || 0;

      if (berryReward > 0) {
        showFeedback(article._id, `+${berryReward} Berry`, "reward");
      } else {
        showFeedback(
          article._id,
          nextState.liked ? "Report liked" : "Like removed",
        );
      }
    } catch (error) {
      console.error("Unable to update like:", error);

      showFeedback(
        article._id,
        error.response?.data?.message || "Unable to update like",
        "error",
      );
    } finally {
      setPendingArticleId(null);
    }
  };

  if (visibleArticles.length === 0) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-6
        md:grid-cols-2
        xl:grid-cols-4
      "
    >
      {visibleArticles.map((article, index) => {
        if (!article) {
          return null;
        }

        const articleKey = article._id || article.id || article.name || index;

        const routeName = article.name || article._id || article.id;

        const interaction = interactions[article._id] || {
          liked: Boolean(article.liked),

          likesCount: getLikesCount(article),
        };

        const isPending = pendingArticleId === article._id;

        const ownerId = getOwnerId(article);

        const isOwnArticle = Boolean(
          ownerId && currentUserId && String(ownerId) === String(currentUserId),
        );

        const articleFeedback = feedback[article._id];

        return (
          <article
            key={articleKey}
            className="
                group
                relative
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
            <div
              className="
                  flex
                  h-3
                  items-center
                  gap-1
                  border-b-2
                  border-zinc-950
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

            <div
              className="
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3.5
                "
            >
              <div
                className={`
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border-2
                    border-zinc-950
                    ${article.color || "bg-zinc-500"}
                    text-xs
                    font-black
                    uppercase
                    text-white
                    shadow-[2px_2px_0_#18181b]
                  `}
              >
                {article.author ? article.author.charAt(0).toUpperCase() : "?"}
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
                      truncate
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
            </div>

            <ArticleImage article={article} getImage={getImage} />

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
                      max-w-[65%]
                      truncate
                      rounded-lg
                      border-2
                      border-zinc-950
                      ${article.color || "bg-zinc-500"}
                      px-2
                      py-1
                      text-[7px]
                      font-black
                      uppercase
                      tracking-[0.08em]
                      text-white
                      shadow-[2px_2px_0_#18181b]
                    `}
                >
                  {article.date || "RECENT"}
                </span>

                <span
                  className={`
                      shrink-0
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
                    text-lg
                    font-black
                    uppercase
                    leading-[1.05]
                    tracking-[-0.025em]
                    text-zinc-950
                    sm:text-xl
                  "
              >
                {article.title}
              </h3>

              {article.desc && (
                <p
                  className="
                      mt-2.5
                      line-clamp-3
                      text-[13px]
                      font-medium
                      leading-5
                      text-zinc-500
                    "
                >
                  {article.desc}
                </p>
              )}

              {articleFeedback && (
                <div
                  className={`
                      mt-4
                      rounded-lg
                      border-2
                      px-3
                      py-2
                      text-center
                      text-[9px]
                      font-black
                      uppercase
                      ${
                        articleFeedback.type === "reward"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : articleFeedback.type === "error"
                            ? "border-red-600 bg-red-50 text-red-700"
                            : "border-zinc-300 bg-zinc-50 text-zinc-600"
                      }
                    `}
                >
                  {articleFeedback.message}
                </div>
              )}

              <div
                className="
                    mt-auto
                    grid
                    grid-cols-[minmax(0,1fr)_44px]
                    gap-2.5
                    pt-5
                  "
              >
                <Button
                  to={routeName ? `/articles/${routeName}` : "/articles"}
                  variant="secondary"
                  size="md"
                  className="
                      w-full
                      !justify-center
                      font-black
                    "
                >
                  View Post
                </Button>

                <Button
                  type="button"
                  onClick={() => handleLikeToggle(article)}
                  disabled={isPending || isOwnArticle}
                  variant="secondary"
                  size="md"
                  aria-label={
                    interaction.liked ? "Unlike report" : "Like report"
                  }
                  className={`
                      !flex
                      !h-[42px]
                      !w-[44px]
                      !items-center
                      !justify-center
                      !px-0
                      !text-lg
                      ${
                        interaction.liked
                          ? "!bg-red-500 !text-white hover:!bg-red-600"
                          : "!bg-red-50 !text-red-500 hover:!bg-red-100"
                      }
                      disabled:opacity-50
                    `}
                >
                  {isPending ? "…" : interaction.liked ? "♥" : "♡"}
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default ArticleList;
