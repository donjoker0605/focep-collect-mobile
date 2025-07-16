// src/hooks/useClients.js - VERSION CORRIGÉE
import { useState, useEffect, useCallback } from 'react';
import clientService from '../services/clientService'; // ✅ CORRIGÉ : Import direct du service

export const useClients = (collecteurId = null) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction utilitaire pour gérer les erreurs
  const handleError = useCallback((err) => {
    console.error('Error in useClients:', err);
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

  const fetchClients = useCallback(async (page = 0, size = 20, search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ CORRIGÉ : Utiliser la bonne signature de méthode
      let response;
      
      if (collecteurId) {
        // Utiliser la méthode pour récupérer les clients d'un collecteur
        response = await clientService.getClientsByCollecteur(collecteurId, { 
          page, 
          size, 
          search 
        });
      } else {
        // Utiliser la méthode pour récupérer tous les clients
        response = await clientService.getAllClients({ 
          page, 
          size, 
          search 
        });
      }
      
      // ✅ CORRIGÉ : Adapter selon la structure de réponse
      if (response && response.success) {
        const clientsData = response.data || [];
        const clientsArray = Array.isArray(clientsData) ? clientsData : [];
        
        // Mise à jour de l'état en fonction de la page
        if (page === 0) {
          setClients(clientsArray);
        } else {
          setClients(prevClients => [...prevClients, ...clientsArray]);
        }
        
        setCurrentPage(page);
        // ✅ CORRIGÉ : Logique de pagination adaptée
        setHasMore(clientsArray.length === size);
      } else {
        throw new Error(response?.error || 'Erreur lors de la récupération des clients');
      }
      
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collecteurId, handleError]);

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
      
      // ✅ CORRIGÉ : Utiliser la bonne méthode
      const response = await clientService.toggleClientStatus(clientId, newStatus);
      
      if (response && response.success) {
        // Mise à jour locale après confirmation du serveur
        setClients(prevClients => 
          prevClients.map(c => 
            c.id === clientId ? { ...c, valide: newStatus } : c
          )
        );
        
        return { success: true, data: response.data };
      } else {
        throw new Error(response?.error || 'Erreur lors du changement de statut');
      }
      
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createClient = useCallback(async (clientData) => {
    try {
      setLoading(true);
      
      // ✅ CORRIGÉ : Utiliser la bonne méthode
      const response = await clientService.createClient(clientData);
      
      if (response && response.success) {
        // Ajouter le nouveau client à l'état
        setClients(prevClients => [response.data, ...prevClients]);
        
        return { success: true, client: response.data };
      } else {
        throw new Error(response?.error || 'Erreur lors de la création du client');
      }
      
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateClient = useCallback(async (clientId, clientData) => {
    try {
      setLoading(true);
      
      // ✅ CORRIGÉ : Utiliser la bonne méthode
      const response = await clientService.updateClient(clientId, clientData);
      
      if (response && response.success) {
        // Mettre à jour l'état localement
        setClients(prevClients => 
          prevClients.map(c => 
            c.id === clientId ? response.data : c
          )
        );
        
        return { success: true, data: response.data };
      } else {
        throw new Error(response?.error || 'Erreur lors de la mise à jour du client');
      }
      
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Charger les clients au montage du composant ou lorsque le collecteurId change
  useEffect(() => {
    if (collecteurId) {
      fetchClients();
    }
  }, [collecteurId, fetchClients]);

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