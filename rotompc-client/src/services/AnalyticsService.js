// filepath: rotompc-client/src/services/AnalyticsService.js

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
  baseURL: `${API_ROOT}/users/analytics`,

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
   VISITOR ID
========================================================= */

const VISITOR_STORAGE_KEY = "rotompc-visitor-id";

let fallbackVisitorId = "";

/* =========================================================
   CREATE RANDOM ID
========================================================= */

const createVisitorId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),

    Math.random().toString(36).slice(2),

    Math.random().toString(36).slice(2),
  ].join("-");
};

/* =========================================================
   GET VISITOR ID
========================================================= */

export const getVisitorId = () => {
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const next = createVisitorId();

    localStorage.setItem(
      VISITOR_STORAGE_KEY,

      next,
    );

    return next;
  } catch {
    if (!fallbackVisitorId) {
      fallbackVisitorId = createVisitorId();
    }

    return fallbackVisitorId;
  }
};

/* =========================================================
   CLEAN PATH
========================================================= */

const cleanPath = (value) => {
  let path = String(value || "/")
    .trim()
    .split("?")[0]
    .split("#")[0];

  if (!path) {
    path = "/";
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return path.slice(0, 300);
};

/* =========================================================
   RECORD VISIT
========================================================= */

export const recordWebsiteVisit = (pathname) => {
  return API.post("/visit", {
    visitorId: getVisitorId(),

    path: cleanPath(pathname),
  });
};

/* =========================================================
   ANALYTICS SUMMARY
========================================================= */

export const fetchAnalyticsSummary = (year) => {
  return API.get("/summary", {
    params: {
      year,
    },
  });
};

export default API;
