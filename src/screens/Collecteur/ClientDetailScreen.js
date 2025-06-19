// src/screens/Collecteur/ClientDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { clientService } from '../../services';
import { formatCurrency } from '../../utils/formatters';

const ClientDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Récupération des paramètres
  const { client: initialClient, clientId } = route.params || {};
  
  const [client, setClient] = useState(initialClient || null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(!initialClient);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Chargement des détails du client en une seule requête
  const loadClientDetails = useCallback(async (showRefreshing = false) => {
    try {
      const id = clientId || client?.id;
      if (!id) throw new Error('Aucun ID client fourni');

      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);

      // Une seule requête pour tout récupérer
      const response = await clientService.getClientWithTransactions(id);

      if (response.success) {
        setClient(response.data);
        setTransactions(response.data.transactions || []);
        setBalance(response.data.soldeTotal || 0);
      } else {
        throw new Error(response.message || 'Échec du chargement du client');
      }
      
    } catch (err) {
      console.error('Erreur chargement détails client:', err);
      setError(err.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client?.id, clientId]);

  // Effet de chargement initial
  useEffect(() => {
    if (!client && clientId) {
      loadClientDetails();
    }
  }, [clientId, loadClientDetails]);

  // Gestion du rafraîchissement
  const onRefresh = () => {
    loadClientDetails(true);
  };

  // Navigation vers l'écran de transaction
	const handleNewTransaction = (type) => {
	  if (!client) return;
	  
	  navigation.navigate('TransactionForm', { 
		client,
		transactionType: type,
		onSuccess: loadClientDetails
	  });
	};

  // Navigation vers le détail d'une transaction
	const handleViewTransaction = (transaction) => {
	  navigation.navigate('TransactionDetail', { 
		transaction,
		clientId: client?.id 
	  });
	};

  // Calcul des totaux (utilise les données directes du backend si disponibles)
  const { totalEpargne = 0, totalRetraits = 0 } = client || {};
  const calculatedTotals = calculateTotals();

  function calculateTotals() {
    // Si le backend fournit déjà les totaux, on les utilise
    if (client?.totalEpargne !== undefined && client?.totalRetraits !== undefined) {
      return {
        totalEpargne: client.totalEpargne,
        totalRetrait: client.totalRetraits
      };
    }

    // Sinon on calcule côté client
    return transactions.reduce((totals, t) => {
      if (t.sens?.toUpperCase() === 'EPARGNE') {
        totals.totalEpargne += t.montant || 0;
      } else {
        totals.totalRetrait += t.montant || 0;
      }
      return totals;
    }, { totalEpargne: 0, totalRetrait: 0 });
  }

  // Rendu d'une transaction
  const renderTransactionItem = ({ item }) => {
    if (!item) return null;
    
    const isEpargne = item.sens?.toUpperCase() === 'EPARGNE';
    const dateFormatted = item.dateOperation ? 
      format(new Date(item.dateOperation), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 
      'Date inconnue';
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => handleViewTransaction(item)}
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
            {dateFormatted}
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

  if (error || !client) {
    return (
      <View style={styles.container}>
        <Header
          title="Détails client"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>
            {error || 'Impossible de charger les détails du client'}
          </Text>
          <Button
            title="Réessayer"
            onPress={loadClientDetails}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Détails client"
        onBackPress={() => navigation.goBack()}
      />
      
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
            <Text style={styles.infoLabel}>Date d'inscription</Text>
            <Text style={styles.infoValue}>
              {client.dateCreation ? 
                format(new Date(client.dateCreation), 'dd MMMM yyyy', { locale: fr }) :
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

        {/* Résumé financier */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Résumé financier</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total épargné</Text>
            <Text style={[styles.infoValue, { color: theme.colors.success }]}>
              {formatCurrency(calculatedTotals.totalEpargne)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total retiré</Text>
            <Text style={[styles.infoValue, { color: theme.colors.error }]}>
              {formatCurrency(calculatedTotals.totalRetrait)}
            </Text>
          </View>
        </Card>

        {/* Dernières transactions */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Dernières transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>Aucune transaction enregistrée</Text>
            </View>
          ) : (
            <FlatList
              data={transactions.slice(0, 10)} // Limite à 10 transactions pour éviter le surchargement
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
            />
          )}
        </Card>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    marginTop: 16,
    width: '50%',
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
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default ClientDetailScreen;