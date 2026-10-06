// filepath: rotompc-client/src/components/NavBar.jsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { NavLink, useLocation, useNavigate } from "react-router-dom";

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

const ADMIN_LINK = {
  label: "Admin",
  to: "/dashboard",
};

/* =========================================================
   MOBILE FEATURE EVENTS

   The mobile Buddy / RotomAI buttons first try to locate
   and click the existing visible floating launcher.

   If one cannot be found, these events are dispatched as
   a fallback for event-based launchers.
========================================================= */

const BUDDY_OPEN_EVENT = "rotompc:open-buddy";

const ROTOM_AI_OPEN_EVENT = "rotompc:open-rotom-ai";

const FEATURE_SELECTORS = {
  buddy: [
    '[data-rotompc-launcher="buddy"]',

    "[data-buddy-launcher]",

    'button[aria-label*="buddy" i]',

    'button[title*="buddy" i]',
  ],

  rotom: [
    '[data-rotompc-launcher="rotom-ai"]',

    "[data-rotom-ai-launcher]",

    'button[aria-label*="rotomai" i]',

    'button[aria-label*="rotom ai" i]',

    'button[aria-label*="rotom" i]',

    'button[title*="rotom" i]',
  ],
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/* =========================================================
   READ SESSION
========================================================= */

const readSessionState = () => {
  if (typeof window === "undefined") {
    return {
      authenticated: false,

      role: "",
    };
  }

  const authenticated = Boolean(localStorage.getItem("token"));

  let role = normalizeRole(localStorage.getItem("role"));

  /*
   * Fall back to the stored user object if an older
   * session does not contain the standalone role key.
   */
  if (!role) {
    try {
      const storedUser = localStorage.getItem("user");

      const parsed = storedUser ? JSON.parse(storedUser) : null;

      role = normalizeRole(parsed?.role);
    } catch {
      role = "";
    }
  }

  return {
    authenticated,

    role,
  };
};

/* =========================================================
   FIND EXISTING FEATURE LAUNCHER
========================================================= */

const findVisibleFeatureLauncher = (feature) => {
  if (typeof document === "undefined") {
    return null;
  }

  const selectors = FEATURE_SELECTORS[feature] || [];

  /*
   * First use explicit / accessible selectors.
   */
  for (const selector of selectors) {
    const matches = Array.from(document.querySelectorAll(selector));

    const target = matches.find((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      /*
       * Never trigger the quick-access button
       * inside the drawer itself.
       */
      if (element.closest("#rotompc-mobile-drawer")) {
        return false;
      }

      if (element.hasAttribute("disabled")) {
        return false;
      }

      const style = window.getComputedStyle(element);

      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity || 1) === 0
      ) {
        return false;
      }

      return element.getClientRects().length > 0;
    });

    if (target) {
      return target;
    }
  }

  /*
   * Additional fallback:
   * inspect visible button labels/text.
   */
  const textNeedle = feature === "buddy" ? "buddy" : "rotom";

  const textMatch = Array.from(document.querySelectorAll("button")).find(
    (element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      if (element.closest("#rotompc-mobile-drawer")) {
        return false;
      }

      if (element.hasAttribute("disabled")) {
        return false;
      }

      const label = [
        element.getAttribute("aria-label"),

        element.getAttribute("title"),

        element.textContent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!label.includes(textNeedle)) {
        return false;
      }

      const style = window.getComputedStyle(element);

      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity || 1) === 0
      ) {
        return false;
      }

      return element.getClientRects().length > 0;
    },
  );

  return textMatch || null;
};

/* =========================================================
   FALLBACK FEATURE EVENT
========================================================= */

const emitFeatureOpenEvent = (feature) => {
  if (typeof window === "undefined") {
    return;
  }

  const eventName =
    feature === "buddy" ? BUDDY_OPEN_EVENT : ROTOM_AI_OPEN_EVENT;

  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: {
        source: "mobile-navbar",
      },
    }),
  );
};

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

  !text-[9px]
  !font-black
  !not-italic
  !uppercase

  !leading-none
  !tracking-[0.08em]

  !text-current
