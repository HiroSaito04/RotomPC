// rotompc-server/validators/userValidator.js

const NAME_REGEX = /^[A-Za-z\s'-]+$/;

const USERNAME_REGEX = /^[A-Za-z0-9._]+$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * Requirements:
 *
 * - 8 to 72 characters
 * - at least one lowercase
 * - at least one uppercase
 * - at least one number
 * - at least one special character
 * - no whitespace
 */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,72}$/;

/* =========================================================
   VALIDATE USER
========================================================= */

const validateUserInput = (data, { update = false } = {}) => {
  const errors = [];

  /* -----------------------------------------------------
     FIRST NAME
  ----------------------------------------------------- */

  if (!update || data.firstName !== undefined) {
    const value = String(data.firstName || "").trim();

    if (value.length < 2 || value.length > 50 || !NAME_REGEX.test(value)) {
      errors.push("First name must contain 2-50 letters.");
    }
  }

  /* -----------------------------------------------------
     LAST NAME
  ----------------------------------------------------- */

  if (!update || data.lastName !== undefined) {
    const value = String(data.lastName || "").trim();

    if (value.length < 2 || value.length > 50 || !NAME_REGEX.test(value)) {
      errors.push("Last name must contain 2-50 letters.");
    }
  }

  /* -----------------------------------------------------
     AGE
  ----------------------------------------------------- */

  if (!update || data.age !== undefined) {
    const age = Number.parseInt(data.age, 10);

    if (Number.isNaN(age) || age < 18 || age > 100) {
      errors.push("Age must be between 18 and 100.");
    }
  }

  /* -----------------------------------------------------
     GENDER
  ----------------------------------------------------- */

  if (!update || data.gender !== undefined) {
    const gender = String(data.gender || "")
      .toLowerCase()
      .trim();

    if (!["male", "female", "other"].includes(gender)) {
      errors.push("Gender must be Male, Female, or Other.");
    }
  }

  /* -----------------------------------------------------
     CONTACT NUMBER
  ----------------------------------------------------- */

  if (!update || data.contactNumber !== undefined) {
    const contactNumber = String(data.contactNumber || "").trim();

    if (!/^09\d{9}$/.test(contactNumber)) {
      errors.push("Contact number must contain 11 digits starting with 09.");
    }
  }

  /* -----------------------------------------------------
     EMAIL
  ----------------------------------------------------- */

  if (!update || data.email !== undefined) {
    const email = String(data.email || "")
      .toLowerCase()
      .trim();

    if (!EMAIL_REGEX.test(email)) {
      errors.push("Invalid email address.");
    }
  }

  /* -----------------------------------------------------
     USERNAME
  ----------------------------------------------------- */

  if (!update || data.username !== undefined) {
    const username = String(data.username || "").trim();

    if (
      username.length < 3 ||
      username.length > 30 ||
      !USERNAME_REGEX.test(username)
    ) {
      errors.push(
        "Username must contain 3-30 letters, numbers, dots, or underscores.",
      );
    }
  }

  /* -----------------------------------------------------
     PASSWORD
  ----------------------------------------------------- */

  if (!update) {
    if (!PASSWORD_REGEX.test(String(data.password || ""))) {
      errors.push(
        "Password must be 8-72 characters and include uppercase, lowercase, number, and special character.",
      );
    }
  } else if (
    data.password !== undefined &&
    String(data.password).trim() !== "" &&
    !PASSWORD_REGEX.test(String(data.password))
  ) {
    errors.push(
      "New password must be 8-72 characters and include uppercase, lowercase, number, and special character.",
    );
  }

  return errors;
};

module.exports = {
  validateUserInput,

  NAME_REGEX,
  USERNAME_REGEX,
  EMAIL_REGEX,
  PASSWORD_REGEX,
};
