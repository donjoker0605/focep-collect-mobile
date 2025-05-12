import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

class AuthService {
  // Connexion utilisateur
  async login(email, password) {
    try {
      const response = await ApiService.post('/auth/login', {
        email,
        password,
      }, false); // false = pas de token requis pour login

      if (response.token) {
        // Stocker le token
        await AsyncStorage.setItem('authToken', response.token);
        
        // Décoder le token pour obtenir les infos utilisateur
        const decodedToken = jwtDecode(response.token);
        const userInfo = {
          id: decodedToken.sub,
          email: decodedToken.email,
          role: decodedToken.role,
          nom: decodedToken.nom,
          prenom: decodedToken.prenom,
          agenceId: decodedToken.agenceId,
        };
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
        
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
      await AsyncStorage.multiRemove(['authToken', 'userInfo']);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        return false;
      }

      // Vérifier si le token n'est pas expiré
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        // Token expiré, nettoyer le storage
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Obtenir l'utilisateur actuel
  async getCurrentUser() {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Obtenir le token
  async getToken() {
    try {
      return await AsyncStorage.getItem('authToken');
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
}

export default new AuthService();