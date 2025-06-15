// src/context/AuthContext.js - VERSION CORRIGÉE
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
      console.log('🔍 AuthContext - Résultat checkAuth:', authResult);
      
      if (authResult && authResult.isAuthenticated && authResult.userData) {
        setUser(authResult.userData);
        setIsAuthenticated(true);
        console.log('✅ Session restaurée:', { 
          email: authResult.userData?.email,
          role: authResult.userData?.role 
        });
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('❌ Aucune session valide trouvée');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'état d\'authentification:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FONCTION DE CONNEXION CORRIGÉE
  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('🔐 AuthContext: Tentative de connexion pour', email);
      
      // ✅ CORRECTION CRITIQUE: Passer les paramètres séparément
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        console.log('✅ Connexion réussie! Utilisateur:', {
          email: result.user?.email,
          role: result.user?.role
        });
        
        return { success: true, user: result.user };
      } else {
        setError(result.error);
        console.error('❌ Échec de la connexion:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Erreur de connexion';
      setError(errorMessage);
      console.error('💥 Exception pendant la connexion:', error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setIsLoading(true);
      
      const result = await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('✅ Déconnexion réussie');
      return result;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, réinitialiser l'état local
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
      return null;
    }
  };

  const value = {
    // État
    isAuthenticated,
    isLoading,
    user,
    error,
    
    // Fonctions
    login,
    logout,
    refreshUser,
    checkAuthStatus,
    
    // Fonction utilitaire pour nettoyer les erreurs
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};