// rotompc-client/src/layouts/AuthLayout.jsx

import { Outlet, useLocation } from "react-router-dom";

/* =========================================================
   ARTWORK
========================================================= */

const LOGIN_ARTWORK =
  "https://ik.imagekit.io/ytwzizvepv/RotomPC/Klefki-LogIn.png?updatedAt=1775751142800";

const SIGNUP_ARTWORK =
  "https://ik.imagekit.io/ytwzizvepv/RotomPC/RotomPC-SignUp.png?updatedAt=1775751231924";

/* =========================================================
   PRESENTATION
========================================================= */

const getAuthPresentation = (pathname) => {
  if (pathname.includes("complete-profile")) {
    return {
      image: SIGNUP_ARTWORK,

      imageAlt: "RotomPC Trainer profile artwork",

      badge: "ID SETUP",

      eyebrow: "Trainer ID Setup",

      title: "Complete your Trainer ID.",

      description:
        "Add the remaining details required to activate your RotomPC Trainer profile.",
    };
  }

  if (pathname.includes("signup")) {
    return {
      image: SIGNUP_ARTWORK,

      imageAlt: "RotomPC Trainer registration artwork",

      badge: "ROTOMPC ONLINE",

      eyebrow: "New Trainer Registration",

      title: "Register Now, Trainer! ^v^",

      description:
        "Create your RotomPC account and join the PokéSocial trainer network.",
    };
  }

  return {
    image: LOGIN_ARTWORK,

    imageAlt: "Klefki RotomPC login artwork",

    badge: "ROTOMPC ONLINE",

    eyebrow: "Trainer Login",

    title: "Welcome back, Trainer! ^v^",

    description:
      "Reconnect to your Trainer profile, Buddy, PokéSocial, and RotomPC.",
  };
};

/* =========================================================
   ROTOMPC BRAND
========================================================= */

