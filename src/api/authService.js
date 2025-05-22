// src/api/authService.js
import axiosInstance from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/apiConfig';
import { jwtDecode } from 'jwt-decode';

export const authService = {
  // Connexion utilisateur - FONCTION CORRIGÉE
  login: async (email, password) => {
    try {
      console.log('🚀 Tentative de connexion:', { email });
      
      // Structure correcte pour le backend
      const requestData = { email, password };
      console.log('📤 Données envoyées:', requestData);
      
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
          email: email,
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

  // Récupération mot de passe
  forgotPassword: async (email) => {
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      return { success: true };
	  console.log('Réponse brute du serveur:', JSON.stringify(response));
    console.log('Données de la réponse:', JSON.stringify(response.data));
    } catch (error) {
		console.error('Détails complets de l\'erreur:', JSON.stringify(error, null, 2));
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur' 
      };
    }
  },
 

  // Déconnexion
  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.warn('Erreur lors de la déconnexion côté serveur:', error);
    }
    
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.JWT_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.REFRESH_TOKEN,
      'lastLoginAt'
    ]);
    
    return { success: true };
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (!token) return { token: null, userData: null };
      
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          console.log('Token expiré, nettoyage...');
          await this.logout();
          return { token: null, userData: null };
        }
      } catch (decodeError) {
        console.error('Erreur lors du décodage du token:', decodeError);
        await this.logout();
        return { token: null, userData: null };
      }
      
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return { token, userData: userData ? JSON.parse(userData) : null };
    } catch (error) {
      console.error('Erreur vérification authentification:', error);
      return { token: null, userData: null };
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