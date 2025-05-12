// src/hooks/useCollecteurs.js
import { useState, useEffect, useCallback } from 'react';
import CollecteurService from '../api/collecteur';

export const useCollecteurs = () => {
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCollecteurs = useCallback(async (page = 0, search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // Dans une implémentation réelle, vous appelleriez le service API
      // const response = await CollecteurService.getAllCollecteurs(page, 10, search);
      
      // Pour la démo, on simule une réponse avec un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler une réponse paginée
      const mockResponse = {
        content: [
          {
            id: 1,
            nom: 'Dupont',
            prenom: 'Jean',
            adresseMail: 'jean.dupont@example.com',
            telephone: '+237 655 123 456',
            agence: {
              id: 1,
              nomAgence: 'Agence Centrale'
            },
            montantMaxRetrait: 150000,
            status: 'active',
            totalClients: 45,
          },
          {
            id: 2,
            nom: 'Martin',
            prenom: 'Sophie',
            adresseMail: 'sophie.martin@example.com',
            telephone: '+237 677 234 567',
            agence: {
              id: 1,
              nomAgence: 'Agence Centrale'
            },
            montantMaxRetrait: 150000,
            status: 'active',
            totalClients: 32,
          },
          {
            id: 3,
            nom: 'Dubois',
            prenom: 'Pierre',
            adresseMail: 'pierre.dubois@example.com',
            telephone: '+237 698 345 678',
            agence: {
              id: 2,
              nomAgence: 'Agence Nord'
            },
            montantMaxRetrait: 100000,
            status: 'inactive',
            totalClients: 0,
          },
        ],
        totalPages: 1,
        totalElements: 3,
        size: 10,
        number: page,
        last: page >= 0, // Pour la démo, nous n'avons qu'une seule page
      };
      
      if (page === 0) {
        setCollecteurs(mockResponse.content);
      } else {
        setCollecteurs(prevCollecteurs => [...prevCollecteurs, ...mockResponse.content]);
      }
      
      setCurrentPage(page);
      setHasMore(page < mockResponse.totalPages - 1);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du chargement des collecteurs');
    } finally {
      setLoading(false);
    }
  }, []);

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
      
      // Dans une implémentation réelle, vous appelleriez le service API
      // await CollecteurService.updateStatus(collecteurId, newStatus);
      
      // Pour la démo, on simule un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour l'état localement
      setCollecteurs(prevCollecteurs => 
        prevCollecteurs.map(c => 
          c.id === collecteurId ? { ...c, status: newStatus } : c
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

  const createCollecteur = useCallback(async (collecteurData) => {
    try {
      setLoading(true);
      
      // Dans une implémentation réelle, vous appelleriez le service API
      // const response = await CollecteurService.createCollecteur(collecteurData);
      
      // Pour la démo, on simule un délai
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simuler une réponse
      const mockResponse = {
        ...collecteurData,
        id: Math.floor(Math.random() * 1000) + 4, // Générer un ID aléatoire
        status: 'active',
        totalClients: 0,
      };
      
      // Ajouter le nouveau collecteur à l'état
      setCollecteurs(prevCollecteurs => [mockResponse, ...prevCollecteurs]);
      
      return { success: true, collecteur: mockResponse };
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la création du collecteur');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCollecteur = useCallback(async (collecteurId, collecteurData) => {
    try {
      setLoading(true);
      
      // Dans une implémentation réelle, vous appelleriez le service API
      // const response = await CollecteurService.updateCollecteur(collecteurId, collecteurData);
      
      // Pour la démo, on simule un délai
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'état localement
      setCollecteurs(prevCollecteurs => 
        prevCollecteurs.map(c => 
          c.id === collecteurId ? { ...c, ...collecteurData } : c
        )
      );
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du collecteur');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

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