`;

/* =========================================================
   BUTTON OVERLAY
========================================================= */

const ButtonOverlay = () => {
  return (
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
};

/* =========================================================
   AUTH INDICATOR
========================================================= */

const AuthIndicator = ({ authenticated }) => {
  return (
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
};

/* =========================================================
   NAVBAR BUTTON
========================================================= */

const NavbarButton = ({
  children,

  className = "",

  indicator = null,

  ...props
}) => {
  return (
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
};

/* =========================================================
   ROTOM LOGO
========================================================= */

const RotomLogo = ({ onClick }) => {
  return (
    <NavLink
      to="/"
      onClick={onClick}
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

          md:h-12
          md:w-12
          md:border-4
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

            md:h-8
            md:w-8
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

              md:h-4
              md:w-4
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

            md:text-[7px]
            md:tracking-[0.3em]
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

            md:text-xl
            md:tracking-tighter
          "
        >
          ROTOM
          <span className="text-[#ff1c1c]">PC</span>
        </p>
      </div>
    </NavLink>
  );
};

/* =========================================================
   NAVIGATION BUTTONS
========================================================= */

const NavButtons = ({
  drawer = false,

  onNavigate,

  isAdmin = false,
}) => {
  /*
   * Admin receives one additional dashboard button.
   *
   * Editors / trainers do not see it.
   */
  const visibleLinks = isAdmin ? [...links, ADMIN_LINK] : links;

  return (
    <>
      {visibleLinks.map((link) => {
        const adminLink = link.to === ADMIN_LINK.to;

        return (
          <NavbarButton
            key={link.to}
            to={link.to}
            asNavLink
            end={link.to === "/"}
            onClick={onNavigate}
            className={
              drawer
                ? `
                      h-12
                      min-h-12

                      w-full

                      justify-start

                      px-4

                      shadow-[3px_3px_0_#18181b]

                      ${
                        adminLink
                          ? `
                              !bg-zinc-950
                              !text-white

                              hover:!bg-[#cc0000]
                              hover:!text-white
                            `
                          : ""
                      }
                    `
                : `
                      w-[106px]
                      min-w-[106px]

                      ${
                        adminLink
                          ? `
                              !bg-zinc-950
                              !text-white

                              hover:!bg-[#cc0000]
                              hover:!text-white
                            `
                          : ""
                      }
                    `
            }
          >
            {link.label}
          </NavbarButton>
        );
      })}
    </>
  );
};

/* =========================================================
   BUDDY ICON
========================================================= */

const BuddyIcon = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <circle cx="8" cy="7" r="2" />

      <circle cx="16" cy="7" r="2" />

      <circle cx="5" cy="12" r="2" />

      <circle cx="19" cy="12" r="2" />

      <path d="M8.5 18.5c1.1 1 2.3 1.5 3.5 1.5s2.4-.5 3.5-1.5c1.4-1.3 1.6-3.2.5-4.4-.8-.9-1.9-1.2-3-.8-.7.2-1.3.2-2 0-1.1-.4-2.2-.1-3 .8-1.1 1.2-.9 3.1.5 4.4Z" />
    </svg>
  );
};

/* =========================================================
   ROTOMAI ICON
========================================================= */

const RotomAIIcon = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M13 2 5.5 13h5L9.8 22 18.5 10h-5L13 2Z" />
    </svg>
  );
};

/* =========================================================
   MOBILE FEATURE BUTTON
========================================================= */

const MobileFeatureButton = ({
  label,

  description,

  icon,

  accentClass,

  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group

        relative

        flex
        min-h-[58px]
        w-full

        items-center

        gap-3

        overflow-hidden

        rounded-xl

        border-2
        border-zinc-950

        bg-white

        px-3
        py-2.5

        text-left
        text-zinc-950

        shadow-[3px_3px_0_#18181b]

        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:bg-yellow-50

        active:translate-x-0.5
        active:translate-y-0.5
        active:shadow-none

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-zinc-950
        focus-visible:ring-offset-2
      "
    >
      <span
        className={`
          relative
          z-10

          flex
          h-9
          w-9
          shrink-0

          items-center
          justify-center

          rounded-lg

          border-2
          border-zinc-950

          ${accentClass}
        `}
      >
        {icon}
      </span>

      <span
        className="
          relative
          z-10

          min-w-0
          flex-1
        "
      >
        <span
          className="
            block

            text-[10px]
            font-black
            uppercase
            leading-none
            tracking-[0.08em]
          "
        >
          {label}
        </span>

        <span
          className="
            mt-1

            block

            truncate

            font-mono

            text-[7px]
            font-bold
            uppercase
            tracking-[0.08em]

            text-zinc-500
          "
        >
          {description}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="
          relative
          z-10

          text-base
          font-black

          transition-transform

          group-hover:translate-x-0.5
        "
      >
        →
      </span>

      <ButtonOverlay />
    </button>
  );
};

/* =========================================================
   AUTH BUTTON
========================================================= */

const AuthButton = ({
  isAuthenticated,

  onLogout,

  drawer = false,

  onNavigate,
}) => {
  const buttonClass = drawer
    ? `
          h-12
          min-h-12

          w-full

          px-4

          shadow-[3px_3px_0_#18181b]
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
        onClick={() => {
          onNavigate?.();

          onLogout?.();
        }}
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
      onClick={onNavigate}
      className={buttonClass}
      indicator={<AuthIndicator authenticated={false} />}
    >
      Log In
    </NavbarButton>
  );
};

