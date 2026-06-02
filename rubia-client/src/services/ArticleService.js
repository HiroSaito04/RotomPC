// rubia-client/src/services/ArticleService.js
import axios from 'axios';
import constants from '../constants';

const API = axios.create({
  baseURL: `${constants.HOST}/articles`,
});

export const fetchArticles = () => API.get('/');

export const createArticle = (articleData) => API.post('/', articleData);

export const updateArticle = (id, articleData) => API.put(`/${id}`, articleData);

export const deleteArticle = (id) => API.delete(`/${id}`);