// src/services/secureStorage.js
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Clés pour le stockage sécurisé
export const SECURE_KEYS = {
  JWT_TOKEN: 'focep_jwt_secure_token',
  REFRESH_TOKEN: 'focep_refresh_secure_token',
  USER_SESSION: 'focep_user_secure_session',
  BIOMETRIC_ENABLED: 'focep_biometric_enabled',
  PIN_HASH: 'focep_pin_hash',
};

// Options de stockage sécurisé pour mobile
const secureStoreOptions = Platform.OS !== 'web' ? {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
} : {};

export const SecureStorage = {
  // Stockage sécurisé
  saveItem: async (key, value) => {
    try {
      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }
      
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value, secureStoreOptions);
      }
      return true;
    } catch (error) {
      console.error(`Erreur lors du stockage sécurisé de ${key}:`, error);
      return false;
    }
  },

  // Récupération sécurisée
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key, secureStoreOptions);
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération sécurisée de ${key}:`, error);
      return null;
    }
  },

  // Récupération et parsing JSON sécurisé
  getJSON: async (key) => {
    try {
      let value;
      if (Platform.OS === 'web') {
        value = localStorage.getItem(key);
      } else {
        value = await SecureStore.getItemAsync(key, secureStoreOptions);
      }
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error(`Erreur lors de la récupération/parsing de ${key}:`, error);
      return null;
    }
  },

  // Suppression sécurisée
  removeItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key, secureStoreOptions);
      }
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression sécurisée de ${key}:`, error);
      return false;
    }
  },

  // Vérifier si une clé existe
  hasItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key) !== null;
      } else {
        const value = await SecureStore.getItemAsync(key, secureStoreOptions);
        return value !== null;
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'existence de ${key}:`, error);
      return false;
    }
  },

  // Nettoyage complet des données d'authentification
  clearAuthData: async () => {
    try {
      const keys = [
        SECURE_KEYS.JWT_TOKEN,
        SECURE_KEYS.REFRESH_TOKEN,
        SECURE_KEYS.USER_SESSION,
      ];
      
      if (Platform.OS === 'web') {
        keys.forEach(key => localStorage.removeItem(key));
      } else {
        await Promise.all(keys.map(key => 
          SecureStore.deleteItemAsync(key, secureStoreOptions)
        ));
      }
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage des données d\'authentification:', error);
      return false;
    }
  },
};