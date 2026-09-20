// rotompc-client/src/services/ArticleService.js

import axios from "axios";
import apiConfig from "@/config/api";

/* =========================================================
   API
========================================================= */

const API = axios.create({
  baseURL: `${apiConfig.HOST}/articles`,
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
   CACHE
========================================================= */

const CACHE_DURATION = 1000 * 60 * 5;

const ARTICLE_CACHE_KEY = "articles_cache";

const ARTICLE_CACHE_TIME_KEY = "articles_cache_time";

let articleCache = null;

let articleCacheTime = 0;

/* =========================================================
   HELPERS
========================================================= */

const normalizeArticlesPayload = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.articles)) {
    return data.articles;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const hasUsableArticleCache = (data) =>
  normalizeArticlesPayload(data).length > 0;

const getUserCacheKey = (userId, limit) =>
  `user_articles_cache_${userId}_${limit}`;

const getUserCacheTimeKey = (userId, limit) =>
  `user_articles_cache_time_${userId}_${limit}`;

const normalizeUserArticleOptions = (
  limitOrOptions = 4,
  explicitForceRefresh = false,
) => {
  let limit = 4;

  let forceRefresh = explicitForceRefresh;

  if (typeof limitOrOptions === "object" && limitOrOptions !== null) {
    limit = Number(limitOrOptions.limit) || 4;

    forceRefresh = Boolean(limitOrOptions.forceRefresh);
  } else {
    limit = Number(limitOrOptions) || 4;
  }

  return {
    limit: Math.min(Math.max(Math.floor(limit), 1), 20),

    forceRefresh,
  };
};

const storeMainArticleCache = (data) => {
  const now = Date.now();

  articleCache = data;

  articleCacheTime = now;

  try {
    sessionStorage.setItem(ARTICLE_CACHE_KEY, JSON.stringify(data));

    sessionStorage.setItem(ARTICLE_CACHE_TIME_KEY, String(now));
  } catch (error) {
    console.warn("Unable to store article cache:", error);
  }
};

/* =========================================================
   CLEAR CACHE
========================================================= */

export const clearArticleCache = () => {
  articleCache = null;

  articleCacheTime = 0;

  sessionStorage.removeItem(ARTICLE_CACHE_KEY);

  sessionStorage.removeItem(ARTICLE_CACHE_TIME_KEY);

  Object.keys(sessionStorage).forEach((key) => {
    if (
      key.startsWith("user_articles_cache_") ||
      key.startsWith("user_articles_cache_time_")
    ) {
      sessionStorage.removeItem(key);
    }
  });
};

/* =========================================================
   ALL ARTICLES
========================================================= */

export const fetchArticles = async (forceRefresh = false) => {
  const now = Date.now();

  if (
    !forceRefresh &&
    articleCache &&
    hasUsableArticleCache(articleCache) &&
    now - articleCacheTime < CACHE_DURATION
  ) {
    return {
      data: articleCache,
    };
  }

  if (!forceRefresh) {
    try {
      const stored = sessionStorage.getItem(ARTICLE_CACHE_KEY);

      const storedTime = Number(sessionStorage.getItem(ARTICLE_CACHE_TIME_KEY));

      if (stored && storedTime && now - storedTime < CACHE_DURATION) {
        const parsed = JSON.parse(stored);

        if (hasUsableArticleCache(parsed)) {
          articleCache = parsed;

          articleCacheTime = storedTime;

          return {
            data: parsed,
          };
        }

        sessionStorage.removeItem(ARTICLE_CACHE_KEY);

        sessionStorage.removeItem(ARTICLE_CACHE_TIME_KEY);
      }
    } catch (error) {
      console.warn("Unable to read article cache:", error);
    }
  }

  const response = await API.get("/");

  const normalized = normalizeArticlesPayload(response.data);

  storeMainArticleCache(normalized);

  return {
    ...response,
    data: normalized,
  };
};

/* =========================================================
   STORED ARTICLES
========================================================= */

export const getStoredArticles = () => {
  try {
    const cached = sessionStorage.getItem(ARTICLE_CACHE_KEY);

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);

    return hasUsableArticleCache(parsed)
      ? normalizeArticlesPayload(parsed)
      : null;
  } catch {
    return null;
  }
};

