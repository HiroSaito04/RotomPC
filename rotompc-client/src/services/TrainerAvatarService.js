// filepath: rotompc-client/src/services/TrainerAvatarService.js

import axios from "axios";

import apiConfig from "@/config/api";

/* =========================================================
   API ROOT
========================================================= */

const buildUsersApiRoot = () => {
  const host = String(apiConfig.HOST || "http://localhost:8000")
    .trim()
    .replace(/\/+$/, "");

  if (host.endsWith("/api/users")) {
    return host;
  }

  if (host.endsWith("/api")) {
    return `${host}/users`;
  }

  return `${host}/api/users`;
};

const API = axios.create({
  baseURL: buildUsersApiRoot(),

  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   AUTH
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
   CATALOG
========================================================= */

export const fetchTrainerAvatarCatalog = () => API.get("/trainer-avatars");

/* =========================================================
   CURRENT TRAINER
========================================================= */

export const fetchMyTrainerAvatar = () => API.get("/me/trainer-avatar");

/* =========================================================
   PUBLIC TRAINER
========================================================= */

export const fetchTrainerAvatar = (userId) => {
  const id = String(userId || "").trim();

  if (!id) {
    throw new Error("Trainer ID is required.");
  }

  return API.get(`/${encodeURIComponent(id)}/trainer-avatar`);
};

/* =========================================================
   SAVE
========================================================= */

export const saveMyTrainerAvatar = (avatarId) => {
  const id = String(avatarId || "")
    .trim()
    .toLowerCase();

  if (!id) {
    throw new Error("Choose a Trainer character first.");
  }

  return API.put(
    "/me/trainer-avatar",

    {
      avatarId: id,
    },
  );
};

/* =========================================================
   CLEAR
========================================================= */

export const clearMyTrainerAvatar = () => API.delete("/me/trainer-avatar");

export default API;