/* =========================================================
   HAMBURGER BUTTON
========================================================= */

const HamburgerButton = ({
  open,

  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={open}
      aria-controls="rotompc-mobile-drawer"
      className="
        flex
        h-10
        w-10
        shrink-0

        items-center
        justify-center

        border-0
        bg-transparent

        p-0

        text-zinc-950

        outline-none

        transition-opacity
        duration-200

        hover:opacity-60

        focus-visible:rounded-md
        focus-visible:ring-2
        focus-visible:ring-zinc-950
        focus-visible:ring-offset-2
      "
    >
      <span
        aria-hidden="true"
        className="
          flex
          w-7
          flex-col

          gap-[5px]
        "
      >
        <span className="block h-[3px] w-7 bg-zinc-950" />

        <span className="block h-[3px] w-7 bg-zinc-950" />

        <span className="block h-[3px] w-7 bg-zinc-950" />
      </span>
    </button>
  );
};

/* =========================================================
   MOBILE DRAWER
========================================================= */

const MobileDrawer = ({
  open,

  isAuthenticated,

  role,

  isAdmin,

  onClose,

  onLogout,

  onOpenBuddy,

  onOpenRotomAI,
}) => {
  const sessionLabel = isAuthenticated
    ? `${role || "trainer"} session online`
    : "guest session";

  return (
    <div
      className={`
        fixed
        inset-0

        z-[300]

        md:hidden

        ${open ? "pointer-events-auto" : "pointer-events-none"}
      `}
      aria-hidden={!open}
    >
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={`
          absolute
          inset-0

          h-full
          w-full

          border-0

          bg-black/55

          backdrop-blur-[2px]

          transition-opacity
          duration-300

          ${open ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* DRAWER */}

      <aside
        id="rotompc-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          absolute
          right-0
          top-0

          flex
          h-[100dvh]
          w-[min(88vw,360px)]

          flex-col

          border-l-[5px]
          border-zinc-950

          bg-[#f3f4f6]

          shadow-[-12px_0_35px_rgba(0,0,0,0.28)]

          transition-transform
          duration-300

          ease-[cubic-bezier(.4,0,.2,1)]

          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* HARDWARE STRIP */}

        <div
          className="
            flex
            h-6
            shrink-0

            items-center

            gap-2

            border-b-2
            border-black/20

            bg-[#cc0000]

            px-4
          "
        >
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

          <span
            className="
              h-2
              w-2

              rounded-full

              bg-[#ffcb05]
            "
          />

          <span
            className="
              h-2
              w-2

              rounded-full

              bg-[#4dad5b]
            "
          />

          <span
            className="
              ml-auto

              font-mono

              text-[7px]
              font-black
              uppercase
              tracking-[0.16em]

              text-white/60
            "
          >
            ROTOM LINK
          </span>
        </div>

        {/* DRAWER HEADER */}

        <div
          className="
            flex
            shrink-0

            items-center
            justify-between

            gap-4

            border-b-[3px]
            border-zinc-950

            px-4
            py-4
          "
        >
          <RotomLogo onClick={onClose} />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="
              flex
              h-9
              w-9
              shrink-0

              items-center
              justify-center

              rounded-xl

              border-2
              border-zinc-950

              bg-white

              text-lg
              font-black
              text-zinc-950

              shadow-[2px_2px_0_#18181b]

              transition

              hover:bg-yellow-50

              active:translate-x-0.5
              active:translate-y-0.5
              active:shadow-none
            "
          >
            ×
          </button>
        </div>

        {/* SYSTEM LABEL */}

        <div
          className="
            border-b
            border-zinc-300

            bg-zinc-200/70

            px-4
            py-3
          "
        >
          <p
            className="
              font-mono

              text-[7px]
              font-black
              uppercase
              tracking-[0.2em]

              text-zinc-500
            "
          >
            NAVIGATION SYSTEM //
          </p>

          <div
            className="
              mt-1

              flex

              items-center
              justify-between

              gap-3
            "
          >
            <p
              className="
                min-w-0

                truncate

                text-xs
                font-black
                uppercase
                tracking-wide

                text-zinc-950
              "
            >
              {isAdmin ? "Admin Terminal" : "Trainer Terminal"}
            </p>

            {isAdmin && (
              <span
                className="
                  shrink-0

                  rounded-full

                  border
                  border-[#cc0000]

                  bg-red-50

                  px-2
                  py-0.5

                  font-mono

                  text-[6px]
                  font-black
                  uppercase
                  tracking-[0.12em]

                  text-[#cc0000]
                "
              >
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* NAVIGATION */}

        <nav
          className="
            flex
            min-h-0
            flex-1
            flex-col

            gap-3

            overflow-y-auto
            overscroll-contain

            p-4
          "
        >
          <NavButtons drawer onNavigate={onClose} isAdmin={isAdmin} />

          {/* =============================================
              AUTHENTICATED MOBILE QUICK ACCESS

              Mobile only because MobileDrawer itself is
              hidden from md and above.
          ============================================== */}

          {isAuthenticated && (
            <>
              <div
                className="
                  my-1

                  flex
                  items-center

                  gap-2
                "
              >
                <span className="h-px flex-1 bg-zinc-300" />

                <span
                  className="
                    shrink-0

                    font-mono

                    text-[7px]
                    font-black
                    uppercase
                    tracking-[0.16em]

                    text-zinc-500
                  "
                >
                  QUICK ACCESS
                </span>

                <span className="h-px flex-1 bg-zinc-300" />
              </div>

              <MobileFeatureButton
                label="Buddy"
                description="Open Buddy controls"
                icon={<BuddyIcon />}
                accentClass="
                  bg-[#ffcb05]
                  text-zinc-950
                "
                onClick={onOpenBuddy}
              />

              <MobileFeatureButton
                label="RotomAI"
                description="Open research assistant"
                icon={<RotomAIIcon />}
                accentClass="
                  bg-[#00E5FF]
                  text-zinc-950
                "
                onClick={onOpenRotomAI}
              />
            </>
          )}
        </nav>

        {/* AUTH */}

        <div
          className="
            shrink-0

            border-t-[3px]
            border-zinc-950

            bg-zinc-200

            p-4

            pb-[max(16px,env(safe-area-inset-bottom))]
          "
        >
          <div
            className="
              mb-3

              flex
              items-center

              gap-2
            "
          >
            <AuthIndicator authenticated={isAuthenticated} />

            <span
              className="
                truncate

                font-mono

                text-[7px]
                font-black
                uppercase
                tracking-[0.16em]

                text-zinc-500
              "
            >
              {sessionLabel}
            </span>
          </div>

          <AuthButton
            drawer
            isAuthenticated={isAuthenticated}
            onLogout={onLogout}
            onNavigate={onClose}
          />
        </div>
      </aside>
    </div>
  );
};

/* =========================================================
   NAVBAR HANDLE
========================================================= */

const NavbarHandle = ({
  collapsed,

  onToggle,
}) => {
  return (
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

          md:right-6
          md:w-16

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
};

/* =========================================================
   NAVBAR
========================================================= */

const NavBar = ({
  collapsed = false,

  onToggle,

  onHeightChange,
}) => {
  const navigate = useNavigate();

  const location = useLocation();

  const headerRef = useRef(null);

  const [navbarHeight, setNavbarHeight] = useState(0);

  /* =======================================================
     SESSION

     Tracks BOTH:
     - authentication
     - role

     This is required so Admin navigation updates without
     requiring a page refresh after authentication.
  ======================================================= */

  const [session, setSession] = useState(() => readSessionState());

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* =======================================================
     LOGOUT MODAL
  ======================================================= */

  const [logoutOpen, setLogoutOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const isAuthenticated = session.authenticated;

  const role = session.role;

  const isAdmin = isAuthenticated && role === "admin";

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
     AUTH + ROLE SYNC
  ======================================================= */

  useEffect(() => {
    const handleAuthChange = () => {
      const nextSession = readSessionState();

      setSession(nextSession);

      if (!nextSession.authenticated) {
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
     CLOSE DRAWER AFTER NAVIGATION
  ======================================================= */

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /* =======================================================
     CLOSE DRAWER WHEN NAVBAR COLLAPSES
  ======================================================= */

  useEffect(() => {
    if (collapsed) {
      setMobileMenuOpen(false);
    }
  }, [collapsed]);

  /* =======================================================
     MOBILE DRAWER BODY LOCK + ESCAPE
  ======================================================= */

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  /* =======================================================
     AUTO-CLOSE MOBILE DRAWER AT DESKTOP SIZE
  ======================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =======================================================
     MOBILE BUDDY / ROTOMAI LAUNCHERS
  ======================================================= */

  const openMobileFeature = (feature) => {
    if (!isAuthenticated) {
      navigate("/auth/signin");

      return;
    }

    /*
     * Close the drawer first so it no longer intercepts
     * pointer events over the floating launcher.
     */
    setMobileMenuOpen(false);

    /*
     * Drawer animation is 300 ms.
     *
     * Wait slightly longer before activating the
     * underlying floating control.
     */
    window.setTimeout(() => {
      const launcher = findVisibleFeatureLauncher(feature);

      if (launcher) {
        launcher.click();

        return;
      }

      /*
       * Fallback for Buddy / Rotom components that
       * expose global event-based opening instead.
       */
      emitFeatureOpenEvent(feature);
    }, 320);
  };

  /* =======================================================
     REQUEST LOGOUT
  ======================================================= */

  const handleLogoutRequest = () => {
    if (loggingOut) {
      return;
    }

    setMobileMenuOpen(false);

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
     * Do not delete:
     * - Buddy state
     * - berries
     * - profile data
     * - RotomAI history
     */

    clearAuthSession();

    setSession({
      authenticated: false,

      role: "",
    });

    setLogoutOpen(false);

    setMobileMenuOpen(false);

    navigate("/", {
      replace: true,
    });
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      {/* =================================================
          MAIN NAVBAR
      ================================================== */}

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
          {/* HARDWARE STRIP */}

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

              md:px-6
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

            <div
              className="
                flex

                gap-1.5
              "
            >
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

                  md:block
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

          {/* =================================================
              MOBILE < 768px
          ================================================== */}

          <div
            className="
              mx-auto

              flex
              min-h-[64px]
              w-full
              max-w-7xl

              items-center
              justify-between

              gap-3

              px-3
              py-2

              md:hidden
            "
          >
            <RotomLogo
              onClick={() => {
                setMobileMenuOpen(false);
              }}
            />

            <HamburgerButton
              open={mobileMenuOpen}
              onClick={() => {
                setMobileMenuOpen((current) => !current);
              }}
            />
          </div>

          {/* =================================================
              TABLET / DESKTOP >= 768px
          ================================================== */}

          <div
            className="
              relative

              mx-auto

              hidden
              h-20
              max-w-7xl

              items-center
              justify-between

              gap-3

              px-4

              md:flex

              lg:gap-4
              lg:px-8
            "
          >
            <RotomLogo />

            <nav
              className="
                flex
                min-w-0

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
              <NavButtons isAdmin={isAdmin} />
            </nav>

            <AuthButton
              isAuthenticated={isAuthenticated}
              onLogout={handleLogoutRequest}
            />
          </div>
        </header>

        <NavbarHandle collapsed={collapsed} onToggle={onToggle} />
      </div>

      {/* =================================================
          MOBILE SIDE DRAWER
      ================================================== */}

      <MobileDrawer
        open={mobileMenuOpen}
        isAuthenticated={isAuthenticated}
        role={role}
        isAdmin={isAdmin}
        onClose={() => {
          setMobileMenuOpen(false);
        }}
        onLogout={handleLogoutRequest}
        onOpenBuddy={() => {
          openMobileFeature("buddy");
        }}
        onOpenRotomAI={() => {
          openMobileFeature("rotom");
        }}
      />

      {/* =================================================
          LOGOUT CONFIRMATION
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
