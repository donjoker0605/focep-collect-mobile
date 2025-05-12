// src/constants/api.js

// URL de base de l'API
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

// Timeout pour les requêtes API (en ms)
export const API_TIMEOUT = 15000;

// Endpoints de l'API
export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_CODE: '/auth/verify-reset-code',
    REFRESH_TOKEN: '/auth/refresh-token',
    USER_INFO: '/auth/user-info',
  },
  
  // Collecteurs
  COLLECTEUR: {
    BASE: '/collecteurs',
    BY_ID: (id) => `/collecteurs/${id}`,
    CLIENTS: (id) => `/collecteurs/${id}/clients`,
    COMMISSIONS: (id) => `/collecteurs/${id}/commissions`,
    JOURNAL: (id) => `/collecteurs/${id}/journals`,
    STATS: (id) => `/collecteurs/${id}/stats`,
  },
  
  // Clients
  CLIENT: {
    BASE: '/clients',
    BY_ID: (id) => `/clients/${id}`,
    TRANSACTIONS: (id) => `/clients/${id}/transactions`,
    SOLDE: (id) => `/clients/${id}/solde`,
  },
  
  // Comptes
  COMPTE: {
    BASE: '/comptes',
    BY_ID: (id) => `/comptes/${id}`,
    TRANSACTIONS: (id) => `/comptes/${id}/transactions`,
  },
  
  // Transactions
  TRANSACTION: {
    BASE: '/transactions',
    BY_ID: (id) => `/transactions/${id}`,
    EPARGNE: '/transactions/epargne',
    RETRAIT: '/transactions/retrait',
  },
  
  // Journal
  JOURNAL: {
    BASE: '/journals',
    BY_ID: (id) => `/journals/${id}`,
    CLOTURE: (id) => `/journals/${id}/cloture`,
  },
  
  // Rapports
  RAPPORT: {
    BASE: '/rapports',
    COMMISSION: '/rapports/commission',
    COLLECTE: '/rapports/collecte',
    JOURNAL: '/rapports/journal',
  },
  
  // Paramètres
  PARAMETRE: {
    BASE: '/parametres',
    COMMISSION: '/parametres/commission',
    COLLECTE: '/parametres/collecte',
  },
};

// Codes d'erreur spécifiques
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  MAX_RETRAIT_EXCEEDED: 'MAX_RETRAIT_EXCEEDED',
};

// Messages d'erreur
export const API_ERROR_MESSAGES = {
  [API_ERROR_CODES.UNAUTHORIZED]: 'Vous n\'êtes pas autorisé à effectuer cette action.',
  [API_ERROR_CODES.INVALID_CREDENTIALS]: 'Identifiants invalides.',
  [API_ERROR_CODES.RESOURCE_NOT_FOUND]: 'La ressource demandée n\'existe pas.',
  [API_ERROR_CODES.INSUFFICIENT_FUNDS]: 'Solde insuffisant pour effectuer cette opération.',
  [API_ERROR_CODES.VALIDATION_ERROR]: 'Les données fournies sont invalides.',
  [API_ERROR_CODES.SERVER_ERROR]: 'Une erreur serveur est survenue. Veuillez réessayer plus tard.',
  [API_ERROR_CODES.NETWORK_ERROR]: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
  [API_ERROR_CODES.MAX_RETRAIT_EXCEEDED]: 'Le montant maximum de retrait a été dépassé.',
};