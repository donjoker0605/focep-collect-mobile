// src/services/authService.js - CORRECTION FINALE AVEC TON ARCHITECTURE
import { SecureStorage, SECURE_KEYS } from './secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_KEYS } from '../config/apiConfig';
import axiosInstance from '../api/axiosConfig'; // ✅ TON AXIOS EXISTANT

class AuthService {
  constructor() {
    this.axios = axiosInstance; // ✅ UTILISER TON AXIOS
  }

  // Connexion utilisateur
  async login(email, password) {
    try {
      const response = await this.axios.post('/auth/login', { // ✅ CORRECTION
        email,
        password,
      });

      // ✅ ADAPTATION À LA STRUCTURE DE TON BACKEND
      const responseData = response.data;
      const token = responseData.data?.token || responseData.token;

      if (token) {
        // Stocker le token de manière sécurisée
        await SecureStorage.saveItem(SECURE_KEYS.JWT_TOKEN, token);
        
        // ✅ CORRECTION: Aussi stocker dans AsyncStorage pour compatibilité
        await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
        
        // Stocker le refresh token s'il existe
        const refreshToken = responseData.data?.refreshToken || responseData.refreshToken;
        if (refreshToken) {
          await SecureStorage.saveItem(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        
        // Décoder le token pour obtenir les infos utilisateur
        const decodedToken = jwtDecode(token);
        const userInfo = {
          id: decodedToken.userId || decodedToken.sub, // ✅ Compatibilité avec ton backend
          email: decodedToken.email,
          role: decodedToken.role,
          nom: decodedToken.nom,
          prenom: decodedToken.prenom,
          agenceId: decodedToken.agenceId,
          exp: decodedToken.exp,
        };
        
        // Stocker les informations utilisateur de manière sécurisée ET dans AsyncStorage
        await SecureStorage.saveItem(SECURE_KEYS.USER_SESSION, userInfo);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userInfo));
        
        // Sauvegarder la date de dernière connexion
        await AsyncStorage.setItem('lastLoginAt', new Date().toISOString());
        
        return { success: true, user: userInfo, token: token };
      }
      
      return { success: false, error: 'Token non reçu' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Déconnexion
  async logout() {
    try {
      // Tenter d'appeler le endpoint de logout si connecté
      try {
        await this.axios.post('/auth/logout'); // ✅ CORRECTION
      } catch (e) {
        // Ignorer les erreurs, nous voulons nettoyer localement de toute façon
      }
      
      // Nettoyage sécurisé
      await SecureStorage.clearAuthData();
      
      // ✅ CORRECTION: Nettoyer aussi AsyncStorage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.USER_DATA,
        'lastLoginAt'
      ]);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated() { 
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (!token) return { token: null, userData: null };
      
      // Vérifier si le token n'est pas expiré
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          // Token expiré
          console.log('Token expiré, tentative de déconnexion');
          await this.logout();
          return { token: null, userData: null };
        }
      } catch (decodeError) {
        console.error('Erreur lors du décodage du token:', decodeError);
        return { token: null, userData: null };
      }
      
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return { token, userData: userData ? JSON.parse(userData) : null };
    } catch (error) {
      console.error('Erreur vérification authentification:', error);
      return { token: null, userData: null };
    }
  }
  
  // Rafraîchir le token si possible
  async refreshToken() {
    try {
      const refreshToken = await SecureStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        return false;
      }
      
      const response = await this.axios.post('/auth/refresh-token', { // ✅ CORRECTION
        refreshToken
      });
      
      const responseData = response.data;
      const newToken = responseData.data?.token || responseData.token;
      
      if (!newToken) {
        return false;
      }
      
      // Stocker le nouveau token
      await SecureStorage.saveItem(SECURE_KEYS.JWT_TOKEN, newToken);
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, newToken);
      
      // Stocker le nouveau refresh token s'il existe
      const newRefreshToken = responseData.data?.refreshToken || responseData.refreshToken;
      if (newRefreshToken) {
        await SecureStorage.saveItem(SECURE_KEYS.REFRESH_TOKEN, newRefreshToken);
      }
      
      // Mettre à jour la session utilisateur
      const decodedToken = jwtDecode(newToken);
      const userInfo = await SecureStorage.getJSON(SECURE_KEYS.USER_SESSION);
      
      if (userInfo) {
        // Mettre à jour uniquement l'expiration
        userInfo.exp = decodedToken.exp;
        await SecureStorage.saveItem(SECURE_KEYS.USER_SESSION, userInfo);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userInfo));
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // ✅ MÉTHODE CRITIQUE POUR TON PROBLÈME DE CLIENT
  async getCurrentUser() {
    try {
      // Essayer d'abord SecureStorage
      let userInfo = await SecureStorage.getJSON(SECURE_KEYS.USER_SESSION);
      
      // Si pas trouvé, essayer AsyncStorage comme fallback
      if (!userInfo) {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (userData) {
          userInfo = JSON.parse(userData);
        }
      }
      
      return userInfo;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Obtenir le token
  async getToken() {
    try {
      // Essayer d'abord SecureStorage
      let token = await SecureStorage.getItem(SECURE_KEYS.JWT_TOKEN);
      
      // Si pas trouvé, essayer AsyncStorage
      if (!token) {
        token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      }
      
      return token;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // Réinitialisation de mot de passe
  async resetPassword(email) {
    try {
      const response = await this.axios.post('/auth/reset-password', { // ✅ CORRECTION
        email,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Vérifier si la session est active
  async checkSessionActivity(maxInactivityMinutes = 30) {
    try {
      const lastLoginString = await AsyncStorage.getItem('lastLoginAt');
      if (!lastLoginString) {
        return false;
      }
      
      const lastLogin = new Date(lastLoginString);
      const now = new Date();
      const diffMinutes = (now - lastLogin) / (1000 * 60);
      
      // Si inactif trop longtemps, déconnecter
      if (diffMinutes > maxInactivityMinutes) {
        await this.logout();
        return false;
      }
      
      // Mettre à jour le timestamp de dernière activité
      await AsyncStorage.setItem('lastLoginAt', now.toISOString());
      return true;
    } catch (error) {
      console.error('Check session activity error:', error);
      return false;
    }
  }
}

export const authService = new AuthService(); // ✅ EXPORT NOMMÉ AUSSI
export default new AuthService();