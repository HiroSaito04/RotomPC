// rotompc-client/src/pages/AuthPages/SignInPage.jsx

import { useCallback, useEffect, useRef, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import Button from "@/components/Button";

import PasswordField from "@/components/auth/PasswordField";

import AuthPageHeader from "@/components/auth/AuthPageHeader";

import AuthSocialSection from "@/components/auth/AuthSocialSection";

import * as userService from "@/services/UserService";

import { getAuthDestination, saveAuthSession } from "@/utils/authSession";

import {
  AUTH_ERROR_CLASS,
  AUTH_FOOTER_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_SUCCESS_CLASS,
} from "@/constants/authUI";

/* =========================================================
   CONFIG
========================================================= */

const LOGIN_SUCCESS_DELAY = 850;

/* =========================================================
   SIGN IN
========================================================= */

const SignInPage = () => {
  const navigate = useNavigate();

  const redirectTimerRef = useRef(null);

  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  /* =======================================================
     AUTH COMPLETE

     Used by:
     - normal password login
     - Google login
     - Facebook login
  ======================================================= */

  const completeAuthentication = useCallback(
    (data) => {
      try {
        setError("");

        setLoading(true);

        /*
         * Save the authenticated session first.
         *
         * This ensures that when the destination
         * loads, Navbar / Buddy / profile sync
         * already see the valid token.
         */

        saveAuthSession(data);

        const trainerName = String(
          data?.firstName || data?.username || "",
        ).trim();

        setSuccess(
          trainerName
            ? `Login successful. Welcome back, ${trainerName}!`
            : "Login successful. Welcome back, Trainer!",
        );

        /*
         * Keep the confirmation visible briefly
         * so the user actually sees that login
         * succeeded before the route changes.
         */

        redirectTimerRef.current = window.setTimeout(
          () => {
            navigate(getAuthDestination(data), {
              replace: true,
            });
          },

          LOGIN_SUCCESS_DELAY,
        );
      } catch (err) {
        console.error("Authentication completion error:", err);

        setLoading(false);

        setSuccess("");

        setError(err.message || "Unable to complete login.");
      }
    },
    [navigate],
  );

  /* =======================================================
     PASSWORD LOGIN
  ======================================================= */

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    setSuccess("");

    setLoading(true);

    try {
      const response = await userService.loginUser({
        email: identifier.trim(),

        password,
      });

      /*
       * Do not set loading false here on success.
       *
       * completeAuthentication keeps the page locked
       * during the brief success confirmation and
       * then redirects.
       */

      completeAuthentication(response.data);
    } catch (err) {
      setLoading(false);

      setSuccess("");

      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    }
  };

  /* =======================================================
     SOCIAL ERROR
  ======================================================= */

  const handleSocialError = useCallback((message) => {
    setSuccess("");

    setLoading(false);

    setError(message || "");
  }, []);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <AuthPageHeader
        eyebrow="Trainer Login"
        title="Welcome back."
        description="Reconnect to your Trainer profile, Buddy, PokéSocial, and the RotomPC network."
      />

      <form
        className="
          mt-8
          space-y-5
        "
        onSubmit={handleLogin}
      >
        {/* ===============================================
            IDENTIFIER
        ================================================ */}

        <div>
          <label htmlFor="signin-identifier" className={AUTH_LABEL_CLASS}>
            Username or Email
          </label>

          <input
            id="signin-identifier"
            name="signin-identifier"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Trainer username or email"
            autoComplete="username"
            className={AUTH_INPUT_CLASS}
            disabled={loading}
            required
          />
        </div>

        {/* ===============================================
            PASSWORD
        ================================================ */}

        <PasswordField
          id="signin-password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={loading}
          required
        />

        {/* ===============================================
            ERROR
        ================================================ */}

        {error && (
          <div role="alert" className={AUTH_ERROR_CLASS}>
            {error}
          </div>
        )}

        {/* ===============================================
            SUCCESS
        ================================================ */}

        {success && (
          <div role="status" aria-live="polite" className={AUTH_SUCCESS_CLASS}>
            <div
              className="
                flex
                items-start
                gap-3
              "
            >
              <span
                aria-hidden="true"
                className="
                  mt-0.5

                  flex
                  h-5
                  w-5
                  shrink-0
                  items-center
                  justify-center

                  rounded-full

                  bg-green-600

                  text-[11px]
                  font-black
                  text-white
                "
              >
                ✓
              </span>

              <div>
                <p
                  className="
                    font-black
                    text-green-900
                  "
                >
                  Trainer authenticated
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    font-semibold
                    text-green-700
                  "
                >
                  {success}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===============================================
            LOGIN BUTTON
        ================================================ */}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className={AUTH_PRIMARY_BUTTON_CLASS}
        >
          {success ? "Connected ✓" : loading ? "Connecting..." : "Log In"}
        </Button>
      </form>

      {/* =================================================
          SOCIAL LOGIN
      ================================================== */}

      {!success && (
        <AuthSocialSection
          mode="signin"
          onAuthenticated={completeAuthentication}
          onError={handleSocialError}
        />
      )}

      {/* =================================================
          FOOTER
      ================================================== */}

      {!success && (
        <div className={AUTH_FOOTER_CLASS}>
          New to RotomPC?{" "}
          <Link to="/auth/signup" className={AUTH_LINK_CLASS}>
            Create Trainer Account
          </Link>
        </div>
      )}
    </>
  );
};

export default SignInPage;
