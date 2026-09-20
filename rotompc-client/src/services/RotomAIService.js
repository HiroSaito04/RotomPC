// rotompc-client/src/services/RotomAIService.js

import axios from "axios";

import apiConfig from "@/config/api";

/* =========================================================
   API ROOT
========================================================= */

/*
 * Supports either:
 *
 * HOST=http://localhost:8000
 *
 * or:
 *
 * HOST=http://localhost:8000/api
 *
 * without ever producing:
 *
 * /api/api/...
 */

const RAW_HOST = String(apiConfig.HOST || "http://localhost:8000")
  .trim()
  .replace(/\/+$/, "");

const API_ROOT = RAW_HOST.endsWith("/api") ? RAW_HOST : `${RAW_HOST}/api`;

/* =========================================================
   AXIOS INSTANCE
========================================================= */

const API = axios.create({
  baseURL: `${API_ROOT}/rotom-ai`,

  timeout: 90000,

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   DEBUG

   Useful while developing.

   You can remove this later.
========================================================= */

if (import.meta.env.DEV) {
  API.interceptors.request.use((config) => {
    const baseURL = config.baseURL || "";

    const url = config.url || "";

    console.log(
      "[RotomAI request]",
      config.method?.toUpperCase(),
      `${baseURL}${url}`,
    );

    return config;
  });
}

/* =========================================================
   CHAT
========================================================= */

export const sendRotomMessage = async ({ message, history = [] }) => {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) {
    throw new Error("Message cannot be empty.");
  }

  if (cleanMessage.length > 4000) {
    throw new Error("Message cannot exceed 4,000 characters.");
  }

  return API.post(
    "/chat",

    {
      message: cleanMessage,

      history: Array.isArray(history) ? history : [],
    },
  );
};

/* =========================================================
   STATUS
========================================================= */

export const getRotomAIStatus = async () => {
  return API.get("/status");
};

/* =========================================================
   OPTIONAL DEBUG EXPORT
========================================================= */

export const ROTOM_AI_API_URL = `${API_ROOT}/rotom-ai`;

export default API;
