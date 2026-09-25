// rotompc-client/src/layouts/Layout.jsx

import { useCallback, useEffect, useState } from "react";

import { Outlet, useLocation, useNavigate } from "react-router-dom";

import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

import Button from "@/components/Button";

import BuddyCard from "@/components/profile/BuddyCard";

import RotomAI from "@/components/rotom-ai/RotomAI";

/* =========================================================
   CONSTANTS
========================================================= */

const NAVBAR_STORAGE_KEY = "rotompc-navbar-hidden";

/* =========================================================
   BUDDY BUTTON STYLE
========================================================= */

const BUDDY_BUTTON_CLASS = `
  relative

  flex
  h-12
  min-h-12
  items-center
  justify-center

  overflow-hidden

  rounded-xl

  border-[3px]
  border-zinc-950

  bg-[#cc0000]

  px-3
  py-0

  font-black
  uppercase

  text-white

  shadow-[4px_4px_0_#18181b]

  transition

  hover:-translate-y-1
  hover:bg-[#ff1c1c]
  hover:shadow-[5px_5px_0_#18181b]

  active:translate-x-0.5
  active:translate-y-0.5
  active:shadow-[2px_2px_0_#18181b]

  sm:px-4
`;

/* =========================================================
   BUDDY ORB
========================================================= */

const BuddyOrb = () => {
  return (
    <span
      aria-hidden="true"
      className="
        relative

        block
        h-6
        w-6
        shrink-0

        overflow-hidden

        rounded-full

        border-2
        border-zinc-950

        bg-white
      "
    >
      {/* RED HALF */}

      <span
        className="
          absolute
          inset-x-0
          top-0

          h-1/2

          bg-red-500
        "
      />

      {/* CENTER LINE */}

      <span
        className="
          absolute
          inset-x-0
          top-1/2

          h-[2px]

          -translate-y-1/2

          bg-zinc-950
        "
      />

      {/* CENTER BUTTON */}

      <span
        className="
          absolute
          left-1/2
          top-1/2
          z-10

          h-2
          w-2

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          border-[2px]
          border-zinc-950

          bg-white
        "
      />
    </span>
  );
};

/* =========================================================
   BUDDY ONLINE DOT
========================================================= */

