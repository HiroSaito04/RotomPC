// filepath: rotompc-client/src/services/SocialService.js

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
   HELPERS
========================================================= */

const cleanId = (value, message = "Trainer ID is required.") => {
  const result = String(value || "").trim();

  if (!result) {
    throw new Error(message);
  }

  return result;
};

/* =========================================================
   PROFILE BY ID
========================================================= */

export const getTrainerProfileById = (userId) => {
  const id = cleanId(userId);

  return API.get(`/${encodeURIComponent(id)}/social-profile`);
};

/* =========================================================
   PROFILE BY USERNAME
========================================================= */

export const getTrainerProfileByUsername = async (username) => {
  const value = cleanId(username, "Trainer username is required.");

  const response = await API.get(`/profile/${encodeURIComponent(value)}`);

  const profile = response.data?.profile;

  const profileId = profile?._id || profile?.id || "";

  if (profileId) {
    return getTrainerProfileById(profileId);
  }

  return response;
};

/* =========================================================
   PROFILE
========================================================= */

export const getTrainerProfile = ({ userId, username } = {}) => {
  if (userId) {
    return getTrainerProfileById(userId);
  }

  if (username) {
    return getTrainerProfileByUsername(username);
  }

  throw new Error("Trainer ID or username is required.");
};

/* =========================================================
   FOLLOW
========================================================= */

export const followTrainer = (userId) => {
  const id = cleanId(userId);

  return API.post(`/${encodeURIComponent(id)}/follow`);
};

/* =========================================================
   UNFOLLOW
========================================================= */

export const unfollowTrainer = (userId) => {
  const id = cleanId(userId);

  return API.delete(`/${encodeURIComponent(id)}/follow`);
};

/* =========================================================
   FOLLOW STATUS
========================================================= */

export const getFollowStatus = (userId) => {
  const id = cleanId(userId);

  return API.get(`/${encodeURIComponent(id)}/follow-status`);
};

/* =========================================================
   FOLLOWERS
========================================================= */

export const getFollowers = (userId) => {
  const id = cleanId(userId);

  return API.get(`/${encodeURIComponent(id)}/followers`);
};

/* =========================================================
   FOLLOWING
========================================================= */

export const getFollowing = (userId) => {
  const id = cleanId(userId);

  return API.get(`/${encodeURIComponent(id)}/following`);
};

/* =========================================================
   REMOVE FOLLOWER
========================================================= */

export const removeFollower = (userId) => {
  const id = cleanId(userId);

  return API.delete(`/${encodeURIComponent(id)}/follower`);
};

export default API;
