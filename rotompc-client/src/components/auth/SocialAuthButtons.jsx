// rotompc-client/src/components/auth/SocialAuthButtons.jsx

import { useState } from "react";

import * as userService from "@/services/UserService";

/* =========================================================
   GOOGLE ICON
========================================================= */

const GoogleIcon = ({ className = "h-6 w-6" }) => {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="
          M21.805 10.023
          H12
          v3.955
          h5.617
          c-.242 1.273
          -.969 2.352
          -2.063 3.078
          v2.563
          h3.336
          c1.953-1.797
          3.078-4.445
          3.078-7.586
          0-.695
          -.062-1.367
          -.163-2.01
        "
      />

      <path
        fill="#34A853"
        d="
          M12 22
          c2.805 0
          5.156-.93
          6.89-2.523
          l-3.336-2.563
          c-.93.625
          -2.117.992
          -3.554.992
          -2.711 0
          -5.008-1.828
          -5.828-4.289
          H2.727
          v2.648
          C4.453 19.695
          7.969 22
          12 22
        "
      />

      <path
        fill="#FBBC05"
        d="
          M6.172 13.617
          A5.99 5.99 0 0 1
          5.86 12
          c0-.563.11-1.102.312-1.617
          V7.734
          H2.727
          A10.012 10.012 0 0 0
          2 12
          c0 1.602.383 3.117
          1.063 4.266
          z
        "
      />

      <path
        fill="#EA4335"
        d="
          M12 6.094
          c1.523 0
          2.89.523
          3.969 1.555
          l2.969-2.97
          C17.156 3.016
          14.805 2
          12 2
          7.969 2
          4.453 4.305
          2.727 7.734
          l3.445 2.649
          C6.992 7.922
          9.289 6.094
          12 6.094
        "
      />
    </svg>
  );
};

/* =========================================================
   APPLE / IOS ICON
========================================================= */

const AppleIcon = ({ className = "h-7 w-7" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="
          M17.05 20.28
          c-.98.95
          -2.05.8
          -3.08.35
          -1.09-.46
          -2.09-.48
          -3.24 0
          -1.44.62
          -2.2.44
          -3.06-.35
          C2.79 15.25
          3.51 7.59
          9.05 7.31
          c1.35.07
          2.29.74
          3.08.79
          1.18-.24
          2.31-.93
          3.57-.84
          1.51.12
          2.65.72
          3.4 1.8
          -3.12 1.87
          -2.38 5.98
          .48 7.13
          -.57 1.5
          -1.31 2.99
          -2.53 4.09
          Z

          M12.03 7.25
          C11.88 5.02
          13.69 3.18
          15.77 3
          c.29 2.58
          -2.34 4.5
          -3.74 4.25
          Z
        "
      />
    </svg>
  );
};

/* =========================================================
   SOCIAL AUTH BUTTON
========================================================= */

const SocialIconButton = ({
  provider,
  disabled = false,
  loading = false,
  onClick,
  children,
}) => {
  const isGoogle = provider === "Google";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`Continue with ${provider}`}
      title={`Continue with ${provider}`}
      className={`
        group

        relative

        flex
        h-12
        w-12
        shrink-0

        items-center
        justify-center

        rounded-xl

        border-2
        border-zinc-400

        transition-all
        duration-150

        focus:outline-none
        focus:ring-[3px]
        focus:ring-[#3b4cca]/20

        disabled:cursor-not-allowed
        disabled:opacity-50

        ${
          isGoogle
            ? `
              bg-white
              text-zinc-950

              hover:-translate-y-0.5
              hover:border-zinc-600
              hover:bg-zinc-50

              hover:shadow-[2px_2px_0_#18181b]
            `
            : `
              bg-zinc-950
              text-white

              hover:-translate-y-0.5
              hover:bg-zinc-800

              hover:shadow-[2px_2px_0_#18181b]
            `
        }
      `}
    >
      {loading ? (
        <span
          className="
            h-5
            w-5

            animate-spin

            rounded-full

            border-2
            border-current
            border-r-transparent

            opacity-70
          "
          aria-hidden="true"
        />
      ) : (
        children
      )}

      {/* Tooltip */}

      <span
        className="
          pointer-events-none

          absolute

          bottom-[calc(100%+8px)]
          left-1/2

          z-20

          -translate-x-1/2
          translate-y-1

          whitespace-nowrap

          rounded-md

          border
          border-zinc-800

          bg-zinc-950

          px-2
          py-1

          text-[8px]
          font-black
          uppercase
          tracking-[0.08em]

          text-white

          opacity-0

          shadow-md

          transition

          group-hover:translate-y-0
          group-hover:opacity-100

          group-focus-visible:translate-y-0
          group-focus-visible:opacity-100
        "
      >
        {provider}
      </span>
    </button>
  );
};

/* =========================================================
   SOCIAL AUTH
========================================================= */

const SocialAuthButtons = ({
  mode = "signin",

  onAuthenticated,

  onError,
}) => {
  const [activeProvider, setActiveProvider] = useState(null);

  /* =======================================================
     GOOGLE

     Keep your existing Google auth implementation here
     if yours already uses GIS / Google Identity Services.
  ======================================================= */

  const handleGoogleAuth = async () => {
    if (activeProvider) {
      return;
    }

    setActiveProvider("google");

    onError?.("");

    try {
      /*
       * If your existing UserService function has
       * another name, keep your existing call here.
       *
       * Expected result:
       *
       * {
       *   data: {
       *     token,
       *     id,
       *     role,
       *     ...
       *   }
       * }
       */

      if (typeof userService.continueWithGoogle !== "function") {
        throw new Error("Google authentication service is not configured.");
      }

      const response = await userService.continueWithGoogle({
        mode,
      });

      onAuthenticated?.(response.data);
    } catch (error) {
      console.error("Google authentication error:", error);

      onError?.(
        error.response?.data?.message ||
          error.message ||
          "Google authentication failed.",
      );
    } finally {
      setActiveProvider(null);
    }
  };

  /* =======================================================
     APPLE

     Keep your existing Apple auth implementation here
     if yours already opens Apple Sign In.
  ======================================================= */

  const handleAppleAuth = async () => {
    if (activeProvider) {
      return;
    }

    setActiveProvider("apple");

    onError?.("");

    try {
      if (typeof userService.continueWithApple !== "function") {
        throw new Error("Apple authentication service is not configured.");
      }

      const response = await userService.continueWithApple({
        mode,
      });

      onAuthenticated?.(response.data);
    } catch (error) {
      console.error("Apple authentication error:", error);

      onError?.(
        error.response?.data?.message ||
          error.message ||
          "Apple authentication failed.",
      );
    } finally {
      setActiveProvider(null);
    }
  };

  /* =======================================================
     UI

     Icons only.
     No "Continue with Google".
     No "Continue with Apple".
  ======================================================= */

  return (
    <div
      className="
        flex
        items-center
        justify-center
        gap-3
      "
    >
      <SocialIconButton
        provider="Google"
        disabled={Boolean(activeProvider)}
        loading={activeProvider === "google"}
        onClick={handleGoogleAuth}
      >
        <GoogleIcon />
      </SocialIconButton>

      <SocialIconButton
        provider="Apple"
        disabled={Boolean(activeProvider)}
        loading={activeProvider === "apple"}
        onClick={handleAppleAuth}
      >
        <AppleIcon />
      </SocialIconButton>
    </div>
  );
};

export default SocialAuthButtons;