const RotomPCBrand = () => {
  return (
    <div
      className="
          flex
          items-center
          gap-3
        "
    >
      <div
        className="
            relative

            flex
            h-11
            w-11
            shrink-0

            items-center
            justify-center

            rounded-full

            border-[3px]
            border-zinc-950

            bg-zinc-900

            shadow-[3px_3px_0_rgba(0,0,0,.14)]
          "
      >
        <div
          className="
              relative

              h-7
              w-7

              overflow-hidden

              rounded-full

              border-2
              border-cyan-100

              bg-gradient-to-br
              from-cyan-200
              via-blue-500
              to-blue-800

              shadow-[inset_0_0_10px_rgba(255,255,255,.55),0_0_10px_rgba(59,130,246,.35)]
            "
        >
          <span
            className="
                absolute

                left-1
                top-1

                h-2.5
                w-2.5

                rounded-full

                bg-white/75

                blur-[1px]
              "
          />
        </div>
      </div>

      <div>
        <p
          className="
              font-display

              text-xl
              font-bold
              uppercase
              italic
              leading-none
              tracking-tight

              text-zinc-950
            "
        >
          ROTOM
          <span
            className="
                text-[#ff1c1c]
              "
          >
            PC
          </span>
        </p>

        <p
          className="
              mt-1

              font-mono

              text-[8px]
              font-black
              uppercase
              tracking-[0.16em]

              text-zinc-400
            "
        >
          Trainer Network
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   MOBILE ARTWORK

   Full artwork visible.
   Branding/page information belongs here on mobile.
========================================================= */

const MobileArtwork = ({ presentation }) => {
  return (
    <section
      className="
        relative

        w-full
        shrink-0

        overflow-hidden

        border-b-[3px]
        border-zinc-950

        bg-zinc-900

        lg:hidden
      "
    >
      {/* =================================================
          COMPLETE IMAGE

          No fixed height.
          No object-cover.
          No cropping.
      ================================================== */}

      <img
        src={presentation.image}
        alt={presentation.imageAlt}
        className="
          block

          h-auto
          w-full

          object-contain
        "
        style={{
          imageRendering: "auto",
        }}
      />

      {/* =================================================
          VERY LIGHT CONTRAST

          Only mobile has overlays.
      ================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-0

          bg-gradient-to-b

          from-black/10
          via-transparent
          to-black/25
        "
      />

      {/* =================================================
          MOBILE TOP BAR
      ================================================== */}

      <div
        className="
          absolute

          left-3
          right-3
          top-3

          flex
          items-start
          justify-between
          gap-2

          sm:left-5
          sm:right-5
          sm:top-5
        "
      >
        {/* ROTOMPC */}

        <div
          className="
            flex
            min-w-0
            items-center
            gap-2

            rounded-xl

            border-2
            border-zinc-950

            bg-white/95

            px-2.5
            py-2

            shadow-[2px_2px_0_#18181b]

            backdrop-blur-md
          "
        >
          <div
            className="
              relative

              flex
              h-7
              w-7
              shrink-0

              items-center
              justify-center

              rounded-full

              border-2
              border-zinc-950

              bg-zinc-900
            "
          >
            <div
              className="
                relative

                h-[18px]
                w-[18px]

                overflow-hidden

                rounded-full

                border
                border-cyan-100

                bg-gradient-to-br
                from-cyan-200
                via-blue-500
                to-blue-800
              "
            >
              <span
                className="
                  absolute

                  left-[3px]
                  top-[3px]

                  h-1.5
                  w-1.5

                  rounded-full

                  bg-white/75
                "
              />
            </div>
          </div>

          <div
            className="
              min-w-0
            "
          >
            <p
              className="
                font-display

                text-[13px]
                font-bold
                uppercase
                italic
                leading-none
                tracking-tight

                text-zinc-950
              "
            >
              ROTOM
              <span
                className="
                  text-[#ff1c1c]
                "
              >
                PC
              </span>
            </p>

            <p
              className="
                mt-0.5

                truncate

                font-mono

                text-[5px]
                font-black
                uppercase
                tracking-[0.11em]

                text-zinc-400
              "
            >
              Trainer Network
            </p>
          </div>
        </div>

        {/* STATUS */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-1.5

            rounded-lg

            border-2
            border-zinc-950

            bg-white/95

            px-2
            py-1.5

            shadow-[2px_2px_0_#18181b]

            backdrop-blur-md
          "
        >
          <span
            className="
              h-1.5
              w-1.5

              rounded-full

              bg-green-500
            "
          />

          <span
            className="
              font-mono

              text-[6px]
              font-black
              uppercase
              tracking-[0.08em]

              text-zinc-700
            "
          >
            {presentation.badge}
          </span>
        </div>
      </div>

      {/* =================================================
          CURRENT PAGE

          Kept compact so it does not cover too much art.
      ================================================== */}

      <div
        className="
          absolute

          bottom-3
          left-3

          max-w-[75%]

          sm:bottom-5
          sm:left-5
        "
      >
        <div
          className="
            rounded-xl

            border-2
            border-zinc-950

            bg-white/95

            px-3
            py-2.5

            shadow-[2px_2px_0_#18181b]

            backdrop-blur-md
          "
        >
          <p
            className="
              font-mono

              text-[6px]
              font-black
              uppercase
              tracking-[0.13em]

              text-[#cc0000]
            "
          >
            {presentation.eyebrow}
          </p>

          <h1
            className="
              mt-1

              font-display

              text-base
              font-bold
              leading-tight
              tracking-tight

              text-zinc-950

              sm:text-lg
            "
          >
            {presentation.title}
          </h1>
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   DESKTOP ARTWORK

   Nothing overlays the desktop artwork.
========================================================= */

const DesktopArtwork = ({ presentation }) => {
  return (
    <aside
      className="
        relative

        hidden

        h-full
        min-h-0
        w-full

        overflow-hidden

        border-r-[3px]
        border-zinc-950

        bg-zinc-200

        lg:block
      "
    >
      <img
        src={presentation.image}
        alt={presentation.imageAlt}
        className="
          absolute
          inset-0

          h-full
          w-full

          object-cover
          object-center
        "
        style={{
          imageRendering: "auto",
        }}
      />
    </aside>
  );
};

/* =========================================================
   AUTH LAYOUT
========================================================= */

const AuthLayout = () => {
  const location = useLocation();

  const presentation = getAuthPresentation(location.pathname);

  return (
    <section
      className="
        min-h-dvh
        w-full

        overflow-x-hidden

        bg-zinc-100

        text-zinc-900

        lg:h-dvh
        lg:overflow-hidden
      "
    >
      <div
        className="
          flex
          min-h-dvh
          w-full
          flex-col

          lg:grid
          lg:h-full
          lg:min-h-0
          lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,.95fr)]
        "
      >
        {/* =================================================
            MOBILE ART
        ================================================== */}

        <MobileArtwork presentation={presentation} />

        {/* =================================================
            DESKTOP ART
        ================================================== */}

        <DesktopArtwork presentation={presentation} />

        {/* =================================================
            FORM SIDE
        ================================================== */}

        <main
          className="
            relative

            min-w-0

            bg-[#fafafa]

            lg:h-full
            lg:overflow-y-auto
          "
        >
          {/* BACKGROUND GRID */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none

              absolute
              inset-0

              opacity-[0.025]

              bg-[linear-gradient(#18181b_1px,transparent_1px),linear-gradient(90deg,#18181b_1px,transparent_1px)]
              bg-[size:24px_24px]
            "
          />

          {/* ===============================================
              PANEL INNER

              IMPORTANT:

              Mobile has NO vertical centering and almost
              no top padding.

              Desktop gets min-height + centering.
          ================================================ */}

          <div
            className="
              relative

              mx-auto

              w-full
              max-w-2xl

              px-5
              pb-5
              pt-4

              sm:px-8
              sm:pb-7
              sm:pt-5

              lg:flex
              lg:min-h-full
              lg:flex-col
              lg:px-12
              lg:py-12

              xl:px-16
            "
          >
            {/* =============================================
                DESKTOP BRAND ONLY
            ============================================== */}

            <div
              className="
                hidden

                lg:block
              "
            >
              <RotomPCBrand />
            </div>

            {/* =============================================
                PAGE CONTENT

                MOBILE:
                starts immediately after artwork.

                DESKTOP:
                vertically centered.
            ============================================== */}

            <div
              className="
                w-full

                lg:my-auto
                lg:py-10
              "
            >
              <Outlet />
            </div>

            {/* =============================================
                FOOTER

                Small natural spacing on mobile.
            ============================================== */}

            <footer
              className="
                mt-6

                flex
                flex-wrap

                items-center
                justify-between

                gap-2

                border-t
                border-zinc-200

                pt-3

                font-mono

                text-[7px]
                font-bold
                uppercase
                tracking-[0.1em]

                text-zinc-400

                lg:mt-auto
                lg:border-t-2
                lg:pt-4
              "
            >
              <span>ROTOMPC NETWORK</span>

              <span>SECURE TRAINER LINK</span>
            </footer>
          </div>
        </main>
      </div>
    </section>
  );
};

export default AuthLayout;
