// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { useRouter } from 'expo-router';
import { SecureStorage } from '../services/secureStorage';
import { EventEmitter } from 'events';
import * as LocalAuthentication from 'expo-local-authentication';

// Créer un émetteur d'événements global pour l'authentification
if (!global.authEventEmitter) {
  global.authEventEmitter = new EventEmitter();
}

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Gestionnaire de session expirée
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/auth');
      setError('Votre session a expiré. Veuillez vous reconnecter.');
    };

    // S'abonner à l'événement de session expirée
    global.authEventEmitter.on('SESSION_EXPIRED', handleSessionExpired);

    // Nettoyage
    return () => {
      global.authEventEmitter.off('SESSION_EXPIRED', handleSessionExpired);
    };
  }, [router]);

  // Vérification périodique de la session
  useEffect(() => {
    let sessionCheckInterval;

    if (isAuthenticated) {
      // Vérifier la session toutes les 5 minutes
      sessionCheckInterval = setInterval(async () => {
        const sessionActive = await authService.checkSessionActivity(30); // 30 minutes max
        if (!sessionActive) {
          global.authEventEmitter.emit('SESSION_EXPIRED');
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [isAuthenticated]);

  // Vérifier l'état d'authentification au démarrage
  useEffect(() => {
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier si le token est valide
      const authResult = await authService.isAuthenticated();
      
      // Gérer différents formats de retour possibles
      if (authResult && typeof authResult === 'object' && authResult.token) {
        // Format { token, userData }
        const userData = authResult.userData;
        
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('Session restaurée:', { role: userData?.role });
      } else if (authResult === true) {
        // Format booléen (ancienne implémentation)
        const userData = await authService.getCurrentUser();
        
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('Session restaurée (boolean):', { role: userData?.role });
      } else {
        // Token invalide ou format incorrect
        await SecureStorage.clearAuthData();
        
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

  // Fonction de connexion avec authentification biométrique optionnelle
  const login = async (email, password, useBiometrics = false) => {
    setError(null);
    setIsLoading(true);

    try {
      // Vérifier si l'authentification biométrique est disponible et activée
      if (useBiometrics) {
        const biometricAuth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authentification pour FOCEP Collect',
          fallbackLabel: 'Utiliser le mot de passe',
        });
        
        if (!biometricAuth.success) {
          setIsLoading(false);
          return { success: false, error: 'Authentification biométrique échouée' };
        }
      }
      
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);

        // Rediriger selon le rôle
        redirectBasedOnRole(result.user.role);
        
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
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
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }
      
      const updatedUser = { ...user, ...updatedInfo };
      await SecureStorage.saveItem(SECURE_KEYS.USER_SESSION, updatedUser);
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