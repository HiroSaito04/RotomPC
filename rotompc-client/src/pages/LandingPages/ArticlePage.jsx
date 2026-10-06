// filepath: rotompc-client/src/pages/ArticlePage/ArticlePage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "@/components/Button.jsx";
import TrainerProfilePicture from "@/components/profile/TrainerProfilePicture";
import TrainerProfileModal from "@/components/social/TrainerProfileModal";
import NotFoundPage from "@/pages/NotFoundPage.jsx";
import * as articleService from "@/services/ArticleService";

/* =========================================================
   CONFIG
========================================================= */

const FALLBACK_IMAGE =
  "https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png";

const MAX_COMMENT_LENGTH = 500;

const PRIVILEGED_COMMENT_ROLES = new Set(["admin", "editor"]);

/* =========================================================
   HELPERS
========================================================= */

const getOwnerId = (article) => {
  if (!article?.userId) {
    return "";
  }

  if (typeof article.userId === "object") {
    return article.userId._id || article.userId.id || "";
  }

  return article.userId;
};

const getCommentUserId = (comment) => {
  if (!comment?.user) {
    return "";
  }

  if (typeof comment.user === "object") {
    return comment.user._id || comment.user.id || "";
  }

  return String(comment.user);
};

const getCommentId = (comment) => comment?._id || comment?.id || "";

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

  const intervals = [
    ["YEAR", 31536000],
    ["MONTH", 2592000],
    ["WEEK", 604800],
    ["DAY", 86400],
    ["HOUR", 3600],
    ["MIN", 60],
  ];

  for (const [label, amount] of intervals) {
    if (seconds >= amount) {
      const count = Math.floor(seconds / amount);

      return `${count} ${label}${count === 1 ? "" : "S"} AGO`;
    }
  }

  return "RECENT";
};

const normalizeContent = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((paragraph) => String(paragraph || "").trim())
      .filter(Boolean);
  }

  const text = String(value || "").trim();

  if (!text) {
    return [];
  }

  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

