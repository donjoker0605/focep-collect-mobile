// src/api/authService.js
import api from './config';
import AsyncStorage from '../utils/storage';

export const authService = {
  // Connexion utilisateur
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Sauvegarder le token et les données utilisateur
      await AsyncStorage.setItem('jwt_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      
      return { success: true, user, token };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de connexion' 
      };
    }
  },

  // Récupération mot de passe
  forgotPassword: async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur' 
      };
    }
  },

  // Déconnexion
  logout: async () => {
    await AsyncStorage.multiRemove(['jwt_token', 'user_data']);
    return { success: true };
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('jwt_token');
    const userData = await AsyncStorage.getItem('user_data');
    return { token, userData: userData ? JSON.parse(userData) : null };
  }
};