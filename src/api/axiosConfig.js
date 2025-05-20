// src/api/axiosConfig.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../config/apiConfig';
import NetInfo from '@react-native-community/netinfo';

// Instance Axios avec configuration
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL, 
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
axiosInstance.interceptors.request.use(
  async (config) => {
    // Vérifier la connexion internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // Si hors-ligne, rejeter directement pour économiser des tentatives
      return Promise.reject(new Error('OFFLINE'));
    }
    
    // Récupérer le token depuis le stockage
    const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs et le rafraîchissement de tokens
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si l'erreur est due à l'absence de connexion
    if (error.message === 'OFFLINE') {
      return Promise.reject({ 
        offline: true, 
        message: 'Appareil hors-ligne. Opération enregistrée pour synchronisation ultérieure.' 
      });
    }
    
    // Si erreur 401 (non autorisé) et pas déjà en tentative de rafraîchissement
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Essayer de rafraîchir le token
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          // Appeler l'API pour obtenir un nouveau token
          const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh-token`, {
            refreshToken
          });
          
          const { token } = response.data;
          
          // Stocker le nouveau token
          await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
          
          // Mettre à jour l'en-tête avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Réessayer la requête originale
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Si le rafraîchissement échoue, nettoyer les tokens et rediriger vers la connexion
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.JWT_TOKEN, 
          STORAGE_KEYS.REFRESH_TOKEN, 
          STORAGE_KEYS.USER_DATA
        ]);
        
        // Le composant AuthContext s'occupera de la redirection
        return Promise.reject({ 
          authError: true, 
          message: 'Session expirée. Veuillez vous reconnecter.' 
        });
      }
    }
    
    // Reformater l'erreur pour une meilleure gestion
    return Promise.reject({
      status: error.response?.status,
      data: error.response?.data,
      message: error.response?.data?.message || error.message || 'Erreur inconnue',
      originalError: error
    });
  }
);

// Fonction pour gérer les erreurs API de manière standardisée
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.offline) {
    return {
      isOfflineError: true,
      message: error.message
    };
  }
  
  if (error.authError) {
    return {
      isAuthError: true,
      message: error.message
    };
  }
  
  return {
    status: error.status || 500,
    message: error.message || 'Une erreur est survenue',
    data: error.data || {}
  };
};

export default axiosInstance;