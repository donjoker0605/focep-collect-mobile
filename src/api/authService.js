// src/api/authService.js - VERSION DÉFINITIVEMENT CORRIGÉE
import axiosInstance from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/apiConfig';
import { jwtDecode } from 'jwt-decode';

export const authService = {
  // ✅ FONCTION LOGIN COMPLÈTEMENT RÉÉCRITE ET CORRIGÉE
  login: async (email, password) => {
    try {
      console.log('🚀 Tentative de connexion:', { email });
      
      // ✅ CORRECTION CRITIQUE: Créer un objet simple et propre
      const requestData = {
        email: email.trim(), // Nettoyer l'email
        password: password.trim() // Nettoyer le mot de passe
      };
      
      console.log('📤 Données envoyées:', requestData);
      
      // ✅ CORRECTION: Envoyer directement l'objet, pas de sérialisation manuelle
      const response = await axiosInstance.post('/auth/login', requestData);
      
      console.log('📥 Réponse reçue:', response.data);
      
      const { token, role } = response.data;
      
      if (!token) {
        return { 
          success: false, 
          error: 'Token non reçu du serveur' 
        };
      }
      
      try {
        // Décoder le token pour extraire les informations utilisateur
        const decodedToken = jwtDecode(token);
        
        // Construire un objet utilisateur cohérent
        const user = {
          id: decodedToken.userId || decodedToken.sub || 0,
          email: email.trim(), // ✅ Utiliser l'email nettoyé
          role: role || decodedToken.role,
          agenceId: decodedToken.agenceId || 0,
          nom: decodedToken.nom || '',
          prenom: decodedToken.prenom || '',
        };
        
        // Sauvegarder de manière sécurisée
        await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        
        if (response.data.refreshToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
        }
        
        await AsyncStorage.setItem('lastLoginAt', new Date().toISOString());
        
        return { success: true, user, token };
        
      } catch (decodeError) {
        console.error('❌ Erreur de décodage JWT:', decodeError);
        return { 
          success: false, 
          error: 'Erreur lors du traitement des données utilisateur' 
        };
      }
    } catch (error) {
      console.error('❌ Erreur de connexion complète:', error);
      console.error('❌ Détails de l\'erreur:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Erreur de connexion' 
      };
    }
  },

  // ✅ MÉTHODE DE VÉRIFICATION D'AUTHENTIFICATION
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (!token) {
        return { isAuthenticated: false, token: null, userData: null };
      }
      
      // Vérifier si le token est expiré
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp <= currentTime) {
        // Token expiré, nettoyer le stockage
        await authService.logout();
        return { isAuthenticated: false, token: null, userData: null };
      }
      
      // Récupérer les données utilisateur
      const userData = await authService.getCurrentUser();
      
      return { 
        isAuthenticated: true, 
        token: token, 
        userData: userData 
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      return { isAuthenticated: false, token: null, userData: null };
    }
  },

  // Récupération utilisateur actuel
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur récupération données utilisateur:', error);
      return null;
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      // Tenter d'appeler l'endpoint de logout
      try {
        await axiosInstance.post('/auth/logout');
      } catch (error) {
        console.warn('Erreur lors de la déconnexion côté serveur:', error);
      }
      
      // Nettoyage des données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        'lastLoginAt'
      ]);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Même en cas d'erreur, nettoyer les données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        'lastLoginAt'
      ]);
      return { success: false, error: error.message };
    }
  },

  // Mot de passe oublié
  forgotPassword: async (email) => {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { 
        email: email.trim() // ✅ Nettoyer l'email
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur mot de passe oublié:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur' 
      };
    }
  },

  // Rafraîchir le token
  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        return false;
      }
      
      const response = await axiosInstance.post('/auth/refresh-token', {
        refreshToken
      });
      
      const { token, newRefreshToken } = response.data;
      
      if (!token) {
        return false;
      }
      
      // Stocker le nouveau token
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      
      // Stocker le nouveau refresh token s'il existe
      if (newRefreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      return false;
    }
  }
};

export default authService;