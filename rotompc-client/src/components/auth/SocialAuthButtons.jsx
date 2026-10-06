// filepath: rotompc-client/src/components/auth/SocialAuthButtons.jsx

import { useCallback, useEffect, useRef, useState } from "react";

import * as userService from "@/services/UserService";

/* =========================================================
   CONFIG
========================================================= */

const GOOGLE_CLIENT_ID = String(
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
).trim();

const FACEBOOK_APP_ID = String(
  import.meta.env.VITE_FACEBOOK_APP_ID || "",
).trim();

const FACEBOOK_GRAPH_VERSION = String(
  import.meta.env.VITE_FACEBOOK_GRAPH_VERSION || "",
).trim();

/* =========================================================
   GOOGLE SDK SINGLETON
========================================================= */

let googleSdkPromise = null;

let googleInitializedClientId = null;

let currentGoogleCredentialHandler = null;

/* =========================================================
   FACEBOOK SDK SINGLETON
========================================================= */

let facebookSdkPromise = null;

let facebookInitializedAppId = null;

/* =========================================================
   GOOGLE SDK
========================================================= */

const loadGoogleSdk = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (googleSdkPromise) {
    return googleSdkPromise;
  }

  googleSdkPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-identity-services");

    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          if (window.google?.accounts?.id) {
            resolve(window.google);
          } else {
            googleSdkPromise = null;

            reject(new Error("Google Identity Services could not be loaded."));
          }
        },
        {
          once: true,
        },
      );

      existing.addEventListener(
        "error",
        () => {
          googleSdkPromise = null;

          reject(new Error("Unable to load Google authentication."));
        },
        {
          once: true,
        },
      );

      return;
    }

    const script = document.createElement("script");

    script.id = "google-identity-services";

    script.src = "https://accounts.google.com/gsi/client";

    script.async = true;

    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google);
      } else {
        googleSdkPromise = null;

        reject(new Error("Google Identity Services could not be initialized."));
      }
    };

    script.onerror = () => {
      googleSdkPromise = null;

      reject(new Error("Unable to load Google authentication."));
    };

    document.head.appendChild(script);
  });

  return googleSdkPromise;
};

/* =========================================================
   FACEBOOK SDK
========================================================= */

const loadFacebookSdk = () => {
  if (!FACEBOOK_APP_ID) {
    return Promise.reject(new Error("Facebook App ID is not configured."));
  }

  if (!FACEBOOK_GRAPH_VERSION) {
    return Promise.reject(
      new Error("Facebook Graph API version is not configured."),
    );
  }

  if (window.FB && facebookInitializedAppId === FACEBOOK_APP_ID) {
    return Promise.resolve(window.FB);
  }

  if (facebookSdkPromise) {
    return facebookSdkPromise;
  }

  facebookSdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: FACEBOOK_GRAPH_VERSION,
        });

        facebookInitializedAppId = FACEBOOK_APP_ID;

        resolve(window.FB);
      } catch (error) {
        facebookSdkPromise = null;

        reject(error);
      }
    };

    const existing = document.getElementById("facebook-jssdk");

    if (existing) {
      return;
    }

    const script = document.createElement("script");

    script.id = "facebook-jssdk";

    script.src = "https://connect.facebook.net/en_US/sdk.js";

    script.async = true;

    script.defer = true;

    script.crossOrigin = "anonymous";

    script.onerror = () => {
      facebookSdkPromise = null;

      reject(new Error("Unable to load Facebook authentication."));
    };

    document.head.appendChild(script);
  });

  return facebookSdkPromise;
};

/* =========================================================
   GOOGLE ICON
========================================================= */

const GoogleIcon = ({ className = "h-6 w-6" }) => {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.509h3.232c1.891-1.741 2.981-4.309 2.981-7.35Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.968-.895 6.623-2.423l-3.232-2.509c-.895.6-2.041.955-3.391.955-2.605 0-4.809-1.759-5.595-4.123H3.064v2.591A9.998 9.998 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.405 13.9A6.015 6.015 0 0 1 6.091 12c0-.659.114-1.3.314-1.9V7.509H3.064A9.995 9.995 0 0 0 2 12c0 1.614.386 3.141 1.064 4.491L6.405 13.9Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496L18.696 4.6C16.964 2.986 14.695 2 12 2a9.998 9.998 0 0 0-8.936 5.509L6.405 10.1C7.191 7.736 9.395 5.977 12 5.977Z"
      />
    </svg>
  );
};

/* =========================================================
   FACEBOOK ICON
========================================================= */

const FacebookIcon = ({ className = "h-6 w-6" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="
          M13.397 21
          v-8.21
          h2.765
          l.414-3.2
          h-3.179
          V7.547
          c0-.927
          .258-1.558
          1.59-1.558
          h1.697
          V3.127
          C16.391 3.088
          15.384 3
          14.212 3
          c-2.445 0
          -4.12 1.492
          -4.12 4.231
          V9.59
          H7.326
          v3.2
          h2.766
          V21
          h3.305
          Z
        "
      />
    </svg>
  );
};

