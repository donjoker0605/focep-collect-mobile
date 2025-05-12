// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Charger l'état d'authentification au démarrage
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les données stockées
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUserData = await AsyncStorage.getItem('user_data');
        
        if (storedToken && storedUserData) {
          // Restaurer la session
          const parsedUser = JSON.parse(storedUserData);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Configurer axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          console.log('Session restaurée:', { role: parsedUser.role });
        } else if (__DEV__) {
          // En développement, connecter automatiquement en tant que collecteur
          console.log('Mode DEV: Connexion automatique en tant que collecteur');
          await loginWithRole('COLLECTEUR');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état d\'authentification:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuthState();
  }, []);

  // Fonction utilitaire pour créer un utilisateur selon le rôle
  const createMockUser = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          id: 1,
          nom: 'Admin',
          prenom: 'FOCEP',
          adresseMail: 'admin@focep.cm',
          telephone: '+237 655 123 456',
          numeroCni: 'AD12345678',
          role: 'ADMIN',
          agenceId: 1
        };
      case 'SUPER_ADMIN':
        return {
          id: 3,
          nom: 'Super',
          prenom: 'Admin',
          adresseMail: 'super.admin@focep.cm',
          telephone: '+237 655 789 012',
          numeroCni: 'SA12345678',
          role: 'SUPER_ADMIN',
          agenceId: null
        };
      case 'COLLECTEUR':
      default:
        return {
          id: 2,
          nom: 'Dupont',
          prenom: 'Jean',
          adresseMail: 'collecteur@focep.cm',
          telephone: '+237 677 234 567',
          numeroCni: 'CM12345678',
          role: 'COLLECTEUR',
          agenceId: 1
        };
    }
  };

  // Fonction interne pour se connecter avec un rôle spécifique
  const loginWithRole = async (role) => {
    try {
      const userData = createMockUser(role);
      const mockToken = `mock_token_${role}_${Date.now()}`;
      
      // Stocker les données
      await AsyncStorage.setItem('auth_token', mockToken);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      // Mettre à jour l'état
      setToken(mockToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Configurer axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
      
      console.log(`Connecté en tant que ${role}`);
      
      // Redirection automatique
      switch (role) {
        case 'ADMIN':
          router.replace('/admin');
          break;
        case 'SUPER_ADMIN':
          router.replace('/super-admin');
          break;
        case 'COLLECTEUR':
        default:
          router.replace('/(tabs)');
          break;
      }
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion');
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  // Fonction de connexion
  const login = async (email, password, role = 'COLLECTEUR') => {
    setError(null);
    setIsLoading(true);
    
    try {
      // En développement, utiliser l'authentification simulée
      if (__DEV__) {
        return await loginWithRole(role);
      }
      
      // Code pour l'authentification réelle (pour la production)
      // ...
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Identifiants invalides');
      return { success: false, error: 'Identifiants invalides' };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Supprimer les données stockées
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      // Supprimer les en-têtes d'autorisation
      delete axios.defaults.headers.common['Authorization'];
      
      // Réinitialiser l'état
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Rediriger vers la page de connexion
      router.replace('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction pour changer de rôle (utile pour le développement)
  const switchRole = async (newRole) => {
    if (!['COLLECTEUR', 'ADMIN', 'SUPER_ADMIN'].includes(newRole)) {
      throw new Error('Rôle invalide');
    }
    
    console.log(`Changement de rôle vers ${newRole}`);
    return await loginWithRole(newRole);
  };

  // Fonction pour mettre à jour les informations de l'utilisateur
  const updateUserInfo = async (updatedInfo) => {
    try {
      const updatedUser = { ...user, ...updatedInfo };
      
      // Sauvegarder les données mises à jour
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      // Mettre à jour l'état
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des infos utilisateur:', error);
      return { success: false, error: error.message };
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
    switchRole,
    updateUserInfo,
    setError
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};