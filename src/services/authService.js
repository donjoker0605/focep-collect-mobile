// src/services/authService.js
import { SecureStorage, SECURE_KEYS } from './secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_KEYS } from '../config/apiConfig';

class AuthService {
  // Connexion utilisateur
  async login(email, password) {
    try {
      const response = await ApiService.post('/auth/login', {
        email,
        password,
      }, false); // false = pas de token requis pour login

      if (response.token) {
        // Stocker le token de manière sécurisée
        await SecureStorage.saveItem(SECURE_KEYS.JWT_TOKEN, response.token);
        
        // Stocker le refresh token s'il existe
        if (response.refreshToken) {
          await SecureStorage.saveItem(SECURE_KEYS.REFRESH_TOKEN, response.refreshToken);
        }
        
        // Décoder le token pour obtenir les infos utilisateur
        const decodedToken = jwtDecode(response.token);
        const userInfo = {
          id: decodedToken.sub,
          email: decodedToken.email,
          role: decodedToken.role,
          nom: decodedToken.nom,
          prenom: decodedToken.prenom,
          agenceId: decodedToken.agenceId,
          // Ajouter la date d'expiration pour pouvoir vérifier côté client
          exp: decodedToken.exp,
        };
        
        // Stocker les informations utilisateur de manière sécurisée
        await SecureStorage.saveItem(SECURE_KEYS.USER_SESSION, userInfo);
        
        // Sauvegarder la date de dernière connexion
        await AsyncStorage.setItem('lastLoginAt', new Date().toISOString());
        
        return { success: true, user: userInfo, token: response.token };
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
        await ApiService.post('/auth/logout');
      } catch (e) {
        // Ignorer les erreurs, nous voulons nettoyer localement de toute façon
      }
      
      // Nettoyage sécurisé
      await SecureStorage.clearAuthData();
      
      // Nettoyage des préférences non sensibles
      await AsyncStorage.removeItem('lastLoginAt');
      
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
          await this.logout(); // Utiliser this au lieu de authService
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
      
      const response = await ApiService.post('/auth/refresh-token', {
        refreshToken
      }, false);
      
      if (!response.token) {
        return false;
      }
      
      // Stocker le nouveau token
      await SecureStorage.saveItem(SECURE_KEYS.JWT_TOKEN, response.token);
      
      // Stocker le nouveau refresh token s'il existe
      if (response.refreshToken) {
        await SecureStorage.saveItem(SECURE_KEYS.REFRESH_TOKEN, response.refreshToken);
      }
      
      // Mettre à jour la session utilisateur
      const decodedToken = jwtDecode(response.token);
      const userInfo = await SecureStorage.getJSON(SECURE_KEYS.USER_SESSION);
      
      if (userInfo) {
        // Mettre à jour uniquement l'expiration
        userInfo.exp = decodedToken.exp;
        await SecureStorage.saveItem(SECURE_KEYS.USER_SESSION, userInfo);
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Obtenir l'utilisateur actuel
  async getCurrentUser() {
    try {
      return await SecureStorage.getJSON(SECURE_KEYS.USER_SESSION);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Obtenir le token
  async getToken() {
    try {
      return await SecureStorage.getItem(SECURE_KEYS.JWT_TOKEN);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // Réinitialisation de mot de passe
  async resetPassword(email) {
    try {
      const response = await ApiService.post('/auth/reset-password', {
        email,
      }, false);
      
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

export default new AuthService();