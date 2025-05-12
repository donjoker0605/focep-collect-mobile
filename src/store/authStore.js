import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

export const useAuthStore = create((set, get) => ({
  // State
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,

  // Actions
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await ApiService.post('/auth/login', {
        email,
        password,
      }, false); // false = pas de token requis pour login

      if (response.token) {
        // Stocker le token
        await AsyncStorage.setItem('authToken', response.token);
        
        // Pour l'instant, on simule les infos utilisateur
        const userInfo = {
          email,
          role: 'ROLE_COLLECTEUR', // À adapter selon la réponse
        };
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        set({
          isAuthenticated: true,
          user: userInfo,
          token: response.token,
          isLoading: false,
        });
        return { success: true };
      }
      
      set({ error: 'Token non reçu', isLoading: false });
      return { success: false, error: 'Token non reçu' };
    } catch (error) {
      console.error('Login error:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      await AsyncStorage.multiRemove(['authToken', 'userInfo']);
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  checkAuthentication: async () => {
    set({ isLoading: true });
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userInfo = await AsyncStorage.getItem('userInfo');
      
      if (token && userInfo) {
        set({
          isAuthenticated: true,
          user: JSON.parse(userInfo),
          token,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: error.message,
      });
    }
  },

  clearError: () => set({ error: null }),
}));