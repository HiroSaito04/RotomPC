// filepath: rotompc-client/src/services/UserService.js

import axios from "axios";

import apiConfig from "@/config/api";

/* =========================================================
   API ROOT
========================================================= */

const RAW_HOST = String(apiConfig.HOST || "http://localhost:8000/api")
  .trim()
  .replace(/\/+$/, "");

const API_ROOT = RAW_HOST.endsWith("/api") ? RAW_HOST : `${RAW_HOST}/api`;

const API = axios.create({
  baseURL: `${API_ROOT}/users`,

  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   AUTHORIZATION
========================================================= */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

/* =========================================================
   HELPERS
========================================================= */

const cleanUserId = (userId) => {
  const id = String(userId || "").trim();

  if (!id) {
    throw new Error("User ID is required.");
  }

  return id;
};

const cleanUsername = (username) => {
  const value = String(username || "").trim();

  if (!value) {
    throw new Error("Trainer username is required.");
  }

  return value;
};

/* =========================================================
   AUTH
========================================================= */

export const loginUser = (credentials) => API.post("/login", credentials);

/* ---------------------------------------------------------
   GOOGLE

   Receives Google Identity Services ID token.
--------------------------------------------------------- */

export const googleAuth = (credential) =>
  API.post(
    "/auth/google",

    {
      credential,
    },
  );

/* ---------------------------------------------------------
   FACEBOOK

   Receives Facebook user access token.
--------------------------------------------------------- */

export const facebookAuth = (accessToken) =>
  API.post(
    "/auth/facebook",

    {
      accessToken,
    },
  );

/* =========================================================
   USERS
========================================================= */

export const fetchUsers = () => API.get("/");

export const createUser = (user) => API.post("/", user);

export const updateUser = (userId, user) => {
  const id = cleanUserId(userId);

  return API.put(`/${encodeURIComponent(id)}`, user);
};

export const deleteUser = (userId) => {
  const id = cleanUserId(userId);

  return API.delete(`/${encodeURIComponent(id)}`);
};

/* =========================================================
   CURRENT TRAINER PROFILE
========================================================= */

export const fetchMyProfile = () => API.get("/me");

export const updateTrainerProfile = (profile) =>
  API.patch("/me/profile", profile);

export const completeTrainerProfile = (profile) =>
  API.patch("/me/complete-profile", profile);

/* =========================================================
   PUBLIC TRAINER PROFILE
========================================================= */

export const fetchPublicProfile = (username) => {
  const value = cleanUsername(username);

  return API.get(`/profile/${encodeURIComponent(value)}`);
};

/* =========================================================
   POKÉSOCIAL
========================================================= */

export const followTrainer = (userId) => {
  const id = cleanUserId(userId);

  return API.post(`/${encodeURIComponent(id)}/follow`);
};

export const unfollowTrainer = (userId) => {
  const id = cleanUserId(userId);

  return API.delete(`/${encodeURIComponent(id)}/follow`);
};

export const fetchFollowers = (userId) => {
  const id = cleanUserId(userId);

  return API.get(`/${encodeURIComponent(id)}/followers`);
};

export const fetchFollowing = (userId) => {
  const id = cleanUserId(userId);

  return API.get(`/${encodeURIComponent(id)}/following`);
};

export const fetchFollowStatus = (userId) => {
  const id = cleanUserId(userId);

  return API.get(`/${encodeURIComponent(id)}/follow-status`);
};

export const removeFollower = (userId) => {
  const id = cleanUserId(userId);

  return API.delete(`/${encodeURIComponent(id)}/follower`);
};

export default API;
