// src/hooks/useCommissionV2.js
import { useState, useCallback, useEffect } from 'react';
import commissionV2Service from '../services/commissionV2Service';

/**
 * Hook pour gérer les nouvelles fonctionnalités de commission FOCEP v2
 * - Calcul commission hiérarchique
 * - Rémunération Vi vs S
 * - Génération rapports Excel
 * - Gestion rubriques
 */
export const useCommissionV2 = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commissionData, setCommissionData] = useState(null);
  const [remunerationData, setRemunerationData] = useState(null);
  const [rubriques, setRubriques] = useState([]);

  /**
   * Nettoie les erreurs
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Lance le calcul de commission avec hiérarchie
   */
  const calculateCommissions = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validation des paramètres
      commissionV2Service.validatePeriodParams(dateDebut, dateFin);
      
      const result = await commissionV2Service.calculateCommissionsHierarchy(
        collecteurId, 
        dateDebut, 
        dateFin
      );
      
      setCommissionData(result.data);
      
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du calcul des commissions';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lance la rémunération
   */
  const processRemuneration = useCallback(async (collecteurId, montantS) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!montantS || montantS <= 0) {
        throw new Error('Le montant S doit être positif');
      }
      
      const result = await commissionV2Service.processRemuneration(collecteurId, montantS);
      
      setRemunerationData(result.data);
      
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la rémunération';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Processus complet automatisé
   */
  const processusComplet = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validation des paramètres
      commissionV2Service.validatePeriodParams(dateDebut, dateFin);
      
      const result = await commissionV2Service.processusCompletCommissionRemuneration(
        collecteurId, 
        dateDebut, 
        dateFin
      );
      
      setCommissionData(result.data.commission);
      setRemunerationData(result.data.remuneration);
      
      return {
        success: true,
        data: result.data,
        message: result.message,
        periode: result.data.periode
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du processus complet';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Génère le rapport Excel de commission
   */
  const generateCommissionReport = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await commissionV2Service.generateCommissionExcelReport(
        collecteurId, 
        dateDebut, 
        dateFin
      );
      
      return {
        success: true,
        fileName: result.data.fileName,
        size: result.data.size,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la génération du rapport';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Génère le rapport Excel de rémunération
   */
  const generateRemunerationReport = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await commissionV2Service.generateRemunerationExcelReport(
        collecteurId, 
        dateDebut, 
        dateFin
      );
      
      return {
        success: true,
        fileName: result.data.fileName,
        size: result.data.size,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la génération du rapport';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charge les rubriques d'un collecteur
   */
  const loadRubriques = useCallback(async (collecteurId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await commissionV2Service.getRubriquesCollecteur(collecteurId);
      
      setRubriques(result.data || []);
      
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement des rubriques';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crée une nouvelle rubrique
   */
  const createRubrique = useCallback(async (rubriqueData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await commissionV2Service.createRubrique(rubriqueData);
      
      // Met à jour la liste locale
      setRubriques(prev => [...prev, result.data]);
      
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la création de la rubrique';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Met à jour une rubrique
   */
  const updateRubrique = useCallback(async (rubriqueId, rubriqueData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await commissionV2Service.updateRubrique(rubriqueId, rubriqueData);
      
      // Met à jour la liste locale
      setRubriques(prev => 
        prev.map(r => r.id === rubriqueId ? result.data : r)
      );
      
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la rubrique';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Désactive une rubrique
   */
  const deactivateRubrique = useCallback(async (rubriqueId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await commissionV2Service.deactivateRubrique(rubriqueId);
      
      // Retire de la liste locale
      setRubriques(prev => prev.filter(r => r.id !== rubriqueId));
      
      return {
        success: true,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la désactivation de la rubrique';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calcule les statistiques des commissions actuelles
   */
  const getCommissionStats = useCallback(() => {
    if (!commissionData) return null;
    
    return commissionV2Service.calculateCommissionStats(commissionData);
  }, [commissionData]);

  /**
   * Formate une période pour l'affichage
   */
  const formatPeriode = useCallback((dateDebut, dateFin) => {
    return commissionV2Service.formatPeriode(dateDebut, dateFin);
  }, []);

  /**
   * Réinitialise toutes les données
   */
  const reset = useCallback(() => {
    setCommissionData(null);
    setRemunerationData(null);
    setRubriques([]);
    setError(null);
  }, []);

  return {
    // État
    loading,
    error,
    commissionData,
    remunerationData,
    rubriques,
    
    // Actions
    calculateCommissions,
    processRemuneration,
    processusComplet,
    generateCommissionReport,
    generateRemunerationReport,
    
    // Rubriques
    loadRubriques,
    createRubrique,
    updateRubrique,
    deactivateRubrique,
    
    // Utilitaires
    getCommissionStats,
    formatPeriode,
    clearError,
    reset
  };
};