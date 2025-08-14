// src/config/apiConfig.js - VERSION CORRIGÉE
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (!__DEV__) {
    return 'https://api.votredomaine.com/api';
  }
  
  // En développement, adapter l'URL selon la plateforme
  switch (Platform.OS) {
    case 'android':
      console.log('📱 Android détecté - Utilisation de 10.0.2.2:8080');
      return 'http://10.0.2.2:8080/api';
    case 'ios':
      console.log('📱 iOS détecté - Utilisation de localhost:8080');
      return 'http://localhost:8080/api';
    case 'web':
      console.log('💻 Web détecté - Utilisation de localhost:8080');
      return 'http://localhost:8080/api';
    default:
      console.log('🤔 Plateforme inconnue - Utilisation de localhost:8080 par défaut');
      return 'http://localhost:8080/api';
  }
};

export const API_CONFIG = {
  baseURL: getBaseUrl(),
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export const STORAGE_KEYS = {
  JWT_TOKEN: 'focep_jwt_token',
  REFRESH_TOKEN: 'focep_refresh_token',
  USER_DATA: 'focep_user_data',
  OFFLINE_DATA: 'focep_offline_data',
  LAST_SYNC: 'focep_last_sync',
};

// Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  PING: '/public/ping',
  
  // Collecteurs
  COLLECTEURS: '/collecteurs',
  COLLECTEURS_BY_AGENCE: '/collecteurs/agence',
  
  // Clients
  CLIENTS: '/clients',
  CLIENTS_BY_COLLECTEUR: '/clients/collecteur',
  
  // Comptes
  COMPTES: '/comptes',
  COMPTES_BY_CLIENT: '/comptes/client',
  COMPTES_BY_COLLECTEUR: '/comptes/collecteur',
  COMPTES_SOLDE: '/comptes/{id}/solde',
  
  // Mouvements
  MOUVEMENTS_EPARGNE: '/mouvements/epargne',
  MOUVEMENTS_RETRAIT: '/mouvements/retrait',
  MOUVEMENTS_BY_JOURNAL: '/mouvements/journal',
  
  // Journaux
  JOURNAUX: '/journaux',
  JOURNAUX_BY_COLLECTEUR: '/journaux/collecteur',
  JOURNAUX_CLOTURE: '/journaux/cloture',
  
  // Commissions
  COMMISSIONS_PROCESS: '/commissions/process',
  COMMISSIONS_STATUS: '/commissions/status',
  COMMISSIONS_BY_COLLECTEUR: '/commissions/collecteur',
  
  // Reports
  REPORTS_COLLECTEUR_MONTHLY: '/reports/collecteur/{id}/monthly',
  REPORTS_AGENCE: '/reports/agence/{id}',
};

// Utilitaire pour construire les URLs complètes
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};

// Fonction de débogage pour afficher la configuration
export const debugApiConfig = () => {
  console.log('🔧 Configuration API:', {
    baseURL: API_CONFIG.baseURL,
    platform: Platform.OS,
    isDev: __DEV__, // ✅ CORRECTION
    timeout: API_CONFIG.timeout
  });
};