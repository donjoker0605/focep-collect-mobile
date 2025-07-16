// hooks/useClientSearch.js - VERSION AMÉLIORÉE LIAISON BIDIRECTIONNELLE

import { useState, useEffect, useCallback, useRef } from 'react';
import clientService from '../services/clientService';

/**
 * Hook avancé pour recherche client avec liaison bidirectionnelle parfaite
 * Gère automatiquement la synchronisation nom ↔ numéro de compte
 */
export const useClientSearch = (collecteurId) => {
  // ========================================
  // 🔄 ÉTATS DE RECHERCHE
  // ========================================
  
  const [clientName, setClientName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Suggestions séparées pour optimiser l'UX
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [accountSuggestions, setAccountSuggestions] = useState([]);
  
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // État pour éviter les boucles lors de la synchronisation
  const [lastUpdateSource, setLastUpdateSource] = useState(null);
  
  // Refs pour gérer les timeouts et requêtes
  const nameDebounceRef = useRef(null);
  const accountDebounceRef = useRef(null);
  const nameRequestRef = useRef(null);
  const accountRequestRef = useRef(null);

  // ========================================
  // 🔍 RECHERCHE PAR NOM AVEC DEBOUNCE
  // ========================================

  const searchByName = useCallback(async (query, isManualTrigger = false) => {
    if (!query || query.trim().length < 2) {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      return;
    }

    // Éviter recherche si on vient de mettre à jour depuis account
    if (lastUpdateSource === 'account' && !isManualTrigger) {
      setLastUpdateSource(null);
      return;
    }

    // Annuler requête précédente
    if (nameRequestRef.current) {
      nameRequestRef.current.abort();
    }

    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      nameRequestRef.current = controller;

      // Utiliser la recherche intelligente
      const response = await clientService.smartSearch(
        collecteurId, 
        query.trim(), 
        10
      );

      if (!controller.signal.aborted && response.success) {
        const suggestions = response.data || [];
        setNameSuggestions(suggestions);
        setShowNameSuggestions(true);

        // Vérification correspondance exacte
        const exactMatch = suggestions.find(client => 
          client.displayName.toLowerCase() === query.toLowerCase()
        );

        if (exactMatch && lastUpdateSource !== 'account') {
          // Correspondance exacte trouvée, synchroniser automatiquement
          setSelectedClient(exactMatch);
          setLastUpdateSource('name');
          setAccountNumber(exactMatch.numeroCompte || '');
          setShowNameSuggestions(false);
        }
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur recherche par nom:', err);
        setError('Erreur lors de la recherche');
      }
    } finally {
      setLoading(false);
      nameRequestRef.current = null;
    }
  }, [collecteurId, lastUpdateSource]);

  // ========================================
  // 🔍 RECHERCHE PAR NUMÉRO DE COMPTE
  // ========================================

  const searchByAccount = useCallback(async (account, isManualTrigger = false) => {
    if (!account || account.trim().length < 3) {
      setAccountSuggestions([]);
      setShowAccountSuggestions(false);
      return;
    }

    // Éviter recherche si on vient de mettre à jour depuis name
    if (lastUpdateSource === 'name' && !isManualTrigger) {
      setLastUpdateSource(null);
      return;
    }

    // Annuler requête précédente
    if (accountRequestRef.current) {
      accountRequestRef.current.abort();
    }

    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      accountRequestRef.current = controller;

      // 1. D'abord chercher correspondance exacte
      const exactResponse = await clientService.findByAccountNumber(
        collecteurId, 
        account.trim()
      );

      if (!controller.signal.aborted) {
        if (exactResponse.data) {
          // Correspondance exacte trouvée
          const client = exactResponse.data;
          setSelectedClient(client);
          setLastUpdateSource('account');
          setClientName(client.displayName);
          setShowAccountSuggestions(false);
          return;
        }

        // 2. Pas de correspondance exacte, chercher suggestions
        const suggestResponse = await clientService.suggestAccountNumbers(
          collecteurId,
          account.trim(),
          5
        );

        if (suggestResponse.success && suggestResponse.data?.length > 0) {
          // Convertir les suggestions en format uniforme
          const suggestions = suggestResponse.data.map(accountNum => ({
            numeroCompte: accountNum,
            displayName: `Compte ${accountNum}`,
            type: 'account'
          }));
          
          setAccountSuggestions(suggestions);
          setShowAccountSuggestions(true);
        }
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur recherche par compte:', err);
        setError('Erreur lors de la recherche par compte');
      }
    } finally {
      setLoading(false);
      accountRequestRef.current = null;
    }
  }, [collecteurId, lastUpdateSource]);

  // ========================================
  // 📝 GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleClientNameChange = useCallback((text) => {
    setClientName(text);
    setError(null);
    setLastUpdateSource(null); // Reset pour permettre future synchronisation

    // Réinitialiser si vide
    if (!text.trim()) {
      setSelectedClient(null);
      setAccountNumber('');
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      return;
    }

    // Debounce pour la recherche
    if (nameDebounceRef.current) {
      clearTimeout(nameDebounceRef.current);
    }

    nameDebounceRef.current = setTimeout(() => {
      searchByName(text);
    }, 300);

  }, [searchByName]);

  const handleAccountNumberChange = useCallback((text) => {
    setAccountNumber(text);
    setError(null);
    setLastUpdateSource(null); // Reset pour permettre future synchronisation

    // Réinitialiser si vide
    if (!text.trim()) {
      if (!clientName) { // Ne réinitialiser que si nom vide aussi
        setSelectedClient(null);
        setClientName('');
      }
      setAccountSuggestions([]);
      setShowAccountSuggestions(false);
      return;
    }

    // Debounce pour la recherche
    if (accountDebounceRef.current) {
      clearTimeout(accountDebounceRef.current);
    }

    accountDebounceRef.current = setTimeout(() => {
      searchByAccount(text);
    }, 500); // Plus long pour les comptes car moins fréquent

  }, [searchByAccount, clientName]);

  // ========================================
  // 🎯 SÉLECTION DEPUIS SUGGESTIONS
  // ========================================

  const handleNameSuggestionSelect = useCallback((client) => {
    setSelectedClient(client);
    setClientName(client.displayName);
    setAccountNumber(client.numeroCompte || '');
    setLastUpdateSource('name');
    setShowNameSuggestions(false);
    setNameSuggestions([]);
    setError(null);
  }, []);

  const handleAccountSuggestionSelect = useCallback((suggestion) => {
    if (suggestion.type === 'account') {
      // Suggestion de numéro de compte, rechercher le client correspondant
      setAccountNumber(suggestion.numeroCompte);
      searchByAccount(suggestion.numeroCompte, true); // Force la recherche
    } else {
      // Suggestion de client complet
      setSelectedClient(suggestion);
      setClientName(suggestion.displayName);
      setAccountNumber(suggestion.numeroCompte || '');
      setLastUpdateSource('account');
    }
    setShowAccountSuggestions(false);
    setAccountSuggestions([]);
    setError(null);
  }, [searchByAccount]);

  // ========================================
  // 🔄 ACTIONS UTILITAIRES
  // ========================================

  const resetSearch = useCallback(() => {
    setClientName('');
    setAccountNumber('');
    setSelectedClient(null);
    setNameSuggestions([]);
    setAccountSuggestions([]);
    setShowNameSuggestions(false);
    setShowAccountSuggestions(false);
    setLoading(false);
    setError(null);
    setLastUpdateSource(null);

    // Nettoyer timeouts
    if (nameDebounceRef.current) {
      clearTimeout(nameDebounceRef.current);
    }
    if (accountDebounceRef.current) {
      clearTimeout(accountDebounceRef.current);
    }
    
    // Annuler requêtes en cours
    if (nameRequestRef.current) {
      nameRequestRef.current.abort();
    }
    if (accountRequestRef.current) {
      accountRequestRef.current.abort();
    }
  }, []);

  const forceSync = useCallback(async () => {
    if (clientName && !accountNumber) {
      await searchByName(clientName, true);
    } else if (accountNumber && !clientName) {
      await searchByAccount(accountNumber, true);
    }
  }, [clientName, accountNumber, searchByName, searchByAccount]);

  // ========================================
  // 🧹 NETTOYAGE
  // ========================================

  useEffect(() => {
    return () => {
      // Nettoyage lors du démontage
      if (nameDebounceRef.current) {
        clearTimeout(nameDebounceRef.current);
      }
      if (accountDebounceRef.current) {
        clearTimeout(accountDebounceRef.current);
      }
      if (nameRequestRef.current) {
        nameRequestRef.current.abort();
      }
      if (accountRequestRef.current) {
        accountRequestRef.current.abort();
      }
    };
  }, []);

  // ========================================
  // 📤 RETOUR DU HOOK
  // ========================================

  return {
    // États principaux
    clientName,
    accountNumber,
    selectedClient,
    
    // Suggestions séparées
    nameSuggestions,
    accountSuggestions,
    showNameSuggestions,
    showAccountSuggestions,
    
    // États système
    loading,
    error,
    
    // Actions principales
    handleClientNameChange,
    handleAccountNumberChange,
    handleNameSuggestionSelect,
    handleAccountSuggestionSelect,
    resetSearch,
    forceSync,
    
    // Contrôles UI
    setShowNameSuggestions,
    setShowAccountSuggestions,
    
    // Informations utiles
    hasSelectedClient: !!selectedClient,
    isSearching: loading,
    canProceed: !!selectedClient && !!clientName && !!accountNumber,
    isSynced: !!selectedClient && selectedClient.displayName === clientName && 
              selectedClient.numeroCompte === accountNumber,
    
    // Debug info
    lastUpdateSource,
    searchType: clientService.detectSearchType(clientName || accountNumber)
  };
};