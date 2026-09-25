// rotompc-client/src/services/RotomAIService.js

import axios from "axios";

import apiConfig from "@/config/api";

/* =========================================================
   API
========================================================= */

const RAW_HOST = String(apiConfig.HOST || "http://localhost:8000/api")
  .trim()
  .replace(/\/+$/, "");

const API_ROOT = RAW_HOST.endsWith("/api") ? RAW_HOST : `${RAW_HOST}/api`;

const API = axios.create({
  baseURL: `${API_ROOT}/rotom-ai`,

  timeout: 90000,

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
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

/* =========================================================
   STATUS
========================================================= */

export const getRotomAIStatus = () => API.get("/status");

/* =========================================================
   HISTORY
========================================================= */

export const getRotomAIHistory = () => API.get("/history");

/* =========================================================
   CHAT
========================================================= */

export const sendRotomMessage = ({ message }) => {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) {
    throw new Error("Message cannot be empty.");
  }

  if (cleanMessage.length > 4000) {
    throw new Error("Message cannot exceed 4,000 characters.");
  }

  /*
   * IMPORTANT:
   *
   * We no longer send browser-owned
   * history to Gemini.
   *
   * The server loads authenticated
   * history from MongoDB.
   */

  return API.post(
    "/chat",

    {
      message: cleanMessage,
    },
  );
};

/* =========================================================
   CLEAR HISTORY
========================================================= */

export const clearRotomAIHistory = () => API.delete("/history");

/* =========================================================
   EXPORT
========================================================= */

export const ROTOM_AI_API_URL = `${API_ROOT}/rotom-ai`;

export default API;
