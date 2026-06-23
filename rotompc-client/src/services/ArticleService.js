import axios from 'axios';
import constants from '@/constants';

const API = axios.create({
  baseURL: `${constants.HOST}/articles`,
});

export const fetchArticles = () => API.get('/');

export const createArticle = (formData) => API.post('/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const updateArticle = (id, formData) => API.put(`/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const deleteArticle = (id) => API.delete(`/${id}`);