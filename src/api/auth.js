// src/api/auth.js
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import axiosInstance from './axiosConfig';

// Configuration de l'URL de base pour les requêtes d'authentification
const AUTH_URL = `${API_BASE_URL}/auth`;

/**
 * Connexion d'un utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe de l'utilisateur
 * @returns {Promise<Object>} - Données de l'utilisateur et token JWT
 */
export const login = async (email, password) => {
  try {
    // Dans l'environnement de développement, on peut simuler la connexion
    if (__DEV__ && process.env.EXPO_PUBLIC_MOCK_API === 'true') {
      // Simuler un délai de réponse
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Cas de test: admin@focep.cm / admin123
      if (email === 'admin@focep.cm' && password === 'admin123') {
        return {
          token: 'fake-admin-token-12345',
          user: {
            id: 1,
            nom: 'Admin',
            prenom: 'FOCEP',
            adresseMail: 'admin@focep.cm',
            telephone: '+237 655 123 456',
            role: 'ADMIN',
            status: 'active',
            agenceId: 1
          }
        };
      }
      
      // Cas de test: collecteur@focep.cm / collect123
      if (email === 'collecteur@focep.cm' && password === 'collect123') {
        return {
          token: 'fake-collecteur-token-67890',
          user: {
            id: 2,
            nom: 'Dupont',
            prenom: 'Marie',
            adresseMail: 'collecteur@focep.cm',
            telephone: '+237 677 234 567',
            numeroCni: 'CM12345678',
            role: 'COLLECTEUR',
            status: 'active',
            agenceId: 1
          }
        };
      }
      
      // Si les identifiants ne correspondent pas, on lance une erreur
      throw new Error('Identifiants invalides');
    }
    
    // En production, on utilise l'API réelle
    const response = await axios.post(`${AUTH_URL}/login`, {
      email,
      password
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Erreur de connexion');
    }
    throw error;
  }
};

/**
 * Inscription d'un nouvel utilisateur
 * @param {Object} userData - Données du nouvel utilisateur
 * @returns {Promise<Object>} - Données de l'utilisateur créé
 */
export const register = async (userData) => {
  try {
    // Dans l'environnement de développement, on peut simuler l'inscription
    if (__DEV__ && process.env.EXPO_PUBLIC_MOCK_API === 'true') {
      // Simuler un délai de réponse
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simuler une réponse d'inscription réussie
      return {
        success: true,
        message: 'Inscription réussie. Vous pouvez maintenant vous connecter.'
      };
    }
    
    // En production, on utilise l'API réelle
    const response = await axios.post(`${AUTH_URL}/register`, userData);
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Erreur lors de l\'inscription');
    }
    throw error;
  }
};

/**
 * Demande de réinitialisation de mot de passe
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise<Object>} - Confirmation de l'envoi du code de réinitialisation
 */
export const forgotPassword = async (email) => {
  try {
    // Dans l'environnement de développement, on peut simuler la demande
    if (__DEV__ && process.env.EXPO_PUBLIC_MOCK_API === 'true') {
      // Simuler un délai de réponse
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler une réponse réussie
      return {
        success: true,
        message: 'Un code de réinitialisation a été envoyé à votre adresse email.',
        // Pour faciliter les tests, on retourne un code fixe
        code: '123456'
      };
    }
    
    // En production, on utilise l'API réelle
    const response = await axios.post(`${AUTH_URL}/forgot-password`, { email });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Erreur lors de la demande de réinitialisation');
    }
    throw error;
  }
};

/**
 * Vérification du code de réinitialisation
 * @param {string} email - Email de l'utilisateur
 * @param {string} code - Code de réinitialisation
 * @returns {Promise<Object>} - Confirmation de la validité du code
 */
