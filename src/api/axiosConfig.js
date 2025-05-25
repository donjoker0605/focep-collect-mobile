// src/api/axiosConfig.js - VERSION DÉFINITIVEMENT CORRIGÉE
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../config/apiConfig';
import NetInfo from '@react-native-community/netinfo';

// Instance Axios avec configuration CORRIGÉE
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL, // ✅ Déjà http://192.168.91.2:8080/api
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
axiosInstance.interceptors.request.use(
  async (config) => {
    // ✅ CORRECTION CRITIQUE : Plus besoin de nettoyer l'URL puisque baseURL est correcte
    
    // Ajouter un identifiant unique à chaque requête pour le suivi
    config.metadata = { 
      startTime: new Date().getTime(),
      requestId: Math.random().toString(36).substring(2, 15),
    };
    
    // Log de la requête pour débogage
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.data) {
      console.log(`Data:`, config.data);
    }
    
    // Ne pas ajouter de token pour les requêtes d'authentification
    const publicRoutes = ['/auth/login', '/auth/register', '/public/'];
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
    
    if (!isPublicRoute) {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token ajouté pour:', config.url);
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs et le rafraîchissement de tokens
axiosInstance.interceptors.response.use(
  (response) => {
    // Ajouter des métadonnées à la réponse pour le suivi
    if (response.config?.metadata) {
      const requestTime = new Date().getTime() - response.config.metadata.startTime;
      response.metadata = {
        ...response.config.metadata,
        requestTime,
      };
    }
    
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${response.status})`);
    return response;
  },
  async (error) => {
    // Enrichir l'erreur avec des métadonnées
    console.error(`❌ ${error.config?.method?.toUpperCase() || 'NETWORK'} ${error.config?.url || ''}`);
    console.error('Error details:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    const enhancedError = {
      ...error,
      message: error.message || 'Une erreur est survenue',
      code: error.code || 'ERR_UNKNOWN',
    };
    
    // Si la requête a des métadonnées, les ajouter à l'erreur
    if (error.config?.metadata) {
      enhancedError.metadata = {
        ...error.config.metadata,
        requestTime: new Date().getTime() - error.config.metadata.startTime,
      };
    }
    
    // Si la requête a été annulée délibérément, ne pas traiter comme une vraie erreur
    if (axios.isCancel(error)) {
      enhancedError.code = 'ERR_REQUEST_CANCELED';
      enhancedError.message = 'Requête annulée';
      return Promise.reject(enhancedError);
    }
    
    // Erreurs de connexion
    if (error.code === 'ECONNABORTED') {
      enhancedError.code = 'ERR_NETWORK_TIMEOUT';
      enhancedError.message = 'La requête a pris trop de temps à répondre';
    }
    
    // Erreur 401 (non autorisé) - essayer de rafraîchir le token si disponible
    if (error.response && error.response.status === 401 && error.config && !error.config._retry) {
      error.config._retry = true;
      
      try {
        // Essayer de rafraîchir le token
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          // Appeler l'API pour obtenir un nouveau token
          const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh-token`, {
            refreshToken
          });
          
          const { token, newRefreshToken } = response.data;
          
          // Stocker le nouveau token
          await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
          
          // Stocker le nouveau refresh token s'il existe
          if (newRefreshToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }
          
          // Mettre à jour l'en-tête avec le nouveau token
          error.config.headers.Authorization = `Bearer ${token}`;
          
          // Réessayer la requête originale
          return axiosInstance(error.config);
        }
      } catch (refreshError) {
        console.error('Erreur lors du rafraîchissement du token:', refreshError);
        
        // Si le rafraîchissement échoue, nettoyer les tokens
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.JWT_TOKEN, 
          STORAGE_KEYS.REFRESH_TOKEN, 
          STORAGE_KEYS.USER_DATA
        ]);
        
        // Publier un événement pour la déconnexion
        if (global.authEventEmitter) {
          global.authEventEmitter.emit('SESSION_EXPIRED');
        }
        
        enhancedError.authError = true;
        enhancedError.message = 'Session expirée. Veuillez vous reconnecter.';
      }
    }
    
    // Enrichir l'erreur avec les données de la réponse
    if (error.response) {
      enhancedError.status = error.response.status;
      enhancedError.data = error.response.data;
      enhancedError.headers = error.response.headers;
      
      // Extraire le message d'erreur si disponible
      if (error.response.data?.message) {
        enhancedError.message = error.response.data.message;
      } else if (error.response.data?.error) {
        enhancedError.message = error.response.data.error;
      }
    }
    
    return Promise.reject(enhancedError);
  }
);

// Fonction pour gérer les erreurs API de manière standardisée
export const handleApiError = (error) => {
  return {
    status: error.status || 500,
    message: error.message || 'Une erreur est survenue',
    data: error.data || {},
    code: error.code || 'ERR_UNKNOWN',
    offline: error.offline || false,
    authError: error.authError || false
  };
};

export default axiosInstance;