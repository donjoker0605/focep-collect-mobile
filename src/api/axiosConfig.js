// src/api/axiosConfig.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

// Créer une instance axios avec une configuration par défaut
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Ajouter un intercepteur pour inclure le token d'authentification à chaque requête
axiosInstance.interceptors.request.use(
  async (config) => {
    // Récupérer le token depuis le stockage local
    const token = await AsyncStorage.getItem('authToken');
    
    // Si un token existe, l'ajouter à l'en-tête Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Ajouter un intercepteur pour gérer les erreurs de réponse
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si l'erreur est 401 (non autorisé) et que ce n'est pas déjà une tentative de rafraîchissement
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Essayer de rafraîchir le token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Appeler l'API pour obtenir un nouveau token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          const { token } = response.data;
          
          // Stocker le nouveau token
          await AsyncStorage.setItem('authToken', token);
          
          // Mettre à jour l'en-tête avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Réessayer la requête originale
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Si le rafraîchissement échoue, déconnecter l'utilisateur
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        
        // Rediriger vers la page de connexion (géré par le contexte d'authentification)
        // La logique se trouve dans le hook useAuth
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;