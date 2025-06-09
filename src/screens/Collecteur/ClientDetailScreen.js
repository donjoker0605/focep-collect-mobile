// app/client-detail.js ou src/screens/Collecteur/ClientDetailScreen.js - EXPO ROUTER VERSION
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { clientService } from '../../services';
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { formatDate, formatTime } from '../../utils/dateUtils';

const ClientDetailScreen = () => {
  // ✅ RÉCUPÉRATION DES PARAMÈTRES EXPO ROUTER
  const params = useLocalSearchParams();
  
  console.log('🔍 ClientDetail Expo Router - Paramètres reçus:', params);
  
  // ✅ EXTRACTION SÉCURISÉE DES PARAMÈTRES
  const clientId = params.clientId ? parseInt(params.clientId) : null;
  
  // ✅ GESTION DES DONNÉES CLIENT DEPUIS LES PARAMÈTRES
  let initialClient = null;
  if (params.clientData) {
    try {
      initialClient = JSON.parse(params.clientData);
      console.log('✅ Données client décodées:', initialClient);
    } catch (error) {
      console.error('❌ Erreur décodage clientData:', error);
    }
  }

  // États
  const [client, setClient] = useState(initialClient);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(!initialClient);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  console.log('🎯 État initial:', {
    clientId,
    hasInitialClient: !!initialClient,
    clientNom: initialClient?.nom
  });

  // ✅ FONCTION DE CHARGEMENT DES DÉTAILS COMPLETS
  const loadClientDetails = useCallback(async (showRefreshing = false) => {
    if (!clientId) {
      console.error('❌ Aucun ID client fourni');
      setError('Aucun client sélectionné');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Chargement détails client:', clientId);
      
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);

      const clientDetails = await clientService.getClientDetails(clientId);
      
      console.log('✅ Détails client récupérés:', clientDetails);
      
      if (clientDetails) {
        setClient(clientDetails);
        setTransactions(clientDetails.transactions || []);
      } else {
        throw new Error('Détails du client non trouvés');
      }
      
    } catch (err) {
      console.error('❌ Erreur chargement détails client:', err);
      setError(err.message || 'Erreur lors du chargement des détails du client');
      
      // Garder les données initiales si disponibles
      if (!client && initialClient) {
        setClient(initialClient);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId, initialClient, client]);

  // ✅ EFFET DE CHARGEMENT INITIAL
  useEffect(() => {
    console.log('🔄 useEffect ClientDetail - clientId:', clientId, 'initialClient:', !!initialClient);
    
    if (clientId && !initialClient) {
      // Pas de données initiales, charger depuis l'API
      loadClientDetails();
    } else if (clientId && initialClient) {
      // Données initiales disponibles, charger en arrière-plan
      loadClientDetails();
    } else {
      // Aucun ID client
      setError('Aucun client spécifié');
      setLoading(false);
    }
  }, [clientId, loadClientDetails]);

  // ✅ FONCTIONS D'ACTION
  const handleRefresh = () => {
    if (clientId) {
      loadClientDetails(true);
    }
  };

  const handleNewTransaction = (type) => {
    if (!client) return;
    
    router.push({
      pathname: '/collecte',
      params: {
        selectedTab: type,
        preSelectedClientId: client.id,
        preSelectedClientData: JSON.stringify(client)
      }
    });
  };

  const handleTransactionPress = (transaction) => {
    router.push({
      pathname: '/collecte-detail',
      params: {
        transactionId: transaction.id,
        transactionData: JSON.stringify(transaction)
      }
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  // ✅ COMPOSANTS UI
  const Header = ({ title, onBackPress }) => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const Card = ({ children, style, title }) => (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );

  const DetailRow = ({ label, value, icon, style }) => (
    <View style={[styles.detailRow, style]}>
      <View style={styles.detailLabelContainer}>
        {icon && <Ionicons name={icon} size={16} color={theme.colors.textLight} />}
        <Text style={[styles.detailLabel, icon && { marginLeft: 8 }]}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  // ✅ RENDU DES TRANSACTIONS
  const renderTransaction = (transaction, index) => {
    const isEpargne = transaction.typeMouvement === 'EPARGNE' || transaction.sens === 'epargne';
    const date = new Date(transaction.dateOperation);
    
    return (
      <TouchableOpacity 
        key={`transaction-${transaction.id}-${index}`}
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(transaction)}
      >
        <View style={styles.transactionHeader}>
          <View style={[
            styles.transactionIcon,
            { backgroundColor: isEpargne ? `${theme.colors.success}20` : `${theme.colors.error}20` }
          ]}>
            <Ionicons 
              name={isEpargne ? "arrow-down" : "arrow-up"} 
              size={16} 
              color={isEpargne ? theme.colors.success : theme.colors.error} 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {isEpargne ? 'Épargne' : 'Retrait'}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(date)} à {formatTime(date)}
            </Text>
          </View>
          <Text style={[
            styles.transactionAmount,
            { color: isEpargne ? theme.colors.success : theme.colors.error }
          ]}>
            {isEpargne ? '+' : '-'} {formatCurrency(transaction.montant)} FCFA
          </Text>
        </View>
        {transaction.libelle && (
          <Text style={styles.transactionDescription}>{transaction.libelle}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // ✅ ÉTATS DE CHARGEMENT ET D'ERREUR
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détails du client"
          onBackPress={handleGoBack}
        />
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !client) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détails du client"
          onBackPress={handleGoBack}
        />
        <View style={[styles.content, styles.centerContent]}>
          <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détails du client"
          onBackPress={handleGoBack}
        />
        <View style={[styles.content, styles.centerContent]}>
          <Ionicons name="person-outline" size={60} color={theme.colors.gray} />
          <Text style={styles.errorTitle}>Client introuvable</Text>
          <Text style={styles.errorMessage}>Les informations de ce client ne sont pas disponibles.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ CALCUL DES STATISTIQUES
  const totalEpargne = client.totalEpargne || 
    transactions.filter(t => t.typeMouvement === 'EPARGNE' || t.sens === 'epargne')
                .reduce((sum, t) => sum + (t.montant || 0), 0);
                
  const totalRetraits = client.totalRetraits || 
    transactions.filter(t => t.typeMouvement === 'RETRAIT' || t.sens === 'retrait')
                .reduce((sum, t) => sum + (t.montant || 0), 0);
                
  const soldeActuel = client.soldeTotal || (totalEpargne - totalRetraits);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Détails du client"
        onBackPress={handleGoBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ✅ INFORMATIONS PERSONNELLES */}
        <Card title="Informations personnelles" style={styles.infoCard}>
          <DetailRow 
            label="Nom complet" 
            value={`${client.prenom} ${client.nom}`}
            icon="person-outline"
          />
          <DetailRow 
            label="N° CNI" 
            value={client.numeroCni}
            icon="id-card-outline"
          />
          <DetailRow 
            label="N° de compte" 
            value={client.numeroCompte || `#${client.id}`}
            icon="card-outline"
          />
          {client.telephone && (
            <DetailRow 
              label="Téléphone" 
              value={client.telephone}
              icon="call-outline"
            />
          )}
          {client.ville && (
            <DetailRow 
              label="Ville" 
              value={client.ville}
              icon="location-outline"
            />
          )}
          {client.quartier && (
            <DetailRow 
              label="Quartier" 
              value={client.quartier}
            />
          )}
          <DetailRow 
            label="Statut" 
            value={client.valide ? 'Actif' : 'Inactif'}
            icon={client.valide ? "checkmark-circle-outline" : "close-circle-outline"}
          />
        </Card>

        {/* ✅ RÉSUMÉ FINANCIER */}
        <Card title="Résumé financier" style={styles.financialCard}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Solde actuel</Text>
            <Text style={[
              styles.balanceAmount,
              { color: soldeActuel >= 0 ? theme.colors.success : theme.colors.error }
            ]}>
              {formatCurrency(soldeActuel)} FCFA
            </Text>
          </View>
          
          <View style={styles.financialStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total épargné</Text>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                +{formatCurrency(totalEpargne)} FCFA
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total retiré</Text>
              <Text style={[styles.statValue, { color: theme.colors.error }]}>
                -{formatCurrency(totalRetraits)} FCFA
              </Text>
            </View>
          </View>
        </Card>

        {/* ✅ BOUTONS D'ACTION */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.epargneButton]}
            onPress={() => handleNewTransaction('epargne')}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Nouvelle épargne</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.retraitButton]}
            onPress={() => handleNewTransaction('retrait')}
          >
            <Ionicons name="remove-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Nouveau retrait</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ HISTORIQUE DES TRANSACTIONS */}
        <Card title={`Historique (${transactions.length} transactions)`} style={styles.transactionsCard}>
          {transactions.length > 0 ? (
            <View>
              {transactions.slice(0, 10).map(renderTransaction)}
              {transactions.length > 10 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>Voir toutes les transactions</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noTransactions}>
              <Ionicons name="document-text-outline" size={40} color={theme.colors.gray} />
              <Text style={styles.noTransactionsText}>Aucune transaction pour ce client</Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// STYLES (identiques au précédent)
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
    justifyContent: 'center',
    alignItems: 'center',
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    maxWidth: '50%',
    textAlign: 'right',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  financialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  epargneButton: {
    backgroundColor: theme.colors.success,
  },
  retraitButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  transactionItem: {
    padding: 12,
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
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
});

export default ClientDetailScreen;