// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../api/auth';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/apiConfig';
import axiosInstance from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Vérifier l'état d'authentification au démarrage
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si le token est valide
        const isValid = await authService.isAuthenticated();
        
        if (isValid) {
          // Récupérer les données utilisateur
          const userData = await authService.getCurrentUser();
          
          setUser(userData);
          setIsAuthenticated(true);
          
          console.log('Session restaurée:', { role: userData?.role });
        } else {
          // Si le token n'est pas valide, nettoyer les données
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.JWT_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_DATA,
          ]);
          
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'état d\'authentification:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.login({ email, password });
      
      setUser(result.user);
      setIsAuthenticated(true);

      // Rediriger selon le rôle
      redirectBasedOnRole(result.user.role);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError(error.message || 'Identifiants invalides');
      return { success: false, error: error.message || 'Identifiants invalides' };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      router.replace('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, on réinitialise l'état
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour rediriger selon le rôle
  const redirectBasedOnRole = (role) => {
    if (!role) return;
    
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
  };

  // Fonction pour mettre à jour l'utilisateur
  const updateUserInfo = async (updatedInfo) => {
    try {
      const updatedUser = { ...user, ...updatedInfo };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations utilisateur:', error);
      return { success: false, error: error.message };
    }
  };

  // Exposer le contexte
  const authContext = {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    updateUserInfo,
    setError,
    checkAuthStatus: async () => {
      setIsLoading(true);
      try {
        const isValid = await authService.isAuthenticated();
        const userData = isValid ? await authService.getCurrentUser() : null;
        
        setUser(userData);
        setIsAuthenticated(isValid);
        
        return isValid;
      } catch (error) {
        console.error('Erreur lors de la vérification du statut d\'authentification:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};