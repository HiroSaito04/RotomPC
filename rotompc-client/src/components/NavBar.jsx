// rotompc-client/src/components/NavBar.jsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import Button from "@/components/Button";

import LogoutConfirmModal from "@/components/auth/LogoutConfirmModal";

import { clearAuthSession } from "@/utils/authSession";

/* =========================================================
   LINKS
========================================================= */

const links = [
  {
    label: "PokeDex",
    to: "/",
  },
  {
    label: "Trainer ID",
    to: "/about",
  },
  {
    label: "PokeSocial",
    to: "/articles",
  },
];

/* =========================================================
   SHARED NAVBAR BUTTON
========================================================= */

const NAV_BUTTON_CLASS = `
  relative

  flex
  h-9
  min-h-9
  items-center
  justify-center

  overflow-hidden

  rounded-xl

  border-2
  border-zinc-950

  bg-white

  px-3
  py-0

  text-zinc-900

  shadow-[2px_2px_0_#18181b]

  transition-all
  duration-200

  hover:-translate-y-0.5
  hover:bg-yellow-50
  hover:text-zinc-950

  active:translate-x-0.5
  active:translate-y-0.5
  active:shadow-none

  sm:px-4
`;

/* =========================================================
   SHARED BUTTON TEXT
========================================================= */

const NAV_BUTTON_TEXT_CLASS = `
  relative
  z-10

  block
  min-w-0

  whitespace-nowrap

  !m-0
  !p-0

  !text-center

  !text-[8px]
  !font-black
  !not-italic
  !uppercase

  !leading-none

  !tracking-[0.05em]

  !text-current

  sm:!text-[9px]
  sm:!tracking-[0.1em]
`;

/* =========================================================
   BUTTON OVERLAY
========================================================= */

const ButtonOverlay = () => (
  <span
    aria-hidden="true"
    className="
      pointer-events-none
      absolute
      inset-0

      opacity-[0.05]

      bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,.5)_50%)]
      bg-[length:100%_2px]
    "
  />
);

/* =========================================================
   AUTH INDICATOR
========================================================= */

const AuthIndicator = ({ authenticated }) => (
  <span
    aria-hidden="true"
    className={`
      relative
      z-10

      h-1.5
      w-1.5
      shrink-0

      rounded-full

      border
      border-zinc-950/30

      ${
        authenticated
          ? `
              bg-green-500
              shadow-[0_0_6px_rgba(34,197,94,.8)]
            `
          : `
              bg-zinc-400
            `
      }
    `}
  />
);

/* =========================================================
   NAVBAR BUTTON
========================================================= */

const NavbarButton = ({
  children,
  className = "",
  indicator = null,
  ...props
}) => (
  <Button
    variant="secondary"
    size="sm"
    className={`
      ${NAV_BUTTON_CLASS}
      ${className}
    `}
    {...props}
  >
    <span
      className="
        relative
        z-10

        flex
        min-w-0
        items-center
        justify-center
        gap-1.5
      "
    >
      {indicator}

      <span className={NAV_BUTTON_TEXT_CLASS}>{children}</span>
    </span>

    <ButtonOverlay />
  </Button>
);

/* =========================================================
   ROTOM LOGO
========================================================= */

const RotomLogo = () => (
  <NavLink
    to="/"
    className="
      group

      flex
      min-w-0
      shrink-0
      items-center
      gap-2

      sm:gap-3
    "
  >
    {/* ROTOM EYE */}

    <div
      className="
        relative

        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center

        rounded-full

        border-[3px]
        border-zinc-950

        bg-zinc-800

        shadow-[2px_2px_0_rgba(0,0,0,.15)]

        transition-transform

        group-hover:rotate-12

        sm:h-12
        sm:w-12
        sm:border-4
      "
    >
      <div
        className="
          relative

          flex
          h-6
          w-6
          items-center
          justify-center

          overflow-hidden

          rounded-full

          border
          border-blue-300

          bg-gradient-to-tr
          from-blue-600
          to-blue-400

          sm:h-8
          sm:w-8
        "
      >
        <span
          className="
            absolute
            left-1
            top-0.5

            h-2
            w-2

            rounded-full

            bg-white/35

            blur-[1px]

            sm:h-4
            sm:w-4
          "
        />

        <span
          className="
            h-full
            w-1

            rotate-45

            bg-white/10
          "
        />
      </div>
    </div>

    {/* WORDMARK */}

    <div className="min-w-0">
      <span
        className="
          block
          truncate

          font-mono

          text-[6px]
          font-black
          uppercase
          leading-none
          tracking-[0.18em]

          text-zinc-400

          sm:text-[7px]
          sm:tracking-[0.3em]
        "
      >
        SYSTEM FEED //
      </span>

      <p
        className="
          mt-1

          whitespace-nowrap

          text-base
          font-black
          uppercase
          italic
          leading-none
          tracking-[-0.05em]

          text-zinc-950

          sm:text-xl
          sm:tracking-tighter
        "
      >
        ROTOM
        <span className="text-[#ff1c1c]">PC</span>
      </p>
    </div>
  </NavLink>
);

