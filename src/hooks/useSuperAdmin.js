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

  const toggleAdminStatus = useCallback(async (adminId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.toggleAdminStatus(adminId);
      if (result.success) {
        // Recharger la liste des admins pour mettre à jour le statut
        await loadAdmins();
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError('Erreur lors du changement de statut de l\'admin');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAdmins]);

  /**
   * 🏢 GESTION COMPLÈTE DES AGENCES
   */
  const loadAgences = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getAllAgences(params);
      if (result.success) {
        setAgences(result.data);
        return result.data;
      } else {
        setError(result.error);
        return [];
      }
    } catch (err) {
      setError('Erreur lors du chargement des agences');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAgenceDetails = useCallback(async (agenceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getAgenceDetails(agenceId);
      if (result.success) {
        setSelectedAgence(result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erreur lors du chargement des détails agence');
      return null;
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

  const updateAgence = useCallback(async (agenceId, agenceData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.updateAgence(agenceId, agenceData);
      if (result.success) {
        // Recharger la liste des agences
        await loadAgences();
        // Mettre à jour l'agence sélectionnée si c'est la même
        if (selectedAgence && selectedAgence.id === agenceId) {
          setSelectedAgence(result.data);
        }
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erreur lors de la modification de l\'agence');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAgences, selectedAgence]);

  const toggleAgenceStatus = useCallback(async (agenceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.toggleAgenceStatus(agenceId);
      if (result.success) {
        // Recharger la liste des agences
        await loadAgences();
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erreur lors du changement de statut de l\'agence');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAgences]);

  const deleteAgence = useCallback(async (agenceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.deleteAgence(agenceId);
      if (result.success) {
        // Recharger la liste des agences
        await loadAgences();
        // Réinitialiser l'agence sélectionnée si c'est la même
        if (selectedAgence && selectedAgence.id === agenceId) {
          setSelectedAgence(null);
        }
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError('Erreur lors de la suppression de l\'agence');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAgences, selectedAgence]);

  // ================================
  // 💰 GESTION PARAMÈTRES COMMISSION PAR AGENCE
  // ================================

  const loadAgenceCommissionParams = useCallback(async (agenceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.getAgenceCommissionParams(agenceId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return [];
      }
    } catch (err) {
      setError('Erreur lors du chargement des paramètres commission');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const setAgenceCommissionParams = useCallback(async (agenceId, parametres) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.setAgenceCommissionParams(agenceId, parametres);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erreur lors de la définition des paramètres commission');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAgenceCommissionParam = useCallback(async (agenceId, parametreId, parametre) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.updateAgenceCommissionParam(agenceId, parametreId, parametre);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erreur lors de la modification du paramètre commission');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAgenceCommissionParam = useCallback(async (agenceId, parametreId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await superAdminService.deleteAgenceCommissionParam(agenceId, parametreId);
      if (result.success) {
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError('Erreur lors de la suppression du paramètre commission');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

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
    toggleAdminStatus,
    
    // Actions Agences
    loadAgences,
    loadAgenceDetails,
    createAgence,
    updateAgence,
    toggleAgenceStatus,
    deleteAgence,
    
    // Actions Commission par Agence
    loadAgenceCommissionParams,
    setAgenceCommissionParams,
    updateAgenceCommissionParam,
    deleteAgenceCommissionParam,
    
    // Actions Collecteurs/Clients
    loadCollecteursByAgence,
    loadClientsByAgence,
    
    // Utilitaires
    clearError,
    resetSelectedAdmin,
    resetSelectedAgence,
  };
};