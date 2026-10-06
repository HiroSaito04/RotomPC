// filepath: rotompc-client/src/services/PublicBuddyService.js

import axios from "axios";

import apiConfig from "@/config/api";

const API = axios.create({
  baseURL: `${apiConfig.HOST}/buddy`,

  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   PUBLIC BUDDY
========================================================= */

export const fetchPublicBuddy = (userId) => {
  const id = String(userId || "").trim();

  if (!id) {
    throw new Error("Trainer ID is required.");
  }

  return API.get(`/trainer/${encodeURIComponent(id)}`);
};

export default API;
