// src/screens/Admin/ClientDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { clientService, transactionService } from '../../services';

const ClientDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { client: initialClient } = route.params;
  
  const [client, setClient] = useState(initialClient);
  const [statistics, setStatistics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info, transactions, stats
  const [transactionsPage, setTransactionsPage] = useState(0);
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);

  useEffect(() => {
    loadClientDetails();
  }, []);

  const loadClientDetails = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      // Charger les détails en parallèle
      const [clientResponse, statsResponse, balanceResponse, transactionsResponse] = await Promise.all([
        clientService.getClientById(client.id),
        clientService.getClientStatistics(client.id),
        clientService.getClientBalance(client.id),
        clientService.getClientTransactions(client.id, { page: 0, size: 20 })
      ]);
      
      if (clientResponse.success) {
        setClient(clientResponse.data);
      }
      
      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }
      
      if (balanceResponse.success) {
        setBalance(balanceResponse.data.solde || 0);
      }
      
      if (transactionsResponse.success) {
        const transData = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : [];
        setTransactions(transData);
        setHasMoreTransactions(transData.length >= 20);
        setTransactionsPage(0);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du client');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (!hasMoreTransactions || loadingMoreTransactions) return;
    
    try {
      setLoadingMoreTransactions(true);
      const nextPage = transactionsPage + 1;
      
      const response = await clientService.getClientTransactions(client.id, {
        page: nextPage,
        size: 20
      });
      
      if (response.success) {
        const newTransactions = Array.isArray(response.data) ? response.data : [];
        setTransactions(prev => [...prev, ...newTransactions]);
        setTransactionsPage(nextPage);
        setHasMoreTransactions(newTransactions.length >= 20);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setLoadingMoreTransactions(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClientDetails(false);
  };

  const handleEditClient = () => {
    navigation.navigate('ClientAddEdit', {
      mode: 'edit',
      client,
      adminEdit: true,
      onRefresh: () => loadClientDetails(false)
    });
  };

  const handleNewTransaction = (type) => {
    navigation.navigate('TransactionScreen', {
      client,
      transactionType: type, // 'epargne' ou 'retrait'
      onSuccess: () => loadClientDetails(false)
    });
  };

  const handleViewCommissionParams = () => {
    navigation.navigate('CommissionParametersScreen', {
      entityType: 'client',
      selectedCollecteur: client.collecteurId,
      selectedClient: client.id
    });
  };

  const handleTransferClient = () => {
    navigation.navigate('TransfertCompteScreen', {
      sourceCollecteurId: client.collecteurId,
      selectedClientIds: [client.id]
    });
  };

  const formatCurrency = (amount) => {
    return `${new Intl.NumberFormat('fr-FR').format(amount || 0)} FCFA`;
  };

  const renderInfoTab = () => (
    <>
      {/* Informations personnelles */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom complet</Text>
          <Text style={styles.infoValue}>
            {client.prenom} {client.nom}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>{client.telephone}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Collecteur</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CollecteurDetailScreen', {
              collecteur: { id: client.collecteurId, nom: client.collecteurNom }
            })}
          >
            <Text style={[styles.infoValue, styles.linkText]}>
              {client.collecteurNom || 'Non assigné'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut</Text>
          <View style={[
            styles.statusBadge,
            client.valide ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={styles.statusText}>
              {client.valide ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date d'inscription</Text>
          <Text style={styles.infoValue}>
            {client.dateInscription ? 
              format(new Date(client.dateInscription), 'dd MMMM yyyy', { locale: fr }) :
              'Non disponible'
            }
          </Text>
        </View>
      </Card>

      {/* Solde et actions */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde actuel</Text>
        <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        
        <View style={styles.transactionButtons}>
          <Button
            title="Nouvelle épargne"
            onPress={() => handleNewTransaction('epargne')}
            style={styles.epargneButton}
            icon="add-circle"
          />
          
          <Button
            title="Nouveau retrait"
            onPress={() => handleNewTransaction('retrait')}
            style={styles.retraitButton}
            variant="secondary"
            icon="remove-circle"
          />
        </View>
      </Card>

      {/* Actions rapides */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEditClient}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewCommissionParams}
          >
            <Ionicons name="calculator-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Commissions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTransferClient}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Transférer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Info', 'Historique en développement')}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Historique</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </>
  );

  const renderTransactionItem = ({ item }) => {
    if (!item) return null;
    
    const isEpargne = item.sens?.toUpperCase() === 'EPARGNE';
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => navigation.navigate('TransactionDetailScreen', { transaction: item })}
      >
        <View style={styles.transactionIcon}>
          <Ionicons 
            name={isEpargne ? "add-circle" : "remove-circle"} 
            size={24} 
            color={isEpargne ? theme.colors.success : theme.colors.error} 
          />
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {isEpargne ? 'Épargne' : 'Retrait'}
          </Text>
          <Text style={styles.transactionDate}>
            {item.dateOperation ? 
              format(new Date(item.dateOperation), 'dd/MM/yyyy à HH:mm', { locale: fr }) :
              'Date inconnue'
            }
          </Text>
        </View>
        
        <Text style={[
          styles.transactionAmount,
          { color: isEpargne ? theme.colors.success : theme.colors.error }
        ]}>
          {isEpargne ? '+' : '-'}{formatCurrency(item.montant)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTransactionsTab = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>
        Historique des transactions
      </Text>
      
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>Aucune transaction enregistrée</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
          onEndReached={loadMoreTransactions}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMoreTransactions ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          scrollEnabled={false}
        />
      )}
    </Card>
  );

  const renderStatsTab = () => (
    <>
      {/* Statistiques générales */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Statistiques générales</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statistics?.nombreOperations || 0}
            </Text>
            <Text style={styles.statLabel}>Opérations</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statistics?.anciennete || 0}
            </Text>
            <Text style={styles.statLabel}>Mois d'ancienneté</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statistics?.frequenceOperations || 0}
            </Text>
            <Text style={styles.statLabel}>Opér./mois</Text>
          </View>
        </View>
      </Card>

      {/* Statistiques financières */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Statistiques financières</Text>
        
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Total épargné</Text>
            <Text style={[styles.financeValue, { color: theme.colors.success }]}>
              {formatCurrency(statistics?.totalEpargne)}
            </Text>
          </View>
        </View>
        
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Total retiré</Text>
            <Text style={[styles.financeValue, { color: theme.colors.error }]}>
              {formatCurrency(statistics?.totalRetrait)}
            </Text>
          </View>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Solde net</Text>
            <Text style={[styles.financeValue, styles.netBalance]}>
              {formatCurrency(balance)}
            </Text>
          </View>
        </View>
        
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Épargne moyenne/mois</Text>
            <Text style={styles.financeValue}>
              {formatCurrency(statistics?.moyenneEpargneMensuelle)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Activité récente */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Activité récente</Text>
        
        <View style={styles.activityInfo}>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>Dernière opération</Text>
            <Text style={styles.activityValue}>
              {statistics?.derniereOperation ? 
                format(new Date(statistics.derniereOperation), 'dd/MM/yyyy', { locale: fr }) :
                'Aucune'
              }
            </Text>
          </View>
          
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>Opérations ce mois</Text>
            <Text style={styles.activityValue}>
              {statistics?.operationsMoisEnCours || 0}
            </Text>
          </View>
          
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>Épargne ce mois</Text>
            <Text style={styles.activityValue}>
              {formatCurrency(statistics?.epargneMoisEnCours)}
            </Text>
          </View>
        </View>
      </Card>
    </>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Détails client"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Détails client"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleEditClient}>
            <Ionicons name="create-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Informations
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
              Transactions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
              Statistiques
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'transactions' && renderTransactionsTab()}
          {activeTab === 'stats' && renderStatsTab()}
        </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
  },
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceLabel: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 24,
  },
  transactionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  epargneButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  retraitButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 12,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  financeRow: {
    marginBottom: 16,
  },
  financeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  financeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginVertical: 16,
  },
  netBalance: {
    fontSize: 20,
    color: theme.colors.primary,
  },
  activityInfo: {
    marginTop: 8,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
});

export default ClientDetailScreen;