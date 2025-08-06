// src/hooks/useAdminCommissions.js 
import { useState, useCallback } from 'react';
import adminCommissionService from '../services/adminCommissionService'; // ✅ Service maintenant existant
import { useErrorHandler } from './useErrorHandler';

/**
 * CORRIGÉ pour la gestion des commissions administratives
 * Utilise le service adminCommissionService maintenant disponible
 */
export const useAdminCommissions = () => {
  const { handleError } = useErrorHandler();
  
  // États
  const [processing, setProcessing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [commissionData, setCommissionData] = useState(null);
  const [error, setError] = useState(null);

  // ================================
  // TRAITEMENT DES COMMISSIONS
  // ================================

  /**
   * Traiter les commissions pour un collecteur
   */
  const processCommissions = useCallback(async (collecteurId, dateDebut, dateFin, force = false) => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await adminCommissionService.processCommissions(
        collecteurId, dateDebut, dateFin, force
      );
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, [handleError]);

  /**
   * Calculer les commissions (endpoint principal)
   */
  const calculateCommissions = useCallback(async (dateDebut, dateFin, collecteurId = null) => {
    try {
      setCalculating(true);
      setError(null);
      
      const response = await adminCommissionService.calculateCommissions(
        dateDebut, dateFin, collecteurId
      );
      
      if (response.success) {
        setCommissionData(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCalculating(false);
    }
  }, [handleError]);

  /**
   * Calculer les commissions pour toute l'agence
   */
  const calculateAgenceCommissions = useCallback(async (dateDebut, dateFin) => {
    try {
      setCalculating(true);
      setError(null);
      
      const response = await adminCommissionService.calculateAgenceCommissions(
        dateDebut, dateFin
      );
      
      if (response.success) {
        setCommissionData(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCalculating(false);
    }
  }, [handleError]);

  /**
   * Calculer les commissions d'un collecteur spécifique
   */
  const calculateCollecteurCommissions = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setCalculating(true);
      setError(null);
      
      const response = await adminCommissionService.calculateCollecteurCommissions(
        collecteurId, dateDebut, dateFin
      );
      
      if (response.success) {
        setCommissionData(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCalculating(false);
    }
  }, [handleError]);

  // ================================
  // TRAITEMENT BATCH ET ASYNCHRONE
  // ================================

  /**
   * Traitement batch pour une agence
   */
  const processAgenceBatch = useCallback(async (agenceId, dateDebut, dateFin) => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await adminCommissionService.processAgenceBatch(
        agenceId, dateDebut, dateFin
      );
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, [handleError]);

  /**
   * Traitement asynchrone
   */
  const processCommissionsAsync = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await adminCommissionService.processCommissionsAsync(
        collecteurId, dateDebut, dateFin
      );
      
      if (response.success) {
        return { success: true, data: response.data, taskId: response.data.taskId };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, [handleError]);

  // ================================
  // SIMULATION
  // ================================

  /**
   * Simuler une commission
   */
  const simulateCommission = useCallback(async (simulationData) => {
    try {
      setError(null);
      
      const response = await adminCommissionService.simulateCommission(simulationData);
      
      if (response.success) {
        setSimulationResult(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [handleError]);

  // ================================
  // CONSULTATION
  // ================================

  /**
   * Récupérer les commissions d'un collecteur
   */
  const getCollecteurCommissions = useCallback(async (collecteurId, startDate = null, endDate = null) => {
    try {
      setError(null);
      
      const response = await adminCommissionService.getCollecteurCommissions(
        collecteurId, startDate, endDate
      );
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [handleError]);

  // ================================
  // GESTION ASYNCHRONE
  // ================================

  /**
   * Vérifier le statut d'un traitement asynchrone
   */
  const checkAsyncStatus = useCallback(async (taskId) => {
    try {
      const response = await adminCommissionService.checkAsyncStatus(taskId);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Erreur vérification statut:', err);
      return null;
    }
  }, []);

  /**
   * Annuler un traitement en cours
   */
  const cancelProcessing = useCallback(async (taskId) => {
    try {
      const response = await adminCommissionService.cancelProcessing(taskId);
      return response.success;
    } catch (err) {
      console.error('Erreur annulation:', err);
      return false;
    }
  }, []);

  // ================================
  // ACTIONS UTILITAIRES
  // ================================

  const clearError = useCallback(() => setError(null), []);
  const clearSimulation = useCallback(() => setSimulationResult(null), []);
  const clearCommissionData = useCallback(() => setCommissionData(null), []);

  const reset = useCallback(() => {
    setError(null);
    setSimulationResult(null);
    setCommissionData(null);
    setProcessing(false);
    setCalculating(false);
  }, []);

  return {
    // ================================
    // ÉTATS
    // ================================
    processing,
    calculating,
    simulationResult,
    commissionData,
    error,
    
    // ================================
    // ACTIONS PRINCIPALES
    // ================================
    processCommissions,
    calculateCommissions,
    calculateAgenceCommissions,
    calculateCollecteurCommissions,
    simulateCommission,
    
    // ================================
    // ACTIONS AVANCÉES
    // ================================
    processAgenceBatch,
    processCommissionsAsync,
    getCollecteurCommissions,
    checkAsyncStatus,
    cancelProcessing,
    
    // ================================
    // ACTIONS UTILITAIRES
    // ================================
    clearError,
    clearSimulation,
    clearCommissionData,
    reset
  };
};