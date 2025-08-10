// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',

  TIMEOUT: 30000, // 10 secondes
  RETRY_ATTEMPTS: 3,
};

// Endpoints principaux
export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Public
  PUBLIC: {
    PING: '/public/ping',
  },
  
  // Collecteurs
  COLLECTEURS: {
    BASE: '/collecteurs',
    BY_AGENCE: (agenceId) => `/collecteurs/agence/${agenceId}`,
    COMPTES: (collecteurId) => `/comptes/collecteur/${collecteurId}`,
    RESET_PASSWORD: (collecteurId) => `/collecteurs/${collecteurId}/reset-password`,
    MONTANT_MAX: (collecteurId) => `/collecteurs/${collecteurId}/montant-max`,
  },
  
  // Clients
  CLIENTS: {
    BASE: '/clients',
    BY_COLLECTEUR: (collecteurId) => `/clients/collecteur/${collecteurId}`,
    COMPTES: (clientId) => `/comptes/client/${clientId}`,
    BY_ID: (clientId) => `/clients/${clientId}`,
  },
  
  // Journaux
  JOURNAUX: {
    BASE: '/journaux',
    BY_COLLECTEUR: (collecteurId) => `/journaux/collecteur/${collecteurId}`,
    ACTIF: (collecteurId) => `/journaux/collecteur/${collecteurId}/actif`,
    CLOTURE: '/journaux/cloture',
    BY_ID: (journalId) => `/journaux/${journalId}`,
  },
  
  // Mouvements
  MOUVEMENTS: {
    EPARGNE: '/mouvements/epargne',
    RETRAIT: '/mouvements/retrait',
    BY_JOURNAL: (journalId) => `/mouvements/journal/${journalId}`,
    BY_CLIENT: (clientId) => `/mouvements/client/${clientId}`,
    BY_COLLECTEUR: (collecteurId) => `/mouvements/collecteur/${collecteurId}`,
  },
  
  // Comptes
  COMPTES: {
    BASE: '/comptes',
    SOLDE: (compteId) => `/comptes/${compteId}/solde`,
    BY_AGENCE: (agenceId) => `/comptes/agence/${agenceId}`,
  },
  
  // Commissions
  COMMISSIONS: {
    PARAMETERS: '/commissions/parameters',
    PROCESS: '/commissions/process',
    STATUS: (trackingId) => `/commissions/status/${trackingId}`,
    BY_COLLECTEUR: (collecteurId) => `/commissions/collecteur/${collecteurId}`,
    TIERS: (parameterId) => `/commission-parameters/${parameterId}/tiers`,
  },
  
  // Rapports
  RAPPORTS: {
    COLLECTEUR_MONTHLY: (collecteurId) => `/reports/collecteur/${collecteurId}/monthly`,
    AGENCE: (agenceId) => `/reports/agence/${agenceId}`,
    GLOBAL: '/reports/admin/global',
  },
  
  // Transfers
  TRANSFERS: {
    COLLECTEURS: '/transfers/collecteurs',
    BY_ID: (transferId) => `/transfers/${transferId}`,
  },
  
  // Admin
  ADMIN: {
    CACHE_CLEAR: '/admin/cache/clear-all',
    COMPTE_HEALTH_CHECK: '/admin/compte-health/check',
    COMPTE_HEALTH_FIX: (collecteurId) => `/admin/compte-health/fix/${collecteurId}`,
  },
  
  // Utilisateurs
  USERS: {
    ADMIN: '/users/admin',
  },
  
  // Audit
  AUDIT: {
    USER: (email) => `/audit/user/${email}`,
  },
};

// Rôles utilisateur
export const USER_ROLES = {
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  ADMIN: 'ROLE_ADMIN',
  COLLECTEUR: 'ROLE_COLLECTEUR',
};

// Types de mouvements
export const MOVEMENT_TYPES = {
  EPARGNE: 'EPARGNE',
  RETRAIT: 'RETRAIT',
};

// Types de commission
export const COMMISSION_TYPES = {
  FIXE: 'FIXE',
  PERCENTAGE: 'PERCENTAGE',
  PALIER: 'PALIER',
};

// Status des journaux
export const JOURNAL_STATUS = {
  OUVERT: 'OUVERT',
  CLOTURE: 'CLOTURE',
};