/* =========================================================
   NAVIGATION BUTTONS
========================================================= */

const NavButtons = ({ mobile = false }) => (
  <>
    {links.map((link) => (
      <NavbarButton
        key={link.to}
        to={link.to}
        asNavLink
        end={link.to === "/"}
        className={mobile ? "w-full min-w-0" : "w-[106px] min-w-[106px]"}
      >
        {link.label}
      </NavbarButton>
    ))}
  </>
);

/* =========================================================
   AUTH BUTTON
========================================================= */

const AuthButton = ({ isAuthenticated, onLogout, mobile = false }) => {
  const buttonClass = mobile
    ? `
        w-auto
        min-w-[88px]
        shrink-0

        px-2.5
      `
    : `
        w-[106px]
        min-w-[106px]
        shrink-0
      `;

  if (isAuthenticated) {
    return (
      <NavbarButton
        type="button"
        onClick={onLogout}
        className={buttonClass}
        indicator={<AuthIndicator authenticated />}
      >
        Log Out
      </NavbarButton>
    );
  }

  return (
    <NavbarButton
      to="/auth/signin"
      asNavLink
      className={buttonClass}
      indicator={<AuthIndicator authenticated={false} />}
    >
      Log In
    </NavbarButton>
  );
};

/* =========================================================
   NAVBAR HANDLE
========================================================= */

