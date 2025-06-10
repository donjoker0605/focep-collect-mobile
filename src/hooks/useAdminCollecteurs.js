// src/hooks/useAdminCollecteurs.js 
import { useState, useEffect, useCallback } from 'react';
import adminService from '../services/adminService';
import { useErrorHandler } from './useErrorHandler';

export const useAdminCollecteurs = () => {
  const { handleError } = useErrorHandler();
  
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCollecteurs = useCallback(async (page = 0, size = 20, search = '', append = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getCollecteurs({ page, size, search });
      
      if (response.success) {
        if (append) {
          setCollecteurs(prev => [...prev, ...response.data.content]);
        } else {
          setCollecteurs(response.data.content);
        }
        
        setCurrentPage(page);
        setHasMore(page < response.data.totalPages - 1);
        setTotalElements(response.data.totalElements);
      } else {
        setError(response.error);
      }
    } catch (err) {
      handleError(err, {
        context: {
          componentInfo: 'useAdminCollecteurs',
          action: 'fetchCollecteurs'
        }
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createCollecteur = useCallback(async (collecteurData) => {
    try {
      setLoading(true);
      const response = await adminService.createCollecteur(collecteurData);
      
      if (response.success) {
        // Recharger la liste
        fetchCollecteurs(0);
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
      setLoading(false);
    }
  }, [fetchCollecteurs, handleError]);

  const updateCollecteur = useCallback(async (collecteurId, collecteurData) => {
    try {
      setLoading(true);
      const response = await adminService.updateCollecteur(collecteurId, collecteurData);
      
      if (response.success) {
        // Mettre à jour localement
        setCollecteurs(prev => prev.map(c => 
          c.id === collecteurId ? { ...c, ...response.data } : c
        ));
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
      setLoading(false);
    }
  }, [handleError]);

  const toggleCollecteurStatus = useCallback(async (collecteurId, newStatus) => {
    try {
      setLoading(true);
      const response = await adminService.toggleCollecteurStatus(collecteurId, newStatus);
      
      if (response.success) {
        // Mettre à jour localement
        setCollecteurs(prev => prev.map(c => 
          c.id === collecteurId ? { ...c, active: newStatus } : c
        ));
        return { success: true };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      handleError(err);
      setError(err.message);
      return { success: false, error: err.message };
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
      await fetchCollecteurs(currentPage + 1, 20, '', true);
    }
  }, [loading, hasMore, currentPage, fetchCollecteurs]);

  // Charger au montage
  useEffect(() => {
    fetchCollecteurs();
  }, [fetchCollecteurs]);

  return {
    // États
    collecteurs,
    loading,
    error,
    hasMore,
    totalElements,
    refreshing,
    
    // Actions
    fetchCollecteurs,
    createCollecteur,
    updateCollecteur,
    toggleCollecteurStatus,
    refreshCollecteurs,
    loadMoreCollecteurs,
    clearError: () => setError(null)
  };
};