// rotompc-client/src/pages/ArticlePage/ArticlePage.jsx

import React, { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Button from "@/components/Button.jsx";
import NotFoundPage from "@/pages/NotFoundPage.jsx";

import * as articleService from "@/services/ArticleService";

const FALLBACK_IMAGE =
  "https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png";

/* =========================================================
   HELPERS
========================================================= */

const getId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value._id || value.id || null;
  }

  return value;
};

/* =========================================================
   PAGE
========================================================= */

function ArticlePage() {
  const { name } = useParams();

  const navigate = useNavigate();

  const [article, setArticle] = useState(null);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [imageFailed, setImageFailed] = useState(false);

  /* =======================================================
     AUTH
  ======================================================= */

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token")),
  );

  const [currentUserId, setCurrentUserId] = useState(
    localStorage.getItem("id"),
  );

  const [currentRole, setCurrentRole] = useState(
    localStorage.getItem("role") || "",
  );

  /* =======================================================
     LIKE
  ======================================================= */

  const [liked, setLiked] = useState(false);

  const [likesCount, setLikesCount] = useState(0);

  const [likeLoading, setLikeLoading] = useState(false);

  const [interactionMessage, setInteractionMessage] = useState(null);

  /* =======================================================
     COMMENTS
  ======================================================= */

  const [comments, setComments] = useState([]);

  const [commentsLoading, setCommentsLoading] = useState(false);

  const [commentBody, setCommentBody] = useState("");

  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [commentError, setCommentError] = useState("");

  const [deletingCommentId, setDeletingCommentId] = useState(null);

  /* =======================================================
     DERIVED
  ======================================================= */

  const articleId = article?._id || null;

  const articleOwnerId = getId(article?.userId);

  const isOwnArticle = Boolean(
    currentUserId &&
    articleOwnerId &&
    String(currentUserId) === String(articleOwnerId),
  );

  /* =======================================================
     AUTH SYNC
  ======================================================= */

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("token")));

      setCurrentUserId(localStorage.getItem("id"));

      setCurrentRole(localStorage.getItem("role") || "");
    };

    window.addEventListener("storage", syncAuth);

    window.addEventListener("local-auth-update", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);

      window.removeEventListener("local-auth-update", syncAuth);
    };
  }, []);

  /* =======================================================
     IMAGE
  ======================================================= */

  const articleImage = useMemo(() => {
    if (!article) {
      return FALLBACK_IMAGE;
    }

    if (article.imageUrl) {
      return article.imageUrl;
    }

    if (article._id) {
      return articleService.getArticleImageUrl(article._id) || FALLBACK_IMAGE;
    }

    return FALLBACK_IMAGE;
  }, [article]);

  useEffect(() => {
    setImageFailed(false);
  }, [articleImage]);

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

      const createdDate = new Date(dateValue);

      if (Number.isNaN(createdDate.getTime())) {
        return "RECENT";
      }

      const secondsDelta = Math.max(
        0,
        Math.floor((Date.now() - createdDate.getTime()) / 1000),
      );

      if (secondsDelta < 60) {
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
        const count = Math.floor(secondsDelta / amount);

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
     CONTENT
  ======================================================= */

  const getFormattedContent = () => {
    if (!article?.content) {
      return [];
    }

    const paragraphs = Array.isArray(article.content)
      ? article.content.filter(Boolean).map((item) => String(item))
      : String(article.content).split(/\n{2,}/);

    return paragraphs
      .map((paragraph) => {
        const lines = paragraph.split("\n");

        const fixedLines = [];

        lines.forEach((line) => {
          const trimmed = line.trim();

          const previous = fixedLines[fixedLines.length - 1];

          const shouldAttach =
            previous &&
            trimmed.length > 0 &&
            trimmed.length <= 45 &&
            !/^[•\-*0-9]/.test(trimmed) &&
            !/[.!?]"?$/.test(previous.trim());

          if (shouldAttach) {
            fixedLines[fixedLines.length - 1] = `${previous} ${trimmed}`;
          } else {
            fixedLines.push(line);
          }
        });

        return fixedLines.join("\n");
      })
      .filter(Boolean);
  };

  /* =======================================================
     LOAD ARTICLE
  ======================================================= */

  useEffect(() => {
    if (!name) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadArticle = async () => {
      try {
        setLoading(true);

        setLoadError("");

        const response = await articleService.fetchArticleByName(name);

        if (cancelled) {
          return;
        }

        const loaded = response.data;

        setArticle(loaded);

        setLiked(Boolean(loaded?.liked));

        setLikesCount(Number(loaded?.likesCount) || 0);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Unable to load article:", error);

        setArticle(null);

        setLoadError(error.response?.data?.message || "Unable to load report.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [name]);

  /* =======================================================
     LIKE STATUS
  ======================================================= */

  useEffect(() => {
    if (!articleId || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    const loadLikeStatus = async () => {
      try {
        const response = await articleService.getArticleLikeStatus(articleId);

        if (cancelled) {
          return;
        }

        setLiked(Boolean(response.data?.liked));

        setLikesCount(Number(response.data?.likesCount) || 0);
      } catch (error) {
        console.error("Unable to load like status:", error);
      }
    };

    loadLikeStatus();

    return () => {
      cancelled = true;
    };
  }, [articleId, isAuthenticated]);

  /* =======================================================
     COMMENTS LOAD
  ======================================================= */

  useEffect(() => {
    if (!articleId) {
      return;
    }

    let cancelled = false;

    const loadComments = async () => {
      try {
        setCommentsLoading(true);

        setCommentError("");

        const response = await articleService.fetchArticleComments(articleId);

        if (cancelled) {
          return;
        }

        setComments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Unable to load comments:", error);

        setCommentError(
          error.response?.data?.message || "Unable to load comments.",
        );
      } finally {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  /* =======================================================
     HASH
  ======================================================= */

  useEffect(() => {
    if (article && window.location.hash === "#comments") {
      window.setTimeout(() => {
        document.getElementById("comments")?.scrollIntoView({
          behavior: "smooth",

          block: "start",
        });
      }, 150);
    }
  }, [article]);

  /* =======================================================
     LIKE
  ======================================================= */

  const showInteractionMessage = (message, type = "normal") => {
    setInteractionMessage({
      message,
      type,
    });

    window.setTimeout(() => setInteractionMessage(null), 2200);
  };

  const handleLike = async () => {
    if (!articleId || likeLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth/signin");

      return;
    }

    if (isOwnArticle) {
      showInteractionMessage("You cannot like your own report.", "error");

      return;
    }

    try {
      setLikeLoading(true);

      const response = liked
        ? await articleService.unlikeArticle(articleId)
        : await articleService.likeArticle(articleId);

      const nextLiked = Boolean(response.data?.liked);

      const nextCount = Number(response.data?.likesCount) || 0;

      setLiked(nextLiked);

      setLikesCount(nextCount);

      const reward = Number(response.data?.berryReward) || 0;

      showInteractionMessage(
        reward > 0
          ? `+${reward} Berry`
          : nextLiked
            ? "Report liked"
            : "Like removed",
        reward > 0 ? "reward" : "normal",
      );
    } catch (error) {
      showInteractionMessage(
        error.response?.data?.message || "Unable to update like.",
        "error",
      );
    } finally {
      setLikeLoading(false);
    }
  };

  /* =======================================================
     CREATE COMMENT
  ======================================================= */

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/auth/signin");

      return;
    }

    const body = commentBody.trim();

    if (!body) {
      setCommentError("Write a comment first.");

      return;
    }

    if (body.length > 500) {
      setCommentError("Comments are limited to 500 characters.");

      return;
    }

    try {
      setCommentSubmitting(true);

      setCommentError("");

      const response = await articleService.createArticleComment(
        articleId,
        body,
      );

      setComments((current) => [...current, response.data]);

      setCommentBody("");
    } catch (error) {
      setCommentError(
        error.response?.data?.message || "Unable to post comment.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  /* =======================================================
     DELETE COMMENT
  ======================================================= */

  const handleDeleteComment = async (comment) => {
    if (!comment?._id || deletingCommentId) {
      return;
    }

    try {
      setDeletingCommentId(comment._id);

      setCommentError("");

      await articleService.deleteArticleComment(articleId, comment._id);

      setComments((current) =>
        current.filter((item) => String(item._id) !== String(comment._id)),
      );
    } catch (error) {
      setCommentError(
        error.response?.data?.message || "Unable to delete comment.",
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#f8fafc]
        "
      >
        <div
          className="
            rounded-3xl
            border-4
            border-zinc-900
            bg-white
            px-8
            py-6
            shadow-[8px_8px_0_#18181b]
          "
        >
          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-zinc-200
              border-t-[#3b4cca]
            "
          />

          <p
            className="
              mt-4
              text-[10px]
              font-black
              uppercase
              tracking-widest
              text-zinc-500
            "
          >
            Loading Report
          </p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div
        className="
          flex
          min-h-screen
          flex-col
          items-center
          justify-center
          bg-[#f8fafc]
        "
      >
        {loadError && (
          <p
            className="
              mb-6
              rounded-xl
              border-2
              border-red-500
              bg-red-50
              px-4
              py-3
              font-bold
              text-red-700
            "
          >
            {loadError}
          </p>
        )}

        <Button to="/articles" variant="secondary" size="md">
          ← Back to PokéSocial
        </Button>

        <NotFoundPage />
      </div>
    );
  }

  const formattedContent = getFormattedContent();

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        min-h-screen
        bg-[#eef1f6]
        font-sans
      "
    >
      <main
        className="
          mx-auto
          max-w-6xl
          px-4
          pb-16
          pt-8
          sm:px-6
          sm:pt-10
          lg:px-8
        "
      >
        <div
          className="
            mb-8
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <Button to="/articles" variant="secondary" size="sm">
            ← Social Feed
          </Button>

          <div
            className="
              flex
              gap-2
            "
          >
            <span
              className="
                rounded-full
                border-2
                border-zinc-900
                bg-red-50
                px-3
                py-2
                text-[10px]
                font-black
                text-red-500
                shadow-[3px_3px_0_#18181b]
              "
            >
              ♥ {likesCount}
            </span>

            <span
              className="
                rounded-full
                border-2
                border-zinc-900
                bg-blue-50
                px-3
                py-2
                text-[10px]
                font-black
                text-[#3b4cca]
                shadow-[3px_3px_0_#18181b]
              "
            >
              💬 {comments.length}
            </span>
          </div>
        </div>

        <article
          className="
            clearfix
          "
        >
          {/* IMAGE / TITLE */}

          <div
            className="
              mb-8
              lg:float-left
              lg:mr-8
              lg:w-[56%]
            "
          >
            <div
              className="
                overflow-hidden
                rounded-[2rem]
                border-4
                border-zinc-900
                bg-white
                shadow-[12px_12px_0_#18181b]
              "
            >
              <div
                className="
                  relative
                  aspect-video
                  overflow-hidden
                  border-b-4
                  border-zinc-900
                  bg-zinc-900
                "
              >
                <img
                  src={imageFailed ? FALLBACK_IMAGE : articleImage}
                  alt={article.title}
                  onError={() => setImageFailed(true)}
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black/25
                    via-transparent
                    to-transparent
                  "
                />
              </div>

              <div
                className="
                  p-6
                  sm:p-8
                "
              >
                <div
                  className="
                    mb-5
                    flex
                    flex-wrap
                    gap-3
                  "
                >
                  <span
                    className={`
                      rounded-lg
                      border-2
                      border-zinc-900
                      ${article.color || "bg-zinc-500"}
                      px-3
                      py-1
                      text-[10px]
                      font-black
                      uppercase
                      text-white
                    `}
                  >
                    {article.date || "RECENT"}
                  </span>
                </div>

                <h1
                  className="
                    text-4xl
                    font-black
                    uppercase
                    italic
                    leading-[0.9]
                    tracking-tighter
                    text-zinc-900
                    sm:text-5xl
                    lg:text-6xl
                  "
                >
                  {article.title}
                </h1>

                {article.desc && (
                  <div
                    className="
                      mt-6
                      rounded-2xl
                      border-4
                      border-zinc-900
                      bg-zinc-50
                      p-5
                      shadow-[5px_5px_0_#18181b]
                    "
                  >
                    <p
                      className="
                        text-base
                        font-bold
                        italic
                        leading-relaxed
                        text-zinc-700
                      "
                    >
                      “{article.desc}”
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div
            className="
              space-y-6
            "
          >
            <div
              className="
                rounded-[1.8rem]
                border-4
                border-zinc-900
                bg-[#ffcb05]
                p-5
                shadow-[8px_8px_0_#18181b]
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-4
                  "
                >
                  <div
                    className="
                      flex
                      h-14
                      w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      border-2
                      border-zinc-900
                      bg-white
                      text-xl
                      font-black
                      shadow-[3px_3px_0_#000]
                    "
                  >
                    {article.author
                      ? article.author.charAt(0).toUpperCase()
                      : "?"}
                  </div>

                  <div
                    className="
                      min-w-0
                    "
                  >
                    <p
                      className="
                        text-[9px]
                        font-black
                        uppercase
                        tracking-widest
                        text-zinc-700
                      "
                    >
                      Published By
                    </p>

                    <p
                      className="
                        truncate
                        text-xl
                        font-black
                        uppercase
                        italic
                        text-zinc-950
                      "
                    >
                      {article.author || "Unknown Trainer"}
                    </p>
                  </div>
                </div>

                <span
                  className="
                    shrink-0
                    rounded-lg
                    bg-zinc-950
                    px-2
                    py-1
                    text-[9px]
                    font-black
                    text-yellow-400
                  "
                >
                  {getRelativeTime(article.createdAt)}
                </span>
              </div>

              <div
                className="
                  mt-5
                  flex
                  items-center
                  justify-between
                  gap-3
                  border-t-2
                  border-zinc-900/20
                  pt-4
                "
              >
                <div>
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      text-zinc-700
                    "
                  >
                    Reactions
                  </p>

                  <p
                    className="
                      mt-1
                      font-black
                      text-zinc-950
                    "
                  >
                    {likesCount} {likesCount === 1 ? "Like" : "Likes"}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleLike}
                  disabled={likeLoading || isOwnArticle}
                  variant="secondary"
                  size="sm"
                  className={
                    liked
                      ? "!bg-red-500 !text-white"
                      : "!bg-white !text-red-500"
                  }
                >
                  {likeLoading
                    ? "..."
                    : isOwnArticle
                      ? "Your Report"
                      : liked
                        ? "♥ Liked"
                        : "♡ Like"}
                </Button>
              </div>

              {interactionMessage && (
                <div
                  className="
                    mt-3
                    rounded-lg
                    border-2
                    border-zinc-900
                    bg-white
                    px-3
                    py-2
                    text-center
                    text-[9px]
                    font-black
                    uppercase
                  "
                >
                  {interactionMessage.message}
                </div>
              )}
            </div>

            <div
              className="
                rounded-[1.8rem]
                border-4
                border-zinc-900
                bg-white
                p-6
                shadow-[8px_8px_0_#18181b]
                sm:p-8
              "
            >
              <div
                className="
                  mb-6
                  border-b-4
                  border-zinc-100
                  pb-4
                "
              >
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-widest
                    text-[#3b4cca]
                  "
                >
                  Full Report
                </p>
              </div>

              {formattedContent.length > 0 ? (
                formattedContent.map((paragraph, index) => (
                  <p
                    key={index}
                    className="
                        mb-7
                        whitespace-pre-line
                        text-base
                        font-medium
                        leading-8
                        text-zinc-800
                        last:mb-0
                        sm:text-lg
                        sm:leading-9
                      "
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p
                  className="
                    text-sm
                    italic
                    text-zinc-400
                  "
                >
                  No report body.
                </p>
              )}
            </div>
          </div>
        </article>

        {/* =================================================
            COMMENTS
        ================================================== */}

        <section
          id="comments"
          className="
            clear-both
            scroll-mt-28
            pt-10
          "
        >
          <div
            className="
              overflow-hidden
              rounded-[2rem]
              border-4
              border-zinc-950
              bg-white
              shadow-[8px_8px_0_#18181b]
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
                bg-[#3b4cca]
                px-5
                py-4
                text-white
              "
            >
              <div>
                <p
                  className="
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.16em]
                    text-yellow-300
                  "
                >
                  Discussion
                </p>

                <h2
                  className="
                    text-xl
                    font-black
                    uppercase
                    italic
                  "
                >
                  Trainer Comments
                </h2>
              </div>

              <span
                className="
                  rounded-full
                  border-2
                  border-white/30
                  bg-black/20
                  px-3
                  py-1.5
                  text-[9px]
                  font-black
                "
              >
                💬 {comments.length}
              </span>
            </div>

            <div
              className="
                p-4
                sm:p-6
              "
            >
              {isAuthenticated ? (
                <form
                  onSubmit={handleCommentSubmit}
                  className="
                    rounded-2xl
                    border-[3px]
                    border-zinc-950
                    bg-zinc-50
                    p-4
                    shadow-[4px_4px_0_#18181b]
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <label
                      htmlFor="article-comment"
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-widest
                        text-zinc-600
                      "
                    >
                      Add Comment
                    </label>

                    <span
                      className="
                        text-[9px]
                        font-bold
                        text-zinc-400
                      "
                    >
                      {commentBody.length}
                      /500
                    </span>
                  </div>

                  <textarea
                    id="article-comment"
                    value={commentBody}
                    maxLength={500}
                    rows={4}
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder="Join the discussion..."
                    className="
                      mt-3
                      w-full
                      resize-y
                      rounded-xl
                      border-2
                      border-zinc-300
                      bg-white
                      p-3
                      text-sm
                      font-medium
                      leading-6
                      text-zinc-900
                      outline-none
                      placeholder:text-zinc-400
                      focus:border-[#3b4cca]
                      focus:ring-4
                      focus:ring-[#3b4cca]/10
                    "
                  />

                  <div
                    className="
                      mt-3
                      flex
                      justify-end
                    "
                  >
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={commentSubmitting || !commentBody.trim()}
                    >
                      {commentSubmitting ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div
                  className="
                    rounded-xl
                    border-2
                    border-dashed
                    border-zinc-300
                    bg-zinc-50
                    px-4
                    py-4
                    text-center
                    text-sm
                    font-semibold
                    text-zinc-500
                  "
                >
                  Sign in from the navbar to join the discussion.
                </div>
              )}

              {commentError && (
                <div
                  className="
                    mt-4
                    rounded-xl
                    border-2
                    border-red-300
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-red-700
                  "
                >
                  {commentError}
                </div>
              )}

              <div
                className="
                  mt-6
                  space-y-3
                "
              >
                {commentsLoading ? (
                  <div
                    className="
                      py-8
                      text-center
                      text-sm
                      font-bold
                      text-zinc-400
                    "
                  >
                    Loading comments...
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => {
                    const commentUserId = getId(comment.user);

                    const canDelete =
                      Boolean(
                        currentUserId &&
                        commentUserId &&
                        String(currentUserId) === String(commentUserId),
                      ) || ["admin", "editor"].includes(currentRole);

                    return (
                      <article
                        key={comment._id}
                        className="
                            rounded-2xl
                            border-2
                            border-zinc-200
                            bg-white
                            p-4
                            transition
                            hover:border-zinc-300
                          "
                      >
                        <div
                          className="
                              flex
                              items-start
                              gap-3
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
                                rounded-xl
                                border-2
                                border-zinc-950
                                bg-yellow-300
                                text-sm
                                font-black
                                uppercase
                                shadow-[2px_2px_0_#18181b]
                              "
                          >
                            {comment.author?.charAt(0)?.toUpperCase() || "?"}
                          </div>

                          <div
                            className="
                                min-w-0
                                flex-1
                              "
                          >
                            <div
                              className="
                                  flex
                                  flex-wrap
                                  items-center
                                  justify-between
                                  gap-2
                                "
                            >
                              <div>
                                <p
                                  className="
                                      text-sm
                                      font-black
                                      text-zinc-950
                                    "
                                >
                                  {comment.author || "Trainer"}
                                </p>

                                <p
                                  className="
                                      mt-0.5
                                      text-[8px]
                                      font-bold
                                      uppercase
                                      tracking-wider
                                      text-zinc-400
                                    "
                                >
                                  {getRelativeTime(comment.createdAt)}
                                </p>
                              </div>

                              {canDelete && (
                                <button
                                  type="button"
                                  disabled={deletingCommentId === comment._id}
                                  onClick={() => handleDeleteComment(comment)}
                                  className="
                                      rounded-lg
                                      border-2
                                      border-transparent
                                      px-2
                                      py-1
                                      text-[8px]
                                      font-black
                                      uppercase
                                      text-red-500
                                      transition
                                      hover:border-red-200
                                      hover:bg-red-50
                                      disabled:opacity-40
                                    "
                                >
                                  {deletingCommentId === comment._id
                                    ? "..."
                                    : "Delete"}
                                </button>
                              )}
                            </div>

                            <p
                              className="
                                  mt-3
                                  whitespace-pre-wrap
                                  break-words
                                  text-sm
                                  font-medium
                                  leading-6
                                  text-zinc-700
                                "
                            >
                              {comment.body}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div
                    className="
                      rounded-2xl
                      border-2
                      border-dashed
                      border-zinc-200
                      bg-zinc-50
                      py-10
                      text-center
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-black
                        uppercase
                        text-zinc-500
                      "
                    >
                      No comments yet
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-zinc-400
                      "
                    >
                      Start the discussion.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div
          className="
            pt-10
          "
        >
          <Button to="/articles" variant="secondary" size="md">
            ← Return to PokéSocial
          </Button>
        </div>
      </main>
    </div>
  );
}

export default ArticlePage;
