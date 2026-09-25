// rotompc-client/src/utils/authSession.js

/* =========================================================
   EVENTS
========================================================= */

export const AUTH_UPDATE_EVENT = "local-auth-update";

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

    role: data.role ?? previous.role ?? "trainer",

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

   Important:
   Do NOT overwrite existing profile information with
   missing properties from a smaller API response.
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

  localStorage.setItem("role", next.role || "trainer");

  localStorage.setItem("firstName", next.firstName || "");

  if (dispatch) {
    notifyAuthUpdate();
  }

  return next;
};

/* =========================================================
   SAVE AUTH SESSION
========================================================= */

export const saveAuthSession = (data) => {
  if (!data?.token || !(data?.id || data?._id)) {
    throw new Error("Invalid authentication response.");
  }

  localStorage.setItem("token", data.token);

  updateStoredUser(data, {
    dispatch: false,
  });

  notifyAuthUpdate();

  return getStoredUser();
};

/* =========================================================
   AUTH DESTINATION
========================================================= */

export const getAuthDestination = (data) => {
  if (data?.profileCompleted === false) {
    return "/auth/complete-profile";
  }

  if (data?.role === "trainer" || !data?.role) {
    return "/";
  }

  return "/dashboard";
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
