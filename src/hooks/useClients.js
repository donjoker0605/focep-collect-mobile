// src/hooks/useClients.js - VERSION AMÉLIORÉE AVEC GESTION AUTOMATIQUE DES RÔLES
import { useState, useEffect, useCallback } from 'react';
import clientService from '../services/clientService';
import authService from '../services/authService';

export const useClients = (overrideCollecteurId = null) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [canAccess, setCanAccess] = useState(false);

  // 🔥 DÉTECTION AUTOMATIQUE DU RÔLE UTILISATEUR
  const initializeUserInfo = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserRole(user.role);
        const access = await clientService.canAccessClients();
        setCanAccess(access);
        
        console.log('👤 useClients - Utilisateur initialisé:', {
          role: user.role,
          canAccess: access,
          overrideCollecteurId
        });
      }
    } catch (err) {
      console.error('❌ Erreur initialisation utilisateur:', err);
      setError('Erreur d\'authentification');
    }
  }, [overrideCollecteurId]);

  // Fonction utilitaire pour gérer les erreurs
  const handleError = useCallback((err) => {
    console.error('❌ Erreur useClients:', err);
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

  /**
   * 🔥 MÉTHODE PRINCIPALE - Récupération intelligente des clients
   * Utilise automatiquement le bon endpoint selon le rôle
   */
  const fetchClients = useCallback(async (page = 0, size = 20, search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      if (!canAccess) {
        throw new Error('Accès non autorisé aux clients');
      }
      
      console.log('🔄 fetchClients - Paramètres:', {
        page, size, search, 
        userRole, 
        overrideCollecteurId
      });
      
      // 🔥 UTILISATION DU SERVICE AMÉLIORÉ
      let response;
      
      if (overrideCollecteurId) {
        // Cas spécial: Admin voulant voir les clients d'un collecteur spécifique
        response = await clientService.getAllClients({ 
          page, size, search, 
          collecteurId: overrideCollecteurId 
        });
      } else {
        // Cas normal: Détection automatique du rôle
        response = await clientService.getAllClients({ 
          page, size, search 
        });
      }
      
      if (response && response.success) {
        // 🔥 ADAPTATION STRUCTURE DE DONNÉES - CORRECTION CRITIQUE
        let clientsData = [];
        
        console.log('🔍 Structure response complète:', response);
        console.log('🔍 response.data:', response.data);
        
        // Gérer la structure de réponse du backend
        if (response.data) {
          // Cas 1: Structure paginée Spring Boot (admin/clients)
          if (response.data.content && Array.isArray(response.data.content)) {
            console.log('📄 Structure paginée détectée');
            clientsData = response.data.content;
            const totalElements = response.data.totalElements || 0;
            const currentSize = response.data.size || size;
            setHasMore(page * currentSize < totalElements);
            console.log('📊 Pagination:', { 
              clientsCount: clientsData.length, 
              totalElements, 
              hasMore: page * currentSize < totalElements 
            });
          }
          // Cas 2: Array direct (collecteur/clients)
          else if (Array.isArray(response.data)) {
            console.log('📋 Array direct détecté');
            clientsData = response.data;
            setHasMore(clientsData.length === size);
          }
          // Cas 3: Objet avec clients (fallback)
          else if (typeof response.data === 'object') {
            console.log('📦 Objet avec clients détecté');
            const values = Object.values(response.data);
            clientsData = values.filter(item => 
              item && typeof item === 'object' && item.id
            );
            setHasMore(clientsData.length === size);
          }
        }
        
        console.log('✅ Clients extraits:', {
          count: clientsData.length,
          clients: clientsData.map(c => ({ id: c.id, nom: c.nom, prenom: c.prenom }))
        });
        
        // Mise à jour de l'état en fonction de la page
        if (page === 0) {
          setClients(clientsData);
        } else {
          setClients(prevClients => [...prevClients, ...clientsData]);
        }
        
        setCurrentPage(page);
        
        console.log('✅ Clients chargés:', {
          count: clientsData.length,
          page,
          hasMore: hasMore,
          userRole
        });
        
      } else {
        throw new Error(response?.error || 'Erreur lors de la récupération des clients');
      }
      
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      
      // En cas d'erreur d'authentification, réinitialiser
      if (err.message?.includes('Session expirée') || err.message?.includes('non authentifié')) {
        setCanAccess(false);
        setUserRole(null);
      }
    } finally {
      setLoading(false);
    }
  }, [canAccess, userRole, overrideCollecteurId, handleError, hasMore]);

  /**
   * 🔄 RAFRAÎCHISSEMENT DES DONNÉES
   */
  const refreshClients = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(0);
    setHasMore(true);
    
    // Réinitialiser les infos utilisateur au refresh
    await initializeUserInfo();
    
    await fetchClients(0);
    setRefreshing(false);
  }, [fetchClients, initializeUserInfo]);

  /**
   * 📄 CHARGEMENT DE PAGES ADDITIONNELLES
   */
  const loadMoreClients = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchClients(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchClients]);

  /**
   * 🔄 CHANGEMENT DE STATUT CLIENT
   */
  const toggleClientStatus = useCallback(async (clientId, newStatus) => {
    try {
      setLoading(true);
      
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

  /**
   * ➕ CRÉATION D'UN NOUVEAU CLIENT
   */
  const createClient = useCallback(async (clientData) => {
    try {
      setLoading(true);
      
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

  /**
   * ✏️ MISE À JOUR D'UN CLIENT
   */
  const updateClient = useCallback(async (clientId, clientData) => {
    try {
      setLoading(true);
      
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

  /**
   * 🔍 RECHERCHE DE CLIENTS
   */
  const searchClients = useCallback(async (searchQuery) => {
    setCurrentPage(0);
    setHasMore(true);
    await fetchClients(0, 20, searchQuery);
  }, [fetchClients]);

  /**
   * 🧪 MÉTHODE DE DEBUG - Test d'accès
   */
  const debugAccess = useCallback(async () => {
    try {
      const result = await clientService.debugUserAccess();
      console.log('🔍 Debug accès useClients:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur debug accès:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * 🧪 MÉTHODE DE TEST - Validation complète
   */
  const testAccess = useCallback(async () => {
    try {
      const result = await clientService.testRoleBasedAccess();
      console.log('🧪 Test accès useClients:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur test accès:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Initialiser les informations utilisateur au montage
  useEffect(() => {
    initializeUserInfo();
  }, [initializeUserInfo]);

  // Charger les clients automatiquement si l'accès est autorisé
  useEffect(() => {
    if (canAccess && userRole) {
      fetchClients();
    }
  }, [canAccess, userRole, overrideCollecteurId]); // Note: fetchClients n'est pas dans les deps pour éviter les boucles

  // 🔧 MÉTHODES UTILITAIRES
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setClients([]);
    setCurrentPage(0);
    setHasMore(true);
    setError(null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  return {
    // États principaux
    clients,
    loading,
    error,
    refreshing,
    hasMore,
    
    // États utilisateur
    userRole,
    canAccess,
    
    // Actions de base
    fetchClients,
    refreshClients,
    loadMoreClients,
    searchClients,
    
    // Actions CRUD
    toggleClientStatus,
    createClient,
    updateClient,
    
    // Utilitaires
    clearError,
    reset,
    
    // Debug et tests
    debugAccess,
    testAccess,
    
    // Métadonnées
    currentPage,
    totalClients: clients.length
  };
};

export default useClients;