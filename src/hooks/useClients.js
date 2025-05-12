// src/hooks/useClients.js
import { useState, useEffect, useCallback } from 'react';
import ClientService from '../api/client';

export const useClients = (collecteurId = null) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClients = useCallback(async (page = 0, search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // Dans une implémentation réelle, vous appelleriez le service API
      // const response = collecteurId 
      //   ? await ClientService.getClientsByCollecteur(collecteurId, page, 10, search)
      //   : await ClientService.getAllClients(page, 10, search);
      
      // Pour la démo, on simule une réponse avec un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Données fictives pour la démo
      const mockClients = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Marie',
          numeroCni: 'CM12345678',
          numeroCompte: '37305D0100015254',
          telephone: '+237 655 123 456',
          ville: 'Douala',
          quartier: 'Akwa',
          solde: 124500.0,
          status: 'active',
          collecteurId: 1,
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Jean',
          numeroCni: 'CM23456789',
          numeroCompte: '37305D0100015255',
          telephone: '+237 677 234 567',
          ville: 'Douala',
          quartier: 'Bonanjo',
          solde: 56700.0,
          status: 'active',
          collecteurId: 1,
        },
        {
          id: 3,
          nom: 'Dubois',
          prenom: 'Sophie',
          numeroCni: 'CM34567890',
          numeroCompte: '37305D0100015256',
          telephone: '+237 698 345 678',
          ville: 'Yaoundé',
          quartier: 'Centre',
          solde: 83200.0,
          status: 'inactive',
          collecteurId: 2,
        },
      ];
      
      // Filtrer par collecteur si nécessaire
      const filteredClients = collecteurId
        ? mockClients.filter(client => client.collecteurId === collecteurId)
        : mockClients;
      
      // Filtrer par recherche si nécessaire
      const searchedClients = search
        ? filteredClients.filter(client => 
            client.nom.toLowerCase().includes(search.toLowerCase()) ||
            client.prenom.toLowerCase().includes(search.toLowerCase()) ||
            client.numeroCompte.includes(search) ||
            client.numeroCni.includes(search) ||
            client.telephone.includes(search)
          )
        : filteredClients;
      
      // Simuler une réponse paginée
      const mockResponse = {
        content: searchedClients,
        totalPages: 1,
        totalElements: searchedClients.length,
        size: 10,
        number: page,
        last: true, // Pour la démo, nous n'avons qu'une seule page
      };
      
      if (page === 0) {
        setClients(mockResponse.content);
      } else {
        setClients(prevClients => [...prevClients, ...mockResponse.content]);
      }
      
      setCurrentPage(page);
      setHasMore(page < mockResponse.totalPages - 1);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  }, [collecteurId]);

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
      
      // Dans une implémentation réelle, vous appelleriez le service API
      // await ClientService.toggleClientStatus(clientId, newStatus);
      
      // Pour la démo, on simule un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour l'état localement
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === clientId ? { ...c, status: newStatus } : c
        )
      );
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du statut');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (clientData) => {
    try {
      setLoading(true);
      
      // Dans une implémentation réelle, vous appelleriez le service API
      // const response = await ClientService.createClient(clientData);
      
      // Pour la démo, on simule un délai
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simuler une réponse
      const mockResponse = {
        ...clientData,
        id: Math.floor(Math.random() * 1000) + 4, // Générer un ID aléatoire
        status: 'active',
        solde: 0,
      };
      
      // Ajouter le nouveau client à l'état
      setClients(prevClients => [mockResponse, ...prevClients]);
      
      return { success: true, client: mockResponse };
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la création du client');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClient = useCallback(async (clientId, clientData) => {
    try {
      setLoading(true);
      
      // Dans une implémentation réelle, vous appelleriez le service API
      // const response = await ClientService.updateClient(clientId, clientData);
      
      // Pour la démo, on simule un délai
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'état localement
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === clientId ? { ...c, ...clientData } : c
        )
      );
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du client');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

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