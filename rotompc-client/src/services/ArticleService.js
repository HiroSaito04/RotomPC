import axios from 'axios';
import constants from '@/constants';

const API = axios.create({
  baseURL: `${constants.HOST}/articles`,
});

let articleCache = null;
let articleCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 5;

export const clearArticleCache = () => {
  articleCache = null;
  articleCacheTime = 0;

  sessionStorage.removeItem('articles_cache');
  sessionStorage.removeItem('articles_cache_time');

  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('user_articles_cache')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const fetchArticles = async (forceRefresh = false) => {
  const now = Date.now();

  if (!forceRefresh && articleCache && now - articleCacheTime < CACHE_DURATION) {
    return { data: articleCache };
  }

  const res = await API.get('/');

  articleCache = res.data;
  articleCacheTime = now;

  sessionStorage.setItem('articles_cache', JSON.stringify(res.data));
  sessionStorage.setItem('articles_cache_time', String(now));

  return res;
};

export const getStoredArticles = () => {
  try {
    const cached = sessionStorage.getItem('articles_cache');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const fetchUserArticles = async (userId, limit = 4) => {
  return API.get(`/user/${userId}`, {
    params: { limit }
  });
};

export const createArticle = async (formData) => {
  const res = await API.post('/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  clearArticleCache();
  return res;
};

export const updateArticle = async (id, formData) => {
  const res = await API.put(`/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  clearArticleCache();
  return res;
};

export const deleteArticle = async (id) => {
  const res = await API.delete(`/${id}`);
  clearArticleCache();
  return res;
};
export const fetchArticleByName = async (name) => {
  return API.get(`/name/${name}`);
};

export const getArticleImageUrl = (id) => {
  return `${constants.HOST}/articles/${id}/image`;
};

