// src/hooks/useAdminCollecteurs.js - HOOK SÉCURISÉ
import { useState, useEffect, useCallback } from 'react';
import { collecteurService } from '../services';

export const useAdminCollecteurs = () => {
  // ✅ ÉTATS INITIALISÉS CORRECTEMENT
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // ✅ FONCTION DE CHARGEMENT SÉCURISÉE
  const fetchCollecteurs = useCallback(async (page = 0, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(0);
      }
      
      setError(null);
      
      const response = await collecteurService.getAllCollecteurs({
        page,
        size: 20
      });
      
      if (response.success) {
        // ✅ VÉRIFICATIONS MULTIPLES POUR LA SÉCURITÉ
        const newCollecteurs = Array.isArray(response.data) ? response.data : [];
        const total = response.totalElements || 0;
        const hasMoreData = page < (response.totalPages - 1) || false;
        
        if (reset || page === 0) {
          setCollecteurs(newCollecteurs);
        } else {
          // ✅ CONCATÉNATION SÉCURISÉE
          setCollecteurs(prev => {
            const prevArray = Array.isArray(prev) ? prev : [];
            return [...prevArray, ...newCollecteurs];
          });
        }
        
        setTotalElements(total);
        setHasMore(hasMoreData);
        setCurrentPage(page);
        
      } else {
        // ✅ GESTION D'ERREUR AVEC FALLBACK
        setError(response.error || 'Erreur lors du chargement des collecteurs');
        if (reset || page === 0) {
          setCollecteurs([]);
          setTotalElements(0);
        }
      }
    } catch (err) {
      console.error('Erreur dans fetchCollecteurs:', err);
      setError(err.message || 'Erreur réseau');
      
      // ✅ FALLBACK EN CAS D'ERREUR
      if (reset || page === 0) {
        setCollecteurs([]);
        setTotalElements(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ✅ FONCTION DE RAFRAÎCHISSEMENT
  const refreshCollecteurs = useCallback(() => {
    setRefreshing(true);
    fetchCollecteurs(0, true);
  }, [fetchCollecteurs]);

  // ✅ FONCTION DE CHARGEMENT SUPPLÉMENTAIRE
  const loadMoreCollecteurs = useCallback(() => {
    if (!loading && hasMore) {
      fetchCollecteurs(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, fetchCollecteurs]);

  // ✅ CRÉATION D'UN COLLECTEUR
  const createCollecteur = useCallback(async (collecteurData) => {
    try {
      setError(null);
      
      const response = await collecteurService.createCollecteur(collecteurData);
      
      if (response.success) {
        // ✅ AJOUTER EN TÊTE DE LISTE DE MANIÈRE SÉCURISÉE
        setCollecteurs(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return [response.data, ...prevArray];
        });
        
        setTotalElements(prev => prev + 1);
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Erreur lors de la création');
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      const errorMessage = err.message || 'Erreur lors de la création';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // ✅ MISE À JOUR D'UN COLLECTEUR
  const updateCollecteur = useCallback(async (collecteurId, updateData) => {
    try {
      setError(null);
      
      const response = await collecteurService.updateCollecteur(collecteurId, updateData);
      
      if (response.success) {
        // ✅ MISE À JOUR SÉCURISÉE DE LA LISTE
        setCollecteurs(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(collecteur => 
            collecteur && collecteur.id === collecteurId 
              ? { ...collecteur, ...response.data }
              : collecteur
          );
        });
        
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Erreur lors de la mise à jour');
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      const errorMessage = err.message || 'Erreur lors de la mise à jour';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // ✅ BASCULER LE STATUT D'UN COLLECTEUR
  const toggleCollecteurStatus = useCallback(async (collecteurId, newStatus) => {
    try {
      setError(null);
      
      const response = await collecteurService.toggleStatus(collecteurId, newStatus);
      
      if (response.success) {
        // ✅ MISE À JOUR SÉCURISÉE DU STATUT
        setCollecteurs(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(collecteur => 
            collecteur && collecteur.id === collecteurId 
              ? { ...collecteur, active: newStatus }
              : collecteur
          );
        });
        
        return { success: true };
      } else {
        setError(response.error || 'Erreur lors du changement de statut');
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      const errorMessage = err.message || 'Erreur lors du changement de statut';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // ✅ SUPPRIMER UN COLLECTEUR
  const deleteCollecteur = useCallback(async (collecteurId) => {
    try {
      setError(null);
      
      const response = await collecteurService.deleteCollecteur(collecteurId);
      
      if (response.success) {
        // ✅ SUPPRESSION SÉCURISÉE DE LA LISTE
        setCollecteurs(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.filter(collecteur => 
            collecteur && collecteur.id !== collecteurId
          );
        });
        
        setTotalElements(prev => Math.max(0, prev - 1));
        return { success: true };
      } else {
        setError(response.error || 'Erreur lors de la suppression');
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      const errorMessage = err.message || 'Erreur lors de la suppression';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // ✅ RECHERCHER DES COLLECTEURS
  const searchCollecteurs = useCallback(async (searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await collecteurService.searchCollecteurs(searchQuery);
      
      if (response.success) {
        const searchResults = Array.isArray(response.data) ? response.data : [];
        setCollecteurs(searchResults);
        setTotalElements(searchResults.length);
        setHasMore(false); // Pas de pagination pour la recherche
      } else {
        setError(response.error || 'Erreur lors de la recherche');
        setCollecteurs([]);
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.message || 'Erreur lors de la recherche');
      setCollecteurs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ EFFACER L'ERREUR
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ CHARGEMENT INITIAL
  useEffect(() => {
    fetchCollecteurs(0, true);
  }, [fetchCollecteurs]);

  // ✅ FONCTIONS UTILITAIRES SÉCURISÉES
  const getCollecteurById = useCallback((id) => {
    if (!Array.isArray(collecteurs)) return null;
    return collecteurs.find(collecteur => collecteur && collecteur.id === id) || null;
  }, [collecteurs]);

  const getActiveCollecteurs = useCallback(() => {
    if (!Array.isArray(collecteurs)) return [];
    return collecteurs.filter(collecteur => collecteur && collecteur.active === true);
  }, [collecteurs]);

  const getInactiveCollecteurs = useCallback(() => {
    if (!Array.isArray(collecteurs)) return [];
    return collecteurs.filter(collecteur => collecteur && collecteur.active === false);
  }, [collecteurs]);

  // ✅ STATISTIQUES SÉCURISÉES
  const stats = {
    total: totalElements,
    active: getActiveCollecteurs().length,
    inactive: getInactiveCollecteurs().length,
    loaded: Array.isArray(collecteurs) ? collecteurs.length : 0
  };

  return {
    // Données
    collecteurs: Array.isArray(collecteurs) ? collecteurs : [], // ✅ TOUJOURS UN TABLEAU
    loading,
    refreshing,
    error,
    hasMore,
    totalElements,
    currentPage,
    stats,
    
    // Actions
    fetchCollecteurs,
    refreshCollecteurs,
    loadMoreCollecteurs,
    createCollecteur,
    updateCollecteur,
    toggleCollecteurStatus,
    deleteCollecteur,
    searchCollecteurs,
    clearError,
    
    // Utilitaires
    getCollecteurById,
    getActiveCollecteurs,
    getInactiveCollecteurs,
  };
};