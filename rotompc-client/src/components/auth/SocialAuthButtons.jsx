// rotompc-client/src/components/auth/SocialAuthButtons.jsx

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
      /*
       * Script may already be
       * loading. fbAsyncInit above
       * will run when ready.
       */
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

        z-30

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
   GOOGLE BUTTON WRAPPER
========================================================= */

const GoogleAuthButton = ({
  googleButtonRef,
  loading,
  disabled,
  configured,
}) => {
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

        ${disabled || !configured ? "opacity-50" : ""}
      `}
      title={
        configured
          ? "Continue with Google"
          : "Google authentication is not configured"
      }
    >
      <div
        ref={googleButtonRef}
        className="
          flex
          h-12
          w-12

          items-center
          justify-center

          overflow-hidden

          rounded-xl
        "
      />

      {loading && (
        <div
          className="
            absolute
            inset-0

            z-20

            flex
            items-center
            justify-center

            rounded-xl

            border-2
            border-zinc-400

            bg-white

            text-zinc-700
          "
        >
          <LoadingSpinner />
        </div>
      )}

      {disabled && !loading && (
        <div
          aria-hidden="true"
          className="
              absolute
              inset-0

              z-10

              cursor-not-allowed

              rounded-xl

              bg-white/10
            "
        />
      )}

      <ProviderTooltip provider="Google" />
    </div>
  );
};

/* =========================================================
   FACEBOOK BUTTON
========================================================= */

const FacebookAuthButton = ({ onClick, loading, disabled, configured }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !configured}
      aria-label="Continue with Facebook"
      title={
        configured
          ? "Continue with Facebook"
          : "Facebook authentication is not configured"
      }
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
      })
      .catch((error) => {
        console.error("Google SDK error:", error);
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

     Preload before click so FB.login()
     is invoked directly from the user's
     click event.
  ======================================================= */

  useEffect(() => {
    if (!FACEBOOK_APP_ID || !FACEBOOK_GRAPH_VERSION) {
      return;
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

    if (!FACEBOOK_APP_ID) {
      onError?.("Facebook authentication is not configured.");

      return;
    }

    if (!FACEBOOK_GRAPH_VERSION) {
      onError?.("Facebook Graph API version is not configured.");

      return;
    }

    if (!facebookReady || !window.FB) {
      onError?.("Facebook authentication is still loading. Please try again.");

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

  const facebookConfigured = Boolean(FACEBOOK_APP_ID && FACEBOOK_GRAPH_VERSION);

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
        configured={Boolean(GOOGLE_CLIENT_ID)}
      />

      <FacebookAuthButton
        onClick={handleFacebookAuth}
        loading={activeProvider === "facebook"}
        disabled={Boolean(activeProvider) || !facebookReady}
        configured={facebookConfigured}
      />
    </div>
  );
};

export default SocialAuthButtons;
