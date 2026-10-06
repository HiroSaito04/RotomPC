// filepath: rotompc-server/constants/userRoles.js

/* =========================================================
   USER ROLES
========================================================= */

const USER_ROLES = Object.freeze([
  "admin",
  "professor",
  "trainer",
  "editor",
  "champion",
]);

/* =========================================================
   SPECIAL TRAINER AVATAR ACCESS

   These roles may use named Pokémon characters such as:
   - Cynthia
   - Leon
   - Professors
   - other Champions
========================================================= */

const SPECIAL_TRAINER_AVATAR_ROLES = Object.freeze([
  "admin",
  "professor",
  "editor",
  "champion",
]);

/* =========================================================
   HELPERS
========================================================= */

const normalizeUserRole = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const isValidUserRole = (value) => {
  return USER_ROLES.includes(normalizeUserRole(value));
};

const canUseSpecialTrainerAvatars = (role) => {
  return SPECIAL_TRAINER_AVATAR_ROLES.includes(normalizeUserRole(role));
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  USER_ROLES,

  SPECIAL_TRAINER_AVATAR_ROLES,

  normalizeUserRole,

  isValidUserRole,

  canUseSpecialTrainerAvatars,
};
