// src/api/axiosConfig.js (mise à jour)
import axios from 'axios';
import { SecureStorage, SECURE_KEYS } from '../services/secureStorage';
import { API_CONFIG } from '../config/apiConfig';
import NetInfo from '@react-native-community/netinfo';
import errorService, { ERROR_TYPES } from '../services/errorService';

// Codes d'erreur personnalisés
export const ERROR_CODES = {
  OFFLINE: 'ERR_NETWORK_OFFLINE',
  TIMEOUT: 'ERR_NETWORK_TIMEOUT',
  CANCELED: 'ERR_REQUEST_CANCELED',
  ABORTED: 'ERR_REQUEST_ABORTED',
  UNKNOWN: 'ERR_UNKNOWN',
};

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
    // Ajouter un identifiant unique à chaque requête pour le suivi
    config.metadata = { 
      startTime: new Date().getTime(),
      requestId: Math.random().toString(36).substring(2, 15),
    };
    
    // Vérifier la connexion internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return Promise.reject({
        code: ERROR_CODES.OFFLINE,
        message: 'Appareil hors-ligne. Veuillez vérifier votre connexion internet.',
        offline: true,
      });
    }
    
    // Récupérer le token depuis le stockage sécurisé
    const token = await SecureStorage.getItem(SECURE_KEYS.JWT_TOKEN);
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
    // Ajouter des métadonnées à la réponse pour le suivi
    const requestTime = new Date().getTime() - response.config.metadata.startTime;
    response.metadata = {
      ...response.config.metadata,
      requestTime,
    };
    
    return response;
  },
  async (error) => {
    // Enrichir l'erreur avec des métadonnées
    const enhancedError = {
      ...error,
      message: error.message || 'Une erreur est survenue',
      code: error.code || ERROR_CODES.UNKNOWN,
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
      enhancedError.code = ERROR_CODES.CANCELED;
      enhancedError.message = 'Requête annulée';
      return Promise.reject(enhancedError);
    }
    
    // Erreurs de connexion
    if (error.code === 'ECONNABORTED') {
      enhancedError.code = ERROR_CODES.TIMEOUT;
      enhancedError.message = 'La requête a pris trop de temps à répondre';
    }
    
    // Si nous avons déjà détecté une erreur hors ligne
    if (error.offline) {
      // Enregistrer l'erreur
      errorService.handleError(new Error(error.message), {
        type: ERROR_TYPES.NETWORK,
        silent: true, // Ne pas afficher de notification
      });
      
      return Promise.reject(enhancedError);
    }
    
    // Erreur 401 (non autorisé) - essayer de rafraîchir le token
    if (error.response && error.response.status === 401 && error.config && !error.config._retry) {
      error.config._retry = true;
      
      try {
        // Essayer de rafraîchir le token
        const refreshToken = await SecureStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          // Appeler l'API pour obtenir un nouveau token
          const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh-token`, {
            refreshToken
          });
          
          const { token, newRefreshToken } = response.data;
          
          // Stocker le nouveau token de manière sécurisée
          await SecureStorage.saveItem(SECURE_KEYS.JWT_TOKEN, token);
          
          // Stocker le nouveau refresh token s'il existe
          if (newRefreshToken) {
            await SecureStorage.saveItem(SECURE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }
          
          // Mettre à jour l'en-tête avec le nouveau token
          error.config.headers.Authorization = `Bearer ${token}`;
          
          // Réessayer la requête originale
          return axiosInstance(error.config);
        }
      } catch (refreshError) {
        // Si le rafraîchissement échoue, nettoyer les tokens
        await SecureStorage.clearAuthData();
        
        // Publier un événement pour la déconnexion
        if (global.authEventEmitter) {
          global.authEventEmitter.emit('SESSION_EXPIRED');
        }
        
        enhancedError.authError = true;
        enhancedError.message = 'Session expirée. Veuillez vous reconnecter.';
        
        // Enregistrer l'erreur d'authentification
        errorService.handleError(new Error('Session expirée'), {
          type: ERROR_TYPES.AUTH,
          silent: true, // La notification sera gérée par l'écouteur d'événements
        });
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
    
    // Enregistrer l'erreur (sauf pour les erreurs d'authentification déjà traitées)
    if (!enhancedError.authError) {
      let errorType = ERROR_TYPES.API;
      
      if (error.response) {
        if (error.response.status === 400) {
          errorType = ERROR_TYPES.VALIDATION;
        } else if (error.response.status === 403) {
          errorType = ERROR_TYPES.AUTH;
        } else if (error.response.status >= 500) {
          errorType = ERROR_TYPES.API;
        }
      } else if (!error.response && error.request) {
        errorType = ERROR_TYPES.NETWORK;
      } else {
        errorType = ERROR_TYPES.UNEXPECTED;
      }
      
      // Envoyer l'erreur au service
      errorService.handleError(enhancedError, {
        type: errorType,
        silent: true, // Ne pas afficher de notification ici, cela sera géré au niveau du composant
        context: {
          url: error.config?.url,
          method: error.config?.method,
          requestData: error.config?.data,
        },
      });
    }
    
    return Promise.reject(enhancedError);
  }
);

// Fonction pour gérer les erreurs API de manière standardisée
export const handleApiError = (error) => {
  // Cette fonction est maintenant simplifiée car la logique est dans le service d'erreur
  return {
    status: error.status || 500,
    message: error.message || 'Une erreur est survenue',
    data: error.data || {},
    code: error.code || ERROR_CODES.UNKNOWN,
    offline: error.offline || false,
    authError: error.authError || false
  };
};

export default axiosInstance;