/* =========================================================
   TOOLTIP
========================================================= */

const ProviderTooltip = ({ provider }) => {
  return (
    <span
      className="
        pointer-events-none

        absolute
        bottom-[calc(100%+8px)]
        left-1/2
        z-40

        -translate-x-1/2
        translate-y-1

        whitespace-nowrap

        rounded-md

        border
        border-zinc-800

        bg-zinc-950

        px-2
        py-1

        font-mono

        text-[7px]
        font-black
        uppercase
        tracking-[0.08em]

        text-white

        opacity-0

        shadow-md

        transition

        group-hover:translate-y-0
        group-hover:opacity-100
      "
    >
      {provider}
    </span>
  );
};

/* =========================================================
   LOADING SPINNER
========================================================= */

const LoadingSpinner = () => {
  return (
    <span
      aria-hidden="true"
      className="
        h-5
        w-5

        animate-spin

        rounded-full

        border-2
        border-current
        border-r-transparent
      "
    />
  );
};

/* =========================================================
   GOOGLE BUTTON

   The visible Google icon is OUR visual layer.

   Google's official button is rendered on top at almost
   zero opacity so the real Google authentication target
   still receives the click.

   This prevents the Google logo from disappearing when
   Google's rendered icon/button has styling/render issues.
========================================================= */

