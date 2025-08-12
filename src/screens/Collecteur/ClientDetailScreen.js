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
import balanceCalculationService from '../../services/balanceCalculationService';

const ClientDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Récupération des paramètres
  const { client: initialClient, clientId } = route.params || {};
  
  const [client, setClient] = useState(initialClient || null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [balances, setBalances] = useState({ soldeTotal: 0, soldeDisponible: 0, commissionSimulee: 0 });
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
        const clientData = response.data;
        console.log('🔍 Données client reçues du backend:', {
          id: clientData.id,
          nom: clientData.nom,
          soldeTotal: clientData.soldeTotal,
          totalEpargne: clientData.totalEpargne,
          commissionParameter: clientData.commissionParameter,
          compteClient: clientData.compteClient,
          transactions: clientData.transactions?.length
        });
        
        // 🔍 DEBUG SPÉCIFIQUE COMMISSION PARAMETER
        if (clientData.commissionParameter) {
          console.log('✅ Paramètre de commission trouvé:', clientData.commissionParameter);
        } else {
          console.warn('⚠️ Paramètre de commission manquant dans la réponse /with-transactions');
          console.log('🔍 Clés disponibles:', Object.keys(clientData));
        }
        
        // 🔍 DEBUG DÉTAILLÉ DES TRANSACTIONS
        if (clientData.transactions && clientData.transactions.length > 0) {
          console.log('✅ Transactions trouvées:', clientData.transactions.length);
          console.log('🔍 Première transaction:', clientData.transactions[0]);
        } else {
          console.warn('⚠️ Aucune transaction trouvée dans la réponse backend');
        }
        
        setClient(clientData);
        setTransactions(clientData.transactions || []);
        setBalance(clientData.soldeTotal || 0);
        
        // 🔍 DEBUG ÉTAT LOCAL DES TRANSACTIONS
        console.log('🔄 État local transactions mis à jour:', (clientData.transactions || []).length);
        
        // Calcul des soldes (total et disponible)
        const calculatedBalances = await balanceCalculationService.calculateClientAvailableBalance(clientData);
        setBalances(calculatedBalances);
        
        console.log('💰 Soldes calculés:', calculatedBalances);
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
    // 🔥 CORRECTION: Toujours charger les détails complets avec transactions
    const id = clientId || client?.id;
    if (id) {
      console.log('🔄 Chargement forcé des détails complets pour client:', id);
      loadClientDetails();
    }
  }, [clientId, client?.id, loadClientDetails]);

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

        {/* Soldes et actions */}
        <Card style={styles.balanceCard}>
          <Text style={styles.sectionTitle}>Soldes du compte</Text>
          
          {/* Solde Total */}
          <View style={styles.balanceRow}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Solde Total</Text>
              <Text style={styles.balanceSubLabel}>Montant total épargné</Text>
            </View>
            <Text style={[styles.balanceValue, { color: theme.colors.primary }]}>
              {formatCurrency(balances.soldeTotal)}
            </Text>
          </View>
          
          {/* Solde Disponible */}
          <View style={styles.balanceRow}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Solde Disponible</Text>
              <Text style={styles.balanceSubLabel}>Montant retirable</Text>
            </View>
            <Text style={[styles.balanceValue, { color: theme.colors.success }]}>
              {formatCurrency(balances.soldeDisponible)}
            </Text>
          </View>
          
          {/* Commission simulée (si > 0) */}
          {balances.commissionSimulee > 0 && (
            <View style={[styles.balanceRow, styles.commissionRow]}>
              <View style={styles.balanceInfo}>
                <Text style={[styles.balanceLabel, { fontSize: 13 }]}>Commission mensuelle</Text>
                <Text style={[styles.balanceSubLabel, { fontSize: 11 }]}>Simulation (non prélevée)</Text>
              </View>
              <Text style={[styles.balanceValue, { color: theme.colors.warning, fontSize: 14 }]}>
                -{formatCurrency(balances.commissionSimulee)}
              </Text>
            </View>
          )}
          
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

        {/* Paramètres de commission */}
        {client?.commissionParameter && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Paramètres de commission</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type de commission</Text>
              <Text style={styles.infoValue}>
                {/* 🔥 CORRECTION: Utiliser les bons champs du backend */}
                {(client.commissionParameter.typeCommission === 'POURCENTAGE' || client.commissionParameter.type === 'PERCENTAGE') ? 'Pourcentage' :
                 (client.commissionParameter.typeCommission === 'FIXE' || client.commissionParameter.type === 'FIXED') ? 'Montant fixe' :
                 (client.commissionParameter.typeCommission === 'PALIER' || client.commissionParameter.type === 'TIER') ? 'Par paliers' : 
                 client.commissionParameter.typeCommission || client.commissionParameter.type || 'Non défini'}
              </Text>
            </View>
            
            {/* 🔥 CORRECTION: Vérifier les deux formats et utiliser 'valeur' du backend */}
            {((client.commissionParameter.typeCommission === 'POURCENTAGE' || client.commissionParameter.type === 'PERCENTAGE')) && 
             (client.commissionParameter.pourcentage || client.commissionParameter.valeur) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Taux de commission</Text>
                <Text style={[styles.infoValue, { color: theme.colors.warning }]}>
                  {client.commissionParameter.pourcentage || client.commissionParameter.valeur}%
                </Text>
              </View>
            )}
            
            {/* 🔥 CORRECTION: Montant fixe avec les bons champs */}
            {(client.commissionParameter.typeCommission === 'FIXE' || client.commissionParameter.type === 'FIXED') && 
             (client.commissionParameter.montantFixe || client.commissionParameter.valeur) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Montant fixe</Text>
                <Text style={[styles.infoValue, { color: theme.colors.warning }]}>
                  {formatCurrency(client.commissionParameter.montantFixe || client.commissionParameter.valeur)}
                </Text>
              </View>
            )}
            
            {client.commissionParameter.type === 'PALIER' && client.commissionParameter.paliersCommission && (
              <View style={styles.palierContainer}>
                <Text style={[styles.infoLabel, { marginBottom: 8 }]}>Paliers de commission</Text>
                {client.commissionParameter.paliersCommission.map((palier, index) => (
                  <View key={index} style={styles.palierRow}>
                    <Text style={styles.palierText}>
                      {formatCurrency(palier.montantMin)} - {formatCurrency(palier.montantMax)}
                    </Text>
                    <Text style={[styles.palierValue, { color: theme.colors.warning }]}>
                      {palier.pourcentage}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {client.commissionParameter.codeProduit && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Code produit</Text>
                <Text style={styles.infoValue}>
                  {client.commissionParameter.codeProduit}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Dernières transactions */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Dernières transactions</Text>
          
          {console.log('🔍 Rendu transactions - Nombre:', transactions.length)}
          
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
    backgroundColor: theme.colors.white,
    marginBottom: 16,
    padding: 16,
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  balanceSubLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  commissionRow: {
    backgroundColor: theme.colors.background,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
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
  palierContainer: {
    marginTop: 8,
  },
  palierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.background,
    marginVertical: 2,
    borderRadius: 6,
  },
  palierText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  palierValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ClientDetailScreen;