// filepath: rotompc-client/src/utils/authSession.js

/* =========================================================
   EVENTS
========================================================= */

export const AUTH_UPDATE_EVENT = "local-auth-update";

/* =========================================================
   ROLE HELPERS
========================================================= */

const normalizeRole = (value) =>
  String(value || "trainer")
    .trim()
    .toLowerCase();

/* =========================================================
   GET STORED SESSION
========================================================= */

export const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/* =========================================================
   GET TOKEN
========================================================= */

export const getAuthToken = () => localStorage.getItem("token");

/* =========================================================
   IS AUTHENTICATED
========================================================= */

export const isAuthenticated = () => Boolean(getAuthToken());

/* =========================================================
   NOTIFY AUTH UPDATE
========================================================= */

export const notifyAuthUpdate = () => {
  window.dispatchEvent(new Event(AUTH_UPDATE_EVENT));
};

/* =========================================================
   NORMALIZE USER DATA
========================================================= */

const normalizeUserPayload = (data = {}, previous = {}) => {
  return {
    ...previous,
    ...data,

    id: data.id || data._id || previous.id || "",

    firstName: data.firstName ?? previous.firstName ?? "",

    lastName: data.lastName ?? previous.lastName ?? "",

    email: data.email ?? previous.email ?? "",

    username: data.username ?? previous.username ?? "",

    role: normalizeRole(data.role ?? previous.role ?? "trainer"),

    age: data.age ?? previous.age ?? null,

    gender: data.gender ?? previous.gender ?? "",

    contactNumber: data.contactNumber ?? previous.contactNumber ?? "",

    address: data.address ?? previous.address ?? "",

    trainerCode: data.trainerCode ?? previous.trainerCode ?? "",

    bio: data.bio ?? previous.bio ?? "",

    region: data.region ?? previous.region ?? "",

    favoritePokemon: {
      id: data.favoritePokemon?.id ?? previous.favoritePokemon?.id ?? null,

      name: data.favoritePokemon?.name ?? previous.favoritePokemon?.name ?? "",
    },

    favoriteType: data.favoriteType ?? previous.favoriteType ?? "",

    profileVisibility:
      data.profileVisibility ?? previous.profileVisibility ?? "public",

    profileCompleted:
      data.profileCompleted ?? previous.profileCompleted ?? true,

    followersCount: data.followersCount ?? previous.followersCount ?? 0,

    followingCount: data.followingCount ?? previous.followingCount ?? 0,
  };
};

/* =========================================================
   REPLACE / MERGE STORED USER

   Used for profile updates after login.

   Existing profile information is preserved when a smaller
   profile API response does not contain every property.
========================================================= */

export const updateStoredUser = (data, { dispatch = true } = {}) => {
  if (!data) {
    return getStoredUser();
  }

  const previous = getStoredUser() || {};

  const next = normalizeUserPayload(data, previous);

  localStorage.setItem("user", JSON.stringify(next));

  if (next.id) {
    localStorage.setItem("id", String(next.id));
  }

  localStorage.setItem("role", normalizeRole(next.role));

  localStorage.setItem("firstName", next.firstName || "");

  if (dispatch) {
    notifyAuthUpdate();
  }

  return next;
};

/* =========================================================
   SAVE AUTH SESSION

   Authentication starts a new account session.

   If another account was previously stored in this browser,
   do not allow that account's profile fields to leak into
   the newly authenticated user.
========================================================= */

export const saveAuthSession = (data) => {
  const incomingId = data?.id || data?._id || "";

  if (!data?.token || !incomingId) {
    throw new Error("Invalid authentication response.");
  }

  const previous = getStoredUser();

  const sameUser = previous?.id && String(previous.id) === String(incomingId);

  const normalizedUser = normalizeUserPayload(data, sameUser ? previous : {});

  localStorage.setItem("token", data.token);

  localStorage.setItem("user", JSON.stringify(normalizedUser));

  localStorage.setItem("id", String(normalizedUser.id));

  localStorage.setItem("role", normalizeRole(normalizedUser.role));

  localStorage.setItem("firstName", normalizedUser.firstName || "");

  notifyAuthUpdate();

  return normalizedUser;
};

/* =========================================================
   AUTH DESTINATION

   IMPORTANT:
   Dashboard roles are checked BEFORE trainer profile
   completion.

   Admins/editors do not need to complete the Trainer
   profile flow before entering the dashboard.
========================================================= */

export const getAuthDestination = (data = {}) => {
  const role = normalizeRole(
    data.role || localStorage.getItem("role") || "trainer",
  );

  /* -------------------------------------------------------
     ADMIN / EDITOR
  ------------------------------------------------------- */

  if (role === "admin" || role === "editor") {
    return "/dashboard";
  }

  /* -------------------------------------------------------
     TRAINER
  ------------------------------------------------------- */

  if (role === "trainer") {
    if (data.profileCompleted === false) {
      return "/auth/complete-profile";
    }

    return "/";
  }

  /* -------------------------------------------------------
     OTHER ROLES

     Professor and any future unsupported role should not
     automatically receive dashboard access.
  ------------------------------------------------------- */

  return "/";
};

/* =========================================================
   CLEAR AUTH SESSION
========================================================= */

export const clearAuthSession = () => {
  localStorage.removeItem("token");

  localStorage.removeItem("id");

  localStorage.removeItem("role");

  localStorage.removeItem("firstName");

  localStorage.removeItem("user");

  notifyAuthUpdate();
};
