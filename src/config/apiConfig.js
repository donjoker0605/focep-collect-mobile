// src/config/apiConfig.js
import Constants from 'expo-constants';
import { Platform } from 'react-native'; // Import manquant ajouté

const PROD_API_URL = 'https://api.votredomaine.com';

// Fonction utilitaire pour obtenir l'URL de base de manière sécurisée
const getBaseApiUrl = () => {
  try {
    if (__DEV__) { // Correction de **DEV** en __DEV__
      // En développement
      if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8080/api';
      } else {
        return 'http://localhost:8080/api';
      }
    } else {
      // En production ou en cas d'erreur
      return 'http://192.168.111.57:8080/api';
    }
  } catch (error) {
    console.warn('Erreur lors de la détermination de l\'URL de base:', error);
    return 'http://192.168.111.57:8080/api'; // URL par défaut en cas d'erreur
  }
};

export const API_CONFIG = {
  baseURL: Constants.expoConfig?.extra?.apiUrl || getBaseApiUrl(),
  timeout: 25000,
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