/* =========================================================
   USER ARTICLES
========================================================= */

export const fetchUserArticles = async (
  userId,
  limitOrOptions = 4,
  explicitForceRefresh = false,
) => {
  if (!userId) {
    return {
      data: [],
    };
  }

  const { limit, forceRefresh } = normalizeUserArticleOptions(
    limitOrOptions,
    explicitForceRefresh,
  );

  const cacheKey = getUserCacheKey(userId, limit);

  const cacheTimeKey = getUserCacheTimeKey(userId, limit);

  const now = Date.now();

  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(cacheKey);

      const cachedTime = Number(sessionStorage.getItem(cacheTimeKey));

      if (cached && cachedTime && now - cachedTime < CACHE_DURATION) {
        return {
          data: normalizeArticlesPayload(JSON.parse(cached)),
        };
      }
    } catch (error) {
      console.warn("Unable to read trainer article cache:", error);
    }
  }

  const response = await API.get(`/user/${userId}`, {
    params: {
      limit,
    },
  });

  const normalized = normalizeArticlesPayload(response.data);

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(normalized));

    sessionStorage.setItem(cacheTimeKey, String(now));
  } catch (error) {
    console.warn("Unable to store trainer article cache:", error);
  }

  return {
    ...response,
    data: normalized,
  };
};

/* =========================================================
   STORED USER ARTICLES
========================================================= */

export const getStoredUserArticles = (userId, limit = 4) => {
  if (!userId) {
    return null;
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 4, 1), 20);

  try {
    const cached = sessionStorage.getItem(getUserCacheKey(userId, safeLimit));

    return cached ? normalizeArticlesPayload(JSON.parse(cached)) : null;
  } catch {
    return null;
  }
};

/* =========================================================
   ARTICLE
========================================================= */

export const fetchArticleByName = async (name) => {
  if (!name) {
    throw new Error("Article name is required.");
  }

  return API.get(`/name/${encodeURIComponent(name)}`);
};

/* =========================================================
   CREATE
========================================================= */

export const createArticle = async (formData) => {
  const response = await API.post("/", formData);

  clearArticleCache();

  return response;
};

/* =========================================================
   UPDATE
========================================================= */

export const updateArticle = async (id, formData) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  const response = await API.put(`/${id}`, formData);

  clearArticleCache();

  return response;
};

/* =========================================================
   DELETE
========================================================= */

export const deleteArticle = async (id) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  const response = await API.delete(`/${id}`);

  clearArticleCache();

  return response;
};

/* =========================================================
   LIKES
========================================================= */

export const likeArticle = async (id) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  const response = await API.post(`/${id}/like`);

  clearArticleCache();

  return response;
};

export const unlikeArticle = async (id) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  const response = await API.delete(`/${id}/like`);

  clearArticleCache();

  return response;
};

export const getArticleLikeStatus = async (id) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  return API.get(`/${id}/like-status`);
};

/* =========================================================
   COMMENTS
========================================================= */

export const fetchArticleComments = async (id) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  return API.get(`/${id}/comments`);
};

export const createArticleComment = async (id, body) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  const cleanBody = String(body || "").trim();

  if (!cleanBody) {
    throw new Error("Comment cannot be empty.");
  }

  return API.post(`/${id}/comments`, {
    body: cleanBody,
  });
};

export const deleteArticleComment = async (articleId, commentId) => {
  if (!articleId || !commentId) {
    throw new Error("Article and comment IDs are required.");
  }

  return API.delete(`/${articleId}/comments/${commentId}`);
};

/* =========================================================
   IMAGE
========================================================= */

export const getArticleImageUrl = (id) => {
  if (!id) {
    return null;
  }

  return `${apiConfig.HOST}/articles/${id}/image`;
};
