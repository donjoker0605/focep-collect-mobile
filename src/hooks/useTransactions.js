// src/hooks/useTransactions.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { transactionService } from '../../services';
import { useErrorHandler } from './useErrorHandler';
import { useNetInfo } from '@react-native-community/netinfo';

export const useTransactions = (clientId = null, collecteurId = null, journalId = null) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const { handleError } = useErrorHandler();
  const netInfo = useNetInfo();

  // Paramètres mémorisés pour éviter les recalculs inutiles
  const params = useMemo(() => ({
    clientId,
    collecteurId,
    journalId,
  }), [clientId, collecteurId, journalId]);

  const fetchTransactions = useCallback(async (page = 0, size = pageSize) => {
    // Éviter les requêtes si déjà en cours de chargement ou hors ligne
    if (loading || !netInfo.isConnected) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Appel API avec les paramètres appropriés
      let response;
      
      if (clientId) {
        response = await TransactionService.getTransactionsByClient(clientId, page, size);
      } else if (journalId) {
        response = await TransactionService.getTransactionsByJournal(journalId, page, size);
      } else if (collecteurId) {
        response = await TransactionService.getTransactionsByCollecteur(collecteurId, page, size);
      } else {
        // Si aucun paramètre, charger toutes les transactions (admin)
        response = await TransactionService.getAllTransactions(page, size);
      }
      
      // Mise à jour de l'état en fonction de la page
      if (page === 0) {
        setTransactions(response.content);
      } else {
        setTransactions(prevTransactions => [...prevTransactions, ...response.content]);
      }
      
      // Mettre à jour les informations de pagination
      setCurrentPage(page);
      setHasMore(page < response.totalPages - 1);
      setTotalItems(response.totalElements);
      setPageSize(response.size);
    } catch (err) {
      handleError(err, {
        context: {
          componentInfo: 'useTransactions',
          action: 'fetchTransactions',
          params,
        }
      });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [clientId, collecteurId, journalId, loading, netInfo.isConnected, pageSize, handleError, params]);

  const refreshTransactions = useCallback(async () => {
    if (!netInfo.isConnected) {
      return;
    }
    
    setRefreshing(true);
    await fetchTransactions(0);
    setRefreshing(false);
  }, [fetchTransactions, netInfo.isConnected]);

  const loadMoreTransactions = useCallback(async () => {
    if (!loading && hasMore && netInfo.isConnected) {
      await fetchTransactions(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchTransactions, netInfo.isConnected]);

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
    return transactions.reduce((acc, transaction) => {
      if (transaction.type === 'DEPOT' || transaction.sens === 'CREDIT') {
        acc.totalDeposits += transaction.montant;
      } else if (transaction.type === 'RETRAIT' || transaction.sens === 'DEBIT') {
        acc.totalWithdrawals += transaction.montant;
      }
      
      acc.transactionCount++;
      return acc;
    }, {
      totalDeposits: 0,
      totalWithdrawals: 0,
      netAmount: 0,
      transactionCount: 0,
    });
  }, [transactions]);

  // Mettre à jour le montant net calculé
  useEffect(() => {
    stats.netAmount = stats.totalDeposits - stats.totalWithdrawals;
  }, [stats]);

  // Charger les transactions au montage ou lorsque les paramètres changent
  useEffect(() => {
    fetchTransactions(0);
  }, [params, fetchTransactions]);

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