// src/hooks/useClients.js
import { useState, useEffect, useCallback } from 'react';
import { clientService } from '../../services';
import { useErrorHandler } from './useErrorHandler';

export const useClients = (collecteurId = null) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { handleApiError } = useErrorHandler();

  const fetchClients = useCallback(async (page = 0, size = 10, search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel API réel avec gestion des différents cas (collecteur spécifique ou tous)
      const response = collecteurId 
        ? await ClientService.getClientsByCollecteur(collecteurId, page, size, search)
        : await ClientService.getAllClients(page, size, search);
      
      // Mise à jour de l'état en fonction de la page
      if (page === 0) {
        setClients(response.content);
      } else {
        setClients(prevClients => [...prevClients, ...response.content]);
      }
      
      setCurrentPage(page);
      setHasMore(page < response.totalPages - 1);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collecteurId, handleApiError]);

  const refreshClients = useCallback(async () => {
    setRefreshing(true);
    await fetchClients(0);
    setRefreshing(false);
  }, [fetchClients]);

  const loadMoreClients = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchClients(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchClients]);

  const toggleClientStatus = useCallback(async (clientId, newStatus) => {
    try {
      setLoading(true);
      
      const response = await ClientService.toggleClientStatus(clientId, newStatus);
      
      // Mise à jour locale après confirmation du serveur
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === clientId ? { ...c, status: newStatus } : c
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

  const createClient = useCallback(async (clientData) => {
    try {
      setLoading(true);
      
      const response = await ClientService.createClient(clientData);
      
      // Ajouter le nouveau client à l'état
      setClients(prevClients => [response, ...prevClients]);
      
      return { success: true, client: response };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const updateClient = useCallback(async (clientId, clientData) => {
    try {
      setLoading(true);
      
      const response = await ClientService.updateClient(clientId, clientData);
      
      // Mettre à jour l'état localement
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === clientId ? response : c
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

  // Charger les clients au montage du composant ou lorsque le collecteurId change
  useEffect(() => {
    fetchClients();
  }, [fetchClients, collecteurId]);

  return {
    clients,
    loading,
    error,
    refreshing,
    hasMore,
    fetchClients,
    refreshClients,
    loadMoreClients,
    toggleClientStatus,
    createClient,
    updateClient,
  };
};

export default useClients;