const GoogleAuthButton = ({
  googleButtonRef,

  loading,

  disabled,

  configured,

  ready,

  failed,
}) => {
  const unavailable = !configured || failed;

  return (
    <div
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

        ${disabled || unavailable ? "opacity-50" : ""}
      `}
      title={
        !configured
          ? "Google authentication is not configured"
          : failed
            ? "Google authentication is unavailable"
            : ready
              ? "Continue with Google"
              : "Loading Google authentication"
      }
    >
      {/* ===============================================
          PERMANENT VISIBLE GOOGLE BUTTON
      ================================================ */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-0
          z-10

          flex
          items-center
          justify-center

          overflow-hidden

          rounded-xl

          border-2
          border-zinc-300

          bg-white

          shadow-[2px_2px_0_rgba(24,24,27,.18)]

          transition-all
          duration-150

          group-hover:border-zinc-950
          group-hover:bg-zinc-50
          group-hover:shadow-[3px_3px_0_#18181b]
        "
      >
        <GoogleIcon className="block h-6 w-6 shrink-0" />
      </div>

      {/* ===============================================
          GOOGLE'S REAL CLICK TARGET

          It stays over our visible icon once ready.
      ================================================ */}

      <div
        ref={googleButtonRef}
        className={`
          absolute
          inset-0
          z-20

          flex
          h-12
          w-12

          items-center
          justify-center

          overflow-hidden

          rounded-xl

          ${
            ready && !disabled && !unavailable
              ? "cursor-pointer opacity-[0.01]"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      {/* ===============================================
          SDK LOADING INDICATOR
      ================================================ */}

      {configured && !ready && !failed && !loading && (
        <span
          className="
              pointer-events-none

              absolute
              bottom-1
              right-1
              z-30

              h-2
              w-2

              animate-pulse

              rounded-full

              border
              border-white

              bg-[#4285F4]

              shadow-sm
            "
        />
      )}

      {/* ===============================================
          AUTH REQUEST LOADING
      ================================================ */}

      {loading && (
        <div
          className="
            absolute
            inset-0
            z-30

            flex
            items-center
            justify-center

            rounded-xl

            border-2
            border-zinc-400

            bg-white

            text-[#4285F4]
          "
        >
          <LoadingSpinner />
        </div>
      )}

      {/* ===============================================
          UNAVAILABLE BLOCKER
      ================================================ */}

      {(disabled || unavailable) && !loading && (
        <div
          aria-hidden="true"
          className="
              absolute
              inset-0
              z-30

              cursor-not-allowed

              rounded-xl

              bg-white/10
            "
        />
      )}

      <ProviderTooltip
        provider={
          !configured
            ? "Google not configured"
            : failed
              ? "Google unavailable"
              : ready
                ? "Google"
                : "Loading Google"
        }
      />
    </div>
  );
};

/* =========================================================
   FACEBOOK BUTTON
========================================================= */

const FacebookAuthButton = ({
  onClick,

  loading,

  disabled,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Continue with Facebook"
      title="Continue with Facebook"
      className="
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
        border-[#145dbf]

        bg-[#1877F2]

        text-white

        shadow-[2px_2px_0_rgba(24,24,27,.18)]

        transition-all
        duration-150

        hover:-translate-y-0.5
        hover:border-zinc-950
        hover:bg-[#166fe5]
        hover:shadow-[3px_3px_0_#18181b]

        focus:outline-none
        focus:ring-[3px]
        focus:ring-[#1877F2]/25

        active:translate-x-[1px]
        active:translate-y-[1px]
        active:shadow-[1px_1px_0_#18181b]

        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {loading ? <LoadingSpinner /> : <FacebookIcon />}

      <ProviderTooltip provider="Facebook" />
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
  const googleButtonRef = useRef(null);

  const [activeProvider, setActiveProvider] = useState(null);

  const [googleReady, setGoogleReady] = useState(false);

  const [googleFailed, setGoogleFailed] = useState(false);

  const [facebookReady, setFacebookReady] = useState(false);

  /* =======================================================
     GOOGLE RESPONSE
  ======================================================= */

  const handleGoogleCredential = useCallback(
    async (credentialResponse) => {
      const credential = credentialResponse?.credential;

      if (!credential) {
        onError?.("Google did not return a valid credential.");

        return;
      }

      setActiveProvider("google");

      onError?.("");

      try {
        const response = await userService.googleAuth(credential);

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
    },
    [onAuthenticated, onError],
  );

  /* =======================================================
     GOOGLE INITIALIZATION
  ======================================================= */

  useEffect(() => {
    setGoogleReady(false);

    setGoogleFailed(false);

    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return undefined;
    }

    let cancelled = false;

    currentGoogleCredentialHandler = handleGoogleCredential;

    loadGoogleSdk()
      .then((google) => {
        if (cancelled || !googleButtonRef.current) {
          return;
        }

        if (googleInitializedClientId !== GOOGLE_CLIENT_ID) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,

            callback: (response) => {
              currentGoogleCredentialHandler?.(response);
            },
          });

          googleInitializedClientId = GOOGLE_CLIENT_ID;
        }

        googleButtonRef.current.innerHTML = "";

        google.accounts.id.renderButton(googleButtonRef.current, {
          type: "icon",

          theme: "outline",

          size: "large",

          shape: "square",

          text: mode === "signup" ? "signup_with" : "signin_with",
        });

        if (!cancelled) {
          setGoogleReady(true);

          setGoogleFailed(false);
        }
      })
      .catch((error) => {
        console.error("Google SDK error:", error);

        if (!cancelled) {
          setGoogleReady(false);

          setGoogleFailed(true);
        }
      });

    return () => {
      cancelled = true;

      if (currentGoogleCredentialHandler === handleGoogleCredential) {
        currentGoogleCredentialHandler = null;
      }
    };
  }, [handleGoogleCredential, mode]);

  /* =======================================================
     FACEBOOK PRELOAD
  ======================================================= */

  useEffect(() => {
    if (!FACEBOOK_APP_ID || !FACEBOOK_GRAPH_VERSION) {
      setFacebookReady(false);

      return undefined;
    }

    let cancelled = false;

    loadFacebookSdk()
      .then(() => {
        if (!cancelled) {
          setFacebookReady(true);
        }
      })
      .catch((error) => {
        console.error("Facebook SDK error:", error);

        if (!cancelled) {
          setFacebookReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     FACEBOOK LOGIN
  ======================================================= */

  const handleFacebookAuth = async () => {
    if (activeProvider) {
      return;
    }

    onError?.("");

    if (
      !FACEBOOK_APP_ID ||
      !FACEBOOK_GRAPH_VERSION ||
      !facebookReady ||
      !window.FB
    ) {
      return;
    }

    try {
      const authResponse = await new Promise((resolve, reject) => {
        window.FB.login(
          (response) => {
            if (
              response?.status === "connected" &&
              response?.authResponse?.accessToken
            ) {
              resolve(response.authResponse);

              return;
            }

            reject(
              new Error("Facebook sign-in was cancelled or not authorized."),
            );
          },
          {
            scope: "public_profile,email",

            return_scopes: true,
          },
        );
      });

      setActiveProvider("facebook");

      const response = await userService.facebookAuth(authResponse.accessToken);

      onAuthenticated?.(response.data);
    } catch (error) {
      console.error("Facebook authentication error:", error);

      onError?.(
        error.response?.data?.message ||
          error.message ||
          "Facebook authentication failed.",
      );
    } finally {
      setActiveProvider(null);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  const googleConfigured = Boolean(GOOGLE_CLIENT_ID);

  const facebookConfigured = Boolean(FACEBOOK_APP_ID && FACEBOOK_GRAPH_VERSION);

  /*
   * Facebook stays completely out of the DOM
   * until its SDK is actually available.
   */
  const showFacebook = facebookConfigured && facebookReady;

  return (
    <div
      className="
        flex
        items-center
        justify-center
        gap-3
      "
    >
      <GoogleAuthButton
        googleButtonRef={googleButtonRef}
        loading={activeProvider === "google"}
        disabled={Boolean(activeProvider) && activeProvider !== "google"}
        configured={googleConfigured}
        ready={googleReady}
        failed={googleFailed}
      />

      {showFacebook && (
        <FacebookAuthButton
          onClick={handleFacebookAuth}
          loading={activeProvider === "facebook"}
          disabled={Boolean(activeProvider)}
        />
      )}
    </div>
  );
};

export default SocialAuthButtons;