const BuddyOnlineDot = () => {
  return (
    <span
      aria-hidden="true"
      className="
        relative

        flex
        h-3
        w-3
        shrink-0
        items-center
        justify-center
      "
    >
      <span
        className="
          absolute

          h-3
          w-3

          animate-ping

          rounded-full

          bg-green-300/40
        "
      />

      <span
        className="
          relative

          h-2
          w-2

          rounded-full

          border
          border-green-100/60

          bg-green-300

          shadow-[0_0_7px_#86efac]
        "
      />
    </span>
  );
};

/* =========================================================
   LAYOUT
========================================================= */

const Layout = () => {
  const navigate = useNavigate();

  const location = useLocation();

  /* =======================================================
     NAVBAR
  ======================================================= */

  const [navbarHidden, setNavbarHidden] = useState(() => {
    return localStorage.getItem(NAVBAR_STORAGE_KEY) === "true";
  });

  const [navbarHeight, setNavbarHeight] = useState(0);

  /* =======================================================
     AUTH
  ======================================================= */

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token")),
  );

  /* =======================================================
     BUDDY
  ======================================================= */

  const [buddyOpen, setBuddyOpen] = useState(false);

  const [buddyRefreshKey, setBuddyRefreshKey] = useState(0);

  /* =======================================================
     NAVBAR HEIGHT
  ======================================================= */

  const handleNavbarHeight = useCallback((height) => {
    setNavbarHeight((current) => {
      if (current === height) {
        return current;
      }

      return height;
    });
  }, []);

  /* =======================================================
     NAVBAR TOGGLE
  ======================================================= */

  const toggleNavbar = () => {
    setNavbarHidden((current) => {
      const next = !current;

      localStorage.setItem(NAVBAR_STORAGE_KEY, String(next));

      return next;
    });
  };

  /* =======================================================
     AUTH SYNC
  ======================================================= */

  useEffect(() => {
    const handleAuthChange = () => {
      const authenticated = Boolean(localStorage.getItem("token"));

      setIsAuthenticated(authenticated);

      /*
       * Buddy only exists for
       * authenticated trainers.
       */
      if (!authenticated) {
        setBuddyOpen(false);
      }
    };

    window.addEventListener("local-auth-update", handleAuthChange);

    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("local-auth-update", handleAuthChange);

      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  /* =======================================================
     CLOSE BUDDY AFTER ROUTE CHANGE
  ======================================================= */

  useEffect(() => {
    setBuddyOpen(false);
  }, [location.pathname]);

  /* =======================================================
     BUDDY MODAL BODY LOCK
  ======================================================= */

  useEffect(() => {
    if (!buddyOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setBuddyOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [buddyOpen]);

  /* =======================================================
     OPEN BUDDY
  ======================================================= */

  const openBuddy = () => {
    setBuddyRefreshKey((current) => current + 1);

    setBuddyOpen(true);
  };

  /* =======================================================
     PAGE OFFSET
  ======================================================= */

  const navbarOffset = navbarHidden ? 0 : Math.max(navbarHeight - 1, 0);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        min-h-screen

        overflow-x-hidden

        bg-zinc-100

        text-zinc-900
      "
    >
      <ScrollToTop />

      {/* ===================================================
          NAVBAR
      ==================================================== */}

      <NavBar
        collapsed={navbarHidden}
        onToggle={toggleNavbar}
        onHeightChange={handleNavbarHeight}
      />

      {/* ===================================================
          PAGE CONTENT
      ==================================================== */}

      <main
        className="
          relative

          min-h-[70vh]

          pb-16

          transition-[padding-top]
          duration-300

          ease-[cubic-bezier(.4,0,.2,1)]
        "
        style={{
          paddingTop: `${navbarOffset}px`,
        }}
      >
        <Outlet />
      </main>

      {/* ===================================================
          FOOTER
      ==================================================== */}

      <Footer />

      {/* ===================================================
          ROTOM AI

          Global.

          Guests:
          - teleports
          - docks bottom-right by itself

          Logged-in trainers:
          - teleports
          - after 5 teleports docks
            beside Buddy

          RotomAI controls its own:
          - 1-second teleport cycle
          - five teleports
          - 20-second dock
          - speech bubbles
          - modal
          - AI chat
      ==================================================== */}

      <RotomAI buddyVisible={isAuthenticated} />

      {/* ===================================================
          GLOBAL BUDDY LAUNCHER
      ==================================================== */}

      {isAuthenticated && (
        <div
          className="
            fixed

            bottom-4
            right-3

            z-40

            sm:bottom-6
            sm:right-6

            lg:bottom-8
            lg:right-8
          "
        >
          <Button
            type="button"
            onClick={openBuddy}
            data-buddy-launcher="true"
            variant="secondary"
            size="sm"
            aria-label="Open Buddy Pokémon"
            title="Open Buddy Pokémon"
            className={BUDDY_BUTTON_CLASS}
          >
            <span
              className="
                grid
                h-full

                grid-cols-[24px_auto_12px]

                items-center

                gap-2.5
              "
            >
              {/* ===========================================
                  POKÉBALL
              ============================================ */}

              <span
                className="
                  flex

                  h-6
                  w-6

                  items-center
                  justify-center
                "
              >
                <BuddyOrb />
              </span>

              {/* ===========================================
                  LABEL
              ============================================ */}

              <span
                className="
                  flex

                  h-6

                  items-center
                  justify-center
                "
              >
                <span
                  className="
                    font-mono

                    text-[9px]
                    font-black
                    uppercase
                    leading-none
                    tracking-[0.12em]

                    sm:text-[10px]
                  "
                >
                  Buddy
                </span>
              </span>

              {/* ===========================================
                  ONLINE STATUS
              ============================================ */}

              <span
                className="
                  flex

                  h-6
                  w-3

                  items-center
                  justify-center
                "
              >
                <BuddyOnlineDot />
              </span>
            </span>

            {/* =============================================
                HARDWARE SHINE
            ============================================== */}

            <span
              aria-hidden="true"
              className="
                pointer-events-none

                absolute

                left-3
                right-3
                top-1

                h-px

                bg-white/35
              "
            />

            {/* =============================================
                SCANLINES
            ============================================== */}

            <span
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                inset-0

                opacity-[0.08]

                bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_3px)]
              "
            />
          </Button>
        </div>
      )}

      {/* ===================================================
          BUDDY MODAL
      ==================================================== */}

      {buddyOpen && isAuthenticated && (
        <div
          className="
              fixed
              inset-0

              z-[120]

              flex
              items-end
              justify-center

              bg-black/75

              backdrop-blur-md

              sm:items-center
              sm:p-5
            "
          onClick={() => setBuddyOpen(false)}
        >
          <div
            className="
                relative

                max-h-[94dvh]
                w-full

                overflow-y-auto

                rounded-t-[1.8rem]

                border-x-4
                border-t-4
                border-zinc-950

                bg-zinc-950

                shadow-2xl

                sm:max-h-[90dvh]
                sm:max-w-4xl

                sm:rounded-[2rem]
                sm:border-4
              "
            onClick={(event) => event.stopPropagation()}
          >
            {/* ===========================================
                  BUDDY MODAL HEADER
              ============================================ */}

            <div
              className="
                  sticky
                  top-0

                  z-[100]

                  flex
                  items-center
                  justify-between

                  gap-4

                  border-b-[3px]
                  border-zinc-950

                  bg-[#cc0000]

                  px-4
                  py-2.5

                  text-white
                "
            >
              {/* =========================================
                    IDENTITY
                ========================================== */}

              <div
                className="
                    grid
                    min-w-0

                    grid-cols-[24px_minmax(0,1fr)_12px]

                    items-center

                    gap-2.5
                  "
              >
                <span
                  className="
                      flex

                      h-6
                      w-6

                      items-center
                      justify-center
                    "
                >
                  <BuddyOrb />
                </span>

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
                        leading-none
                        tracking-[0.15em]

                        text-white/60
                      "
                  >
                    ROTOM LINK //
                  </p>

                  <p
                    className="
                        mt-1

                        truncate

                        text-[10px]
                        font-black
                        uppercase
                        leading-none
                        tracking-wide
                      "
                  >
                    Buddy Access
                  </p>
                </div>

                <span
                  className="
                      flex

                      h-6
                      w-3

                      items-center
                      justify-center
                    "
                >
                  <BuddyOnlineDot />
                </span>
              </div>

              {/* =========================================
                    CLOSE
                ========================================== */}

              <Button
                type="button"
                onClick={() => setBuddyOpen(false)}
                variant="secondary"
                size="sm"
                aria-label="Close Buddy"
                className="
                    flex

                    h-8
                    min-h-8
                    w-8
                    shrink-0

                    items-center
                    justify-center

                    rounded-xl

                    border-2
                    border-zinc-950

                    bg-white

                    px-0
                    py-0

                    text-base
                    font-black

                    text-zinc-950

                    shadow-[2px_2px_0_#18181b]
                  "
              >
                ×
              </Button>
            </div>

            {/* ===========================================
                  BUDDY CARD
              ============================================ */}

            <div
              className="
                  p-2

                  sm:p-3
                "
            >
              <BuddyCard
                variant="modal"
                refreshKey={buddyRefreshKey}
                onEdit={() => {
                  setBuddyOpen(false);

                  navigate("/about");
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
