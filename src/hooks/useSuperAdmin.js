// src/hooks/useSuperAdmin.js
import { useState, useCallback } from 'react';
import superAdminService from '../services/superAdminService';

export const useSuperAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dashboard
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Admins
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Agences
  const [agences, setAgences] = useState([]);
  const [selectedAgence, setSelectedAgence] = useState(null);
  
  // Collecteurs et clients par agence
  const [collecteursAgence, setCollecteursAgence] = useState([]);
  const [clientsAgence, setClientsAgence] = useState([]);

  /**
   * 📊 DASHBOARD
   */
  const loadDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getDashboardStats();
      if (result.success) {
        setDashboardStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 👥 ADMINS
   */
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getAllAdmins();
      if (result.success) {
        setAdmins(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement des admins');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdminDetails = useCallback(async (adminId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getAdminDetails(adminId);
      if (result.success) {
        setSelectedAdmin(result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erreur lors du chargement des détails admin');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAdminPassword = useCallback(async (adminId, newPassword, reason = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.resetAdminPassword(adminId, newPassword, reason);
      if (result.success) {
        // Recharger la liste des admins
        await loadAdmins();
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError('Erreur lors de la réinitialisation du mot de passe');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAdmins]);

  const createAdmin = useCallback(async (adminData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.createAdmin(adminData);
      if (result.success) {
        // Recharger la liste des admins
        await loadAdmins();
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erreur lors de la création de l\'admin');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAdmins]);

  /**
   * 🏢 AGENCES
   */
  const loadAgences = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getAllAgences();
      if (result.success) {
        setAgences(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement des agences');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAgence = useCallback(async (agenceData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.createAgence(agenceData);
      if (result.success) {
        // Recharger la liste des agences
        await loadAgences();
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erreur lors de la création de l\'agence');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAgences]);

  /**
   * 🏢 COLLECTEURS ET CLIENTS PAR AGENCE
   */
  const loadCollecteursByAgence = useCallback(async (agenceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getCollecteursByAgence(agenceId);
      if (result.success) {
        setCollecteursAgence(result.data);
        return result.data;
      } else {
        setError(result.error);
        return [];
      }
    } catch (err) {
      setError('Erreur lors du chargement des collecteurs');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClientsByAgence = useCallback(async (agenceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getClientsByAgence(agenceId);
      if (result.success) {
        setClientsAgence(result.data);
        return result.data;
      } else {
        setError(result.error);
        return [];
      }
    } catch (err) {
      setError('Erreur lors du chargement des clients');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔧 UTILITAIRES
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetSelectedAdmin = useCallback(() => {
    setSelectedAdmin(null);
  }, []);

  const resetSelectedAgence = useCallback(() => {
    setSelectedAgence(null);
    setCollecteursAgence([]);
    setClientsAgence([]);
  }, []);

  return {
    // États
    loading,
    error,
    dashboardStats,
    admins,
    selectedAdmin,
    agences,
    selectedAgence,
    collecteursAgence,
    clientsAgence,
    
    // Actions Dashboard
    loadDashboardStats,
    
    // Actions Admins
    loadAdmins,
    loadAdminDetails,
    resetAdminPassword,
    createAdmin,
    
    // Actions Agences
    loadAgences,
    createAgence,
    
    // Actions Collecteurs/Clients
    loadCollecteursByAgence,
    loadClientsByAgence,
    
    // Utilitaires
    clearError,
    resetSelectedAdmin,
    resetSelectedAgence,
  };
};