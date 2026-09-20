// rotompc-client/src/utils/authSession.js

/* =========================================================
   SAVE AUTH SESSION
========================================================= */

export const saveAuthSession = (data) => {
  if (!data?.token || !data?.id) {
    throw new Error("Invalid authentication response.");
  }

  localStorage.setItem("token", data.token);

  localStorage.setItem("id", String(data.id));

  localStorage.setItem("role", data.role || "trainer");

  localStorage.setItem("firstName", data.firstName || "");

  const userPayload = {
    id: data.id,

    firstName: data.firstName || "",

    lastName: data.lastName || "",

    username: data.username || "",

    role: data.role || "trainer",

    gender: data.gender || "",

    trainerCode: data.trainerCode || "",

    bio: data.bio || "",

    region: data.region || "",

    favoritePokemon: data.favoritePokemon || {
      id: null,
      name: "",
    },

    favoriteType: data.favoriteType || "",

    profileVisibility: data.profileVisibility || "public",

    profileCompleted: data.profileCompleted !== false,
  };

  localStorage.setItem("user", JSON.stringify(userPayload));

  /*
   * Lets NavBar and other components
   * react immediately to login/logout
   * without waiting for storage events.
   */
  window.dispatchEvent(new Event("local-auth-update"));

  return userPayload;
};

/* =========================================================
   AUTH DESTINATION
========================================================= */

export const getAuthDestination = (data) => {
  /*
   * Google/Apple users who still need
   * required trainer information.
   */
  if (data?.profileCompleted === false) {
    return "/auth/complete-profile";
  }

  /*
   * Trainers use the normal site.
   *
   * Admin/professor/editor accounts
   * enter the dashboard.
   */
  if (data?.role === "trainer" || !data?.role) {
    return "/";
  }

  return "/dashboard";
};

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
   CLEAR AUTH SESSION
========================================================= */

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("id");
  localStorage.removeItem("role");
  localStorage.removeItem("firstName");
  localStorage.removeItem("user");

  window.dispatchEvent(new Event("local-auth-update"));
};
