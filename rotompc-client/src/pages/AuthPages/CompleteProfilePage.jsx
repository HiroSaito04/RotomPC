// rotompc-client/src/pages/AuthPages/CompleteProfilePage.jsx

import { useState } from "react";

import { useNavigate } from "react-router-dom";

import Button from "@/components/Button";

import AuthPageHeader from "@/components/auth/AuthPageHeader";

import * as userService from "@/services/UserService";

import { getStoredUser, saveAuthSession } from "@/utils/authSession";

import {
  AUTH_ERROR_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
} from "@/constants/authUI";

/* =========================================================
   COMPLETE PROFILE
========================================================= */

const CompleteProfilePage = () => {
  const navigate = useNavigate();

  const storedUser = getStoredUser();

  const [formData, setFormData] = useState({
    firstName: storedUser?.firstName || "",

    lastName: storedUser?.lastName || "",

    age: "",

    gender: "",

    contactNumber: "",

    address: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
       CHANGE
    ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,

      [name]: value,
    }));
  };

  /* =====================================================
       SUBMIT
    ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!/^09\d{9}$/.test(formData.contactNumber)) {
      setError("Contact number must contain 11 digits starting with 09.");

      return;
    }

    setLoading(true);

    try {
      const response = await userService.completeTrainerProfile({
        firstName: formData.firstName.trim(),

        lastName: formData.lastName.trim(),

        age: Number(formData.age),

        gender: formData.gender,

        contactNumber: formData.contactNumber.trim(),

        address: formData.address.trim(),
      });

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/auth/signin", {
          replace: true,
        });

        return;
      }

      const user = response.data.user;

      saveAuthSession({
        token,

        id: user.id,

        username: user.username,

        role: user.role,

        firstName: user.firstName,

        lastName: user.lastName,

        gender: user.gender,

        trainerCode: user.trainerCode,

        bio: user.bio,

        region: user.region,

        favoritePokemon: user.favoritePokemon,

        favoriteType: user.favoriteType,

        profileVisibility: user.profileVisibility,

        profileCompleted: true,
      });

      navigate(user.role === "trainer" ? "/" : "/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to complete your trainer profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
       UI
    ===================================================== */

  return (
    <>
      <AuthPageHeader
        eyebrow="Trainer ID Setup"
        title="Complete your Trainer ID."
        description="Add the remaining details required to activate your RotomPC Trainer profile."
      />

      <form
        onSubmit={handleSubmit}
        className="
            mt-8

            space-y-5
          "
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
            <label htmlFor="complete-firstName" className={AUTH_LABEL_CLASS}>
              First Name
            </label>

            <input
              id="complete-firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              className={AUTH_INPUT_CLASS}
              required
              minLength={2}
              maxLength={50}
              pattern="^[A-Za-z\s'-]+$"
              autoComplete="given-name"
            />
          </div>

          <div>
            <label htmlFor="complete-lastName" className={AUTH_LABEL_CLASS}>
              Last Name
            </label>

            <input
              id="complete-lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              className={AUTH_INPUT_CLASS}
              required
              minLength={2}
              maxLength={50}
              pattern="^[A-Za-z\s'-]+$"
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* AGE / GENDER */}

        <div
          className="
              grid

              gap-5

              sm:grid-cols-2
            "
        >
          <div>
            <label htmlFor="complete-age" className={AUTH_LABEL_CLASS}>
              Age
            </label>

            <input
              id="complete-age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              className={AUTH_INPUT_CLASS}
              min={18}
              max={100}
              required
            />
          </div>

          <div>
            <label htmlFor="complete-gender" className={AUTH_LABEL_CLASS}>
              Gender
            </label>

            <select
              id="complete-gender"
              name="gender"
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
        </div>

        {/* CONTACT */}

        <div>
          <label htmlFor="complete-contactNumber" className={AUTH_LABEL_CLASS}>
            Contact Number
          </label>

          <input
            id="complete-contactNumber"
            name="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="09XXXXXXXXX"
            className={AUTH_INPUT_CLASS}
            inputMode="numeric"
            maxLength={11}
            pattern="^09\d{9}$"
            autoComplete="tel"
            required
          />
        </div>

        {/* ADDRESS */}

        <div>
          <label htmlFor="complete-address" className={AUTH_LABEL_CLASS}>
            Address
          </label>

          <input
            id="complete-address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            placeholder="Optional"
            className={AUTH_INPUT_CLASS}
            maxLength={200}
            autoComplete="street-address"
          />
        </div>

        {error && <div className={AUTH_ERROR_CLASS}>{error}</div>}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className={AUTH_PRIMARY_BUTTON_CLASS}
        >
          {loading ? "Saving Trainer ID..." : "Activate Trainer Profile"}
        </Button>
      </form>
    </>
  );
};

export default CompleteProfilePage;
