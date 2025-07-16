// src/api/axiosConfig.js - VERSION DÉFINITIVEMENT CORRIGÉE
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../config/apiConfig';

// ✅ INSTANCE AXIOS SIMPLIFIÉE ET CORRIGÉE
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL, // http://192.168.93.144:8080/api
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ✅ INTERCEPTEUR REQUEST SIMPLIFIÉ
axiosInstance.interceptors.request.use(
  async (config) => {
    // Ajouter un identifiant unique pour le suivi
    config.metadata = { 
      startTime: new Date().getTime(),
      requestId: Math.random().toString(36).substring(2, 15),
    };
    
    // Log propre de la requête
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // ✅ LOG SÉCURISÉ DES DONNÉES (masquer les mots de passe)
    if (config.data) {
      const logData = { ...config.data };
      if (logData.password) {
        logData.password = '[MASQUÉ]';
      }
      console.log('Data:', logData);
    }
    
    // Routes publiques qui n'ont pas besoin de token
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/public/'];
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
    
    // Ajouter le token JWT pour les routes protégées
    if (!isPublicRoute) {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Token ajouté pour:', config.url);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération du token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur dans l\'intercepteur request:', error);
    return Promise.reject(error);
  }
);

// ✅ INTERCEPTEUR RESPONSE AVEC GESTION INTELLIGENTE DES ERREURS
axiosInstance.interceptors.response.use(
  (response) => {
    // Calculer le temps de réponse
    const responseTime = new Date().getTime() - response.config.metadata.startTime;
    console.log(`✅ ${response.status} ${response.config.url} (${responseTime}ms)`);
    
    // Log sécurisé de la réponse
    if (response.data) {
      const logData = { ...response.data };
      if (logData.token) {
        logData.token = '[TOKEN_REÇU]';
      }
      console.log('Response:', logData);
    }
    
    return response;
  },
  async (error) => {
    const responseTime = error.config?.metadata?.startTime 
      ? new Date().getTime() - error.config.metadata.startTime 
      : 0;
    
    console.error(`❌ ${error.response?.status || 'NETWORK'} ${error.config?.url} (${responseTime}ms)`);
    
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    } else {
      console.error('Network error:', error.message);
    }
    
    // Gestion spécifique des erreurs 401 (Non autorisé)
    if (error.response?.status === 401) {
      console.log('🔑 Token expiré, nettoyage des données d\'authentification');
      
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.JWT_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER_DATA,
        ]);
      } catch (storageError) {
        console.error('Erreur lors du nettoyage du stockage:', storageError);
      }
      
      // Vous pouvez ajouter ici une logique de redirection vers l'écran de connexion
    }
    
    return Promise.reject(error);
  }
);

// ✅ FONCTION D'AIDE POUR GÉRER LES ERREURS D'API
export const handleApiError = (error) => {
  if (error.response) {
    // Erreur de réponse du serveur
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: 'VALIDATION_ERROR',
          message: data.message || 'Données invalides',
          details: data.validationErrors || null,
        };
      case 401:
        return {
          type: 'UNAUTHORIZED',
          message: 'Non autorisé - Veuillez vous reconnecter',
        };
      case 403:
        return {
          type: 'FORBIDDEN',
          message: 'Accès interdit',
        };
      case 404:
        return {
          type: 'NOT_FOUND',
          message: 'Ressource non trouvée',
        };
      case 500:
        return {
          type: 'SERVER_ERROR',
          message: 'Erreur serveur interne',
        };
      default:
        return {
          type: 'API_ERROR',
          message: data.message || `Erreur ${status}`,
        };
    }
  } else if (error.request) {
    // Erreur de réseau
    return {
      type: 'NETWORK_ERROR',
      message: 'Problème de connexion réseau',
    };
  } else {
    // Autre erreur
    return {
      type: 'UNKNOWN_ERROR',
      message: error.message || 'Erreur inconnue',
    };
  }
};

export default axiosInstance;