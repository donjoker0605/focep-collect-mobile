// src/screens/Collecteur/JournalScreen.js - VERSION SANS MOCKS
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Services
import { transactionService } from '../../services';

// Hooks
import { useAuth } from '../../hooks/useAuth';

import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';

const JournalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // États
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summary, setSummary] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    balance: 0,
    transactionCount: 0
  });

  // ✅ CORRECTION: Vraie fonction API (plus de mock)
  const loadTransactions = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 0) {
        setLoading(true);
      }

      setError(null);

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // ✅ APPEL API RÉEL
      const response = await transactionService.fetchJournalTransactions({
        collecteurId: user.id,
        date: formattedDate,
        page: pageNum,
        size: 20,
        sort: 'dateHeure,desc'
      });

      if (response.success && response.data) {
        const { content, totalElements, totalPages, number, last } = response.data;
        
        if (pageNum === 0 || refresh) {
          setTransactions(content || []);
        } else {
          setTransactions(prev => [...prev, ...(content || [])]);
        }
        
        setHasMore(!last);
        setPage(number || 0);
        
        // ✅ CALCUL RÉEL DES STATISTIQUES (plus de données fictives)
        calculateSummary(content || []);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err.message || 'Erreur lors du chargement des transactions');
      
      // ✅ En cas d'erreur, vider les données (plus de fallback fictif)
      setTransactions([]);
      setSummary({ totalDeposits: 0, totalWithdrawals: 0, balance: 0, transactionCount: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, selectedDate]);

  // ✅ CALCUL RÉEL DES STATISTIQUES
  const calculateSummary = (transactionList) => {
    const summary = transactionList.reduce((acc, transaction) => {
      if (transaction.type === 'EPARGNE') {
        acc.totalDeposits += transaction.montant;
      } else if (transaction.type === 'RETRAIT') {
        acc.totalWithdrawals += transaction.montant;
      }
      acc.transactionCount++;
      return acc;
    }, { totalDeposits: 0, totalWithdrawals: 0, transactionCount: 0 });

    summary.balance = summary.totalDeposits - summary.totalWithdrawals;
    setSummary(summary);
  };

  useEffect(() => {
    if (isFocused && user?.id) {
      loadTransactions(0);
    }
  }, [isFocused, loadTransactions, selectedDate]);

  const handleRefresh = () => {
    loadTransactions(0, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      loadTransactions(page + 1);
    }
  };

  // ✅ COMPOSANTS SIMPLICIFIÉS TEMPORAIRES
  const Header = ({ title, rightComponent }) => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      {rightComponent}
    </View>
  );

  const Card = ({ children, style }) => (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  const EmptyState = ({ title, message, onActionButtonPress }) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={theme.colors.gray} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {onActionButtonPress && (
        <TouchableOpacity style={styles.retryButton} onPress={onActionButtonPress}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Rendu des cartes de résumé avec données réelles
  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Entrées</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(summary.totalDeposits)} FCFA
        </Text>
      </Card>
      
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Sorties</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(summary.totalWithdrawals)} FCFA
        </Text>
      </Card>
      
      <Card style={[styles.summaryCard, styles.balanceCard]}>
        <Text style={styles.summaryLabel}>Solde</Text>
        <Text style={styles.balanceValue}>
          {formatCurrency(summary.balance)} FCFA
        </Text>
        <Text style={styles.transactionCount}>
          {summary.transactionCount} opération{summary.transactionCount > 1 ? 's' : ''}
        </Text>
      </Card>
    </View>
  );

  // ✅ RENDU D'ITEM SANS DONNÉES FICTIVES
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => navigation.navigate('CollecteDetail', { transaction: item })}
    >
      <View style={styles.transactionLeft}>
        <Ionicons 
          name={item.type === 'EPARGNE' ? 'arrow-down-circle' : 'arrow-up-circle'} 
          size={24} 
          color={item.type === 'EPARGNE' ? theme.colors.success : theme.colors.error} 
        />
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {item.type === 'EPARGNE' ? 'Épargne' : 'Retrait'}
          </Text>
          <Text style={styles.transactionClient}>
            {item.client?.prenom} {item.client?.nom}
          </Text>
          <Text style={styles.transactionDate}>
            {format(new Date(item.dateHeure || item.dateCreation), 'dd/MM/yyyy à HH:mm')}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'EPARGNE' ? theme.colors.success : theme.colors.error }
      ]}>
        {item.type === 'EPARGNE' ? '+' : '-'}{formatCurrency(item.montant)} FCFA
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore || !loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Journal des opérations"
        rightComponent={
          <TouchableOpacity style={styles.calendarButton}>
            <Ionicons name="calendar" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Journal du :</Text>
          <Text style={styles.dateValue}>
            {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
          </Text>
        </View>
        
        {renderSummaryCards()}
        
        <Text style={styles.transactionsTitle}>Transactions du jour</Text>
        
        {loading && page === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des transactions...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Erreur de chargement"
            message={error}
            onActionButtonPress={handleRefresh}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="Aucune transaction"
            message="Aucune transaction n'a été effectuée à cette date."
          />
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  calendarButton: {
    padding: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginRight: 8,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  transactionCount: {
    fontSize: 10,
    color: theme.colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  transactionClient: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default JournalScreen;