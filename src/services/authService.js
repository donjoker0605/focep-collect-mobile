// src/services/authService.js - CORRECTION FINALE AVEC TON ARCHITECTURE
import { SecureStorage, SECURE_KEYS } from './secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_KEYS } from '../config/apiConfig';
import axiosInstance from '../api/axiosConfig'; 

class AuthService {
  constructor() {
    this.axios = axiosInstance; 
  }

  // Connexion utilisateur
	async login(email, password) {
	  try {
		console.log('🔑 Tentative de connexion...');
		
		const response = await this.axios.post('/auth/login', {
		  email,
		  password,
		});

		const responseData = response.data;
		const token = responseData.data?.token || responseData.token;

		if (!token) {
		  throw new Error('Token manquant dans la réponse');
		}

		// 🔥 UTILISER LA NOUVELLE MÉTHODE D'EXTRACTION
		const decodedToken = jwtDecode(token);
		const userInfo = this.extractUserInfoFromToken(decodedToken);

		if (!userInfo) {
		  throw new Error('Impossible d\'extraire les informations utilisateur du token');
		}

		// Stocker le token de manière sécurisée
		await SecureStorage.saveItem(SECURE_KEYS.JWT_TOKEN, token);
		await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
		
		// Stocker le refresh token s'il existe
		const refreshToken = responseData.data?.refreshToken || responseData.refreshToken;
		if (refreshToken) {
		  await SecureStorage.saveItem(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
		}
		
		// Stocker les informations utilisateur
		await SecureStorage.saveItem(SECURE_KEYS.USER_SESSION, userInfo);
		await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userInfo));
		
		// Marquer comme initialisé
		this.isInitialized = true;
		this.currentUser = userInfo;
		this.token = token;
		
		// Sauvegarder la date de dernière connexion
		await AsyncStorage.setItem('lastLoginAt', new Date().toISOString());
		
		console.log('✅ Connexion réussie:', await this.getUserDisplayInfo());
		return { success: true, user: userInfo, token: token };

	  } catch (error) {
		console.error('❌ Erreur login:', error);
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
  
  /**
   * Extraction robuste des informations utilisateur depuis le JWT décodé
   */
  extractUserInfoFromToken(decodedToken) {
    try {
      console.log('🔍 Token décodé reçu:', decodedToken);

      // 🔥 EXTRACTION ROBUSTE DE L'ID UTILISATEUR
      const userId = this.extractUserId(decodedToken);
      if (!userId) {
        console.error('❌ ID utilisateur manquant dans le token');
        return null;
      }

      // 🔥 EXTRACTION ROBUSTE DE L'ID AGENCE
      const agenceId = this.extractAgenceId(decodedToken);
      
      // 🔥 EXTRACTION ROBUSTE DU RÔLE
      const role = this.extractRole(decodedToken);
      if (!role) {
        console.error('❌ Rôle utilisateur manquant dans le token');
        return null;
      }

      // Validation pour les non super admins
      if (!agenceId && role !== 'SUPER_ADMIN') {
        console.error('❌ ID agence manquant pour utilisateur non super admin');
        return null;
      }

      const userInfo = {
        // IDs critiques
        id: userId,
        agenceId: agenceId,
        role: role,
        
        // Informations de base
        email: decodedToken.email || decodedToken.sub,
        username: decodedToken.sub || decodedToken.username || decodedToken.email,
        nom: decodedToken.nom || decodedToken.lastName,
        prenom: decodedToken.prenom || decodedToken.firstName,
        
        // Métadonnées token
        iat: decodedToken.iat,
        exp: decodedToken.exp,
        iss: decodedToken.iss
      };

      console.log('✅ Informations utilisateur extraites:', userInfo);
      return userInfo;

    } catch (error) {
      console.error('❌ Erreur extraction informations utilisateur:', error);
      return null;
    }
  }
  
  /**
   * Extraction robuste de l'ID utilisateur
   */
  extractUserId(decodedToken) {
    const possibleFields = [
      'userId', 'user_id', 'id', 'sub', 'collecteurId', 'collecteur_id'
    ];

    for (const field of possibleFields) {
      const value = decodedToken[field];
      if (value !== null && value !== undefined) {
        const id = typeof value === 'string' ? parseInt(value, 10) : value;
        if (!isNaN(id) && id > 0) {
          console.log(`✅ ID utilisateur trouvé dans ${field}: ${id}`);
          return id;
        }
      }
    }

    console.error('❌ Aucun ID utilisateur valide trouvé dans les champs:', possibleFields);
    return null;
  }

  /**
   * Extraction robuste de l'ID agence
   */
  extractAgenceId(decodedToken) {
    const possibleFields = [
      'agenceId', 'agence_id', 'agence', 'agency_id', 'branchId'
    ];

    for (const field of possibleFields) {
      const value = decodedToken[field];
      if (value !== null && value !== undefined) {
        const id = typeof value === 'string' ? parseInt(value, 10) : value;
        if (!isNaN(id) && id > 0) {
          console.log(`✅ ID agence trouvé dans ${field}: ${id}`);
          return id;
        }
      }
    }

    console.warn('⚠️ Aucun ID agence trouvé dans les champs:', possibleFields);
    return null;
  }

  /**
   * Extraction robuste du rôle
   */
  extractRole(decodedToken) {
    const possibleFields = ['role', 'roles', 'authorities', 'scope'];

    for (const field of possibleFields) {
      let value = decodedToken[field];
      
      if (value) {
        // Si c'est un tableau, prendre le premier élément
        if (Array.isArray(value)) {
          value = value[0];
        }
        
        // Nettoyer le rôle
        if (typeof value === 'string') {
          value = value.replace(/^ROLE_/, '').toUpperCase();
          
          // Valider que c'est un rôle connu
          const validRoles = ['COLLECTEUR', 'ADMIN', 'SUPER_ADMIN'];
          if (validRoles.includes(value)) {
            console.log(`✅ Rôle trouvé dans ${field}: ${value}`);
            return value;
          }
        }
      }
    }

    console.error('❌ Aucun rôle valide trouvé dans les champs:', possibleFields);
    return null;
  }
  
  /**
   * MÉTHODES D'ACCÈS SIMPLIFIÉES AVEC INITIALISATION AUTOMATIQUE
   */
  async getCurrentUserId() {
    const user = await this.getCurrentUser();
    return user?.id;
  }

  async getCurrentUserAgenceId() {
    const user = await this.getCurrentUser();
    return user?.agenceId;
  }

  async getCurrentUserRole() {
    const user = await this.getCurrentUser();
    return user?.role;
  }

  async isCollecteur() {
    const role = await this.getCurrentUserRole();
    return role === 'COLLECTEUR';
  }

  async isAdmin() {
    const role = await this.getCurrentUserRole();
    return role === 'ADMIN';
  }

  async isSuperAdmin() {
    const role = await this.getCurrentUserRole();
    return role === 'SUPER_ADMIN';
  }

  /**
   * 🔥 MÉTHODE CRITIQUE POUR ENRICHIR LES DONNÉES CLIENT
   */
  async enrichClientData(clientData) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (!user.id || !user.agenceId) {
        throw new Error('Informations utilisateur incomplètes (ID ou agence manquant)');
      }

      // 🔥 ENRICHISSEMENT AUTOMATIQUE
      const enrichedData = {
        ...clientData,
        // IDS AUTOMATIQUES (seront écrasés par le backend pour sécurité)
        collecteurId: user.id,
        agenceId: user.agenceId
      };

      console.log('✅ Données client enrichies:', {
        original: clientData,
        enriched: enrichedData,
        user: { id: user.id, agenceId: user.agenceId, role: user.role }
      });

      return enrichedData;

    } catch (error) {
      console.error('❌ Erreur enrichissement données client:', error);
      throw error;
    }
  }

  /**
   * 🔥 GESTION DES HEADERS API AVEC VALIDATION
   */
  async getApiHeaders() {
    try {
      const token = await this.getToken();
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Valider le token avant utilisation
      const isValid = await this.validateToken();
      if (!isValid) {
        throw new Error('Token d\'authentification expiré');
      }

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

    } catch (error) {
      console.error('❌ Erreur génération headers API:', error);
      throw error;
    }
  }

  /**
   * 🔥 VALIDATION AMÉLIORÉE DU TOKEN
   */
  async validateToken() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return false;
      }

      // Vérifier l'expiration
      const now = Date.now() / 1000;
      if (user.exp && user.exp < now) {
        console.warn('⚠️ Token expiré, déconnexion...');
        await this.logout();
        return false;
      }

      // Vérifier l'intégrité des données critiques
      if (!user.id) {
        console.error('❌ Token corrompu: ID utilisateur manquant');
        await this.logout();
        return false;
      }

      if (!user.agenceId && user.role !== 'SUPER_ADMIN') {
        console.error('❌ Token corrompu: ID agence manquant');
        await this.logout();
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ Erreur validation token:', error);
      return false;
    }
  }

  /**
   * 🔥 REFRESH AUTOMATIQUE DES INFORMATIONS UTILISATEUR
   */
  async refreshUserInfo() {
    try {
      const token = await this.getToken();
      if (!token) {
        return null;
      }

      const decodedToken = jwtDecode(token);
      const userInfo = this.extractUserInfoFromToken(decodedToken);

      if (userInfo) {
        // Mettre à jour le stockage
        await SecureStorage.saveItem(SECURE_KEYS.USER_SESSION, userInfo);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userInfo));
        
        console.log('✅ Informations utilisateur rafraîchies');
        return userInfo;
      }

      return null;

    } catch (error) {
      console.error('❌ Erreur refresh informations utilisateur:', error);
      return null;
    }
  }

  /**
   * 🔥 GESTION DES ERREURS D'AUTHENTIFICATION AMÉLIORÉE
   */
  handleAuthError(error) {
    console.error('🔥 Erreur authentification:', error);

    if (error.response?.status === 401) {
      console.warn('⚠️ Erreur 401 - Token invalide, déconnexion...');
      this.logout();
      return { requiresLogin: true, message: 'Session expirée, veuillez vous reconnecter' };
    }

    if (error.response?.status === 403) {
      console.warn('⚠️ Erreur 403 - Accès refusé');
      return { accessDenied: true, message: 'Accès non autorisé' };
    }

    if (error.message?.includes('agence') || error.message?.includes('collecteur')) {
      return { dataError: true, message: 'Données utilisateur incomplètes' };
    }

    return { genericError: error.message || 'Erreur d\'authentification' };
  }

  /**
   * 🔥 DEBUG ET DIAGNOSTICS
   */
  async debugUserInfo() {
    console.log('🔍 DEBUG AuthService:');
    console.log('  - isInitialized:', this.isInitialized);
    
    const token = await this.getToken();
    console.log('  - token présent:', !!token);
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('  - token décodé:', decoded);
        console.log('  - userId extrait:', this.extractUserId(decoded));
        console.log('  - agenceId extrait:', this.extractAgenceId(decoded));
        console.log('  - role extrait:', this.extractRole(decoded));
      } catch (error) {
        console.log('  - erreur décodage token:', error.message);
      }
    }

    const user = await this.getCurrentUser();
    console.log('  - currentUser:', user);

    const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    console.log('  - token stocké présent:', !!storedToken);
  }

  /**
   * 🔥 VALIDATION DES PERMISSIONS
   */
  async canManageClient(clientId) {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Super admin peut tout faire
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Admin peut gérer les clients de son agence
    if (user.role === 'ADMIN') {
      // TODO: Vérifier que le client appartient à la même agence
      return true;
    }

    // Collecteur peut gérer uniquement ses propres clients
    if (user.role === 'COLLECTEUR') {
      // TODO: Vérifier que le client appartient au collecteur
      return true;
    }

    return false;
  }

  async canManageCollecteur(collecteurId) {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Super admin peut tout faire
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Admin peut gérer les collecteurs de son agence
    if (user.role === 'ADMIN') {
      // TODO: Vérifier que le collecteur appartient à la même agence
      return true;
    }

    // Collecteur peut se gérer lui-même
    if (user.role === 'COLLECTEUR') {
      return user.id === collecteurId;
    }

    return false;
  }

  /**
   * 🔥 FORMATAGE POUR LES LOGS
   */
  async getUserDisplayInfo() {
    const user = await this.getCurrentUser();
    if (!user) return 'Utilisateur non connecté';

    return `${user.prenom || ''} ${user.nom || ''} (${user.role}) - Agence ${user.agenceId}`.trim();
  }
}


export const authService = new AuthService(); 
export default new AuthService();