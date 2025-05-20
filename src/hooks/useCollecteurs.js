// src/hooks/useCollecteurs.js
import { useState, useEffect, useCallback } from 'react';
import CollecteurService from '../services/collecteurService';
import { useErrorHandler } from './useErrorHandler'; // Nouveau hook de gestion d'erreurs

export const useCollecteurs = () => {
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { handleApiError } = useErrorHandler();

  const fetchCollecteurs = useCallback(async (page = 0, size = 10, search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel API réel avec pagination et recherche
      const response = await CollecteurService.getAllCollecteurs(page, size, search);
      
      if (page === 0) {
        setCollecteurs(response.content);
      } else {
        setCollecteurs(prevCollecteurs => [...prevCollecteurs, ...response.content]);
      }
      
      setCurrentPage(page);
      setHasMore(page < response.totalPages - 1);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const refreshCollecteurs = useCallback(async () => {
    setRefreshing(true);
    await fetchCollecteurs(0);
    setRefreshing(false);
  }, [fetchCollecteurs]);

  const loadMoreCollecteurs = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchCollecteurs(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchCollecteurs]);

  const toggleCollecteurStatus = useCallback(async (collecteurId, newStatus) => {
    try {
      setLoading(true);
      
      const response = await CollecteurService.updateStatus(collecteurId, newStatus);
      
      // Mise à jour locale de l'état après confirmation par le serveur
      setCollecteurs(prevCollecteurs => 
        prevCollecteurs.map(c => 
          c.id === collecteurId ? { ...c, status: newStatus } : c
        )
      );
      
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const createCollecteur = useCallback(async (collecteurData) => {
    try {
      setLoading(true);
      
      const response = await CollecteurService.createCollecteur(collecteurData);
      
      // Ajouter le nouveau collecteur à l'état
      setCollecteurs(prevCollecteurs => [response, ...prevCollecteurs]);
      
      return { success: true, collecteur: response };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const updateCollecteur = useCallback(async (collecteurId, collecteurData) => {
    try {
      setLoading(true);
      
      const response = await CollecteurService.updateCollecteur(collecteurId, collecteurData);
      
      // Mettre à jour l'état localement après confirmation du serveur
      setCollecteurs(prevCollecteurs => 
        prevCollecteurs.map(c => 
          c.id === collecteurId ? response : c
        )
      );
      
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Charger les collecteurs au montage du composant
  useEffect(() => {
    fetchCollecteurs();
  }, [fetchCollecteurs]);

  return {
    collecteurs,
    loading,
    error,
    refreshing,
    hasMore,
    fetchCollecteurs,
    refreshCollecteurs,
    loadMoreCollecteurs,
    toggleCollecteurStatus,
    createCollecteur,
    updateCollecteur,
  };
};

export default useCollecteurs;