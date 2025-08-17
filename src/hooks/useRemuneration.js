// src/hooks/useRemuneration.js
import { useState, useCallback } from 'react';
import remunerationService from '../services/remunerationService';

/**
 * Hook pour gérer les opérations de rémunération
 */
export const useRemuneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // États des données
  const [commissionsNonRemunerees, setCommissionsNonRemunerees] = useState([]);
  const [historiqueRemunerations, setHistoriqueRemunerations] = useState([]);
  const [rubriques, setRubriques] = useState([]);
  const [selectedCommissions, setSelectedCommissions] = useState([]);

  /**
   * Clear les erreurs
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Charge les commissions non rémunérées pour un collecteur
   */
  const loadCommissionsNonRemunerees = useCallback(async (collecteurId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await remunerationService.getCommissionsNonRemunerees(collecteurId);
      
      if (result.success) {
        setCommissionsNonRemunerees(result.data || []);
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        throw new Error(result.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement des commissions non rémunérées';
      setError(errorMessage);
      setCommissionsNonRemunerees([]);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charge l'historique des rémunérations
   */
  const loadHistoriqueRemunerations = useCallback(async (collecteurId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await remunerationService.getHistoriqueRemunerations(collecteurId);
      
      if (result.success) {
        setHistoriqueRemunerations(result.data || []);
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        throw new Error(result.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement de l\'historique';
      setError(errorMessage);
      setHistoriqueRemunerations([]);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charge les rubriques applicables
   */
  const loadRubriques = useCallback(async (collecteurId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await remunerationService.getRubriquesByCollecteur(collecteurId);
      
      if (result.success) {
        setRubriques(result.data || []);
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        throw new Error(result.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement des rubriques';
      setError(errorMessage);
      setRubriques([]);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lance le processus de rémunération
   */
  const processRemuneration = useCallback(async (collecteurId, commissionIds, rubriquesSelectionnees = []) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await remunerationService.processRemuneration(
        collecteurId, 
        commissionIds, 
        rubriquesSelectionnees
      );
      
      if (result.success) {
        // Recharger les données après succès
        await loadCommissionsNonRemunerees(collecteurId);
        await loadHistoriqueRemunerations(collecteurId);
        
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        throw new Error(result.message || 'Erreur lors de la rémunération');
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du processus de rémunération';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [loadCommissionsNonRemunerees, loadHistoriqueRemunerations]);

  /**
   * Sélectionne/désélectionne une commission
   */
  const toggleCommissionSelection = useCallback((commissionId) => {
    console.log('🔄 toggleCommissionSelection called with ID:', commissionId);
    setSelectedCommissions(prev => {
      console.log('🔄 Previous selected commissions:', prev);
      const isSelected = prev.includes(commissionId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId];
      console.log('🔄 New selected commissions:', newSelection);
      return newSelection;
    });
  }, []);

  /**
   * Sélectionne toutes les commissions
   */
  const selectAllCommissions = useCallback(() => {
    const allIds = commissionsNonRemunerees.map(c => c.id);
    setSelectedCommissions(allIds);
  }, [commissionsNonRemunerees]);

  /**
   * Désélectionne toutes les commissions
   */
  const clearCommissionSelection = useCallback(() => {
    setSelectedCommissions([]);
  }, []);

  /**
   * Calcule le total de rémunération pour les commissions sélectionnées
   */
  const calculateTotalRemuneration = useCallback(() => {
    const selectedCommissionsData = commissionsNonRemunerees.filter(
      c => selectedCommissions.includes(c.id)
    );
    
    return remunerationService.calculateRemuneration(selectedCommissionsData, rubriques);
  }, [commissionsNonRemunerees, selectedCommissions, rubriques]);

  /**
   * Charge toutes les données pour un collecteur
   */
  const loadAllData = useCallback(async (collecteurId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger toutes les données en parallèle
      const [commissionsResult, historiqueResult, rubriquesResult] = await Promise.allSettled([
        loadCommissionsNonRemunerees(collecteurId),
        loadHistoriqueRemunerations(collecteurId),
        loadRubriques(collecteurId)
      ]);

      // Vérifier les erreurs
      const errors = [];
      if (commissionsResult.status === 'rejected') errors.push('Commissions: ' + commissionsResult.reason.message);
      if (historiqueResult.status === 'rejected') errors.push('Historique: ' + historiqueResult.reason.message);
      if (rubriquesResult.status === 'rejected') errors.push('Rubriques: ' + rubriquesResult.reason.message);

      if (errors.length > 0) {
        setError('Erreurs de chargement: ' + errors.join(', '));
        return { success: false, error: errors.join(', ') };
      }

      return { success: true, message: 'Données chargées avec succès' };
      
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement des données';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadCommissionsNonRemunerees, loadHistoriqueRemunerations, loadRubriques]);

  /**
   * Réinitialise toutes les données
   */
  const reset = useCallback(() => {
    setCommissionsNonRemunerees([]);
    setHistoriqueRemunerations([]);
    setRubriques([]);
    setSelectedCommissions([]);
    setError(null);
  }, []);

  return {
    // États
    loading,
    error,
    commissionsNonRemunerees,
    historiqueRemunerations,
    rubriques,
    selectedCommissions,
    
    // Actions de chargement
    loadCommissionsNonRemunerees,
    loadHistoriqueRemunerations,
    loadRubriques,
    loadAllData,
    
    // Actions de sélection
    toggleCommissionSelection,
    selectAllCommissions,
    clearCommissionSelection,
    
    // Actions de traitement
    processRemuneration,
    calculateTotalRemuneration,
    
    // Utilitaires
    clearError,
    reset
  };
};