export const verifyResetCode = async (email, code) => {
  try {
    // Dans l'environnement de développement, on peut simuler la vérification
    if (__DEV__ && process.env.EXPO_PUBLIC_MOCK_API === 'true') {
      // Simuler un délai de réponse
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simuler une vérification réussie (code valide: 123456)
      if (code === '123456') {
        return {
          success: true,
          message: 'Code de réinitialisation valide.'
        };
      }
      
      // Si le code ne correspond pas, on lance une erreur
      throw new Error('Code de réinitialisation invalide');
    }
    
    // En production, on utilise l'API réelle
    const response = await axios.post(`${AUTH_URL}/verify-reset-code`, {
      email,
      code
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Code de réinitialisation invalide');
    }
    throw error;
  }
};

/**
 * Réinitialisation du mot de passe avec un nouveau
 * @param {string} email - Email de l'utilisateur
 * @param {string} code - Code de réinitialisation
 * @param {string} password - Nouveau mot de passe
 * @returns {Promise<Object>} - Confirmation du changement de mot de passe
 */
export const resetPassword = async (email, code, password) => {
  try {
    // Dans l'environnement de développement, on peut simuler la réinitialisation
    if (__DEV__ && process.env.EXPO_PUBLIC_MOCK_API === 'true') {
      // Simuler un délai de réponse
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Simuler une réinitialisation réussie (code valide: 123456)
      if (code === '123456') {
        return {
          success: true,
          message: 'Votre mot de passe a été réinitialisé avec succès.'
        };
      }
      
      // Si le code ne correspond pas, on lance une erreur
      throw new Error('Code de réinitialisation invalide');
    }
    
    // En production, on utilise l'API réelle
    const response = await axios.post(`${AUTH_URL}/reset-password`, {
      email,
      code,
      password
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
    throw error;
  }
};

/**
 * Rafraîchissement du token JWT
 * @param {string} token - Token JWT actuel
 * @returns {Promise<Object>} - Nouveau token JWT
 */
export const refreshToken = async (token) => {
  try {
    // Dans l'environnement de développement, on peut simuler le rafraîchissement
    if (__DEV__ && process.env.EXPO_PUBLIC_MOCK_API === 'true') {
      // Simuler un délai de réponse
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simuler un rafraîchissement réussi
      if (token.startsWith('fake-')) {
        return {
          token: `${token}-refreshed`,
        };
      }
      
      // Si le token ne correspond pas, on lance une erreur
      throw new Error('Token invalide');
    }
    
    // En production, on utilise l'API réelle
    const response = await axiosInstance.post(`${AUTH_URL}/refresh-token`);
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Erreur lors du rafraîchissement du token');
    }
    throw error;
  }
};

/**
 * Récupération des informations de l'utilisateur connecté
 * @returns {Promise<Object>} - Données de l'utilisateur
 */
export const getUserInfo = async () => {
  try {
    // En production, on utilise l'API réelle
    const response = await axiosInstance.get(`${AUTH_URL}/user-info`);
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Erreur lors de la récupération des informations utilisateur');
    }
    throw error;
  }
};

/**
 * Mise à jour des informations de l'utilisateur
 * @param {Object} userData - Nouvelles données de l'utilisateur
 * @returns {Promise<Object>} - Données de l'utilisateur mises à jour
 */
export const updateUser = async (userData) => {
  try {
    // En production, on utilise l'API réelle
    const response = await axiosInstance.put(`${AUTH_URL}/user`, userData);
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Erreur lors de la mise à jour des informations utilisateur');
    }
    throw error;
  }
};

/**
 * Changement de mot de passe pour l'utilisateur connecté
 * @param {string} currentPassword - Mot de passe actuel
 * @param {string} newPassword - Nouveau mot de passe
 * @returns {Promise<Object>} - Confirmation du changement de mot de passe
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // En production, on utilise l'API réelle
    const response = await axiosInstance.post(`${AUTH_URL}/change-password`, {
      currentPassword,
      newPassword
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      throw new Error(error.response.data.message || 'Erreur lors du changement de mot de passe');
    }
    throw error;
  }
};