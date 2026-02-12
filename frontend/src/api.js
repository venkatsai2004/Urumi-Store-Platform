import axios from 'axios';


const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,

  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store endpoints
export const getStores = () => api.get('/stores');
export const createStore = (data) => api.post('/stores', data);
export const deleteStore = (storeId) => api.delete(`/stores/${storeId}`);

export default api;
