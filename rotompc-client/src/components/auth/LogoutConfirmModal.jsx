// rotompc-client/src/components/auth/LogoutConfirmModal.jsx

import { useEffect, useRef } from "react";

import { createPortal } from "react-dom";

/* =========================================================
   ICONS
========================================================= */

const PowerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
    <path
      d="M12 3v9"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />

    <path
      d="M7.1 5.8A8 8 0 1 0 16.9 5.8"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

/* =========================================================
   MODAL
========================================================= */

const LogoutConfirmModal = ({ open, onClose, onConfirm, loading = false }) => {
  const cancelRef = useRef(null);

  /* =======================================================
     BODY LOCK / KEYBOARD
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      cancelRef.current?.focus();
    }, 80);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.clearTimeout(timer);

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onClose]);

  /* =======================================================
     CLOSED
  ======================================================= */

  if (!open || typeof document === "undefined") {
    return null;
  }

  /* =======================================================
     MODAL CONTENT
  ======================================================= */

  const modal = (
    <div
      className="
        fixed
        inset-0
        z-[1000]

        flex
        items-end
        justify-center

        bg-black/70
        backdrop-blur-sm

        sm:items-center
        sm:p-5
      "
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-description"
        aria-busy={loading}
        className="
          relative

          w-full
          overflow-hidden

          rounded-t-[2rem]

          border-[3px]
          border-zinc-950

          bg-zinc-100

          shadow-[0_-10px_35px_rgba(0,0,0,.35)]

          sm:max-w-md
          sm:rounded-[2rem]
          sm:shadow-[8px_8px_0_#18181b]
        "
      >
        {/* ===============================================
            TOP DEVICE BAR
        ================================================ */}

        <div
          className="
            flex
            items-center
            justify-between

            border-b-[3px]
            border-zinc-950

            bg-[#cc0000]

            px-5
            py-3
          "
        >
          <div className="flex items-center gap-2">
            <span
              className="
                h-3
                w-3

                rounded-full

                border-2
                border-zinc-950

                bg-cyan-300

                shadow-[0_0_8px_rgba(103,232,249,.8)]
              "
            />

            <span
              className="
                h-2
                w-2

                rounded-full

                border
                border-zinc-950

                bg-yellow-300
              "
            />

            <span
              className="
                h-2
                w-2

                rounded-full

                border
                border-zinc-950

                bg-green-400
              "
            />
          </div>

          <p
            className="
              font-mono

              text-[8px]
              font-black
              uppercase
              tracking-[0.16em]

              text-white/80
            "
          >
            Session Control
          </p>
        </div>

        {/* ===============================================
            BODY
        ================================================ */}

        <div
          className="
            px-5
            pb-5
            pt-6

            sm:px-6
            sm:pb-6
            sm:pt-7
          "
        >
          {/* ICON */}

          <div
            className="
              mx-auto

              flex
              h-16
              w-16

              items-center
              justify-center

              rounded-2xl

              border-[3px]
              border-zinc-950

              bg-yellow-300

              text-zinc-950

              shadow-[4px_4px_0_#18181b]
            "
          >
            <PowerIcon />
          </div>

          {/* TITLE */}

          <div className="mt-5 text-center">
            <p
              className="
                font-mono

                text-[8px]
                font-black
                uppercase
                tracking-[0.16em]

                text-red-600
              "
            >
              Trainer Session
            </p>

            <h2
              id="logout-confirm-title"
              className="
                mt-1

                font-heading

                text-2xl
                font-black
                uppercase
                tracking-tight

                text-zinc-950
              "
            >
              Log out?
            </h2>

            <p
              id="logout-confirm-description"
              className="
                mx-auto
                mt-3

                max-w-sm

                text-sm
                font-semibold
                leading-6

                text-zinc-600
              "
            >
              Are you sure you want to end your current RotomPC session?
            </p>
          </div>

          {/* INFO */}

          <div
            className="
              mt-5

              rounded-xl

              border-2
              border-zinc-300

              bg-white

              px-4
              py-3
            "
          >
            <p
              className="
                text-center

                text-xs
                font-semibold
                leading-5

                text-zinc-500
              "
            >
              Your Trainer profile, Buddy progress, berries, and RotomAI chat
              history will remain saved to your account.
            </p>
          </div>

          {/* =============================================
              ACTIONS
          ============================================== */}

          <div
            className="
              mt-6

              grid
              grid-cols-2

              gap-3
            "
          >
            <button
              ref={cancelRef}
              type="button"
              disabled={loading}
              onClick={onClose}
              className="
                min-h-12

                rounded-xl

                border-[3px]
                border-zinc-950

                bg-white

                px-4

                text-[10px]
                font-black
                uppercase
                tracking-[0.1em]

                text-zinc-950

                shadow-[3px_3px_0_#18181b]

                transition

                hover:-translate-y-0.5
                hover:bg-zinc-100

                active:translate-x-0.5
                active:translate-y-0.5
                active:shadow-[1px_1px_0_#18181b]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Stay Logged In
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="
                min-h-12

                rounded-xl

                border-[3px]
                border-zinc-950

                bg-[#cc0000]

                px-4

                text-[10px]
                font-black
                uppercase
                tracking-[0.1em]

                text-white

                shadow-[3px_3px_0_#18181b]

                transition

                hover:-translate-y-0.5
                hover:bg-red-600

                active:translate-x-0.5
                active:translate-y-0.5
                active:shadow-[1px_1px_0_#18181b]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading ? "Logging Out..." : "Log Out"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  /* =======================================================
     PORTAL

     Keeps the fullscreen modal outside navbar transforms
     and stacking contexts.
  ======================================================= */

  return createPortal(modal, document.body);
};

export default LogoutConfirmModal;
