// src/api/config.js
import axios from 'axios';

const BASE_URL = 'http://192.168.94.22:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes timeout
});

// Intercepteur pour logger toutes les requêtes
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Data:', config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour logger toutes les réponses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    console.log('Response:', response.data);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.response?.status || 'NETWORK'} ${error.config?.url}`);
    console.error('Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;