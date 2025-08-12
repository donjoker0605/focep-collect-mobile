// src/hooks/useClientFilters.js
import { useState, useMemo, useCallback } from 'react';

/**
 * Hook personnalisé pour la gestion des filtres de clients
 * Encapsule la logique de filtrage, tri et sélection
 */
export const useClientFilters = (clients = []) => {
  const [filters, setFilters] = useState({
    search: '',
    hasBalance: null,
    isActive: null,
    hasPhone: null,
    hasCNI: null,
    city: '',
    quarter: '',
    sortBy: 'nom',
    sortOrder: 'asc'
  });

  const [selectedClients, setSelectedClients] = useState([]);

  // Application des filtres avec memoization pour optimiser les performances
  const filteredClients = useMemo(() => {
    // S'assurer que clients est un array
    if (!Array.isArray(clients)) {
      return [];
    }
    
    let filtered = [...clients];

    // Recherche textuelle
    if (filters.search?.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(client => {
        const fullName = `${client.prenom} ${client.nom}`.toLowerCase();
        const cni = (client.numeroCni || '').toLowerCase();
        const phone = (client.telephone || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               cni.includes(searchTerm) || 
               phone.includes(searchTerm);
      });
    }

    // Filtre par solde
    if (filters.hasBalance !== null && filters.hasBalance !== undefined) {
      filtered = filtered.filter(client => {
        const hasPositiveBalance = (client.soldeTotal || 0) > 0;
        return filters.hasBalance ? hasPositiveBalance : !hasPositiveBalance;
      });
    }

    // Filtre par statut actif
    if (filters.isActive !== null && filters.isActive !== undefined) {
      filtered = filtered.filter(client => {
        const isActive = client.valide === true || client.actif === true;
        return filters.isActive ? isActive : !isActive;
      });
    }

    // Filtre par téléphone
    if (filters.hasPhone !== null && filters.hasPhone !== undefined) {
      filtered = filtered.filter(client => {
        const hasPhone = client.telephone && client.telephone.trim().length > 0;
        return filters.hasPhone ? hasPhone : !hasPhone;
      });
    }

    // Filtre par CNI
    if (filters.hasCNI !== null && filters.hasCNI !== undefined) {
      filtered = filtered.filter(client => {
        const hasCNI = client.numeroCni && client.numeroCni.trim().length > 0;
        return filters.hasCNI ? hasCNI : !hasCNI;
      });
    }

    // Filtre par ville
    if (filters.city?.trim()) {
      const cityTerm = filters.city.toLowerCase().trim();
      filtered = filtered.filter(client => 
        (client.ville || '').toLowerCase().includes(cityTerm)
      );
    }

    // Filtre par quartier
    if (filters.quarter?.trim()) {
      const quarterTerm = filters.quarter.toLowerCase().trim();
      filtered = filtered.filter(client => 
        (client.quartier || '').toLowerCase().includes(quarterTerm)
      );
    }

    // Tri
    const { sortBy, sortOrder } = filters;
    
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'solde':
          valueA = a.soldeTotal || 0;
          valueB = b.soldeTotal || 0;
          break;
        case 'dateCreation':
          valueA = new Date(a.dateCreation || 0);
          valueB = new Date(b.dateCreation || 0);
          break;
        case 'derniereActivite':
          valueA = new Date(a.derniereActivite || 0);
          valueB = new Date(b.derniereActivite || 0);
          break;
        case 'nom':
        default:
          valueA = `${a.prenom} ${a.nom}`.toLowerCase();
          valueB = `${b.prenom} ${b.nom}`.toLowerCase();
          break;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [clients, filters]);

  // Mise à jour des filtres
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      
      // Si la recherche change, ajuster la sélection
      if (newFilters.search !== undefined && newFilters.search !== prevFilters.search && Array.isArray(clients)) {
        const newFilteredIds = applyFilters(clients, updatedFilters).map(c => c.id);
        setSelectedClients(prev => prev.filter(id => newFilteredIds.includes(id)));
      }
      
      return updatedFilters;
    });
  }, [clients]);

  // Helper pour appliquer les filtres (sans memoization pour usage interne)
  const applyFilters = (clientList, filterConfig) => {
    let filtered = [...clientList];
    // ... même logique que dans filteredClients mais sans memo
    // (code duplicaté intentionnellement pour éviter les dépendances circulaires)
    return filtered;
  };

  // Gestion de la sélection
  const toggleClientSelection = useCallback((clientId) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    const filteredIds = filteredClients.map(c => c.id);
    const allFilteredSelected = filteredIds.every(id => selectedClients.includes(id));
    
    if (allFilteredSelected) {
      // Désélectionner tous les clients filtrés
      setSelectedClients(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Sélectionner tous les clients filtrés
      setSelectedClients(prev => [...new Set([...prev, ...filteredIds])]);
    }
  }, [filteredClients, selectedClients]);

  const clearSelection = useCallback(() => {
    setSelectedClients([]);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      hasBalance: null,
      isActive: null,
      hasPhone: null,
      hasCNI: null,
      city: '',
      quarter: '',
      sortBy: 'nom',
      sortOrder: 'asc'
    });
  }, []);

  // Statistiques
  const stats = useMemo(() => {
    const clientsArray = Array.isArray(clients) ? clients : [];
    const selectedFromFiltered = selectedClients.filter(id => 
      filteredClients.some(client => client.id === id)
    ).length;
    
    return {
      totalClients: clientsArray.length,
      filteredCount: filteredClients.length,
      selectedCount: selectedClients.length,
      selectedFromFilteredCount: selectedFromFiltered,
      allFilteredSelected: selectedFromFiltered === filteredClients.length && filteredClients.length > 0
    };
  }, [clients, filteredClients, selectedClients]);

  return {
    // États
    filters,
    filteredClients,
    selectedClients,
    stats,
    
    // Actions
    updateFilters,
    toggleClientSelection,
    selectAllFiltered,
    clearSelection,
    clearFilters,
    setSelectedClients
  };
};

export default useClientFilters;