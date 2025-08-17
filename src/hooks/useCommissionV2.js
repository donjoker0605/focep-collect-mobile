// src/hooks/useCommissionV2.js - INTEGRATION V2 COMPLETE
import { useState, useCallback, useEffect } from 'react';
import commissionV2Service from '../services/commissionV2Service';
import adminCommissionService from '../services/adminCommissionService';

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
   * Lance le calcul de commission avec les nouvelles API V2
   */
  const calculateCommissions = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setLoading(true);
      setError(null);
      
      // Utilisation des nouvelles API V2 backend
      const result = await adminCommissionService.calculateCommissionsV2(
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
   * Processus complet automatisé avec les nouvelles API V2
   */
  const processusComplet = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setLoading(true);
      setError(null);
      
      // Utilisation de la nouvelle API V2 backend qui fait tout en une seule fois
      const result = await adminCommissionService.processComplet(collecteurId, dateDebut, dateFin);
      
      // Mettre à jour les données avec les résultats complets
      if (result.data?.commissionResult) {
        setCommissionData(result.data.commissionResult);
      }
      if (result.data?.remunerationResult) {
        setRemunerationData(result.data.remunerationResult);
      }
      
      return {
        success: true,
        data: result.data,
        message: result.message
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
   * Génération du rapport Excel de commission avec API V2
   */
  const generateCommissionReport = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminCommissionService.generateCommissionReport(collecteurId, dateDebut, dateFin);
      
      return {
        success: true,
        data: result.data,
        message: 'Rapport commission généré avec succès'
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur génération rapport commission';
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
   * Génération du rapport Excel de rémunération complet avec API V2
   */
  const generateRemunerationReport = useCallback(async (collecteurId, dateDebut, dateFin) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminCommissionService.generateRemunerationReport(collecteurId, dateDebut, dateFin);
      
      return {
        success: true,
        data: result.data,
        message: 'Rapport rémunération généré avec succès'
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur génération rapport rémunération';
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
   * Récupération des rubriques de rémunération avec API V2
   */
  const loadRubriques = useCallback(async (collecteurId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = collecteurId 
        ? await adminCommissionService.getRubriquesByCollecteur(collecteurId)
        : await adminCommissionService.getAllRubriques();
      
      setRubriques(result.data || []);
      
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err.message || 'Erreur chargement rubriques';
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
   * Crée une nouvelle rubrique avec API V2
   */
  const createRubrique = useCallback(async (rubriqueData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminCommissionService.createRubrique(rubriqueData);
      
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
   * Met à jour une rubrique existante avec API V2
   */
  const updateRubrique = useCallback(async (rubriqueId, rubriqueData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Hook updateRubrique - ID:', rubriqueId, 'Données:', rubriqueData);
      
      const result = await adminCommissionService.updateRubrique(rubriqueId, rubriqueData);
      
      console.log('📡 Réponse API updateRubrique:', result);
      
      // Met à jour la liste locale - Merge avec les données existantes
      setRubriques(prev => {
        const updatedRubriques = prev.map(r => {
          if (r.id === rubriqueId) {
            // Préserver la structure existante et fusionner avec les nouvelles données
            const updated = { 
              ...r, 
              ...result.data,
              // S'assurer que les champs critiques sont présents
              id: rubriqueId,
              nom: result.data.nom || r.nom,
              type: result.data.type || r.type,
              valeur: result.data.valeur || r.valeur,
              active: result.data.active !== undefined ? result.data.active : r.active
            };
            console.log('🔄 Rubrique mise à jour localement:', updated);
            return updated;
          }
          return r;
        });
        
        console.log('✅ État rubriques mis à jour:', updatedRubriques);
        return updatedRubriques;
      });
      
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (err) {
      console.error('❌ Erreur hook updateRubrique:', err);
      const errorMessage = err.message || 'Erreur lors de la modification de la rubrique';
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
   * Désactive une rubrique avec API V2
   */
  const deactivateRubrique = useCallback(async (rubriqueId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminCommissionService.deactivateRubrique(rubriqueId);
      
      // Met à jour la liste locale
      setRubriques(prev => prev.map(r => 
        r.id === rubriqueId ? { ...r, active: false } : r
      ));
      
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
   * Calcule les statistiques des commissions
   */
  const getCommissionStats = useCallback(() => {
    if (!commissionData) {
      return {
        totalClients: 0,
        totalCommissions: 0,
        totalTaxes: 0,
        montantS: 0,
        moyenne: 0,
        taux: 0
      };
    }

    const clients = commissionData.clients || [];
    const totalClients = clients.length;
    const totalCommissions = clients.reduce((sum, client) => sum + (client.commission || 0), 0);
    const totalTaxes = clients.reduce((sum, client) => sum + (client.taxe || 0), 0);
    const montantS = commissionData.montantS || totalCommissions;
    const moyenne = totalClients > 0 ? totalCommissions / totalClients : 0;
    const totalEpargne = clients.reduce((sum, client) => sum + (client.totalEpargne || 0), 0);
    const taux = totalEpargne > 0 ? (totalCommissions / totalEpargne) * 100 : 0;

    return {
      totalClients,
      totalCommissions,
      totalTaxes,
      montantS,
      moyenne,
      taux: parseFloat(taux.toFixed(2))
    };
  }, [commissionData]);

  /**
   * Formate une période pour affichage
   */
  const formatPeriode = useCallback((dateDebut, dateFin) => {
    if (!dateDebut || !dateFin) return '';
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    return `${debut.toLocaleDateString('fr-FR')} - ${fin.toLocaleDateString('fr-FR')}`;
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
    
    // Actions principales V2
    calculateCommissions,
    processusComplet,
    generateCommissionReport,
    generateRemunerationReport,
    
    // Rubriques V2
    loadRubriques,
    createRubrique,
    updateRubrique,
    deactivateRubrique,
    
    // Statistiques et utilitaires
    getCommissionStats,
    formatPeriode,
    clearError,
    reset
  };
};