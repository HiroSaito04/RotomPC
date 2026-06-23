// rotompc-client\src\services\UserService.js
import axios from 'axios';
import constants from '../constants';

const API = axios.create({ 
  baseURL: `${constants.HOST}/users`, 
});

// Axios Request Interceptor: Automatically inspects local storage and attaches headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchUsers = () => API.get('/');

export const createUser = (user) => API.post('/', user);

export const updateUser = (id, user) => API.put(`/${id}`, user); 

export const deleteUser = (id) => {
  const adminId = localStorage.getItem('id'); // Pull local session ID to satisfy admin identity header verification
  return API.delete(`/${id}`, {
    headers: {
      'x-user-id': adminId
    }
  });
}; 

export const loginUser = (credentials) => API.post('/login', credentials);