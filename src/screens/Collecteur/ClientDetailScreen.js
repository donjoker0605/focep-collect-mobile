// src/screens/Collecteur/ClientDetailScreen.js - VERSION FINALE CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ✅ IMPORTS CORRIGÉS - SUPPRESSION DE L'IMPORT INUTILE
import clientService from '../../services/clientService'; 
import { useAuth } from '../../hooks/useAuth';
import theme from '../../theme';

// ✅ COMPOSANTS LOCAUX AVEC STYLES INTÉGRÉS
const Header = ({ title, onBackPress, rightComponent }) => (
  <View style={headerStyles.container}>
    <TouchableOpacity onPress={onBackPress}>
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
    <Text style={headerStyles.title}>{title}</Text>
    {rightComponent}
  </View>
);

const Card = ({ children, style }) => (
  <View style={[cardStyles.container, style]}>
    {children}
  </View>
);

// ✅ STYLES POUR LES COMPOSANTS LOCAUX
const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
});

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

const ClientDetailScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  
  // ✅ EXTRACTION ROBUSTE DES PARAMÈTRES
  const routeParams = route.params || {};
  const { client, clientId } = routeParams;
  
  console.log('🎯 Paramètres reçus:', routeParams);
  console.log('🎯 Client reçu:', client);
  console.log('🎯 ClientId reçu:', clientId);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientDetails, setClientDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // ✅ LOGIQUE DE VALIDATION ROBUSTE
    const actualClientId = client?.id || clientId;
    
    if (!actualClientId) {
      console.error('❌ Aucun ID client fourni');
      setError('Aucun identifiant client fourni');
      setIsLoading(false);
      return;
    }
    
    console.log('✅ ID client valide:', actualClientId);
    
    // Initialiser avec les données client si disponibles
    if (client && client.id) {
      setClientDetails(client);
    }
    
    loadClientData(actualClientId);
  }, [client, clientId]);
  
  const loadClientData = async (targetClientId) => {
    try {
      setError(null);
      console.log('🔄 Chargement des données pour client:', targetClientId);
      
      // ✅ VALIDATION SUPPLÉMENTAIRE
      if (!targetClientId) {
        throw new Error('ID client manquant');
      }
      
      // ✅ UTILISATION DE L'ENDPOINT COMPLET
      const clientResponse = await clientService.getClientWithTransactions(targetClientId);
      console.log('✅ Réponse client service:', clientResponse);
      
      if (clientResponse.success) {
        const clientData = clientResponse.data;
        setClientDetails(clientData);
        
        if (clientData.transactions) {
          console.log('Transactions trouvées:', clientData.transactions.length);
          setTransactions(clientData.transactions);
        } else {
          console.warn('⚠️ Aucune transaction dans la réponse');
          setTransactions([]);
        }
      } else {
        throw new Error(clientResponse.error || 'Erreur lors du chargement du client');
      }
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      
      // ✅ FALLBACK AMÉLIORÉ
      if (targetClientId) {
        try {
          console.log('🔄 Tentative de fallback - chargement client seul');
          const fallbackResponse = await clientService.getClientById(targetClientId);
          if (fallbackResponse.success) {
            setClientDetails(fallbackResponse.data);
            setTransactions([]);
            setError(null);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback échoué:', fallbackError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // ✅ PROTECTION EARLY RETURN
  if (!client && !clientId) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détail du client"
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Paramètres manquants</Text>
          <Text style={styles.errorMessage}>
            Aucune information client n'a été fournie pour afficher cette page.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const onRefresh = async () => {
    setRefreshing(true);
    const actualClientId = client?.id || clientId;
    if (actualClientId) {
      await loadClientData(actualClientId);
    }
    setRefreshing(false);
  };

  const handleEditClient = () => {
    navigation.navigate('ClientAddEdit', { mode: 'edit', client: clientDetails });
  };
  
  const handleToggleStatus = async () => {
    if (!clientDetails) return;
    
    const newStatus = clientDetails.valide ? false : true;
    const action = newStatus ? 'activer' : 'désactiver';
    
    Alert.alert(
      `Confirmation`,
      `Êtes-vous sûr de vouloir ${action} le compte de ${clientDetails.prenom} ${clientDetails.nom} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              const response = await clientService.updateClientStatus(clientDetails.id, newStatus);
              
              if (response.success) {
                setClientDetails(prev => ({
                  ...prev,
                  valide: newStatus
                }));
                
                const message = newStatus
                  ? `Le compte de ${clientDetails.prenom} ${clientDetails.nom} a été activé avec succès.`
                  : `Le compte de ${clientDetails.prenom} ${clientDetails.nom} a été désactivé avec succès.`;
                
                Alert.alert('Succès', message);
              } else {
                throw new Error(response.error || 'Erreur lors du changement de statut');
              }
            } catch (err) {
              console.error('❌ Erreur changement statut:', err);
              Alert.alert('Erreur', err.message || 'Impossible de changer le statut du client');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  
  const handleViewTransaction = (transaction) => {
    console.log('🔍 Navigation vers détails transaction:', transaction);
    navigation.navigate('CollecteDetail', { 
      transaction: transaction,
      transactionId: transaction.id
    });
  };
  
  const handleNewOperation = (type) => {
    navigation.navigate('Collecte', {
      selectedTab: type === 'epargne' ? 'epargne' : 'retrait',
      preSelectedClient: clientDetails
    });
  };

  const TransactionItem = ({ transaction, onPress }) => {
    const transactionType = transaction.typeMouvement || transaction.type || transaction.sens || 'INCONNU';
    const isEpargne = transactionType.toLowerCase().includes('epargne') || 
                     transactionType.toLowerCase().includes('depot') ||
                     transactionType === 'EPARGNE';
    
    const dateToUse = transaction.dateOperation || transaction.dateCreation || Date.now();
    const montant = transaction.montant || 0;
    
    return (
      <TouchableOpacity style={styles.transactionItem} onPress={() => onPress(transaction)}>
        <View style={styles.transactionLeft}>
          <Ionicons 
            name={isEpargne ? 'arrow-down-circle' : 'arrow-up-circle'} 
            size={20} 
            color={isEpargne ? theme.colors.success : theme.colors.error} 
          />
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {isEpargne ? 'Épargne' : 'Retrait'}
            </Text>
            <Text style={styles.transactionDate}>
              {format(new Date(dateToUse), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </Text>
            {transaction.libelle && (
              <Text style={styles.transactionLibelle} numberOfLines={1}>
                {transaction.libelle}
              </Text>
            )}
          </View>
        </View>
        <Text style={[
          styles.transactionAmount,
          { color: isEpargne ? theme.colors.success : theme.colors.error }
        ]}>
          {montant.toLocaleString()} FCFA
        </Text>
      </TouchableOpacity>
    );
  };
  
  const formatCurrencyValue = (amount) => {
    return (amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };
  
  const formatDateString = (date) => {
    if (!date) return 'Non définie';
    try {
      return format(new Date(date), 'd MMMM yyyy', { locale: fr });
    } catch (error) {
      console.warn('Erreur formatage date:', error);
      return 'Date invalide';
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détail du client"
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détail du client"
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              const actualClientId = client?.id || clientId;
              if (actualClientId) {
                loadClientData(actualClientId);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!clientDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Détail du client"
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={60} color={theme.colors.gray} />
          <Text style={styles.errorTitle}>Client introuvable</Text>
          <Text style={styles.errorMessage}>Les informations du client ne sont pas disponibles.</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Détail du client"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.editButton} onPress={handleEditClient}>
            <Ionicons name="create-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.contentContainer}>
          {/* Profil client */}
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {clientDetails.prenom?.charAt(0) || 'C'}{clientDetails.nom?.charAt(0) || 'L'}
                </Text>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.clientName}>
                  {clientDetails.prenom} {clientDetails.nom}
                </Text>
                <Text style={styles.clientAccount}>
                  {clientDetails.numeroCompte || `Client #${clientDetails.id}`}
                </Text>
                
                <View style={[
                  styles.statusBadge,
                  clientDetails.valide ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={styles.statusText}>
                    {clientDetails.valide ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="id-card-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>CNI:</Text>
                  <Text style={styles.detailValue}>{clientDetails.numeroCni || 'Non renseigné'}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Tél:</Text>
                  <Text style={styles.detailValue}>{clientDetails.telephone || 'Non renseigné'}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Ville:</Text>
                  <Text style={styles.detailValue}>{clientDetails.ville || 'Non renseigné'}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="business-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Quartier:</Text>
                  <Text style={styles.detailValue}>{clientDetails.quartier || 'Non renseigné'}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Date de création:</Text>
                  <Text style={styles.detailValue}>
                    {formatDateString(clientDetails.dateCreation)}
                  </Text>
                </View>
              </View>
            </View>
            
            {clientDetails.solde !== undefined && (
              <View style={styles.soldeContainer}>
                <Text style={styles.soldeLabel}>Solde actuel</Text>
                <Text style={styles.soldeValue}>
                  {formatCurrencyValue(clientDetails.solde)} FCFA
                </Text>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.epargneButton]}
                onPress={() => handleNewOperation('epargne')}
              >
                <Ionicons name="arrow-down-circle-outline" size={24} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Nouvelle épargne</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.retraitButton]}
                onPress={() => handleNewOperation('retrait')}
              >
                <Ionicons name="arrow-up-circle-outline" size={24} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Nouveau retrait</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  clientDetails.valide ? styles.desactiverButton : styles.activerButton
                ]}
                onPress={handleToggleStatus}
              >
                <Ionicons
                  name={clientDetails.valide ? "close-circle-outline" : "checkmark-circle-outline"}
                  size={24}
                  color={theme.colors.white}
                />
                <Text style={styles.actionButtonText}>
                  {clientDetails.valide ? 'Désactiver le compte' : 'Activer le compte'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
          
          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transactions récentes</Text>
              {transactions.length > 0 && (
                <Text style={styles.transactionCount}>
                  {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.gray} />
                <Text style={styles.emptyTransactionsText}>
                  Aucune transaction trouvée pour ce client
                </Text>
                <Text style={styles.emptyTransactionsSubText}>
                  Les nouvelles opérations apparaîtront ici
                </Text>
              </View>
            ) : (
              <View>
                {transactions.slice(0, 5).map((transaction, index) => (
                  <TransactionItem
                    key={transaction.id || `transaction-${index}`}
                    transaction={transaction}
                    onPress={handleViewTransaction}
                  />
                ))}
                
                {transactions.length > 5 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate('ClientTransactions', { 
                      clientId: clientDetails.id,
                      clientName: `${clientDetails.prenom} ${clientDetails.nom}`
                    })}
                  >
                    <Text style={styles.viewAllButtonText}>
                      Voir toutes les transactions ({transactions.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// STYLES EXISTANTS CONSERVÉS + QUELQUES AJOUTS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
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
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
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
    marginBottom: 24,
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
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentContainer: {
    padding: 16,
  },
  editButton: {
    padding: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCard: {
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  clientAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
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
    fontWeight: '500',
    color: theme.colors.text,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginHorizontal: 4,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  soldeContainer: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  soldeLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  soldeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actionButtons: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  epargneButton: {
    backgroundColor: theme.colors.primary,
  },
  retraitButton: {
    backgroundColor: theme.colors.info,
  },
  activerButton: {
    backgroundColor: theme.colors.success,
  },
  desactiverButton: {
    backgroundColor: theme.colors.error,
  },
  
  // ✅ STYLES POUR LA SECTION TRANSACTIONS AMÉLIORÉE
  transactionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  transactionCount: {
    fontSize: 12,
    color: theme.colors.textLight,
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyTransactions: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyTransactionsSubText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
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
    marginLeft: 8,
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
  transactionLibelle: {
    fontSize: 11,
    color: theme.colors.textLight,
    marginTop: 1,
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default ClientDetailScreen;