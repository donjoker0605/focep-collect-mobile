// src/screens/Collecteur/ClientDetailScreen.js - CORRECTION URGENTE
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

import { clientService } from '../../services'; 
import { useAuth } from '../../hooks/useAuth';
import theme from '../../theme';

// COMPOSANTS LOCAUX SIMPLIFIÉS
const Header = ({ title, onBackPress, rightComponent }) => (
  <View style={headerStyles.container}>
    <TouchableOpacity onPress={onBackPress}>
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
    <Text style={headerStyles.title}>{title}</Text>
    {rightComponent || <View style={{ width: 24 }} />}
  </View>
);

const Card = ({ children, style }) => (
  <View style={[cardStyles.container, style]}>
    {children}
  </View>
);

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
  
  // RÉCUPÉRATION SÉCURISÉE DES PARAMÈTRES
  console.log('🎯 Route complète:', route);
  console.log('🎯 Route.params:', route?.params);
  
  const routeParams = route?.params || {};
  const { client, clientId } = routeParams;
  
  console.log('🎯 Paramètres extraits:');
  console.log('  - client:', client);
  console.log('  - clientId:', clientId);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientDetails, setClientDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log('🔍 useEffect - Début');
    
    // LOGIQUE SIMPLIFIÉE
    if (client && client.id) {
      console.log('✅ Client fourni directement:', client);
      setClientDetails(client);
      setIsLoading(false);
      
      // Optionnel : Charger les transactions
      loadClientTransactions(client.id);
      return;
    }
    
    if (clientId) {
      console.log('✅ ClientId fourni:', clientId);
      loadClientData(clientId);
      return;
    }
    
    // Aucun paramètre valide
    console.error('❌ Aucun client ni ID fourni');
    setError('Aucune information client fournie');
    setIsLoading(false);
  }, [client, clientId]);
  
  const loadClientData = async (targetClientId) => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('🔄 Chargement client ID:', targetClientId);
      
      const clientResponse = await clientService.getClientWithTransactions(targetClientId);
      console.log('✅ Réponse client:', clientResponse);
      
      if (clientResponse.success) {
        setClientDetails(clientResponse.data);
        setTransactions(clientResponse.data.transactions || []);
      } else {
        throw new Error(clientResponse.error || 'Erreur chargement client');
      }
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err.message);
      
      // Fallback simple
      try {
        const fallback = await clientService.getClientById(targetClientId);
        if (fallback.success) {
          setClientDetails(fallback.data);
          setTransactions([]);
          setError(null);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback échoué:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadClientTransactions = async (clientId) => {
    try {
      const response = await clientService.getClientWithTransactions(clientId);
      if (response.success && response.data.transactions) {
        setTransactions(response.data.transactions);
      }
    } catch (err) {
      console.warn('⚠️ Erreur transactions:', err);
    }
  };
  
  // ÉCRAN D'ERREUR PARAMÈTRES
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
            Aucune information client n'a été fournie.
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
  
  // ÉCRAN DE CHARGEMENT
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

  // ÉCRAN D'ERREUR
  if (error && !clientDetails) {
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
              const targetId = client?.id || clientId;
              if (targetId) loadClientData(targetId);
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // ✅ ÉCRAN PRINCIPAL
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
          <Text style={styles.errorMessage}>Informations non disponibles.</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const onRefresh = async () => {
    setRefreshing(true);
    const targetId = client?.id || clientId;
    if (targetId) {
      await loadClientData(targetId);
    }
    setRefreshing(false);
  };

  const handleEditClient = () => {
    navigation.navigate('ClientAddEdit', { mode: 'edit', client: clientDetails });
  };
  
  const handleViewTransaction = (transaction) => {
    console.log('🔍 Navigation transaction:', transaction);
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
    const isEpargne = transaction.typeMouvement === 'EPARGNE' || 
                     transaction.sens === 'epargne';
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
              {format(new Date(transaction.dateOperation), 'dd/MM/yyyy', { locale: fr })}
            </Text>
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
                  <Text style={styles.detailLabel}>CNI: {clientDetails.numeroCni || 'N/A'}</Text>
                </View>
              </View>
              
              {clientDetails.telephone && (
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="call-outline" size={18} color={theme.colors.textLight} />
                    <Text style={styles.detailLabel}>Tél: {clientDetails.telephone}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>
                    Créé le: {format(new Date(clientDetails.dateCreation), 'dd/MM/yyyy', { locale: fr })}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.epargneButton]}
                onPress={() => handleNewOperation('epargne')}
              >
                <Ionicons name="arrow-down-circle-outline" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Épargne</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.retraitButton]}
                onPress={() => handleNewOperation('retrait')}
              >
                <Ionicons name="arrow-up-circle-outline" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Retrait</Text>
              </TouchableOpacity>
            </View>
          </Card>
          
          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.gray} />
                <Text style={styles.emptyText}>
                  Aucune transaction pour ce client
                </Text>
              </View>
            ) : (
              transactions.slice(0, 5).map((transaction, index) => (
                <TransactionItem
                  key={transaction.id || index}
                  transaction={transaction}
                  onPress={handleViewTransaction}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
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
    padding: 4,
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
  profileCard: {
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
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
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  epargneButton: {
    backgroundColor: theme.colors.primary,
  },
  retraitButton: {
    backgroundColor: theme.colors.info,
  },
  transactionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  emptyTransactions: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 16,
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
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ClientDetailScreen;