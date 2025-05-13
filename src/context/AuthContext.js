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

        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUserData = await AsyncStorage.getItem('user_data');

        if (storedToken && storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);

          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          console.log('Session restaurée:', { role: parsedUser.role });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état d\'authentification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      // Exemple de requête à l'API (à adapter à ton backend)
      const response = await axios.post('https://api.exemple.com/login', {
        email,
        password
      });

      const { token: receivedToken, user: userData } = response.data;

      await AsyncStorage.setItem('auth_token', receivedToken);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));

      setToken(receivedToken);
      setUser(userData);
      setIsAuthenticated(true);

      axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

      // Rediriger selon le rôle
      switch (userData.role) {
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

      return { success: true };
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
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');

      delete axios.defaults.headers.common['Authorization'];

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      router.replace('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction pour mettre à jour les informations de l'utilisateur
  const updateUserInfo = async (updatedInfo) => {
    try {
      const updatedUser = { ...user, ...updatedInfo };

      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));

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
    updateUserInfo,
    setError
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};
