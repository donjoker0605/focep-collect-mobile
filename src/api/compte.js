import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '../utils/storage';
import axios from 'axios';
import api from './axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  // Vérification du token au chargement de l'application
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        if (storedToken) {
          setToken(storedToken);
          
          // Configuration du token dans les en-têtes Axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Récupérer les informations de l'utilisateur
          await fetchUserInfo(storedToken);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du token:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  // Fonction pour récupérer les informations de l'utilisateur
  const fetchUserInfo = async (userToken) => {
    try {
      // En production, remplacer par un appel réel à l'API
      // const response = await axios.get(`${BACKEND_URL}/api/auth/me`);
      
      // Pour le développement, nous simulons un utilisateur
      const mockUser = {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        adresseMail: 'jean.dupont@example.com',
        telephone: '+237 655 123 456',
        numeroCni: 'CM12345678',
        role: 'COLLECTEUR',
        agenceId: 1
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      await logout();
      throw error;
    }
  };

  // Fonction de connexion
  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // En production, remplacer par un appel réel à l'API
      // const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      //   email,
      //   password
      // });
      
      // Pour le développement, nous simulons une réponse réussie
      const mockResponse = {
        data: {
          token: 'mock_jwt_token_123456789',
          user: {
            id: 1,
            nom: 'Dupont',
            prenom: 'Jean',
            adresseMail: email,
            telephone: '+237 655 123 456',
            numeroCni: 'CM12345678',
            role: 'COLLECTEUR',
            agenceId: 1
          }
        }
      };
      
      const { token: newToken, user: userData } = mockResponse.data;
      
      // Stocker le token
      await AsyncStorage.setItem('auth_token', newToken);
      
      // Configurer Axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Mettre à jour l'état
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Supprimer le token du stockage
      await AsyncStorage.removeItem('auth_token');
      
      // Supprimer les en-têtes d'autorisation
      delete axios.defaults.headers.common['Authorization'];
      
      // Réinitialiser l'état
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction d'inscription (pour le développement)
  const register = async (userData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // En production, remplacer par un appel réel à l'API
      // const response = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
      
      // Pour le développement, nous simulons une réponse réussie
      const mockResponse = {
        data: {
          message: 'Inscription réussie. Veuillez vous connecter.'
        }
      };
      
      return { success: true, message: mockResponse.data.message };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      
      const errorMessage = error.response?.data?.message || 'Erreur d\'inscription';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de récupération de mot de passe
  const forgotPassword = async (email) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // En production, remplacer par un appel réel à l'API
      // const response = await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, { email });
      
      // Pour le développement, nous simulons une réponse réussie
      const mockResponse = {
        data: {
          message: 'Si un compte existe avec cet email, un code de réinitialisation a été envoyé.'
        }
      };
      
      return { success: true, message: mockResponse.data.message };
    } catch (error) {
      console.error('Erreur de récupération de mot de passe:', error);
      
      const errorMessage = error.response?.data?.message || 'Erreur lors de la récupération du mot de passe';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier le code de sécurité pour la réinitialisation du mot de passe
  const verifySecurityCode = async (email, code) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // En production, remplacer par un appel réel à l'API
      // const response = await axios.post(`${BACKEND_URL}/api/auth/verify-code`, { email, code });
      
      // Pour le développement, nous simulons une réponse réussie
      const mockResponse = {
        data: {
          message: 'Code vérifié avec succès.',
          verified: true
        }
      };
      
      return { success: true, ...mockResponse.data };
    } catch (error) {
      console.error('Erreur de vérification du code:', error);
      
      const errorMessage = error.response?.data?.message || 'Code invalide, veuillez réessayer.';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Réinitialiser le mot de passe
  const resetPassword = async (email, password, code) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // En production, remplacer par un appel réel à l'API
      // const response = await axios.post(`${BACKEND_URL}/api/auth/reset-password`, { 
      //   email, 
      //   password,
      //   code 
      // });
      
      // Pour le développement, nous simulons une réponse réussie
      const mockResponse = {
        data: {
          message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
        }
      };
      
      return { success: true, message: mockResponse.data.message };
    } catch (error) {
      console.error('Erreur de réinitialisation du mot de passe:', error);
      
      const errorMessage = error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Exposer le contexte et ses fonctions
  const authContext = {
    isAuthenticated,
    isLoading,
    user,
    token,
    error,
    login,
    logout,
    register,
    forgotPassword,
    verifySecurityCode,
    resetPassword,
    setError
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};