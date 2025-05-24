import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';

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
      // ✅ UTILISATION DU SERVICE UNIFIÉ
      const result = await authService.login(email, password);
      
      if (result.success) {
        set({
          isAuthenticated: true,
          user: result.user,
          token: result.token,
          isLoading: false,
        });
        return { success: true };
      }
      
      set({ error: result.error, isLoading: false });
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Login error:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      // ✅ UTILISATION DU SERVICE UNIFIÉ
      await authService.logout();
      
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
      // ✅ UTILISATION DU SERVICE UNIFIÉ
      const authResult = await authService.isAuthenticated();
      
      if (authResult.token && authResult.userData) {
        set({
          isAuthenticated: true,
          user: authResult.userData,
          token: authResult.token,
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