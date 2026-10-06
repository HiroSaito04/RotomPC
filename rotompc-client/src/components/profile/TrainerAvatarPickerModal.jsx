// filepath: rotompc-client/src/components/profile/TrainerAvatarPickerModal.jsx

import { useEffect, useMemo, useState } from "react";

import { createPortal } from "react-dom";

import {
  fetchMyTrainerAvatar,
  fetchTrainerAvatarCatalog,
  saveMyTrainerAvatar,
} from "@/services/TrainerAvatarService";

/* =========================================================
   HELPERS
========================================================= */

const getAvatarImage = (avatar) =>
  avatar?.animatedImageUrl || avatar?.gifUrl || avatar?.imageUrl || "";

const formatCategory = (value) => {
  const text = String(value || "trainer")
    .trim()
    .replace(/-/g, " ");

  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* =========================================================
   CLOSE
========================================================= */

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

/* =========================================================
   MODAL
========================================================= */

const TrainerAvatarPickerModal = ({ open, userId = "", onClose, onSaved }) => {
  const [avatars, setAvatars] = useState([]);

  const [selectedId, setSelectedId] = useState("");

  const [currentAvatar, setCurrentAvatar] = useState(null);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     SELECTED
  ======================================================= */

  const selectedAvatar = useMemo(
    () =>
      avatars.find((avatar) => avatar.id === selectedId) ||
      currentAvatar ||
      null,
    [avatars, selectedId, currentAvatar],
  );

  /* =======================================================
     OPEN / LOAD
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        setError("");

        const [catalogResponse, currentResponse] = await Promise.all([
          fetchTrainerAvatarCatalog(),
          fetchMyTrainerAvatar(),
        ]);

        if (cancelled) {
          return;
        }

        const nextAvatars = Array.isArray(catalogResponse.data?.avatars)
          ? catalogResponse.data.avatars
          : [];

        const activeAvatar = currentResponse.data?.avatar || null;

        setAvatars(nextAvatars);

        setCurrentAvatar(activeAvatar);

        setSelectedId(activeAvatar?.id || nextAvatars[0]?.id || "");
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Trainer avatar picker load error:", err);

        setError(
          err.response?.data?.message || "Unable to load Trainer characters.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /* =======================================================
     ESCAPE / BODY LOCK
  ======================================================= */

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return undefined;
    }

    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previous;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, onClose]);

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = async () => {
    if (saving || !selectedId) {
      return;
    }

    try {
      setSaving(true);

      setError("");

      const response = await saveMyTrainerAvatar(selectedId);

      const avatar =
        response.data?.avatar ||
        avatars.find((item) => item.id === selectedId) ||
        null;

      setCurrentAvatar(avatar);

      const eventUserId = String(userId || localStorage.getItem("id") || "");

      window.dispatchEvent(
        new CustomEvent("trainer-avatar-update", {
          detail: {
            userId: eventUserId,

            avatar,
          },
        }),
      );

      onSaved?.(avatar);

      onClose?.();
    } catch (err) {
      console.error("Trainer avatar save error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update Trainer character.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     GUARD
  ======================================================= */

  if (!open || typeof document === "undefined") {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return createPortal(
    <>
      <style>
        {`
          @keyframes rotomPickerTrainerIdle {
            0%, 100% {
              transform:
                translate3d(0, 0, 0)
                rotate(0deg);
            }

            30% {
              transform:
                translate3d(0, -2px, 0)
                rotate(-0.3deg);
            }

            55% {
              transform:
                translate3d(0, -5px, 0)
                rotate(0deg);
            }

            80% {
              transform:
                translate3d(0, -1px, 0)
                rotate(0.3deg);
            }
          }

          @keyframes rotomPickerSelected {
            0%, 100% {
              transform:
                translateY(0)
                scale(1);
            }

            50% {
              transform:
                translateY(-5px)
                scale(1.015);
            }
          }

          .rotom-picker-trainer {
            animation:
              rotomPickerTrainerIdle
              3.1s
              ease-in-out
              infinite;

            transform-origin:
              50% 100%;
          }

          .rotom-picker-selected {
            animation:
              rotomPickerSelected
              2.6s
              ease-in-out
              infinite;

            transform-origin:
              50% 100%;
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .rotom-picker-trainer,
            .rotom-picker-selected {
              animation:
                none !important;
            }
          }
        `}
      </style>

      <div
        className="
          fixed
          inset-0
          z-[1400]

          flex
          items-end
          justify-center

          bg-black/75

          backdrop-blur-sm

          sm:items-center
          sm:p-5
        "
        role="dialog"
        aria-modal="true"
        aria-label="Choose Trainer character"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) {
            onClose?.();
          }
        }}
      >
        <div
          className="
            flex

            max-h-[94dvh]
            w-full
            max-w-4xl
            flex-col

            overflow-hidden

            rounded-t-[2rem]

            border-4
            border-b-0
            border-zinc-950

            bg-zinc-100

            shadow-[0_-8px_40px_rgba(0,0,0,.4)]

            sm:rounded-[2rem]
            sm:border-b-4
            sm:shadow-[10px_10px_0_#18181b]
          "
        >
          {/* ===============================================
              HEADER
          ================================================ */}

          <div
            className="
              flex
              shrink-0
              items-center
              justify-between
              gap-4

              border-b-4
              border-zinc-950

              bg-[#e63946]

              px-4
              py-3

              text-white

              sm:px-5
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
              "
            >
              <img
                src="/rotompc-icon02.svg"
                alt=""
                className="
                  h-10
                  w-10
                  shrink-0

                  object-contain
                "
              />

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    font-mono

                    text-[7px]
                    font-black
                    uppercase
                    tracking-[0.18em]

                    text-white/65
                  "
                >
                  Trainer Settings
                </p>

                <h2
                  className="
                    truncate

                    text-lg
                    font-black
                    uppercase
                    italic

                    sm:text-xl
                  "
                >
                  Choose Character
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close character picker"
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

                bg-white

                text-zinc-950

                shadow-[2px_2px_0_#18181b]

                transition

                hover:-translate-y-0.5
                hover:bg-yellow-300

                disabled:opacity-50
              "
            >
              <CloseIcon />
            </button>
          </div>

          {/* ===============================================
              BODY
          ================================================ */}

          <div
            className="
              min-h-0
              flex-1

              overflow-y-auto

              bg-gradient-to-b
              from-zinc-100
              to-zinc-200

              p-4

              sm:p-5
            "
          >
            {loading ? (
              <div
                className="
                  flex
                  min-h-[480px]
                  flex-col
                  items-center
                  justify-center
                  gap-4
                "
              >
                <div
                  className="
                    h-11
                    w-11

                    animate-spin

                    rounded-full

                    border-4
                    border-zinc-300
                    border-t-[#e63946]
                  "
                />

                <p
                  className="
                    font-mono

                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.16em]

                    text-zinc-500
                  "
                >
                  Loading Characters
                </p>
              </div>
            ) : (
              <>
                {/* =========================================
                    SELECTED PREVIEW
                ========================================== */}

                {selectedAvatar && (
                  <section
                    className="
                      mb-5

                      overflow-hidden

                      rounded-[1.6rem]

                      border-4
                      border-zinc-950

                      bg-zinc-900

                      shadow-[6px_6px_0_#18181b]
                    "
                  >
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
                        TRAINER PREVIEW
                      </span>
                    </div>

                    <div
                      className="
                        grid

                        sm:grid-cols-[250px_minmax(0,1fr)]
                      "
                    >
                      <div
                        className="
                          relative

                          flex
                          h-[240px]
                          items-end
                          justify-center

                          overflow-hidden
                        "
                        style={{
                          background: `
                            radial-gradient(
                              circle at 50% 52%,
                              rgba(
                                255,
                                230,
                                106,
                                .75
                              ),
                              transparent 48%
                            ),
                            linear-gradient(
                              180deg,
                              #6390F0,
                              #254cac
                            )
                          `,
                        }}
                      >
                        <div
                          aria-hidden="true"
                          className="
                            absolute
                            inset-0

                            opacity-10

                            bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
                            bg-[size:18px_18px]
                          "
                        />

                        <img
                          src={getAvatarImage(selectedAvatar)}
                          alt={selectedAvatar.label}
                          className="
                            rotom-picker-selected

                            relative
                            z-10

                            h-full
                            w-full

                            object-contain

                            p-4

                            [image-rendering:pixelated]

                            drop-shadow-[0_12px_8px_rgba(0,0,0,.3)]
                          "
                        />
                      </div>

                      <div
                        className="
                          flex
                          flex-col
                          justify-center

                          bg-zinc-950

                          p-5

                          text-white
                        "
                      >
                        <p
                          className="
                            font-mono

                            text-[7px]
                            font-black
                            uppercase
                            tracking-[0.16em]

                            text-yellow-400
                          "
                        >
                          Selected Character
                        </p>

                        <h3
                          className="
                            mt-2

                            text-2xl
                            font-black
                            uppercase
                            italic
                          "
                        >
                          {selectedAvatar.label || "Trainer"}
                        </h3>

                        <p
                          className="
                            mt-2

                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.1em]

                            text-zinc-500
                          "
                        >
                          {formatCategory(selectedAvatar.category)}
                        </p>

                        {selectedAvatar.credit && (
                          <p
                            className="
                              mt-4

                              text-[8px]
                              font-semibold
                              leading-5

                              text-zinc-500
                            "
                          >
                            Sprite credit: {selectedAvatar.credit}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* =========================================
                    ERROR
                ========================================== */}

                {error && (
                  <div
                    className="
                      mb-4

                      rounded-xl

                      border-2
                      border-red-400

                      bg-red-50

                      p-3

                      text-center

                      text-xs
                      font-bold

                      text-red-700
                    "
                  >
                    {error}
                  </div>
                )}

                {/* =========================================
                    CHARACTER GRID
                ========================================== */}

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-3

                    sm:grid-cols-3

                    lg:grid-cols-4
                  "
                >
                  {avatars.map((avatar, index) => {
                    const selected = avatar.id === selectedId;

                    const image = getAvatarImage(avatar);

                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedId(avatar.id)}
                        className={`
                            group

                            relative

                            overflow-hidden

                            rounded-2xl

                            border-[3px]
                            border-zinc-950

                            text-left

                            shadow-[4px_4px_0_#18181b]

                            transition

                            hover:-translate-y-1

                            active:translate-x-0.5
                            active:translate-y-0.5
                            active:shadow-[1px_1px_0_#18181b]

                            ${selected ? "bg-yellow-300" : "bg-white"}
                          `}
                      >
                        {/* SELECTED */}

                        {selected && (
                          <span
                            className="
                                absolute
                                right-2
                                top-2
                                z-30

                                flex
                                h-6
                                w-6
                                items-center
                                justify-center

                                rounded-full

                                border-2
                                border-zinc-950

                                bg-zinc-950

                                text-[10px]
                                font-black

                                text-white
                              "
                          >
                            ✓
                          </span>
                        )}

                        {/* IMAGE */}

                        <div
                          className="
                              relative

                              flex
                              h-36
                              items-end
                              justify-center

                              overflow-hidden

                              border-b-[3px]
                              border-zinc-950

                              bg-gradient-to-b
                              from-sky-100
                              via-blue-100
                              to-blue-200

                              sm:h-40
                            "
                        >
                          <div
                            aria-hidden="true"
                            className="
                                absolute
                                inset-0

                                opacity-[0.08]

                                bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)]
                                bg-[size:14px_14px]
                              "
                          />

                          {image ? (
                            <img
                              src={image}
                              alt={avatar.label || "Trainer"}
                              loading="lazy"
                              className="
                                  rotom-picker-trainer

                                  relative
                                  z-10

                                  h-full
                                  w-full

                                  object-contain

                                  p-3

                                  [image-rendering:pixelated]

                                  drop-shadow-[0_8px_5px_rgba(0,0,0,.25)]

                                  transition-transform

                                  group-hover:scale-105
                                "
                              style={{
                                animationDelay: `${index * 95}ms`,
                              }}
                            />
                          ) : (
                            <span
                              className="
                                  relative
                                  z-10

                                  text-4xl
                                  font-black

                                  text-zinc-400
                                "
                            >
                              ?
                            </span>
                          )}
                        </div>

                        {/* INFO */}

                        <div
                          className="
                              p-3
                            "
                        >
                          <p
                            className="
                                truncate

                                text-xs
                                font-black
                                uppercase
                              "
                          >
                            {avatar.label || "Trainer"}
                          </p>

                          <p
                            className="
                                mt-1
                                truncate

                                text-[7px]
                                font-black
                                uppercase
                                tracking-[0.1em]

                                text-zinc-400
                              "
                          >
                            {formatCategory(avatar.category)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ===============================================
              FOOTER
          ================================================ */}

          {!loading && (
            <div
              className="
                shrink-0

                border-t-4
                border-zinc-950

                bg-white

                p-4

                sm:p-5
              "
            >
              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="
                    min-h-11

                    rounded-xl

                    border-[3px]
                    border-zinc-950

                    bg-white

                    px-4

                    text-xs
                    font-black
                    uppercase

                    shadow-[3px_3px_0_#18181b]

                    transition

                    hover:-translate-y-0.5
                    hover:bg-zinc-100

                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !selectedId}
                  className="
                    min-h-11

                    rounded-xl

                    border-[3px]
                    border-zinc-950

                    bg-yellow-400

                    px-4

                    text-xs
                    font-black
                    uppercase

                    text-zinc-950

                    shadow-[3px_3px_0_#18181b]

                    transition

                    hover:-translate-y-0.5
                    hover:bg-yellow-300

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {saving ? "Saving..." : "Use Character"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default TrainerAvatarPickerModal;
