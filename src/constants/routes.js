// Routes pour la navigation dans l'application

// Routes d'authentification
export const AUTH_ROUTES = {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
    SECURITY_PIN: 'SecurityPin',
    NEW_PASSWORD: 'NewPassword',
  };
  
  // Routes principales de l'application collecteur
  export const COLLECTEUR_ROUTES = {
    // Onglets principaux
    DASHBOARD: 'Dashboard',
    CLIENTS: 'Clients',
    COLLECTE: 'Collecte',
    JOURNAL: 'Journal',
    PROFILE: 'Profile',
    
    // Écrans détaillés
    CLIENT_DETAIL: 'ClientDetail',
    CLIENT_ADD_EDIT: 'ClientAddEdit',
    CLIENT_TRANSACTIONS: 'ClientTransactions',
    COLLECTE_DETAIL: 'CollecteDetail',
    JOURNAL_DETAIL: 'JournalDetail',
    VENTILATION: 'Ventilation',
    HISTORIQUE_COLLECTE: 'HistoriqueCollecte',
    PARAMETRES: 'Parametres',
  };
  
  // Routes pour l'administration
  export const ADMIN_ROUTES = {
    DASHBOARD: 'AdminDashboard',
    COLLECTEURS: 'CollecteurManagement',
    COLLECTEUR_DETAIL: 'CollecteurDetail',
    COLLECTEUR_CREATE: 'CollecteurCreate',
    COLLECTEUR_EDIT: 'CollecteurEdit',
    CAUTION_MANAGEMENT: 'CautionManagement',
    COMPTES: 'CompteManagement',
    TRANSFERT_COMPTES: 'TransfertComptes',
    RAPPORTS: 'Rapports',
    COMMISSION_PARAMETRES: 'CommissionParametres',
    UTILISATEURS: 'Utilisateurs',
    AGENCES: 'Agences',
  };
  
  // Routes communes
  export const COMMON_ROUTES = {
    NOTIFICATIONS: 'Notifications',
    SETTINGS: 'Settings',
    HELP: 'Help',
    ABOUT: 'About',
  };
  
  // Routes de rapports
  export const REPORT_ROUTES = {
    MONTHLY_REPORT: 'MonthlyReport',
    COMMISSION_REPORT: 'CommissionReport',
  };
  
  // Regroupement de toutes les routes
  export const ROUTES = {
    ...AUTH_ROUTES,
    ...COLLECTEUR_ROUTES,
    ...ADMIN_ROUTES,
    ...COMMON_ROUTES,
    ...REPORT_ROUTES,
  };