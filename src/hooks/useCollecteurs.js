// src/hooks/useCollecteurs.js
import { useState, useEffect, useCallback } from 'react';
import { collecteurS²ervice } from '../../services';
import { useErrorHandler } from './useErrorHandler'; // Nouveau hook de gestion d'erreurs

export const useCollecteurs = () => {
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const handleError = useCallback((err) => {
    console.error('Error in useCollecteurs:', err);
    let message = 'Une erreur est survenue';
    
    if (err?.message) {
      message = err.message;
    } else if (err?.response?.data?.message) {
      message = err.response.data.message;
    } else if (typeof err === 'string') {
      message = err;
    }
    
    return message;
  }, []);

  const fetchCollecteurs = useCallback(async (page = 0, size = 20, search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ CORRIGÉ : Utiliser la bonne signature de méthode
      const response = await collecteurService.getAllCollecteurs({ 
        page, 
        size, 
        search 
      });
      
      if (response.success) {
        const collecteursData = response.data || [];
        const collecteursArray = Array.isArray(collecteursData) ? collecteursData : [];
        
        if (page === 0) {
          setCollecteurs(collecteursArray);
        } else {
          setCollecteurs(prevCollecteurs => [...prevCollecteurs, ...collecteursArray]);
        }
        
        setCurrentPage(page);
        setHasMore(collecteursArray.length === size);
      } else {
        throw new Error(response.error || 'Erreur lors de la récupération des collecteurs');
      }
      
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

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
  }, []);

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