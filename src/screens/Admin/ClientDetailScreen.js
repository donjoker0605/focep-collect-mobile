// src/screens/Admin/ClientDetailScreen.js - ÉCRAN ADMIN DÉTAILS CLIENT
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// IMPORTS SERVICES
import { clientService, transactionService } from '../../services';
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { formatDate, formatTime } from '../../utils/dateUtils';

// COMPOSANTS
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';

const ClientDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // ✅ PARAMÈTRES REÇUS
  const { clientId, clientData } = route.params || {};
  
  console.log('🔍 Admin ClientDetail - Paramètres reçus:', { clientId, clientData });
  
  // ✅ DONNÉES CLIENT INITIALES
  let initialClient = null;
  if (clientData) {
    initialClient = typeof clientData === 'string' ? JSON.parse(clientData) : clientData;
  }

  // ✅ ÉTATS
  const [client, setClient] = useState(initialClient);
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    balance: 0,
    transactionCount: 0,
    lastTransactionDate: null,
  });
  const [loading, setLoading] = useState(!initialClient);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ✅ CHARGEMENT DES DONNÉES CLIENT
  const loadClientData = useCallback(async (refresh = false) => {
    if (!clientId) {
      setError('ID client manquant');
      return;
    }

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      // Charger les détails du client si pas déjà présents
      if (!client || refresh) {
        const clientResponse = await clientService.getClientById(clientId);
        if (clientResponse.success && clientResponse.data) {
          setClient(clientResponse.data);
        }
      }

      // Charger les transactions du client
      const transactionsResponse = await transactionService.getTransactionsByClient(clientId);
      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
        calculateStatistics(transactionsResponse.data);
      }

    } catch (err) {
      console.error('❌ Erreur chargement données client:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId, client]);

  // ✅ CALCUL DES STATISTIQUES
  const calculateStatistics = (transactionList) => {
    const stats = transactionList.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.montant) || 0;
      
      if (transaction.sens === 'DEPOT' || transaction.typeTransaction === 'DEPOT') {
        acc.totalDeposits += amount;
      } else if (transaction.sens === 'RETRAIT' || transaction.typeTransaction === 'RETRAIT') {
        acc.totalWithdrawals += amount;
      }
      
      acc.transactionCount++;
      
      // Dernière transaction
      const transactionDate = new Date(transaction.dateCreation || transaction.dateTransaction);
      if (!acc.lastTransactionDate || transactionDate > acc.lastTransactionDate) {
        acc.lastTransactionDate = transactionDate;
      }
      
      return acc;
    }, {
      totalDeposits: 0,
      totalWithdrawals: 0,
      transactionCount: 0,
      lastTransactionDate: null,
    });

    stats.balance = stats.totalDeposits - stats.totalWithdrawals;
    setStatistics(stats);
  };

  // ✅ EFFET DE CHARGEMENT INITIAL
  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  // ✅ NAVIGATION VERS DÉTAIL TRANSACTION
  const handleTransactionPress = (transaction) => {
    navigation.navigate('TransactionDetailScreen', {
      transactionId: transaction.id,
      transactionData: transaction,
    });
  };

  // ✅ ACTIONS ADMIN
  const handleEditClient = () => {
    Alert.alert(
      'Modifier le client',
      'Cette fonctionnalité sera bientôt disponible.',
      [{ text: 'OK' }]
    );
  };

  const handleBlockClient = () => {
    Alert.alert(
      'Bloquer le client',
      `Êtes-vous sûr de vouloir bloquer le client ${client?.prenom} ${client?.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Bloquer', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implémenter la logique de blocage
            Alert.alert('Succès', 'Client bloqué avec succès');
          }
        },
      ]
    );
  };

  const handleTransferClient = () => {
    Alert.alert(
      'Transférer le client',
      'Cette fonctionnalité sera bientôt disponible.',
      [{ text: 'OK' }]
    );
  };

  // ✅ RENDU D'UNE TRANSACTION
  const renderTransaction = (transaction, index) => {
    const isDeposit = transaction.sens === 'DEPOT' || transaction.typeTransaction === 'DEPOT';
    const amount = parseFloat(transaction.montant) || 0;
    const date = new Date(transaction.dateCreation || transaction.dateTransaction);

    return (
      <TouchableOpacity
        key={transaction.id || index}
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(transaction)}
      >
        <View style={styles.transactionHeader}>
          <View style={[
            styles.transactionIcon,
            { backgroundColor: isDeposit ? theme.colors.success + '20' : theme.colors.error + '20' }
          ]}>
            <Ionicons
              name={isDeposit ? 'arrow-down' : 'arrow-up'}
              size={16}
              color={isDeposit ? theme.colors.success : theme.colors.error}
            />
          </View>
          
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {isDeposit ? 'Dépôt' : 'Retrait'}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(date)} à {formatTime(date)}
            </Text>
          </View>
          
          <Text style={[
            styles.transactionAmount,
            { color: isDeposit ? theme.colors.success : theme.colors.error }
          ]}>
            {isDeposit ? '+' : '-'}{formatCurrency(amount)}
          </Text>
        </View>
        
        {transaction.description && (
          <Text style={styles.transactionDescription}>
            {transaction.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // ✅ CHARGEMENT
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails client</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ ERREUR
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Erreur</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            title="Réessayer"
            onPress={() => loadClientData()}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ✅ RENDU PRINCIPAL
  return (
    <SafeAreaView style={styles.container}>
      {/* EN-TÊTE */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {client ? `${client.prenom} ${client.nom}` : 'Détails client'}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleEditClient}
        >
          <Ionicons name="create-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* CONTENU */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadClientData(true)}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* INFORMATIONS CLIENT */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            
            <View style={styles.infoItem}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Nom complet</Text>
                <Text style={styles.infoValue}>
                  {`${client?.prenom || ''} ${client?.nom || ''}`.trim() || 'Non renseigné'}
                </Text>
              </View>
            </View>
            
            {client?.numeroCompte && (
              <View style={styles.infoItem}>
                <Ionicons name="card" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Numéro de compte</Text>
                  <Text style={styles.infoValue}>{client.numeroCompte}</Text>
                </View>
              </View>
            )}
            
            {client?.telephone && (
              <View style={styles.infoItem}>
                <Ionicons name="call" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{client.telephone}</Text>
                </View>
              </View>
            )}
            
            {client?.adresse && (
              <View style={styles.infoItem}>
                <Ionicons name="location" size={20} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Adresse</Text>
                  <Text style={styles.infoValue}>{client.adresse}</Text>
                </View>
              </View>
            )}
          </Card>

          {/* STATISTIQUES */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Résumé des transactions</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics.transactionCount}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {formatCurrency(statistics.totalDeposits)}
                </Text>
                <Text style={styles.statLabel}>Total dépôts</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {formatCurrency(statistics.totalWithdrawals)}
                </Text>
                <Text style={styles.statLabel}>Total retraits</Text>
              </View>
            </View>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Solde net</Text>
              <Text style={[
                styles.balanceValue,
                { color: statistics.balance >= 0 ? theme.colors.success : theme.colors.error }
              ]}>
                {formatCurrency(statistics.balance)}
              </Text>
            </View>
            
            {statistics.lastTransactionDate && (
              <Text style={styles.lastTransactionText}>
                Dernière transaction : {formatDate(statistics.lastTransactionDate)}
              </Text>
            )}
          </Card>

          {/* ACTIONS ADMINISTRATIVES */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Actions administratives</Text>
            
            <View style={styles.actionButtonsContainer}>
              <Button
                title="Modifier"
                variant="outline"
                onPress={handleEditClient}
                style={styles.actionButton}
                leftIcon="create-outline"
              />
              
              <Button
                title="Transférer"
                variant="outline"
                onPress={handleTransferClient}
                style={styles.actionButton}
                leftIcon="swap-horizontal-outline"
              />
              
              <Button
                title="Bloquer"
                variant="outline"
                onPress={handleBlockClient}
                style={[styles.actionButton, { borderColor: theme.colors.error }]}
                textStyle={{ color: theme.colors.error }}
                leftIcon="ban-outline"
              />
            </View>
          </Card>

          {/* HISTORIQUE DES TRANSACTIONS */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Transactions récentes</Text>
            </View>
            
            {transactions.length > 0 ? (
              <View>
                {transactions.slice(0, 10).map(renderTransaction)}
                {transactions.length > 10 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>
                      Voir toutes les transactions ({transactions.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noTransactions}>
                <Ionicons name="document-text-outline" size={40} color={theme.colors.gray} />
                <Text style={styles.noTransactionsText}>
                  Aucune transaction pour ce client
                </Text>
              </View>
            )}
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// ✅ STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 60,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  balanceContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastTransactionText: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionDescription: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    marginLeft: 44,
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    marginTop: 8,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  noTransactions: {
    alignItems: 'center',
    padding: 20,
  },
  noTransactionsText: {
    marginTop: 8,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});

export default ClientDetailScreen;