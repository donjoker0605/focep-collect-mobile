// src/screens/Collecteur/ClientDetailScreen.js - VERSION FINALE CORRIGÉE
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

// Services et Utils
import { clientService } from '../../services';
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { formatDate, formatTime } from '../../utils/dateUtils';

const ClientDetailScreen = ({ navigation, route }) => {
  const routeHook = useRoute();
  const navigationHook = useNavigation();
  
  console.log('🔍🔍🔍 DIAGNOSTIC NAVIGATION COMPLET:');
  console.log('📋 Props route:', JSON.stringify(route, null, 2));
  console.log('📋 Props navigation:', Object.keys(navigation || {}));
  console.log('📋 Hook route:', JSON.stringify(routeHook, null, 2));
  console.log('📋 Hook navigation:', Object.keys(navigationHook || {}));
  console.log('📋 Params via props:', route?.params);
  console.log('📋 Params via hook:', routeHook?.params);
  console.log('📋 Route name via props:', route?.name);
  console.log('📋 Route name via hook:', routeHook?.name);
  
  const navState = navigationHook.getState?.();
  console.log('📋 Navigation state:', JSON.stringify(navState, null, 2));
  
  const routeParams = route.params || {};
  console.log('🎯 Route complète:', JSON.stringify(route, null, 2));
  console.log('🎯 Route.params:', JSON.stringify(routeParams, null, 2));
  
  const { 
    client: initialClient, 
    clientId: routeClientId,
    fallbackData 
  } = routeParams;
  
  // Déterminer l'ID du client de manière robuste
  const clientId = initialClient?.id || routeClientId || fallbackData?.id;
  
  console.log('🎯 Paramètres extraits:');
  console.log('   - client:', initialClient);
  console.log('   - clientId:', clientId);
  console.log('   - fallbackData:', fallbackData);
  
  // États
  const [client, setClient] = useState(initialClient || fallbackData || null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(!initialClient);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // ✅ FONCTION DE CHARGEMENT DES DÉTAILS COMPLETS
  const loadClientDetails = useCallback(async (showRefreshing = false) => {
    if (!clientId) {
      console.error('❌ Aucun ID client fourni pour le chargement');
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

      // ✅ APPEL À L'ENDPOINT AVEC TRANSACTIONS
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
      
      // Si on a des données initiales, les garder
      if (!client && (initialClient || fallbackData)) {
        setClient(initialClient || fallbackData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId, initialClient, fallbackData, client]);

  // ✅ EFFET DE CHARGEMENT INITIAL
  useEffect(() => {
  console.log('🧪 TEST VÉRIFICATION PARAMS:');
  console.log('1. route.params:', route?.params);
  console.log('2. routeHook.params:', routeHook?.params);
  console.log('3. Toutes les clés route:', Object.keys(route || {}));
  console.log('4. Type de route:', typeof route);
  console.log('5. Constructeur route:', route?.constructor?.name);
  
  // ✅ TENTATIVE DE RÉCUPÉRATION ALTERNATIVE
  const allParams = route?.params || routeHook?.params || {};
  console.log('6. Params fusionnés:', allParams);
  
  if (allParams.client || allParams.clientId) {
    console.log('✅ PARAMS TROUVÉS VIA MÉTHODE ALTERNATIVE');
    setClient(allParams.client);
  } else {
    console.log('❌ AUCUN PARAM TROUVÉ - PROBLÈME ARCHITECTURAL');
  }
}, [route, routeHook]);

  // ✅ CHARGEMENT SÉPARÉ DES TRANSACTIONS
  const loadClientTransactions = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoadingTransactions(true);
      console.log('🔄 Chargement transactions pour client:', clientId);
      
      const clientTransactions = await clientService.getClientTransactions(clientId);
      console.log('✅ Transactions récupérées:', clientTransactions?.length || 0);
      
      setTransactions(clientTransactions || []);
    } catch (err) {
      console.error('❌ Erreur chargement transactions:', err);
      // Ne pas faire échouer tout l'écran pour les transactions
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [clientId]);

  // ✅ FONCTIONS D'ACTION
  const handleRefresh = () => {
    if (clientId) {
      loadClientDetails(true);
    }
  };

  const handleNewTransaction = (type) => {
    if (!client) return;
    
    navigation.navigate('Collecte', {
      selectedTab: type,
      preSelectedClient: client
  });
  }

  const handleTransactionPress = (transaction) => {
    navigation.navigate('CollecteDetail', {
      transaction,
      transactionId: transaction.id
    });
  };

  // ✅ RENDU DES COMPOSANTS UI
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
  const renderTransaction = ({ item }) => {
    const isEpargne = item.typeMouvement === 'EPARGNE' || item.sens === 'epargne';
    const date = new Date(item.dateOperation);
    
    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(item)}
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
            {isEpargne ? '+' : '-'} {formatCurrency(item.montant)} FCFA
          </Text>
        </View>
        {item.libelle && (
          <Text style={styles.transactionDescription}>{item.libelle}</Text>
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
          onBackPress={() => navigation.goBack()}
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
          onBackPress={() => navigation.goBack()}
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
          onBackPress={() => navigation.goBack()}
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
        onBackPress={() => navigation.goBack()}
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
            label="Date de création" 
            value={formatDate(new Date(client.dateCreation))}
            icon="calendar-outline"
          />
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
          {loadingTransactions ? (
            <View style={styles.loadingTransactions}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingTransactionsText}>Chargement des transactions...</Text>
            </View>
          ) : transactions.length > 0 ? (
            <FlatList
              data={transactions.slice(0, 10)} // Limiter à 10 pour la performance
              renderItem={renderTransaction}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.transactionSeparator} />}
              ListFooterComponent={transactions.length > 10 ? (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>Voir toutes les transactions</Text>
                </TouchableOpacity>
              ) : null}
            />
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
  
  // Cards
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
  
  // Detail Rows
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
  
  // Financial Card
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
  
  // Action Buttons
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
  
  // Transactions
  transactionItem: {
    padding: 12,
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
  transactionSeparator: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginHorizontal: 12,
  },
  
  // Loading et Error States
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  loadingTransactions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingTransactionsText: {
    marginLeft: 8,
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
  
  // Empty States
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