// src/context/AuthContext.js - VERSION SIMPLIFIÉE ET CORRIGÉE
import React, { createContext, useState, useEffect } from 'react';
import authService from '../api/authService';
import { useRouter } from 'expo-router';
import { SECURE_KEYS } from '../services/secureStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Vérifier l'état d'authentification au démarrage
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      const authResult = await authService.isAuthenticated();
      
      if (authResult && authResult.token && authResult.userData) {
        setUser(authResult.userData);
        setIsAuthenticated(true);
        console.log('Session restaurée:', { role: authResult.userData?.role });
      } else {
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

  // Fonction de connexion CORRIGÉE
  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('🔐 AuthContext: Tentative de connexion pour', email);
      
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        console.log('✅ Connexion réussie, redirection selon le rôle:', result.user.role);
        redirectBasedOnRole(result.user.role);
        
        return { success: true, user: result.user };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erreur de connexion dans AuthContext:', error);
      const errorMessage = error.message || 'Identifiants invalides';
      setError(errorMessage);
      return { success: false, error: errorMessage };
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
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour rediriger selon le rôle
  const redirectBasedOnRole = (role) => {
    if (!role) {
      console.error('Aucun rôle fourni pour la redirection');
      return;
    }
    
    console.log('🔀 Redirection basée sur le rôle:', role);
    
    switch (role) {
      case 'ROLE_ADMIN':
      case 'ADMIN':
        router.replace('/admin');
        break;
      case 'ROLE_SUPER_ADMIN':
      case 'SUPER_ADMIN':
        router.replace('/super-admin');
        break;
      case 'ROLE_COLLECTEUR':
      case 'COLLECTEUR':
        router.replace('/(tabs)');
        break;
      default:
        console.error('Rôle non reconnu:', role);
        setError(`Rôle non reconnu: ${role}`);
    }
  };

  const authContext = {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    checkAuthStatus,
    setError
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};