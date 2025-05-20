// src/services/secureStorage.js
import * as SecureStore from 'expo-secure-store';

// Clés pour le stockage sécurisé
export const SECURE_KEYS = {
  JWT_TOKEN: 'focep_jwt_secure_token',
  REFRESH_TOKEN: 'focep_refresh_secure_token',
  USER_SESSION: 'focep_user_secure_session',
  BIOMETRIC_ENABLED: 'focep_biometric_enabled',
  PIN_HASH: 'focep_pin_hash',
};

// Options de stockage sécurisé
const secureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED, // Uniquement disponible lorsque l'appareil est déverrouillé
};

export const SecureStorage = {
  // Stockage sécurisé
  saveItem: async (key, value) => {
    try {
      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }
      await SecureStore.setItemAsync(key, value, secureStoreOptions);
      return true;
    } catch (error) {
      console.error(`Erreur lors du stockage sécurisé de ${key}:`, error);
      return false;
    }
  },

  // Récupération sécurisée
  getItem: async (key) => {
    try {
      const value = await SecureStore.getItemAsync(key, secureStoreOptions);
      return value;
    } catch (error) {
      console.error(`Erreur lors de la récupération sécurisée de ${key}:`, error);
      return null;
    }
  },

  // Récupération et parsing JSON sécurisé
  getJSON: async (key) => {
    try {
      const value = await SecureStore.getItemAsync(key, secureStoreOptions);
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
      await SecureStore.deleteItemAsync(key, secureStoreOptions);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression sécurisée de ${key}:`, error);
      return false;
    }
  },

  // Vérifier si une clé existe
  hasItem: async (key) => {
    try {
      const value = await SecureStore.getItemAsync(key, secureStoreOptions);
      return value !== null;
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
      
      await Promise.all(keys.map(key => 
        SecureStore.deleteItemAsync(key, secureStoreOptions)
      ));
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage des données d\'authentification:', error);
      return false;
    }
  },
};