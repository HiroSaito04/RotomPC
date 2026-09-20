// rotompc-client/src/pages/AuthPages/SignUpPage.jsx

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
   PASSWORD
========================================================= */

const PASSWORD_PATTERN =
  "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s])\\S{8,72}$";

/* =========================================================
   SIGN UP
========================================================= */

const SignUpPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",

    lastName: "",

    email: "",

    password: "",

    age: "",

    gender: "",

    contactNumber: "",

    username: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const { id, value } = event.target;

    setFormData((current) => ({
      ...current,

      [id]: value,
    }));
  };

  /* =======================================================
     SOCIAL AUTH COMPLETE
  ======================================================= */

  const completeSocialAuthentication = useCallback(
    (data) => {
      saveAuthSession(data);

      navigate(getAuthDestination(data), {
        replace: true,
      });
    },
    [navigate],
  );

  /* =======================================================
     SIGN UP
  ======================================================= */

  const handleSignUp = async (event) => {
    event.preventDefault();

    setError("");

    if (!/^09\d{9}$/.test(formData.contactNumber)) {
      setError("Contact number must contain 11 digits and start with 09.");

      return;
    }

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    setLoading(true);

    try {
      await userService.createUser({
        ...formData,

        firstName: formData.firstName.trim(),

        lastName: formData.lastName.trim(),

        email: formData.email.toLowerCase().trim(),

        username: formData.username.trim(),
      });

      navigate("/auth/signin", {
        replace: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create your account.");
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
        eyebrow="New Trainer Registration"
        title="Become a Trainer."
        description="Create your RotomPC Trainer ID and join the PokéSocial network."
      />

      <form
        className="
          mt-8

          space-y-5
        "
        onSubmit={handleSignUp}
      >
        {/* NAME */}

        <div
          className="
            grid

            gap-5

            sm:grid-cols-2
          "
        >
          <div>
            <label htmlFor="firstName" className={AUTH_LABEL_CLASS}>
              First Name
            </label>

            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              className={AUTH_INPUT_CLASS}
              required
              minLength={2}
              maxLength={50}
              pattern="^[A-Za-z\s'-]+$"
            />
          </div>

          <div>
            <label htmlFor="lastName" className={AUTH_LABEL_CLASS}>
              Last Name
            </label>

            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              className={AUTH_INPUT_CLASS}
              required
              minLength={2}
              maxLength={50}
              pattern="^[A-Za-z\s'-]+$"
            />
          </div>
        </div>

        {/* USERNAME / AGE */}

        <div
          className="
            grid

            gap-5

            sm:grid-cols-2
          "
        >
          <div>
            <label htmlFor="username" className={AUTH_LABEL_CLASS}>
              Username
            </label>

            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Optional"
              autoComplete="username"
              className={AUTH_INPUT_CLASS}
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9._]+$"
            />
          </div>

          <div>
            <label htmlFor="age" className={AUTH_LABEL_CLASS}>
              Age
            </label>

            <input
              id="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              className={AUTH_INPUT_CLASS}
              required
              min={18}
              max={100}
            />
          </div>
        </div>

        {/* GENDER / CONTACT */}

        <div
          className="
            grid

            gap-5

            sm:grid-cols-2
          "
        >
          <div>
            <label htmlFor="gender" className={AUTH_LABEL_CLASS}>
              Gender
            </label>

            <select
              id="gender"
              value={formData.gender}
              onChange={handleChange}
              className={AUTH_INPUT_CLASS}
              required
            >
              <option value="">Select gender</option>

              <option value="male">Male</option>

              <option value="female">Female</option>

              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="contactNumber" className={AUTH_LABEL_CLASS}>
              Contact Number
            </label>

            <input
              id="contactNumber"
              type="tel"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="09XXXXXXXXX"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={11}
              className={AUTH_INPUT_CLASS}
              required
              pattern="^09\d{9}$"
            />
          </div>
        </div>

        {/* EMAIL */}

        <div>
          <label htmlFor="email" className={AUTH_LABEL_CLASS}>
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className={AUTH_INPUT_CLASS}
            required
          />
        </div>

        {/* PASSWORD */}

        <PasswordField
          id="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
          minLength={8}
          maxLength={72}
          pattern={PASSWORD_PATTERN}
          title="Must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        />

        <PasswordField
          id="confirm-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Enter the password again"
          required
        />

        <div
          className="
            rounded-xl

            border
            border-zinc-200

            bg-zinc-50

            px-3
            py-2.5
          "
        >
          <p
            className="
              text-[11px]
              font-semibold
              leading-5

              text-zinc-500
            "
          >
            Passwords need 8–72 characters with an uppercase letter, lowercase
            letter, number, and special character.
          </p>
        </div>

        {error && <div className={AUTH_ERROR_CLASS}>{error}</div>}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className={AUTH_PRIMARY_BUTTON_CLASS}
        >
          {loading ? "Creating Account..." : "Create Trainer Account"}
        </Button>
      </form>

      <AuthSocialSection
        mode="signup"
        onAuthenticated={completeSocialAuthentication}
        onError={setError}
      />

      <div className={AUTH_FOOTER_CLASS}>
        Already a trainer?{" "}
        <Link to="/auth/signin" className={AUTH_LINK_CLASS}>
          Log In
        </Link>
      </div>
    </>
  );
};

export default SignUpPage;
