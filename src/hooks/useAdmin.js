// src/hooks/useAdmin.js - 
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import adminService from '../services/adminService';

export const useAdmin = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  
  // ✅ VÉRIFICATION DU RÔLE ADMIN
  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';
  
  // États généraux
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // États dashboard
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // ✅ CHARGEMENT DU DASHBOARD
  const loadDashboard = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      setDashboardLoading(true);
      setError(null);
      
      const response = await adminService.getDashboardStats();
      if (response.success) {
        setDashboardStats(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      handleError(err, {
        context: {
          componentInfo: 'useAdmin',
          action: 'loadDashboard'
        }
      });
      setError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  }, [isAdmin, handleError]);

  // ✅ ACTIONS ADMIN GÉNÉRIQUES
  const executeAdminAction = useCallback(async (actionFn, successMessage = 'Action exécutée') => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await actionFn();
      
      if (result.success) {
        // Recharger le dashboard après une action
        loadDashboard();
        return { success: true, message: successMessage, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, handleError]);

  // Charger le dashboard au montage
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    // États
    isAdmin,
    isSuperAdmin,
    loading,
    error,
    dashboardStats,
    dashboardLoading,
    
    // Actions
    loadDashboard,
    executeAdminAction,
    clearError: () => setError(null)
  };
};
