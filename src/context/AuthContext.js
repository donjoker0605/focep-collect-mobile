// src/context/AuthContext.js 
import React, { createContext, useState, useEffect } from 'react';
import authService from '../api/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

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

  // Fonction de connexion CORRIGÉE - SANS NAVIGATION DIRECTE
  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('🔐 AuthContext: Tentative de connexion pour', email);
      
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        console.log('✅ Connexion réussie! Rôle:', result.user.role);
        
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

  // Fonction de déconnexion CORRIGÉE - SANS NAVIGATION DIRECTE
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      console.log('✅ Déconnexion réussie');
      // ✅ SUPPRESSION DE LA NAVIGATION DIRECTE
      // AppNavigator détectera automatiquement isAuthenticated = false
      // et affichera AuthStack
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, forcer la déconnexion locale
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
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