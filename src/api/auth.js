// src/api/auth.js
import axiosInstance, { handleApiError } from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/apiConfig';
import { jwtDecode } from 'jwt-decode';

export const authService = {
  // Test de connectivité avec le backend
  async ping() {
    try {
      const response = await axiosInstance.get('/public/ping');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Connexion utilisateur
  async login(credentials) {
    try {
      // Créer un nouvel axios sans token pour la requête de login
      const response = await axiosInstance.post('/auth/login', credentials);
      const { token, refreshToken, user } = response.data;
      
      // Stocker le token et les données utilisateur
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.JWT_TOKEN, token],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''], // Facultatif dans votre backend
        [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
      ]);
      
      return { token, refreshToken, user };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Déconnexion
  async logout() {
    try {
      // Optionnel: notifier le serveur de la déconnexion
      try {
        await axiosInstance.post('/auth/logout');
      } catch (error) {
        // Ignorer les erreurs de déconnexion côté serveur
        console.warn('Erreur lors de la déconnexion côté serveur:', error);
      }
      
      // Supprimer les données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      return true;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Même en cas d'erreur, on essaie de supprimer les données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      return false;
    }
  },

  // Vérifier si l'utilisateur est authentifié
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (!token) return false;
      
      // Vérifier si le token est expiré
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      return false;
    }
  },

  // Récupérer les données utilisateur
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  }
};

export default authService;