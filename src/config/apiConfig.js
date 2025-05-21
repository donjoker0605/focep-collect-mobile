// src/config/apiConfig.js
import Constants from 'expo-constants';

const PROD_API_URL = 'https://api.votredomaine.com';
const DEV_API_URL = 'http://10.0.2.2:8080/api';

export const API_CONFIG = {
  // Utilisez __DEV__ qui est une variable globale d'Expo/React Native
  baseURL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  timeout: 15000,
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
