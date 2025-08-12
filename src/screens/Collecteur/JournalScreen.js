import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// IMPORTS CORRECTS
import MouvementService from '../../services/mouvementService'; // ← AJOUTER CETTE LIGNE
import { useAuth } from '../../hooks/useAuth';
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';

const JournalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isFocused = useIsFocused();

  // États
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summary, setSummary] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    balance: 0,
    transactionCount: 0
  });

  // ✅ FONCTION CORRIGÉE
  const loadTransactions = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // ✅ UTILISATION CORRECTE DU SERVICE
      const response = await MouvementService.getOperationsDuJour(user.id, formattedDate);
	  
	  console.log('📋 RÉPONSE COMPLÈTE:', response);
console.log('📋 RESPONSE.DATA:', response.data);
console.log('📋 TYPE DE DATA:', typeof response.data);
console.log('📋 EST-CE UN ARRAY?:', Array.isArray(response.data));

		if (response.success && response.data) {
		  
		  let operations;
		  
		  if (Array.isArray(response.data)) {
			// Cas 1: response.data est directement un array
			operations = response.data;
		  } else if (response.data.operations) {
			// Cas 2: response.data est un JournalDuJourDTO avec .operations
			operations = response.data.operations;
		  } else {
			// Cas 3: structure inattendue
			console.error('❌ Structure de données inattendue:', response.data);
			operations = [];
		 }
		  
		  setTransactions(operations);
		  calculateSummary(operations);
		}
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err.message || 'Erreur lors du chargement des transactions');
      setTransactions([]);
      setSummary({ totalDeposits: 0, totalWithdrawals: 0, balance: 0, transactionCount: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, selectedDate]);

  const calculateSummary = (transactionList) => {
    const summary = transactionList.reduce((acc, transaction) => {
      if (transaction.sens === 'epargne' || transaction.type === 'EPARGNE') {
        acc.totalDeposits += transaction.montant;
      } else if (transaction.sens === 'retrait' || transaction.type === 'RETRAIT') {
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
      loadTransactions();
    }
  }, [isFocused, loadTransactions]);

  const handleRefresh = () => {
    loadTransactions(true);
  };

  // ✅ HEADER SIMPLE SANS COMPOSANT EXTERNE
  const renderHeader = () => (
    <SafeAreaView style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Journal des opérations</Text>
        
        <TouchableOpacity style={styles.calendarButton}>
          <Ionicons name="calendar" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={[styles.card, styles.summaryCard]}>
        <Text style={styles.summaryLabel}>Entrées</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(summary.totalDeposits)} FCFA
        </Text>
      </View>
      
      <View style={[styles.card, styles.summaryCard]}>
        <Text style={styles.summaryLabel}>Sorties</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(summary.totalWithdrawals)} FCFA
        </Text>
      </View>
      
      <View style={[styles.card, styles.summaryCard, styles.balanceCard]}>
        <Text style={styles.summaryLabel}>Solde</Text>
        <Text style={styles.balanceValue}>
          {formatCurrency(summary.balance)} FCFA
        </Text>
        <Text style={styles.transactionCount}>
          {summary.transactionCount} opération{summary.transactionCount > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
    >
      <View style={styles.transactionLeft}>
        <Ionicons 
          name={item.sens === 'epargne' ? 'arrow-down-circle' : 'arrow-up-circle'} 
          size={24} 
          color={item.sens === 'epargne' ? theme.colors.success : theme.colors.error} 
        />
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {item.sens === 'epargne' ? 'Épargne' : 'Retrait'}
          </Text>
          <Text style={styles.transactionClient}>
            {item.libelle || 'Transaction'}
          </Text>
          <Text style={styles.transactionDate}>
            {format(new Date(item.dateOperation), 'dd/MM/yyyy à HH:mm')}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.sens === 'epargne' ? theme.colors.success : theme.colors.error }
      ]}>
        {item.sens === 'epargne' ? '+' : '-'}{formatCurrency(item.montant)} FCFA
      </Text>
    </TouchableOpacity>
  );

  const EmptyState = ({ title, message, onRetry }) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={theme.colors.gray} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <View style={styles.content}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Journal du :</Text>
          <Text style={styles.dateValue}>
            {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
          </Text>
        </View>
        
        {renderSummaryCards()}
        
        <Text style={styles.transactionsTitle}>Transactions du jour</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des transactions...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Erreur de chargement"
            message={error}
            onRetry={handleRefresh}
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
  // ✅ STYLES POUR LE HEADER CORRIGÉ
  headerContainer: {
    backgroundColor: theme.colors.primary,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  calendarButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 20,
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
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
});

export default JournalScreen;