const normalizeComments = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.comments)) {
    return data.comments;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase();

/* =========================================================
   PAGE
========================================================= */

function ArticlePage() {
  const { name } = useParams();

  const navigate = useNavigate();

  /* =======================================================
     ARTICLE
  ======================================================= */

  const [article, setArticle] = useState(null);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  /* =======================================================
     IMAGE
  ======================================================= */

  const [imageFailed, setImageFailed] = useState(false);

  /* =======================================================
     LIKES
  ======================================================= */

  const [liked, setLiked] = useState(false);

  const [likesCount, setLikesCount] = useState(0);

  const [likeLoading, setLikeLoading] = useState(false);

  /* =======================================================
     COMMENTS
  ======================================================= */

  const [comments, setComments] = useState([]);

  const [commentsLoading, setCommentsLoading] = useState(false);

  const [commentsError, setCommentsError] = useState("");

  const [commentBody, setCommentBody] = useState("");

  const [commentPosting, setCommentPosting] = useState(false);

  const [deletingCommentId, setDeletingCommentId] = useState("");

  /* =======================================================
     UI
  ======================================================= */

  const [interactionMessage, setInteractionMessage] = useState(null);

  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );

  const messageTimeoutRef = useRef(null);

  const commentInputRef = useRef(null);

  /* =======================================================
     SESSION
  ======================================================= */

  const articleId = article?._id || null;

  const currentUserId = localStorage.getItem("id") || "";

  const currentUserRole = normalizeRole(localStorage.getItem("role"));

  const articleOwnerId = getOwnerId(article);

  const isOwnArticle = Boolean(
    currentUserId &&
    articleOwnerId &&
    String(currentUserId) === String(articleOwnerId),
  );

  const canModerateComments = PRIVILEGED_COMMENT_ROLES.has(currentUserRole);

  /* =======================================================
     AUTH
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
     CLEAN FEEDBACK TIMER
  ======================================================= */

  useEffect(
    () => () => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
      }
    },
    [],
  );

  /* =======================================================
     LOAD ARTICLE
  ======================================================= */

  useEffect(() => {
    if (!name) {
      setArticle(null);

      setLoadError("Report name is missing.");

      setLoading(false);

      return undefined;
    }

    let cancelled = false;

    const loadArticle = async () => {
      try {
        setLoading(true);

        setLoadError("");

        setArticle(null);

        const response = await articleService.fetchArticleByName(name);

        if (cancelled) {
          return;
        }

        const result =
          response.data?.article || response.data?.data || response.data;

        if (!result || typeof result !== "object") {
          throw new Error("Report not found.");
        }

        setArticle(result);

        setLikesCount(
          Number(result.likesCount) ||
            (Array.isArray(result.likes) ? result.likes.length : 0),
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Article loading error:", error);

        setLoadError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load report.",
        );

        setArticle(null);
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
     LIKE STATUS
  ======================================================= */

  useEffect(() => {
    if (!articleId) {
      return undefined;
    }

    if (!isAuthenticated) {
      setLiked(false);

      return undefined;
    }

    let cancelled = false;

    const loadStatus = async () => {
      try {
        const response = await articleService.getArticleLikeStatus(articleId);

        if (cancelled) {
          return;
        }

        setLiked(Boolean(response.data?.liked));

        setLikesCount(Number(response.data?.likesCount) || 0);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Like status error:", error);

        if (error.response?.status === 401) {
          setIsAuthenticated(false);

          setLiked(false);
        }
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [articleId, isAuthenticated]);

  /* =======================================================
     LOAD COMMENTS
  ======================================================= */

  const loadComments = useCallback(
    async (silent = false) => {
      if (!articleId) {
        setComments([]);

        return;
      }

      try {
        if (!silent) {
          setCommentsLoading(true);
        }

        setCommentsError("");

        const response = await articleService.fetchArticleComments(articleId);

        setComments(normalizeComments(response.data));
      } catch (error) {
        console.error("Article comments loading error:", error);

        setCommentsError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load comments.",
        );
      } finally {
        if (!silent) {
          setCommentsLoading(false);
        }
      }
    },
    [articleId],
  );

  useEffect(() => {
    if (!articleId) {
      setComments([]);

      setCommentsError("");

      return;
    }

    loadComments();
  }, [articleId, loadComments]);

  /* =======================================================
     FEEDBACK
  ======================================================= */

  const showMessage = (message, type = "normal") => {
    if (messageTimeoutRef.current) {
      window.clearTimeout(messageTimeoutRef.current);
    }

    setInteractionMessage({
      message,
      type,
    });

    messageTimeoutRef.current = window.setTimeout(() => {
      setInteractionMessage(null);

      messageTimeoutRef.current = null;
    }, 2400);
  };

  /* =======================================================
     LIKE
  ======================================================= */

  const handleLike = async () => {
    if (!articleId || likeLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth/signin");

      return;
    }

    if (isOwnArticle) {
      showMessage("You cannot like your own report.", "error");

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

      if (reward > 0) {
        showMessage(`+${reward} Berry`, "reward");
      } else {
        showMessage(nextLiked ? "Report liked." : "Like removed.");
      }
    } catch (error) {
      console.error("Like error:", error);

      if (error.response?.status === 401) {
        setIsAuthenticated(false);
      }

      showMessage(
        error.response?.data?.message || "Unable to update like.",
        "error",
      );
    } finally {
      setLikeLoading(false);
    }
  };

  /* =======================================================
     COMMENT INPUT
  ======================================================= */

  const handleCommentChange = (event) => {
    const value = event.target.value;

    if (value.length > MAX_COMMENT_LENGTH) {
      return;
    }

    setCommentBody(value);

    setCommentsError("");
  };

  /* =======================================================
     CREATE COMMENT
  ======================================================= */

  const handleSubmitComment = async (event) => {
    event.preventDefault();

    if (!articleId || commentPosting) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth/signin");

      return;
    }

    const cleanBody = commentBody.trim();

    if (!cleanBody) {
      setCommentsError("Write a comment before posting.");

      commentInputRef.current?.focus();

      return;
    }

    if (cleanBody.length > MAX_COMMENT_LENGTH) {
      setCommentsError(
        `Comments cannot exceed ${MAX_COMMENT_LENGTH} characters.`,
      );

      return;
    }

    try {
      setCommentPosting(true);

      setCommentsError("");

      const response = await articleService.createArticleComment(
        articleId,
        cleanBody,
      );

      const createdComment =
        response.data?.comment || response.data?.data || response.data;

      if (createdComment && typeof createdComment === "object") {
        setComments((current) => [...current, createdComment]);
      } else {
        await loadComments(true);
      }

      setCommentBody("");

      showMessage("Comment posted.", "success");
    } catch (error) {
      console.error("Create comment error:", error);

      if (error.response?.status === 401) {
        setIsAuthenticated(false);
      }

      setCommentsError(
        error.response?.data?.message ||
          error.message ||
          "Unable to post comment.",
      );
    } finally {
      setCommentPosting(false);
    }
  };

  /* =======================================================
     DELETE COMMENT
  ======================================================= */

  const handleDeleteComment = async (comment) => {
    const commentId = getCommentId(comment);

    if (!articleId || !commentId || deletingCommentId) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth/signin");

      return;
    }

    const confirmed = window.confirm("Delete this comment?");

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCommentId(commentId);

      setCommentsError("");

      await articleService.deleteArticleComment(articleId, commentId);

      setComments((current) =>
        current.filter(
          (item) => String(getCommentId(item)) !== String(commentId),
        ),
      );

      showMessage("Comment deleted.");
    } catch (error) {
      console.error("Delete comment error:", error);

      if (error.response?.status === 401) {
        setIsAuthenticated(false);
      }

      setCommentsError(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete comment.",
      );
    } finally {
      setDeletingCommentId("");
    }
  };

  /* =======================================================
     TRAINER
  ======================================================= */

  const openTrainer = () => {
    if (!articleOwnerId) {
      return;
    }

    setSelectedTrainer({
      id: articleOwnerId,

      username: article.author || "",
    });
  };

  const openCommentTrainer = (comment) => {
    const userId = getCommentUserId(comment);

    if (!userId) {
      return;
    }

    setSelectedTrainer({
      id: userId,

      username: comment?.author || "",
    });
  };

  /* =======================================================
     CONTENT
  ======================================================= */

  const paragraphs = normalizeContent(article?.content);

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
            border-zinc-950

            bg-white

            px-8
            py-7

            text-center

            shadow-[7px_7px_0_#18181b]
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

              text-[9px]
              font-black
              uppercase
              tracking-[0.14em]

              text-zinc-500
            "
          >
            Loading Report
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!article) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          {loadError && (
            <div
              className="
                mb-6

                rounded-xl

                border-2
                border-red-500

                bg-red-50

                p-4

                text-sm
                font-bold

                text-red-700
              "
            >
              {loadError}
            </div>
          )}

          <Button to="/articles" size="sm">
            ← Back to PokéSocial
          </Button>

          <NotFoundPage />
        </div>
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
          min-h-screen

          bg-[#f8fafc]

          pb-14

          text-zinc-950
        "
      >
        <main
          className="
            mx-auto

            w-full
            max-w-6xl

            px-4
            py-6

            sm:px-6
            sm:py-8
          "
        >
          {/* ===============================================
              TOP CONTROLS
          ================================================ */}

          <div
            className="
              mb-4

              flex
              items-center
              justify-between
              gap-3
            "
          >
            <Button to="/articles" variant="secondary" size="sm">
              ← PokéSocial
            </Button>

            <span
              className="
                rounded-full

                border-2
                border-zinc-950

                bg-white

                px-3
                py-1.5

                text-[8px]
                font-black
                uppercase
                tracking-[0.1em]

                shadow-[2px_2px_0_#18181b]
              "
            >
              {getRelativeTime(article.createdAt)}
            </span>
          </div>

          {/* ===============================================
              REPORT
          ================================================ */}

          <article
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
                h-4

                border-b-2
                border-zinc-950

                bg-[#3b4cca]
              "
            />

            {/* HEADER */}

            <div
              className="
                p-5

                sm:p-7
              "
            >
              <span
                className={`
                  inline-flex

                  rounded-lg

                  border-2
                  border-zinc-950

                  ${article.color || "bg-red-500"}

                  px-3
                  py-1.5

                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.1em]

                  text-white

                  shadow-[2px_2px_0_#18181b]
                `}
              >
                {article.date || "POKÉSOCIAL REPORT"}
              </span>

              <h1
                className="
                  mt-4

                  break-words

                  text-left
                  text-3xl
                  font-black
                  uppercase
                  italic
                  leading-[0.95]
                  tracking-tight

                  sm:text-5xl
                "
              >
                {article.title || "Untitled Report"}
              </h1>
            </div>

            {/* =============================================
                IMAGE
            ============================================== */}

            <div
              className="
                relative

                flex
                w-full
                items-center
                justify-center

                overflow-hidden

                border-y-4
                border-zinc-950

                bg-zinc-100
              "
            >
              {!imageFailed ? (
                <img
                  src={articleImage}
                  alt={article.title || "PokéSocial report"}
                  onError={() => setImageFailed(true)}
                  className="
                    block

                    h-auto
                    w-full
                    max-w-full

                    object-contain
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    min-h-[240px]
                    w-full
                    items-center
                    justify-center

                    bg-zinc-100

                    text-6xl
                    font-black

                    text-zinc-300

                    sm:min-h-[320px]
                  "
                >
                  R
                </div>
              )}
            </div>

            {/* =============================================
                TRAINER + REACTIONS
            ============================================== */}

            <div
              className="
                border-b-4
                border-zinc-950

                bg-[#ffcb05]

                p-4

                sm:p-5
              "
            >
              <div
                className="
                  grid
                  gap-3

                  lg:grid-cols-[minmax(0,1fr)_auto]
                  lg:items-center
                "
              >
                <button
                  type="button"
                  disabled={!articleOwnerId}
                  onClick={openTrainer}
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3

                    rounded-2xl

                    border-2
                    border-zinc-950

                    bg-white

                    p-3

                    text-left

                    shadow-[3px_3px_0_#18181b]

                    transition

                    hover:-translate-y-0.5
                    hover:bg-yellow-50

                    disabled:cursor-default
                    disabled:hover:translate-y-0
                    disabled:hover:bg-white
                  "
                >
                  <TrainerProfilePicture
                    userId={articleOwnerId}
                    username={article.author || ""}
                    size="lg"
                    roundedClassName="rounded-2xl"
                    className="
                      shadow-[2px_2px_0_#18181b]
                    "
                    fallbackClassName="
                      text-xl
                    "
                  />

                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.13em]

                        text-zinc-500
                      "
                    >
                      Published By
                    </p>

                    <p
                      className="
                        mt-1

                        truncate

                        text-lg
                        font-black
                        uppercase
                        italic

                        text-zinc-950
                      "
                    >
                      {article.author || "Unknown Trainer"}
                    </p>

                    {articleOwnerId && (
                      <p
                        className="
                          mt-1

                          text-[8px]
                          font-black
                          uppercase
                          tracking-[0.11em]

                          text-[#3b4cca]
                        "
                      >
                        View Trainer ID →
                      </p>
                    )}
                  </div>
                </button>

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-2

                    sm:grid-cols-[110px_110px_minmax(130px,1fr)]

                    lg:grid-cols-[96px_96px_132px]
                  "
                >
                  <div
                    className="
                      rounded-xl

                      border-2
                      border-zinc-950

                      bg-white

                      px-3
                      py-2.5

                      shadow-[2px_2px_0_#18181b]
                    "
                  >
                    <p
                      className="
                        text-lg
                        font-black

                        text-zinc-950
                      "
                    >
                      {likesCount}
                    </p>

                    <p
                      className="
                        mt-0.5

                        text-[7px]
                        font-black
                        uppercase
                        tracking-[0.08em]

                        text-zinc-400
                      "
                    >
                      {likesCount === 1 ? "Like" : "Likes"}
                    </p>
                  </div>

                  <div
                    className="
                      rounded-xl

                      border-2
                      border-zinc-950

                      bg-white

                      px-3
                      py-2.5

                      shadow-[2px_2px_0_#18181b]
                    "
                  >
                    <p
                      className="
                        text-lg
                        font-black

                        text-zinc-950
                      "
                    >
                      {comments.length}
                    </p>

                    <p
                      className="
                        mt-0.5

                        text-[7px]
                        font-black
                        uppercase
                        tracking-[0.08em]

                        text-zinc-400
                      "
                    >
                      {comments.length === 1 ? "Comment" : "Comments"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={likeLoading || isOwnArticle}
                    className={`
                      col-span-2

                      min-h-11

                      rounded-xl

                      border-2
                      border-zinc-950

                      px-4

                      text-xs
                      font-black

                      shadow-[2px_2px_0_#18181b]

                      transition

                      hover:-translate-y-0.5

                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      disabled:hover:translate-y-0

                      sm:col-span-1

                      ${
                        liked
                          ? "bg-red-500 text-white"
                          : "bg-white text-red-500"
                      }
                    `}
                  >
                    {likeLoading
                      ? "..."
                      : isOwnArticle
                        ? "Your Report"
                        : liked
                          ? "♥ Liked"
                          : "♡ Like"}
                  </button>
                </div>
              </div>

              {interactionMessage && (
                <div
                  className={`
                    mt-3

                    rounded-lg

                    border-2

                    px-3
                    py-2

                    text-center

                    text-[9px]
                    font-black
                    uppercase

                    ${
                      interactionMessage.type === "reward"
                        ? "border-green-700 bg-green-50 text-green-800"
                        : interactionMessage.type === "error"
                          ? "border-red-700 bg-red-50 text-red-700"
                          : interactionMessage.type === "success"
                            ? "border-green-700 bg-green-50 text-green-800"
                            : "border-blue-700 bg-blue-50 text-blue-700"
                    }
                  `}
                >
                  {interactionMessage.message}
                </div>
              )}
            </div>

            {/* =============================================
                DESCRIPTION + CONTENT

                Both now share the exact same container,
                padding and left alignment.
            ============================================== */}

            <div
              className="
                p-5

                text-left

                sm:p-7
              "
            >
              {article.desc && (
                <p
                  className="
                    text-left

                    text-base
                    font-bold
                    italic
                    leading-7

                    text-zinc-600

                    sm:text-[17px]
                  "
                >
                  “{article.desc}”
                </p>
              )}

              <div
                className={`
                  ${article.desc ? "mt-5" : ""}

                  space-y-5

                  text-left

                  text-[15px]
                  font-semibold
                  leading-7

                  text-zinc-700

                  sm:text-base
                `}
              >
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 30)}`}>
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p>No report content available.</p>
                )}
              </div>
            </div>
          </article>

          {/* ===============================================
              COMMENTS
          ================================================ */}

          <section
            className="
              mt-7

              overflow-hidden

              rounded-[2rem]

              border-4
              border-zinc-950

              bg-white

              shadow-[8px_8px_0_#18181b]
            "
          >
            {/* COMMENT HEADER */}

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

                sm:px-6
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

                    text-yellow-300
                  "
                >
                  PokéSocial Discussion
                </p>

                <h2
                  className="
                    mt-1

                    text-xl
                    font-black
                    uppercase
                    italic

                    sm:text-2xl
                  "
                >
                  Trainer Comments
                </h2>
              </div>

              <span
                className="
                  flex
                  h-10
                  min-w-10
                  items-center
                  justify-center

                  rounded-xl

                  border-2
                  border-zinc-950

                  bg-yellow-300

                  px-2

                  text-sm
                  font-black

                  text-zinc-950

                  shadow-[2px_2px_0_#18181b]
                "
              >
                {comments.length}
              </span>
            </div>

            {/* COMMENT COMPOSER */}

            <div
              className="
                border-b-[3px]
                border-zinc-950

                bg-yellow-50

                p-4

                sm:p-5
              "
            >
              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment}>
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
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
                        Join the discussion
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-black

                          text-zinc-950
                        "
                      >
                        Leave a Trainer comment
                      </p>
                    </div>

                    <span
                      className={`
                        font-mono

                        text-[8px]
                        font-black

                        ${
                          commentBody.length >= 450
                            ? "text-red-600"
                            : "text-zinc-400"
                        }
                      `}
                    >
                      {commentBody.length}/{MAX_COMMENT_LENGTH}
                    </span>
                  </div>

                  <textarea
                    ref={commentInputRef}
                    value={commentBody}
                    onChange={handleCommentChange}
                    maxLength={MAX_COMMENT_LENGTH}
                    rows={4}
                    disabled={commentPosting}
                    placeholder="Share your thoughts about this report..."
                    className="
                      mt-3

                      min-h-[110px]
                      w-full
                      resize-y

                      rounded-xl

                      border-[3px]
                      border-zinc-950

                      bg-white

                      px-4
                      py-3

                      text-sm
                      font-semibold
                      leading-6

                      text-zinc-950

                      outline-none

                      transition

                      placeholder:text-zinc-400

                      focus:ring-4
                      focus:ring-[#3b4cca]/15

                      disabled:cursor-wait
                      disabled:opacity-60
                    "
                  />

                  <div
                    className="
                      mt-3

                      flex
                      flex-col
                      gap-2

                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >
                    <p
                      className="
                        text-[8px]
                        font-bold
                        uppercase
                        tracking-[0.06em]

                        text-zinc-400
                      "
                    >
                      Keep it friendly and relevant to the report.
                    </p>

                    <button
                      type="submit"
                      disabled={commentPosting || !commentBody.trim()}
                      className="
                        min-h-11

                        rounded-xl

                        border-[3px]
                        border-zinc-950

                        bg-[#3b4cca]

                        px-5

                        text-xs
                        font-black
                        uppercase

                        text-white

                        shadow-[3px_3px_0_#18181b]

                        transition

                        hover:-translate-y-0.5
                        hover:bg-[#3040b4]

                        active:translate-x-0.5
                        active:translate-y-0.5
                        active:shadow-[1px_1px_0_#18181b]

                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        disabled:hover:translate-y-0
                      "
                    >
                      {commentPosting ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  className="
                    flex
                    flex-col
                    gap-4

                    sm:flex-row
                    sm:items-center
                    sm:justify-between
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
                      Want to join the discussion?
                    </p>

                    <p
                      className="
                        mt-1

                        text-xs
                        font-semibold

                        text-zinc-500
                      "
                    >
                      Sign in to leave a comment.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigate("/auth/signin")}
                  >
                    Sign In
                  </Button>
                </div>
              )}

              {commentsError && (
                <div
                  className="
                    mt-3

                    rounded-xl

                    border-2
                    border-red-500

                    bg-red-50

                    px-3
                    py-2.5

                    text-xs
                    font-bold

                    text-red-700
                  "
                >
                  {commentsError}
                </div>
              )}
            </div>

            {/* COMMENTS LIST */}

            <div
              className="
                p-4

                sm:p-5
              "
            >
              {commentsLoading ? (
                <div
                  className="
                    flex
                    min-h-[190px]
                    flex-col
                    items-center
                    justify-center
                    gap-3
                  "
                >
                  <div
                    className="
                      h-8
                      w-8

                      animate-spin

                      rounded-full

                      border-[3px]
                      border-zinc-200
                      border-t-[#3b4cca]
                    "
                  />

                  <p
                    className="
                      font-mono

                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.12em]

                      text-zinc-400
                    "
                  >
                    Loading Comments
                  </p>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment, index) => {
                    const commentId = getCommentId(comment);

                    const commenterId = getCommentUserId(comment);

                    const isCommentOwner = Boolean(
                      currentUserId &&
                      commenterId &&
                      String(currentUserId) === String(commenterId),
                    );

                    const canDeleteComment =
                      isCommentOwner || canModerateComments;

                    return (
                      <div
                        key={
                          commentId ||
                          `${comment.author}-${comment.createdAt}-${index}`
                        }
                        className="
                          rounded-2xl

                          border-[3px]
                          border-zinc-950

                          bg-white

                          p-3.5

                          shadow-[3px_3px_0_#18181b]

                          sm:p-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >
                          <button
                            type="button"
                            disabled={!commenterId}
                            onClick={() => openCommentTrainer(comment)}
                            aria-label={`Open ${
                              comment.author || "Trainer"
                            } profile`}
                            className="
                              shrink-0

                              rounded-xl

                              text-left

                              transition

                              hover:-translate-y-0.5

                              disabled:cursor-default
                              disabled:hover:translate-y-0
                            "
                          >
                            <TrainerProfilePicture
                              userId={commenterId}
                              username={comment.author || "Trainer"}
                              size="md"
                              roundedClassName="rounded-xl"
                              className="
                                shadow-[2px_2px_0_#18181b]
                              "
                              fallbackClassName="
                                text-sm
                              "
                            />
                          </button>

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
                                items-start
                                justify-between
                                gap-2
                              "
                            >
                              <button
                                type="button"
                                disabled={!commenterId}
                                onClick={() => openCommentTrainer(comment)}
                                className="
                                  min-w-0

                                  text-left

                                  disabled:cursor-default
                                "
                              >
                                <p
                                  className="
                                    truncate

                                    text-sm
                                    font-black

                                    text-zinc-950

                                    hover:text-[#3b4cca]
                                  "
                                >
                                  @{comment.author || "Trainer"}
                                </p>

                                <p
                                  className="
                                    mt-0.5

                                    font-mono

                                    text-[7px]
                                    font-black
                                    uppercase
                                    tracking-[0.08em]

                                    text-zinc-400
                                  "
                                >
                                  {getRelativeTime(comment.createdAt)}
                                </p>
                              </button>

                              {canDeleteComment && (
                                <button
                                  type="button"
                                  disabled={deletingCommentId === commentId}
                                  onClick={() => handleDeleteComment(comment)}
                                  className="
                                    shrink-0

                                    rounded-lg

                                    border-2
                                    border-zinc-300

                                    bg-zinc-50

                                    px-2.5
                                    py-1.5

                                    text-[7px]
                                    font-black
                                    uppercase

                                    text-zinc-500

                                    transition

                                    hover:border-red-500
                                    hover:bg-red-50
                                    hover:text-red-600

                                    disabled:cursor-wait
                                    disabled:opacity-50
                                  "
                                >
                                  {deletingCommentId === commentId
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="
                    flex
                    min-h-[190px]
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
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center

                      rounded-xl

                      border-2
                      border-zinc-950

                      bg-yellow-300

                      text-lg
                      font-black

                      shadow-[2px_2px_0_#18181b]
                    "
                  >
                    💬
                  </div>

                  <h3
                    className="
                      mt-4

                      text-base
                      font-black
                      uppercase
                    "
                  >
                    No Comments Yet
                  </h3>

                  <p
                    className="
                      mt-1

                      max-w-sm

                      text-xs
                      font-semibold
                      leading-5

                      text-zinc-400
                    "
                  >
                    Be the first Trainer to discuss this report.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <TrainerProfileModal
        open={Boolean(selectedTrainer)}
        trainerId={selectedTrainer?.id || ""}
        username={selectedTrainer?.username || ""}
        onClose={() => setSelectedTrainer(null)}
      />
    </>
  );
}

export default ArticlePage;
