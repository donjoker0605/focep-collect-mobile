// src/hooks/useTransactions.js - VERSION CORRIGÉE
import { useState, useEffect, useCallback, useMemo } from 'react';
import transactionService from '../services/transactionService'; // ✅ CORRIGÉ : Import direct

export const useTransactions = (clientId = null, collecteurId = null, journalId = null) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(20);
  
  const handleError = useCallback((err) => {
    console.error('Error in useTransactions:', err);
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

  // Paramètres mémorisés pour éviter les recalculs inutiles
  const params = useMemo(() => ({
    clientId,
    collecteurId,
    journalId,
  }), [clientId, collecteurId, journalId]);

  const fetchTransactions = useCallback(async (page = 0, size = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ CORRIGÉ : Utiliser les bonnes méthodes selon les cas
      let response;
      
      if (clientId) {
        // Récupérer les transactions d'un client
        response = await transactionService.getTransactionsByClient(clientId, { 
          page, 
          size 
        });
      } else if (collecteurId) {
        // Récupérer les transactions d'un collecteur
        response = await transactionService.getTransactionsByCollecteur(collecteurId, { 
          page, 
          size 
        });
      } else if (journalId) {
        // Récupérer les transactions d'un journal
        response = await transactionService.getTransactionsByJournal(journalId, { 
          page, 
          size 
        });
      } else {
        // Récupérer toutes les transactions (pour admin)
        response = await transactionService.getAllTransactions({ 
          page, 
          size 
        });
      }
      
      if (response && response.success) {
        const transactionsData = response.data || [];
        const transactionsArray = Array.isArray(transactionsData) ? transactionsData : [];
        
        // Mise à jour de l'état en fonction de la page
        if (page === 0) {
          setTransactions(transactionsArray);
        } else {
          setTransactions(prevTransactions => [...prevTransactions, ...transactionsArray]);
        }
        
        setCurrentPage(page);
        setHasMore(transactionsArray.length === size);
        setTotalItems(response.total || transactionsArray.length);
      } else {
        throw new Error(response?.error || 'Erreur lors de la récupération des transactions');
      }
      
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId, collecteurId, journalId, pageSize, handleError]);

  const refreshTransactions = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions(0);
    setRefreshing(false);
  }, [fetchTransactions]);

  const loadMoreTransactions = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchTransactions(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchTransactions]);

  // Données statistiques mémorisées
  const stats = useMemo(() => {
    if (transactions.length === 0) {
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        netAmount: 0,
        transactionCount: 0,
      };
    }
    
    // Calculer les statistiques en un seul passage
    const calculated = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'DEPOT' || transaction.sens === 'CREDIT') {
        acc.totalDeposits += transaction.montant || 0;
      } else if (transaction.type === 'RETRAIT' || transaction.sens === 'DEBIT') {
        acc.totalWithdrawals += transaction.montant || 0;
      }
      
      acc.transactionCount++;
      return acc;
    }, {
      totalDeposits: 0,
      totalWithdrawals: 0,
      transactionCount: 0,
    });
    
    calculated.netAmount = calculated.totalDeposits - calculated.totalWithdrawals;
    
    return calculated;
  }, [transactions]);

  // Charger les transactions au montage ou lorsque les paramètres changent
  useEffect(() => {
    fetchTransactions();
  }, [clientId, collecteurId, journalId]);

  return {
    transactions,
    loading,
    error,
    refreshing,
    hasMore,
    totalItems,
    stats,
    fetchTransactions,
    refreshTransactions,
    loadMoreTransactions,
  };
};

export default useTransactions;