const NavbarHandle = ({ collapsed, onToggle }) => (
  <div
    className="
      pointer-events-none

      relative

      -mt-px

      h-6
      w-full
    "
  >
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Show navbar" : "Hide navbar"}
      title={collapsed ? "Show navbar" : "Hide navbar"}
      className="
        group
        pointer-events-auto

        absolute
        right-3
        top-0

        h-6
        w-14

        text-zinc-950

        outline-none

        sm:right-6
        sm:w-16

        lg:right-8
      "
    >
      {/* OUTER HARDWARE */}

      <span
        aria-hidden="true"
        className="
          absolute
          inset-0

          bg-zinc-950

          [clip-path:polygon(8%_0,92%_0,100%_72%,84%_100%,16%_100%,0_72%)]
        "
      />

      {/* INNER SURFACE */}

      <span
        aria-hidden="true"
        className="
          absolute

          bottom-[3px]
          left-[3px]
          right-[3px]
          top-0

          bg-[#f3f4f6]

          [clip-path:polygon(5%_0,95%_0,100%_70%,82%_100%,18%_100%,0_70%)]

          transition-colors
          duration-200

          group-hover:bg-zinc-200
        "
      />

      {/* GROOVE */}

      <span
        aria-hidden="true"
        className="
          absolute

          left-1/2
          top-[4px]

          h-[2px]
          w-5

          -translate-x-1/2

          rounded-full

          bg-zinc-950/15
        "
      />

      {/* CHEVRON */}

      <span
        className={`
          absolute
          inset-0

          flex
          items-center
          justify-center

          pt-1

          transition-transform
          duration-300

          ease-[cubic-bezier(.4,0,.2,1)]

          ${collapsed ? "rotate-180" : "rotate-0"}
        `}
      >
        <svg
          width="18"
          height="10"
          viewBox="0 0 18 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="
            transition-transform
            duration-200

            group-hover:-translate-y-[1px]
            group-hover:scale-110
          "
        >
          <path
            d="M2 8L9 2L16 8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </span>
    </button>
  </div>
);

/* =========================================================
   NAVBAR
========================================================= */

const NavBar = ({ collapsed = false, onToggle, onHeightChange }) => {
  const navigate = useNavigate();

  const headerRef = useRef(null);

  const [navbarHeight, setNavbarHeight] = useState(0);

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token")),
  );

  /* =======================================================
     LOGOUT MODAL STATE
  ======================================================= */

  const [logoutOpen, setLogoutOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  /* =======================================================
     MEASURE NAVBAR
  ======================================================= */

  useLayoutEffect(() => {
    const node = headerRef.current;

    if (!node) {
      return undefined;
    }

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);

      setNavbarHeight(nextHeight);

      onHeightChange?.(nextHeight);
    };

    updateHeight();

    let observer = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateHeight);

      observer.observe(node);
    }

    window.addEventListener("resize", updateHeight);

    return () => {
      observer?.disconnect();

      window.removeEventListener("resize", updateHeight);
    };
  }, [onHeightChange]);

  /* =======================================================
     AUTH SYNC
  ======================================================= */

  useEffect(() => {
    const handleAuthChange = () => {
      const authenticated = Boolean(localStorage.getItem("token"));

      setIsAuthenticated(authenticated);

      /*
       * If another tab logs this user out,
       * do not leave a stale logout modal open.
       */

      if (!authenticated) {
        setLogoutOpen(false);

        setLoggingOut(false);
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
     REQUEST LOGOUT
  ======================================================= */

  const handleLogoutRequest = () => {
    if (loggingOut) {
      return;
    }

    setLogoutOpen(true);
  };

  /* =======================================================
     CANCEL LOGOUT
  ======================================================= */

  const handleLogoutCancel = () => {
    if (loggingOut) {
      return;
    }

    setLogoutOpen(false);
  };

  /* =======================================================
     CONFIRM LOGOUT
  ======================================================= */

  const handleLogoutConfirm = () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    /*
     * LOCAL SESSION ONLY.
     *
     * This must not:
     * - delete BuddyState
     * - delete berries
     * - delete profile data
     * - delete RotomAI history
     *
     * Those remain persisted in MongoDB.
     */

    clearAuthSession();

    setLogoutOpen(false);

    navigate("/", {
      replace: true,
    });
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div
        className="
          fixed
          inset-x-0
          top-0
          z-50

          transition-transform
          duration-300

          ease-[cubic-bezier(.4,0,.2,1)]

          will-change-transform
        "
        style={{
          transform:
            collapsed && navbarHeight > 0
              ? `translateY(-${navbarHeight}px)`
              : "translateY(0)",
        }}
      >
        {/* ===============================================
            NAVBAR
        ================================================ */}

        <header
          ref={headerRef}
          className="
            relative

            border-b-[5px]
            border-zinc-950

            bg-[#f3f4f6]

            shadow-[0_4px_12px_rgba(0,0,0,0.08)]
          "
        >
          {/* =============================================
              HARDWARE STRIP
          ============================================== */}

          <div
            className="
              flex
              h-6
              w-full
              items-center
              gap-3

              border-b-2
              border-black/20

              bg-[#cc0000]

              px-3

              sm:px-6
            "
          >
            {/* BLUE SENSOR */}

            <span
              className="
                h-3
                w-3

                animate-pulse

                rounded-full

                border-2
                border-white

                bg-blue-400

                shadow-[0_0_8px_#60a5fa]
              "
            />

            {/* STATUS LIGHTS */}

            <div className="flex gap-1.5">
              <span
                className="
                  h-2
                  w-2

                  rounded-full

                  border
                  border-black/20

                  bg-[#ff1c1c]
                "
              />

              <span
                className="
                  h-2
                  w-2

                  rounded-full

                  border
                  border-black/20

                  bg-[#ffcb05]
                "
              />

              <span
                className="
                  h-2
                  w-2

                  rounded-full

                  border
                  border-black/20

                  bg-[#4dad5b]
                "
              />
            </div>

            {/* RIGHT HARDWARE */}

            <div
              className="
                ml-auto

                flex
                items-center
                gap-3
              "
            >
              <span
                className="
                  hidden

                  font-mono

                  text-[6px]
                  font-black
                  uppercase
                  tracking-[0.18em]

                  text-white/45

                  sm:block
                "
              >
                ROTOM SYSTEM
              </span>

              <span
                className="
                  h-1
                  w-12

                  rounded-full

                  bg-black/20
                "
              />
            </div>
          </div>

          {/* =============================================
              MOBILE
          ============================================== */}

          <div
            className="
              mx-auto
              w-full
              max-w-7xl

              sm:hidden
            "
          >
            {/* IDENTITY */}

            <div
              className="
                flex
                min-h-[58px]
                items-center
                justify-between
                gap-3

                px-3
                py-2
              "
            >
              <RotomLogo />

              <AuthButton
                mobile
                isAuthenticated={isAuthenticated}
                onLogout={handleLogoutRequest}
              />
            </div>

            {/* NAVIGATION */}

            <nav
              className="
                grid
                grid-cols-3
                gap-1.5

                border-t
                border-zinc-300

                bg-zinc-200/70

                px-3
                py-2
              "
            >
              <NavButtons mobile />
            </nav>
          </div>

          {/* =============================================
              TABLET / DESKTOP
          ============================================== */}

          <div
            className="
              relative

              mx-auto

              hidden
              h-20
              max-w-7xl

              items-center
              justify-between
              gap-4

              px-6

              sm:flex

              lg:px-8
            "
          >
            {/* LOGO */}

            <RotomLogo />

            {/* NAVIGATION */}

            <nav
              className="
                flex
                items-center
                justify-center
                gap-1

                rounded-xl

                border
                border-zinc-900/5

                bg-zinc-200/50

                p-1

                shadow-inner
              "
            >
              <NavButtons />
            </nav>

            {/* AUTH */}

            <AuthButton
              isAuthenticated={isAuthenticated}
              onLogout={handleLogoutRequest}
            />
          </div>
        </header>

        {/* ===============================================
            CONNECTED NAVBAR HANDLE
        ================================================ */}

        <NavbarHandle collapsed={collapsed} onToggle={onToggle} />
      </div>

      {/* =================================================
          LOGOUT CONFIRMATION

          Modal uses a React portal, so it stays fullscreen
          even though the navbar itself is transformed.
      ================================================== */}

      <LogoutConfirmModal
        open={logoutOpen}
        loading={loggingOut}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default NavBar;
