// rotompc-client/src/services/UserService.js

import axios from "axios";

import apiConfig from "@/config/api";

/* =========================================================
   API
========================================================= */

const API = axios.create({
  baseURL: `${apiConfig.HOST}/users`,
});

/* =========================================================
   AUTHORIZATION
========================================================= */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

/* =========================================================
   AUTH
========================================================= */

export const loginUser = (credentials) => API.post("/login", credentials);

/* ---------------------------------------------------------
   GOOGLE

   Receives Google Identity Services ID token.
--------------------------------------------------------- */

export const googleAuth = (credential) =>
  API.post("/auth/google", {
    credential,
  });

/* ---------------------------------------------------------
   FACEBOOK

   Receives Facebook user access token.
--------------------------------------------------------- */

export const facebookAuth = (accessToken) =>
  API.post("/auth/facebook", {
    accessToken,
  });

/* =========================================================
   USERS
========================================================= */

export const fetchUsers = () => API.get("/");

export const createUser = (user) => API.post("/", user);

export const updateUser = (id, user) => API.put(`/${id}`, user);

export const deleteUser = (id) => API.delete(`/${id}`);

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

export const fetchPublicProfile = (username) =>
  API.get(`/profile/${encodeURIComponent(username)}`);

/* =========================================================
   POKÉSOCIAL
========================================================= */

export const followTrainer = (userId) => API.post(`/${userId}/follow`);

export const unfollowTrainer = (userId) => API.delete(`/${userId}/follow`);

export const fetchFollowers = (userId) => API.get(`/${userId}/followers`);

export const fetchFollowing = (userId) => API.get(`/${userId}/following`);
