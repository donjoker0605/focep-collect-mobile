// src/config/appConfig.js
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configuration de l'application
export const APP_CONFIG = {
  // Environnement
  environment: process.env.EXPO_PUBLIC_ENV || 'development',
  isDevelopment: (process.env.EXPO_PUBLIC_ENV || 'development') === 'development',
  isStaging: (process.env.EXPO_PUBLIC_ENV || 'development') === 'staging',
  isProduction: (process.env.EXPO_PUBLIC_ENV || 'development') === 'production',
  
  // API
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api',
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_TIMEOUT || '10000', 10),
  apiRetryAttempts: 3,
  apiRetryDelay: 1000,
  
  // Mock API pour le développement
  useMockData: process.env.EXPO_PUBLIC_MOCK_API === 'true',
  
  // Informations sur l'application
  appId: process.env.EXPO_PUBLIC_APP_ID || 'com.focep.collect.dev',
  appVersion: process.env.EXPO_PUBLIC_APP_VERSION || Application.nativeApplicationVersion || '1.0.0',
  appBuild: Application.nativeBuildVersion || '1',
  
  // Reporting d'erreurs
  errorReportingApiKey: process.env.EXPO_PUBLIC_ERROR_REPORTING_API_KEY || 'dev_key',
  
  // Sessions et authentification
  sessionTimeout: parseInt(process.env.EXPO_PUBLIC_SESSION_TIMEOUT || '1800000', 10), // 30 minutes par défaut
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes avant expiration
  
  // Cache
  defaultCacheDuration: parseInt(process.env.EXPO_PUBLIC_CACHE_DURATION || '3600000', 10), // 1 heure par défaut
  imageCacheDays: parseInt(process.env.EXPO_PUBLIC_IMAGE_CACHE_DAYS || '7', 10), // 7 jours par défaut
  
  // Appareil
  deviceInfo: {
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    isDevice: Device.isDevice,
    platform: Platform.OS,
  },
  
  // Fonctionnalités à activer/désactiver selon l'environnement
  features: {
    enableOfflineMode: true,
    enableBiometricAuth: !__DEV__, // Désactivé en développement pour faciliter les tests
    enablePushNotifications: !__DEV__, // Désactivé en développement pour éviter les notifications de test
    enableErrorReporting: !__DEV__, // Activé uniquement hors développement
    enableAnalytics: !__DEV__, // Activé uniquement hors développement
    enablePerformanceMonitoring: !__DEV__, // Activé uniquement hors développement
  },
};

// Fonction utilitaire pour vérifier si une fonctionnalité est activée
export const isFeatureEnabled = (featureName) => {
  return APP_CONFIG.features[featureName] === true;
};

// Exporter la configuration et les fonctions utilitaires
export default {
  APP_CONFIG,
  isFeatureEnabled,
};