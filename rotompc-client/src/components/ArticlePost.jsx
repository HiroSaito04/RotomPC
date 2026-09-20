// rotompc-client/src/components/ArticlePost.jsx

import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import Button from "@/components/Button.jsx";

import * as articleService from "@/services/ArticleService";

/* =========================================================
   COLORS
========================================================= */

const COLOR_OPTIONS = [
  {
    value: "bg-pink-500",
    label: "Pink",
  },
  {
    value: "bg-blue-500",
    label: "Blue",
  },
  {
    value: "bg-yellow-400",
    label: "Yellow",
  },
  {
    value: "bg-purple-600",
    label: "Purple",
  },
  {
    value: "bg-indigo-800",
    label: "Indigo",
  },
  {
    value: "bg-green-600",
    label: "Green",
  },
  {
    value: "bg-orange-600",
    label: "Orange",
  },
  {
    value: "bg-cyan-400",
    label: "Cyan",
  },
  {
    value: "bg-zinc-500",
    label: "Zinc",
  },
];

/* =========================================================
   ARTICLE POST
========================================================= */

const ArticlePost = ({ isOpen, onClose, onRefresh }) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");

  const [desc, setDesc] = useState("");

  const [content, setContent] = useState("");

  const [imageFile, setImageFile] = useState(null);

  const [imageUrl, setImageUrl] = useState("");

  const [color, setColor] = useState("bg-zinc-500");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [formStep, setFormStep] = useState("edit");

  /* =======================================================
     SESSION
  ======================================================= */

  const activeToken = localStorage.getItem("token");

  const activeUserId = localStorage.getItem("id");

  const rawUserData = localStorage.getItem("user");

  let activeUsername = localStorage.getItem("firstName") || "Trainer";

  if (rawUserData) {
    try {
      if (rawUserData.trim().startsWith("{")) {
        const parsed = JSON.parse(rawUserData);

        activeUsername = parsed.username || parsed.firstName || activeUsername;
      } else {
        activeUsername = rawUserData || activeUsername;
      }
    } catch (identityError) {
      console.error("Identity extraction failure:", identityError);
    }
  }

  /*
   * IMPORTANT:
   *
   * Do not require username here.
   * Authentication is token + user id.
   *
   * The server determines article author
   * from the authenticated user anyway.
   */
  const isLoggedIn = Boolean(activeToken && activeUserId);

  /* =======================================================
     CLOSED
  ======================================================= */

  if (!isOpen) {
    return null;
  }

  /* =======================================================
     RESET
  ======================================================= */

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setContent("");

    setImageFile(null);

    setImageUrl("");

    setColor("bg-zinc-500");

    setFormStep("edit");

    setError("");
    setSuccess("");
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const handlePreSubmitValidation = (event) => {
    event.preventDefault();

    const cleanTitle = title.trim();

    const cleanContent = content.trim();

    if (!cleanTitle) {
      setError("Post title is required.");

      return;
    }

    if (!cleanContent) {
      setError("Post content is required.");

      return;
    }

    if (cleanTitle.length > 150) {
      setError("Post title cannot exceed 150 characters.");

      return;
    }

    if (desc.trim().length > 500) {
      setError("Subtitle cannot exceed 500 characters.");

      return;
    }

    setError("");

    setFormStep("confirm");
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleFinalSubmit = async () => {
    if (loading) {
      return;
    }

    if (!isLoggedIn) {
      setError("Your login session is unavailable. Please sign in again.");

      return;
    }

    try {
      setLoading(true);

      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("title", title.trim());

      formData.append("desc", desc.trim());

      formData.append("content", content.trim());

      formData.append("color", color);

      /*
       * Server uses req.user to determine:
       *
       * userId
       * author
       * status
       *
       * Do not trust client identity fields.
       */

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imageUrl.trim()) {
        /*
         * Your current articleController
         * reads req.body.image for URLs.
         */
        formData.append("image", imageUrl.trim());
      }

      const response = await articleService.createArticle(formData);

      const berryReward = Number(response.data?.berryReward) || 0;

      if (berryReward > 0) {
        setSuccess(`Report published. +${berryReward} berries.`);
      } else {
        setSuccess("Report published.");
      }

      if (typeof onRefresh === "function") {
        await onRefresh();
      }

      window.setTimeout(() => {
        resetForm();

        if (typeof onClose === "function") {
          onClose();
        }
      }, 500);
    } catch (err) {
      console.error("Article submission failed:", err);

      const status = err.response?.status;

      if (status === 401 || status === 403) {
        setError(
          err.response?.data?.message ||
            "Your login session is no longer valid. Sign in again.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to publish report.",
        );
      }

      setFormStep("edit");
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleRedirectToLogin = () => {
    resetForm();

    if (typeof onClose === "function") {
      onClose();
    }

    navigate("/auth/signin");
  };

  /* =======================================================
     CLOSE
  ======================================================= */

  const handleCancelClose = () => {
    if (loading) {
      return;
    }

    resetForm();

    if (typeof onClose === "function") {
      onClose();
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        fixed
        inset-0
        z-[150]

        flex
        items-end
        justify-center

        bg-black/70

        p-0

        font-sans

        backdrop-blur-sm

        sm:items-center
        sm:p-4
      "
    >
      <div
        className="
          flex
          max-h-[92dvh]
          w-full
          max-w-lg
          flex-col

          overflow-y-auto

          rounded-t-[2rem]

          border-4
          border-zinc-950

          bg-zinc-900

          p-5

          text-white

          shadow-[8px_8px_0_rgba(0,0,0,1)]

          animate-in
          fade-in
          zoom-in-95

          duration-150

          sm:rounded-[2rem]
          sm:p-6
        "
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4

            border-b-2
            border-zinc-800

            pb-3
          "
        >
          <div
            className="
              min-w-0
            "
          >
            <p
              className="
                text-[8px]
                font-black
                uppercase
                tracking-[0.14em]

                text-zinc-500
              "
            >
              PokéSocial
            </p>

            <h3
              className="
                mt-1

                truncate

                text-xl
                font-black
                uppercase
                italic
                tracking-tight

                text-yellow-400
              "
            >
              {!isLoggedIn
                ? "Access Required"
                : formStep === "confirm"
                  ? "Review Post"
                  : "Create Post"}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleCancelClose}
            disabled={loading}
            aria-label="Close post editor"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center

              rounded-xl

              border-2
              border-zinc-700

              bg-zinc-950

              text-lg
              font-black

              text-zinc-400

              transition

              hover:border-zinc-500
              hover:text-white

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            ×
          </button>
        </div>

        {/* =================================================
            NOT LOGGED IN
        ================================================== */}

        {!isLoggedIn ? (
          <div
            className="
              flex
              flex-col
              items-center
              gap-5

              py-8

              text-center
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center

                rounded-2xl

                border-2
                border-red-500

                bg-red-950

                text-3xl
              "
            >
              🔒
            </div>

            <div>
              <h4
                className="
                  text-lg
                  font-black
                  uppercase

                  text-zinc-100
                "
              >
                Sign In Required
              </h4>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-xs

                  text-xs
                  font-medium
                  leading-5

                  text-zinc-400
                "
              >
                Sign in to publish a PokéSocial report.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleRedirectToLogin}
              variant="primary"
              size="md"
              className="
                w-full

                bg-yellow-400

                font-black

                text-zinc-950
              "
            >
              Sign In
            </Button>
          </div>
        ) : (
          <>
            {/* =============================================
                ERROR
            ============================================== */}

            {error && (
              <div
                className="
                  mt-4

                  rounded-xl

                  border-2
                  border-red-500

                  bg-red-950

                  px-3
                  py-2.5

                  text-xs
                  font-bold

                  text-red-200
                "
              >
                {error}
              </div>
            )}

            {/* =============================================
                SUCCESS
            ============================================== */}

            {success && (
              <div
                className="
                  mt-4

                  rounded-xl

                  border-2
                  border-green-500

                  bg-green-950

                  px-3
                  py-2.5

                  text-xs
                  font-bold

                  text-green-200
                "
              >
                {success}
              </div>
            )}

            {/* =============================================
                CONFIRM
            ============================================== */}

            {formStep === "confirm" ? (
              <div
                className="
                  flex
                  flex-col
                  gap-4

                  py-4

                  animate-in
                  fade-in
                  slide-in-from-bottom-2
                "
              >
                <div
                  className="
                    rounded-2xl

                    border-2
                    border-yellow-400/50

                    bg-yellow-400/5

                    p-4
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]

                      text-yellow-400
                    "
                  >
                    Review Post
                  </p>

                  <h4
                    className="
                      mt-3

                      text-lg
                      font-black
                      uppercase
                      leading-tight

                      text-white
                    "
                  >
                    {title}
                  </h4>

                  {desc && (
                    <p
                      className="
                        mt-2

                        text-xs
                        font-medium
                        leading-5

                        text-zinc-400
                      "
                    >
                      {desc}
                    </p>
                  )}

                  <div
                    className="
                      mt-4

                      flex
                      items-center
                      gap-2
                    "
                  >
                    <span
                      className={`
                        h-3
                        w-3

                        rounded-full

                        border
                        border-white/20

                        ${color}
                      `}
                    />

                    <span
                      className="
                        text-[9px]
                        font-bold
                        uppercase

                        text-zinc-500
                      "
                    >
                      {activeUsername}
                    </span>
                  </div>
                </div>

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-3

                    border-t
                    border-zinc-800

                    pt-4
                  "
                >
                  <Button
                    type="button"
                    onClick={() => setFormStep("edit")}
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                  >
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    variant="primary"
                    size="sm"
                    disabled={loading}
                    className="
                      bg-yellow-400

                      font-black

                      text-zinc-950
                    "
                  >
                    {loading ? "Publishing..." : "Publish"}
                  </Button>
                </div>
              </div>
            ) : (
              /* ===========================================
                 EDIT FORM
              ============================================ */

              <form
                onSubmit={handlePreSubmitValidation}
                className="
                  mt-4

                  flex
                  flex-col
                  gap-4
                "
              >
                {/* TITLE */}

                <div>
                  <div
                    className="
                      mb-1.5

                      flex
                      items-center
                      justify-between
                    "
                  >
                    <label
                      htmlFor="article-title"
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.1em]

                        text-zinc-400
                      "
                    >
                      Post Title
                    </label>

                    <span
                      className="
                        text-[9px]
                        font-bold

                        text-zinc-600
                      "
                    >
                      {title.length}
                      /150
                    </span>
                  </div>

                  <input
                    id="article-title"
                    type="text"
                    value={title}
                    maxLength={150}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Report title"
                    className="
                      min-h-12
                      w-full

                      rounded-xl

                      border-2
                      border-zinc-700

                      bg-zinc-950

                      px-3

                      text-sm
                      font-bold

                      text-white

                      outline-none

                      placeholder:text-zinc-600

                      focus:border-yellow-400
                    "
                  />
                </div>

                {/* DESCRIPTION */}

                <div>
                  <div
                    className="
                      mb-1.5

                      flex
                      items-center
                      justify-between
                    "
                  >
                    <label
                      htmlFor="article-desc"
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.1em]

                        text-zinc-400
                      "
                    >
                      Description
                    </label>

                    <span
                      className="
                        text-[9px]
                        font-bold

                        text-zinc-600
                      "
                    >
                      {desc.length}
                      /500
                    </span>
                  </div>

                  <input
                    id="article-desc"
                    type="text"
                    value={desc}
                    maxLength={500}
                    onChange={(event) => setDesc(event.target.value)}
                    placeholder="Short summary"
                    className="
                      min-h-12
                      w-full

                      rounded-xl

                      border-2
                      border-zinc-700

                      bg-zinc-950

                      px-3

                      text-sm
                      font-medium

                      text-white

                      outline-none

                      placeholder:text-zinc-600

                      focus:border-yellow-400
                    "
                  />
                </div>

                {/* CONTENT */}

                <div>
                  <label
                    htmlFor="article-content"
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.1em]

                      text-zinc-400
                    "
                  >
                    Post Content
                  </label>

                  <textarea
                    id="article-content"
                    rows={6}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write your report..."
                    className="
                      mt-1.5

                      min-h-[140px]
                      w-full
                      resize-y

                      rounded-xl

                      border-2
                      border-zinc-700

                      bg-zinc-950

                      p-3

                      text-sm
                      font-medium
                      leading-6

                      text-white

                      outline-none

                      placeholder:text-zinc-600

                      focus:border-yellow-400
                    "
                  />
                </div>

                {/* COLOR */}

                <div>
                  <label
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.1em]

                      text-zinc-400
                    "
                  >
                    Article Color
                  </label>

                  <div
                    className="
                      mt-2

                      grid
                      grid-cols-3
                      gap-2
                    "
                  >
                    {COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setColor(option.value)}
                        className={`
                            flex
                            items-center
                            gap-2

                            rounded-lg

                            border-2

                            px-3
                            py-2

                            text-[10px]
                            font-bold

                            transition

                            ${
                              color === option.value
                                ? `
                                    border-yellow-400
                                    bg-zinc-800
                                    text-white
                                  `
                                : `
                                    border-zinc-800
                                    bg-zinc-950
                                    text-zinc-400

                                    hover:border-zinc-700
                                  `
                            }
                          `}
                      >
                        <span
                          className={`
                              h-2.5
                              w-2.5
                              shrink-0

                              rounded-full

                              border
                              border-white/20

                              ${option.value}
                            `}
                        />

                        <span
                          className="
                              truncate
                            "
                        >
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* IMAGE */}

                <div
                  className="
                    border-t
                    border-zinc-800

                    pt-4
                  "
                >
                  <label
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.1em]

                      text-zinc-400
                    "
                  >
                    Image
                  </label>

                  <div
                    className="
                      mt-2

                      grid
                      gap-3

                      sm:grid-cols-2
                    "
                  >
                    <div>
                      <p
                        className="
                          mb-1.5

                          text-[8px]
                          font-bold
                          uppercase

                          text-zinc-600
                        "
                      >
                        Upload
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;

                          setImageFile(file);

                          if (file) {
                            setImageUrl("");
                          }
                        }}
                        className="
                          block
                          w-full

                          text-[10px]

                          text-zinc-400

                          file:mr-2
                          file:rounded-lg
                          file:border-0
                          file:bg-zinc-800
                          file:px-3
                          file:py-2
                          file:text-[10px]
                          file:font-black
                          file:text-white
                        "
                      />
                    </div>

                    <div>
                      <p
                        className="
                          mb-1.5

                          text-[8px]
                          font-bold
                          uppercase

                          text-zinc-600
                        "
                      >
                        Image URL
                      </p>

                      <input
                        type="url"
                        value={imageUrl}
                        disabled={Boolean(imageFile)}
                        onChange={(event) => setImageUrl(event.target.value)}
                        placeholder="https://..."
                        className="
                          min-h-10
                          w-full

                          rounded-lg

                          border-2
                          border-zinc-800

                          bg-zinc-950

                          px-3

                          text-[10px]
                          font-medium

                          text-white

                          outline-none

                          placeholder:text-zinc-700

                          focus:border-yellow-400

                          disabled:opacity-40
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-3

                    border-t
                    border-zinc-800

                    pt-4
                  "
                >
                  <Button
                    type="button"
                    onClick={handleCancelClose}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="
                      font-black
                    "
                  >
                    Review Post
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ArticlePost;
