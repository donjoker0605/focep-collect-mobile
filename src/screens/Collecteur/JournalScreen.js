// src/screens/Collecteur/JournalScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Components
import { 
  Header, 
  Card,
  EmptyState, 
  EnhancedTransactionItem,
  Button,
  SelectInput 
} from '../../components';

// Services
import { journalService } from '../../services';

// Hooks
import { useAuth } from '../../hooks/useAuth';

// Styles and utils
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
    lastOperation: null,
    journalStatus: 'OPEN' // OPEN, CLOSED, PENDING_APPROVAL
  });
  const [closingJournal, setClosingJournal] = useState(false);

  // Charger les transactions
  const loadTransactions = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 0) {
        setLoading(true);
      }

      setError(null);

      // Format the date to YYYY-MM-DD
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Fetch transactions from API
      const response = await fetchJournalTransactions({
        collecteurId: user.id,
        date: formattedDate,
        page: pageNum,
        size: 20,
        sort: 'dateHeure,desc'
      });

      // Update state with received data
      if (response && response.content) {
        if (pageNum === 0 || refresh) {
          setTransactions(response.content);
        } else {
          setTransactions(prev => [...prev, ...response.content]);
        }
        
        setHasMore(!response.last);
        setPage(response.number);
        
        // Update summary
        if (response.summary) {
          setSummary({
            totalDeposits: response.summary.totalDeposits || 0,
            totalWithdrawals: response.summary.totalWithdrawals || 0,
            balance: response.summary.balance || 0,
            lastOperation: response.summary.lastOperation,
            journalStatus: response.summary.journalStatus || 'OPEN'
          });
        }
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err.message || 'Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, selectedDate]);

  // Charge les transactions initiales et à chaque changement de date
  useEffect(() => {
    if (isFocused) {
      loadTransactions(0);
    }
  }, [isFocused, loadTransactions, selectedDate]);

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    loadTransactions(0, true);
  };

  // Fonction pour charger plus de transactions
  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      loadTransactions(page + 1);
    }
  };

  // Fonction pour changer de date
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Fonction pour fermer le journal
  const handleCloseJournal = async () => {
    try {
      setClosingJournal(true);
      
      // Format the date to YYYY-MM-DD
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Call API to close journal
      await closeJournal({
        collecteurId: user.id,
        date: formattedDate
      });
      
      // Refresh data
      loadTransactions(0, true);
    } catch (err) {
      console.error('Error closing journal:', err);
      setError(err.message || 'Erreur lors de la fermeture du journal');
    } finally {
      setClosingJournal(false);
    }
  };

  // Rendu des cartes de résumé
  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Entrées</Text>
        <Text style={styles.summaryValue}>{formatCurrency(summary.totalDeposits)} FCFA</Text>
      </Card>
      
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Sorties</Text>
        <Text style={styles.summaryValue}>{formatCurrency(summary.totalWithdrawals)} FCFA</Text>
      </Card>
      
      <Card style={[styles.summaryCard, styles.balanceCard]}>
        <Text style={styles.summaryLabel}>Solde</Text>
        <Text style={styles.balanceValue}>{formatCurrency(summary.balance)} FCFA</Text>
      </Card>
    </View>
  );

  // Rendu d'un élément de la liste
  const renderItem = ({ item }) => (
    <EnhancedTransactionItem
      type={item.type}
      date={format(new Date(item.dateHeure), 'dd MMM yyyy à HH:mm', { locale: fr })}
      amount={item.montant}
      isIncome={item.type === 'Épargne'}
      status={item.status}
      clientInfo={item.client}
      description={item.description}
      reference={item.reference}
      showClient={true}
      onPress={() => navigation.navigate('CollecteDetail', { transaction: item })}
    />
  );

  // Rendu du footer de la liste (indicateur de chargement)
  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>
    );
  };

  // Rendu principal
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Journal des opérations"
        showBackButton={false}
        rightComponent={
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => {
              // Ouvrir un sélecteur de date ici
              // Pour l'instant, on change simplement à une date fixe pour test
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              handleDateChange(yesterday);
            }}
          >
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
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: summary.journalStatus === 'OPEN' 
                ? theme.colors.success 
                : summary.journalStatus === 'PENDING_APPROVAL' 
                  ? theme.colors.warning 
                  : theme.colors.gray
              }
            ]} />
            <Text style={styles.statusText}>
              {summary.journalStatus === 'OPEN' 
                ? 'Ouvert' 
                : summary.journalStatus === 'PENDING_APPROVAL' 
                  ? 'En attente' 
                  : 'Fermé'
              }
            </Text>
          </View>
        </View>
        
        {renderSummaryCards()}
        
        <View style={styles.transactionsHeaderContainer}>
          <Text style={styles.transactionsTitle}>Transactions du jour</Text>
          
          {summary.journalStatus === 'OPEN' && (
            <Button
              title="Clôturer le journal"
              variant="outlined"
              size="small"
              loading={closingJournal}
              onPress={handleCloseJournal}
              style={styles.closeJournalButton}
            />
          )}
        </View>
        
        {loading && page === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des transactions...</Text>
          </View>
        ) : error ? (
          <EmptyState
            type="error"
            title="Erreur de chargement"
            message={error}
            actionButton
            actionButtonTitle="Réessayer"
            onActionButtonPress={handleRefresh}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            type="empty"
            title="Aucune transaction"
            message="Aucune transaction n'a été effectuée à cette date."
            icon="document-text-outline"
          />
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
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
  calendarButton: {
    padding: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
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
    marginRight: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
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
  transactionsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeJournalButton: {
    paddingHorizontal: 12,
  },
  listContainer: {
    paddingBottom: 20,
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
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default JournalScreen;