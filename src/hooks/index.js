// src/hooks/index.js - Export centralisé des hooks

// Hooks d'authentification
export { default as useAuth } from './useAuth';

// Hooks de gestion d'erreurs
export { default as useErrorHandler } from './useErrorHandler';

// Hooks de données
export { default as useClients } from './useClients';
export { default as useCollecteurs } from './useCollecteurs';
export { default as useTransactions } from './useTransactions';

// Hooks de formulaires
export { default as useForm } from './useForm';

// Hooks de synchronisation
export { default as useOfflineSync } from './useOfflineSync';

// Hooks utilitaires
export { default as useDebounce } from './useDebounce';
export { default as useStorage } from './useStorage';

// Hooks de navigation
export { default as useNavigation } from './useNavigation';

// Hooks de performance
export { default as useOptimization } from './useOptimization';

// Hooks de géolocalisation
export { default as useGeolocation } from './useGeolocation';

// Hooks de notification
export { default as useNotifications } from './useNotifications';

// Hooks de thème
export { default as useTheme } from './useTheme';

// Hooks de réseau
export { default as useNetworkStatus } from './useNetworkStatus';