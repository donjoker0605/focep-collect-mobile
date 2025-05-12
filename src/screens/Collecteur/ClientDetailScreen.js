// src/screens/Collecteur/ClientDetailScreen.js
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
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import TransactionItem from '../../components/TransactionItem/TransactionItem';
import theme from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// Mock des données de paramètres de commission pour la démo
const mockCommissionParams = {
  id: 1,
  type: 'PERCENTAGE',
  valeur: 0.05, // 5%
  paliers: [],
  isActive: true,
  entityType: 'client',
  entityId: 1,
  createdAt: new Date(2022, 5, 15),
  updatedAt: new Date(2023, 2, 10)
};

// Données fictives pour la démo
const mockTransactions = [
  {
    id: 1,
    type: 'Épargne',
    montant: 15000,
    date: new Date(2023, 3, 28, 10, 30),
    category: 'Épargne',
    isIncome: true,
    icon: 'arrow-down-circle',
  },
  {
    id: 2,
    type: 'Épargne',
    montant: 25000,
    date: new Date(2023, 3, 20, 11, 15),
    category: 'Épargne',
    isIncome: true,
    icon: 'arrow-down-circle',
  },
  {
    id: 3,
    type: 'Retrait',
    montant: 10000,
    date: new Date(2023, 3, 15, 14, 20),
    category: 'Retrait',
    isIncome: false,
    icon: 'arrow-up-circle',
  },
  {
    id: 4,
    type: 'Épargne',
    montant: 5000,
    date: new Date(2023, 3, 10, 9, 45),
    category: 'Épargne',
    isIncome: true,
    icon: 'arrow-down-circle',
  },
];

const ClientDetailScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { isOnline } = useOfflineSync();
  const { client } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientDetails, setClientDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [commissionParams, setCommissionParams] = useState(null);
  const [commissionLoading, setCommissionLoading] = useState(true);
  
  // Déterminer les droits de l'utilisateur
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isCollecteur = user?.role === 'COLLECTEUR';
  
  useEffect(() => {
    // Si le client est passé en paramètre, l'utiliser directement
    if (client) {
      setClientDetails({
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        numeroCni: client.numeroCni,
        numeroCompte: client.numeroCompte,
        telephone: client.telephone || '+237 655 123 456',
        ville: client.ville || 'Douala',
        quartier: client.quartier || 'Akwa',
        dateCreation: client.dateCreation || new Date(2022, 5, 15),
        solde: client.solde || 124500.0,
        status: client.status || 'active',
      });
    } else {
      // Sinon, charger le client à partir de l'ID
      fetchClientDetails();
    }
    
    // Charger les transactions et les paramètres de commission
    fetchTransactions();
    fetchCommissionParams();
  }, [client]);
  
  const fetchClientDetails = () => {
    // Simuler une requête API
    setTimeout(() => {
      setClientDetails({
        id: 1,
        nom: 'Dupont',
        prenom: 'Marie',
        numeroCni: 'CM12345678',
        numeroCompte: '37305D0100015254',
        telephone: '+237 655 123 456',
        ville: 'Douala',
        quartier: 'Akwa',
        dateCreation: new Date(2022, 5, 15),
        solde: 124500.0,
        status: 'active',
      });
    }, 1000);
  };
  
  const fetchTransactions = () => {
    // Simuler une requête API
    setTimeout(() => {
      setTransactions(mockTransactions);
      setIsLoading(false);
    }, 1500);
  };
  
  const fetchCommissionParams = () => {
    // Simuler une requête API pour les paramètres de commission
    setCommissionLoading(true);
    setTimeout(() => {
      setCommissionParams(mockCommissionParams);
      setCommissionLoading(false);
    }, 1200);
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    
    // Recharger toutes les données
    fetchClientDetails();
    fetchTransactions();
    fetchCommissionParams();
    
    setRefreshing(false);
  };

  const handleEditClient = () => {
    // Navigation vers l'écran de modification de client
    navigation.navigate('ClientAddEdit', { mode: 'edit', client: clientDetails });
  };
  
  const handleToggleStatus = () => {
    if (!clientDetails) return;
    
    const newStatus = clientDetails.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';
    
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
          onPress: () => {
            setIsLoading(true);
            
            // Simuler une requête API
            setTimeout(() => {
              setClientDetails({
                ...clientDetails,
                status: newStatus
              });
              
              setIsLoading(false);
              
              const message = newStatus === 'active'
                ? `Le compte de ${clientDetails.prenom} ${clientDetails.nom} a été activé avec succès.`
                : `Le compte de ${clientDetails.prenom} ${clientDetails.nom} a été désactivé avec succès.`;
              
              Alert.alert('Succès', message);
            }, 1000);
          },
        },
      ]
    );
  };
  
  const handleViewTransaction = (transaction) => {
    // Navigation vers l'écran de détail de la transaction
    navigation.navigate('CollecteDetail', { transaction });
  };
  
  const handleNewOperation = (type) => {
    // Navigation vers l'écran de collecte avec le client pré-sélectionné
    navigation.navigate('Collecte', {
      selectedTab: type === 'epargne' ? 'epargne' : 'retrait',
      preSelectedClient: clientDetails
    });
  };
  
  const handleEditCommission = () => {
    // Navigation vers l'écran de modification des paramètres de commission
    navigation.navigate('CommissionParametersScreen', {
      entityType: 'client',
      entityId: clientDetails.id,
      entityName: `${clientDetails.prenom} ${clientDetails.nom}`
    });
  };
  
  const formatDateString = (date) => {
    return format(date, 'd MMMM yyyy', { locale: fr });
  };
  
  const formatCurrencyValue = (amount) => {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };
  
  // Rendu du type de commission
  const renderCommissionType = () => {
    if (!commissionParams) return 'Non défini';
    
    switch (commissionParams.type) {
      case 'FIXED':
        return `Fixe: ${formatCurrencyValue(commissionParams.valeur)} FCFA`;
      case 'PERCENTAGE':
        return `Pourcentage: ${(commissionParams.valeur * 100).toFixed(2)}%`;
      case 'TIER':
        return `Paliers: ${commissionParams.paliers?.length || 0} niveau(x)`;
      default:
        return 'Non défini';
    }
  };
  
  if (isLoading || !clientDetails) {
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
  
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Détail du client"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditClient}
          >
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
                  {clientDetails.prenom.charAt(0)}{clientDetails.nom.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.clientName}>{clientDetails.prenom} {clientDetails.nom}</Text>
                <Text style={styles.clientAccount}>{clientDetails.numeroCompte}</Text>
                
                <View style={[
                  styles.statusBadge,
                  clientDetails.status === 'active' ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={styles.statusText}>
                    {clientDetails.status === 'active' ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="id-card-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>CNI:</Text>
                  <Text style={styles.detailValue}>{clientDetails.numeroCni}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Tél:</Text>
                  <Text style={styles.detailValue}>{clientDetails.telephone}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Ville:</Text>
                  <Text style={styles.detailValue}>{clientDetails.ville}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="business-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Quartier:</Text>
                  <Text style={styles.detailValue}>{clientDetails.quartier}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.textLight} />
                  <Text style={styles.detailLabel}>Date de création:</Text>
                  <Text style={styles.detailValue}>{formatDateString(clientDetails.dateCreation)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.soldeContainer}>
              <Text style={styles.soldeLabel}>Solde actuel</Text>
              <Text style={styles.soldeValue}>{formatCurrencyValue(clientDetails.solde)} FCFA</Text>
            </View>
            
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
                  clientDetails.status === 'active' ? styles.desactiverButton : styles.activerButton
                ]}
                onPress={handleToggleStatus}
              >
                <Ionicons
                  name={clientDetails.status === 'active' ? "close-circle-outline" : "checkmark-circle-outline"}
                  size={24}
                  color={theme.colors.white}
                />
                <Text style={styles.actionButtonText}>
                  {clientDetails.status === 'active' ? 'Désactiver le compte' : 'Activer le compte'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
          
          {/* Section Commission */}
          <Card style={styles.commissionCard}>
            <View style={styles.commissionHeader}>
              <Text style={styles.sectionTitle}>Paramètres de commission</Text>
              {(isAdmin || isCollecteur) && (
                <TouchableOpacity
                  style={styles.editCommissionButton}
                  onPress={handleEditCommission}
                >
                  <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.editCommissionText}>Configurer</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {commissionLoading ? (
              <View style={styles.commissionLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.commissionLoadingText}>Chargement des paramètres...</Text>
              </View>
            ) : commissionParams ? (
              <View style={styles.commissionDetails}>
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionLabel}>Type de commission:</Text>
                  <Text style={styles.commissionValue}>{renderCommissionType()}</Text>
                </View>
                
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionLabel}>Statut:</Text>
                  <View style={[
                    styles.statusBadge,
                    commissionParams.isActive ? styles.activeBadge : styles.inactiveBadge,
                    { alignSelf: 'flex-start' }
                  ]}>
                    <Text style={styles.statusText}>
                      {commissionParams.isActive ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionLabel}>Dernière mise à jour:</Text>
                  <Text style={styles.commissionValue}>
                    {formatDateString(commissionParams.updatedAt)}
                  </Text>
                </View>
                
                {commissionParams.type === 'TIER' && commissionParams.paliers?.length > 0 && (
                  <View style={styles.paliersContainer}>
                    <Text style={styles.paliersTitle}>Détails des paliers:</Text>
                    {commissionParams.paliers.map((palier, index) => (
                      <View key={index} style={styles.palierItem}>
                        <Text style={styles.palierText}>
                          {palier.min.toLocaleString()} - {palier.max === 999999999 ? "∞" : palier.max.toLocaleString()} FCFA: {palier.rate}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noCommission}>
                <Text style={styles.noCommissionText}>
                  Aucun paramètre de commission spécifique défini pour ce client.
                  {(isAdmin || isCollecteur) && ' Cliquez sur "Configurer" pour en définir.'}
                </Text>
              </View>
            )}
          </Card>
          
          {/* Transactions récentes */}
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.gray} />
                <Text style={styles.emptyTransactionsText}>
                  Aucune transaction trouvée pour ce client
                </Text>
              </View>
            ) : (
              <View>
                {transactions.map(transaction => (
                  <TransactionItem
                    key={transaction.id}
                    type={transaction.type}
                    date={format(transaction.date, 'HH:mm - d MMM yyyy', { locale: fr })}
                    category={transaction.category}
                    amount={transaction.montant}
                    isIncome={transaction.isIncome}
                    icon={transaction.icon}
                    onPress={() => handleViewTransaction(transaction)}
                  />
                ))}
                
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('ClientTransactions', { clientId: clientDetails.id })}
                >
                  <Text style={styles.viewAllButtonText}>Voir toutes les transactions</Text>
                </TouchableOpacity>
              </View>
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
  
  // Commission Card Styles
  commissionCard: {
    marginBottom: 20,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editCommissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  editCommissionText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  commissionLoading: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  commissionLoadingText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 8,
  },
  noCommission: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 16,
  },
  noCommissionText: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  commissionDetails: {
    marginBottom: 8,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  commissionLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  commissionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  paliersContainer: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  paliersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  palierItem: {
    paddingVertical: 4,
  },
  palierText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  
  // Transactions Section Styles
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
    ...theme.shadows.small,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default ClientDetailScreen;