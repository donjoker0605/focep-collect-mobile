// src/api/authService.js
import axiosInstance from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/apiConfig';

export const authService = {
  // Test de connectivité avec le backend
  ping: async () => {
    try {
      const response = await axiosInstance.get('/public/ping');
      return response.data;
    } catch (error) {
      console.error("Erreur ping:", error);
      throw error;
    }
  },

  // Connexion utilisateur
  login: async (credentials) => {
    try {
      console.log('🚀 Tentative de connexion:', credentials);
      
      // Créer une instance axios sans token pour le login
      const response = await axiosInstance.post('/auth/login', credentials);
      console.log('🚀 Réponse du serveur:', response.data);
      
      const { token, user } = response.data;
      
      // Sauvegarder le token et les données utilisateur
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return { success: true, user, token };
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de connexion' 
      };
    }
  },

  // Récupération mot de passe
  forgotPassword: async (email) => {
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      console.error('Erreur récupération mot de passe:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur' 
      };
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      // Essayer de notifier le serveur de la déconnexion
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.warn('Erreur lors de la déconnexion côté serveur:', error);
    }
    
    // Supprimer les données locales quoi qu'il arrive
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.JWT_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.REFRESH_TOKEN
    ]);
    
    return { success: true };
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (!token) return false;
      
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return { token, userData: userData ? JSON.parse(userData) : null };
    } catch (error) {
      console.error('Erreur vérification authentification:', error);
      return false;
    }
  },
  
  // Vérifier l'activité de la session
  checkSessionActivity: async (maxInactivityMinutes = 30) => {
    try {
      const lastLoginString = await AsyncStorage.getItem('lastLoginAt');
      if (!lastLoginString) {
        return false;
      }
      
      const lastLogin = new Date(lastLoginString);
      const now = new Date();
      const diffMinutes = (now - lastLogin) / (1000 * 60);
      
      if (diffMinutes > maxInactivityMinutes) {
        await authService.logout();
        return false;
      }
      
      // Mettre à jour le timestamp d'activité
      await AsyncStorage.setItem('lastLoginAt', now.toISOString());
      return true;
    } catch (error) {
      console.error('Erreur vérification activité session:', error);
      return false;
    }
  },
  
  // Récupérer les données utilisateur actuelles
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur récupération données utilisateur:', error);
      return null;
    }
  }
};

export default authService;