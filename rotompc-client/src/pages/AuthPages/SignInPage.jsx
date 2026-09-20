// rotompc-client/src/pages/AuthPages/SignInPage.jsx

import { useCallback, useState } from "react";

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
} from "@/constants/authUI";

/* =========================================================
   SIGN IN
========================================================= */

const SignInPage = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     AUTH COMPLETE
  ======================================================= */

  const completeAuthentication = useCallback(
    (data) => {
      saveAuthSession(data);

      navigate(getAuthDestination(data), {
        replace: true,
      });
    },
    [navigate],
  );

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    setLoading(true);

    try {
      const response = await userService.loginUser({
        email: identifier.trim(),

        password,
      });

      completeAuthentication(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <label htmlFor="signin-identifier" className={AUTH_LABEL_CLASS}>
            Username or Email
          </label>

          <input
            id="signin-identifier"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Trainer username or email"
            autoComplete="username"
            className={AUTH_INPUT_CLASS}
            required
          />
        </div>

        <PasswordField
          id="signin-password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        {error && <div className={AUTH_ERROR_CLASS}>{error}</div>}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className={AUTH_PRIMARY_BUTTON_CLASS}
        >
          {loading ? "Connecting..." : "Log In"}
        </Button>
      </form>

      <AuthSocialSection
        mode="signin"
        onAuthenticated={completeAuthentication}
        onError={setError}
      />

      <div className={AUTH_FOOTER_CLASS}>
        New to RotomPC?{" "}
        <Link to="/auth/signup" className={AUTH_LINK_CLASS}>
          Create Trainer Account
        </Link>
      </div>
    </>
  );
};

export default SignInPage;
