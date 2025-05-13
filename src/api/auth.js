// src/api/auth.js
import api, { handleApiError } from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS, STORAGE_KEYS } from '../config/apiConfig';

export const authService = {
  // Test de connectivité avec le backend
  async ping() {
    try {
      const response = await api.get(ENDPOINTS.PING);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Connexion utilisateur
  async login(credentials) {
    try {
      const response = await api.post(ENDPOINTS.LOGIN, credentials);
      const { token, user } = response.data;
      
      // Stocker le token et les données utilisateur
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.JWT_TOKEN, token],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
      ]);
      
      return { token, user };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Inscription
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Récupération de mot de passe
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Vérifier le code de réinitialisation
  async verifyResetCode(email, code) {
    try {
      const response = await api.post('/auth/verify-reset-code', { email, code });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Réinitialiser le mot de passe
  async resetPassword(email, code, password) {
    try {
      const response = await api.post('/auth/reset-password', { email, code, password });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Déconnexion
  async logout() {
    try {
      // Optionnel: notifier le serveur de la déconnexion
      // await api.post(ENDPOINTS.LOGOUT);
      
      // Supprimer les données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Même en cas d'erreur, on supprime les données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      return true;
    }
  },

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      return !!token;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  },

  // Récupérer les données utilisateur stockées
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Vérifier la validité du token
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Rafraîchir le token
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh-token');
      const { token } = response.data;
      
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      return { token };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les informations utilisateur
  async getUserInfo() {
    try {
      const response = await api.get('/auth/user-info');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mettre à jour les informations utilisateur
  async updateUser(userData) {
    try {
      const response = await api.put('/auth/user', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Changer le mot de passe
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default authService;