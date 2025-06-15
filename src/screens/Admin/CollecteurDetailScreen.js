// src/screens/Admin/CollecteurDetailScreen.js - VUE DÉTAILLÉE COLLECTEUR
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { collecteurService, clientService, transactionService } from '../../services';

const CollecteurDetailScreen = ({ navigation, route }) => {
  const { collecteur: initialCollecteur } = route.params || {};
  
  // États pour les données
  const [collecteur, setCollecteur] = useState(initialCollecteur);
  const [clients, setClients] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // info, clients, transactions, stats

  useEffect(() => {
    if (!collecteur) {
      Alert.alert('Erreur', 'Informations du collecteur manquantes');
      navigation.goBack();
      return;
    }
    
    loadCollecteurDetails();
  }, [collecteur]);

  const loadCollecteurDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger toutes les données en parallèle
      const [
        collecteurResponse,
        clientsResponse,
        transactionsResponse,
        statsResponse
      ] = await Promise.all([
        collecteurService.getCollecteurById(collecteur.id),
        clientService.getClientsByCollecteur(collecteur.id),
        transactionService.getRecentTransactionsByCollecteur(collecteur.id, { limit: 10 }),
        collecteurService.getCollecteurStatistics(collecteur.id)
      ]);
      
      // ✅ TRAITEMENT SÉCURISÉ DES RÉPONSES
      if (collecteurResponse.success) {
        setCollecteur(collecteurResponse.data);
      }
      
      if (clientsResponse.success) {
        const clientsData = Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
        setClients(clientsData);
      }
      
      if (transactionsResponse.success) {
        const transactionsData = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : [];
        setRecentTransactions(transactionsData);
      }
      
      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setError(err.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCollecteurDetails();
  };

  const handleEditCollecteur = () => {
    navigation.navigate('CollecteurCreationScreen', { 
      mode: 'edit', 
      collecteur 
    });
  };

  const handleViewClient = (client) => {
    navigation.navigate('ClientDetailScreen', { client });
  };

  const handleViewTransaction = (transaction) => {
    navigation.navigate('TransactionDetailScreen', { transaction });
  };

  const handleToggleStatus = async () => {
    const newStatus = !collecteur.active;
    const action = newStatus ? 'activer' : 'désactiver';
    
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} ${collecteur.prenom} ${collecteur.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const response = await collecteurService.toggleStatus(collecteur.id, newStatus);
              if (response.success) {
                setCollecteur(prev => ({ ...prev, active: newStatus }));
                Alert.alert('Succès', `Collecteur ${action} avec succès`);
              } else {
                Alert.alert('Erreur', response.error || `Erreur lors de l'${action}ion`);
              }
            } catch (err) {
              Alert.alert('Erreur', err.message || `Erreur lors de l'${action}ion`);
            }
          }
        }
      ]
    );
  };

  const handleManageCommissions = () => {
    navigation.navigate('CommissionParametersScreen', { 
      collecteur,
      mode: 'collecteur'
    });
  };

  // ✅ RENDU DES ONGLETS
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'info' && styles.activeTab]}
        onPress={() => setActiveTab('info')}
      >
        <Ionicons name="person" size={18} color={activeTab === 'info' ? theme.colors.primary : theme.colors.gray} />
        <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'clients' && styles.activeTab]}
        onPress={() => setActiveTab('clients')}
      >
        <Ionicons name="people" size={18} color={activeTab === 'clients' ? theme.colors.primary : theme.colors.gray} />
        <Text style={[styles.tabText, activeTab === 'clients' && styles.activeTabText]}>
          Clients ({Array.isArray(clients) ? clients.length : 0})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
        onPress={() => setActiveTab('transactions')}
      >
        <Ionicons name="list" size={18} color={activeTab === 'transactions' ? theme.colors.primary : theme.colors.gray} />
        <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>Transactions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
        onPress={() => setActiveTab('stats')}
      >
        <Ionicons name="stats-chart" size={18} color={activeTab === 'stats' ? theme.colors.primary : theme.colors.gray} />
        <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
      </TouchableOpacity>
    </View>
  );

  // ✅ RENDU DES INFORMATIONS GÉNÉRALES
  const renderInfoTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Informations personnelles */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="person" size={20} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Nom complet</Text>
            <Text style={styles.infoValue}>
              {`${collecteur.prenom || ''} ${collecteur.nom || ''}`.trim() || 'Non renseigné'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{collecteur.adresseMail || 'Non renseigné'}</Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="call" size={20} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{collecteur.telephone || 'Non renseigné'}</Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="card" size={20} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Numéro CNI</Text>
            <Text style={styles.infoValue}>{collecteur.numeroCni || 'Non renseigné'}</Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="business" size={20} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Agence</Text>
            <Text style={styles.infoValue}>{collecteur.nomAgence || 'Non renseignée'}</Text>
          </View>
        </View>
      </Card>

      {/* Statut et paramètres */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Statut et paramètres</Text>
        
        <View style={styles.infoItem}>
          <Ionicons 
            name={collecteur.active ? "checkmark-circle" : "close-circle"} 
            size={20} 
            color={collecteur.active ? theme.colors.success : theme.colors.error} 
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Statut</Text>
            <Text style={[
              styles.infoValue,
              { color: collecteur.active ? theme.colors.success : theme.colors.error }
            ]}>
              {collecteur.active ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="cash" size={20} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Montant max retrait</Text>
            <Text style={styles.infoValue}>
              {collecteur.montantMaxRetrait ? 
                `${collecteur.montantMaxRetrait.toLocaleString()} FCFA` : 
                'Non défini'
              }
            </Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="time" size={20} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Ancienneté</Text>
            <Text style={styles.infoValue}>
              {collecteur.ancienneteEnMois || 0} mois
            </Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={20} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Date de création</Text>
            <Text style={styles.infoValue}>
              {collecteur.dateCreation ? 
                new Date(collecteur.dateCreation).toLocaleDateString('fr-FR') : 
                'Non renseignée'
              }
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  // ✅ RENDU DE LA LISTE DES CLIENTS
  const renderClientsTab = () => {
    const renderClientItem = ({ item }) => {
      if (!item) return null;

      return (
        <TouchableOpacity 
          style={styles.clientItem}
          onPress={() => handleViewClient(item)}
        >
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {`${item.prenom || ''} ${item.nom || ''}`.trim() || 'Nom inconnu'}
            </Text>
            <Text style={styles.clientAccount}>
              Compte: {item.numeroCompte || 'Non renseigné'}
            </Text>
            <Text style={styles.clientBalance}>
              Solde: {item.solde ? `${item.solde.toLocaleString()} FCFA` : '0 FCFA'}
            </Text>
          </View>
          <View style={[
            styles.clientStatusBadge,
            item.valide ? styles.validBadge : styles.invalidBadge
          ]}>
            <Text style={styles.clientStatusText}>
              {item.valide ? 'Validé' : 'Non validé'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.tabContent}>
        {Array.isArray(clients) && clients.length > 0 ? (
          <FlatList
            data={clients}
            renderItem={renderClientItem}
            keyExtractor={item => item?.id?.toString() || Math.random().toString()}
            style={styles.clientsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={48} color={theme.colors.gray} />
            <Text style={styles.emptyText}>Aucun client assigné</Text>
          </View>
        )}
      </View>
    );
  };

  // ✅ RENDU DES TRANSACTIONS RÉCENTES
  const renderTransactionsTab = () => {
    const renderTransactionItem = ({ item }) => {
      if (!item) return null;

      return (
        <TouchableOpacity 
          style={styles.transactionItem}
          onPress={() => handleViewTransaction(item)}
        >
          <View style={styles.transactionIcon}>
            <Ionicons 
              name={item.type === 'EPARGNE' ? 'arrow-down' : 'arrow-up'} 
              size={20} 
              color={item.type === 'EPARGNE' ? theme.colors.success : theme.colors.warning} 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>{item.type || 'Transaction'}</Text>
            <Text style={styles.transactionClient}>
              {item.client ? `${item.client.prenom} ${item.client.nom}` : 'Client inconnu'}
            </Text>
            <Text style={styles.transactionDate}>
              {item.dateTransaction ? 
                new Date(item.dateTransaction).toLocaleDateString('fr-FR') : 
                'Date inconnue'
              }
            </Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.transactionAmountText,
              { color: item.type === 'EPARGNE' ? theme.colors.success : theme.colors.warning }
            ]}>
              {item.type === 'EPARGNE' ? '+' : '-'}{item.montant ? item.montant.toLocaleString() : '0'} FCFA
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.tabContent}>
        {Array.isArray(recentTransactions) && recentTransactions.length > 0 ? (
          <FlatList
            data={recentTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item?.id?.toString() || Math.random().toString()}
            style={styles.transactionsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="list" size={48} color={theme.colors.gray} />
            <Text style={styles.emptyText}>Aucune transaction récente</Text>
          </View>
        )}
      </View>
    );
  };

  // ✅ RENDU DES STATISTIQUES
  const renderStatsTab = () => (
    <ScrollView style={styles.tabContent}>
      {statistics ? (
        <>
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Statistiques générales</Text>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Nombre de clients</Text>
              <Text style={styles.statValue}>{statistics.totalClients || 0}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Transactions ce mois</Text>
              <Text style={styles.statValue}>{statistics.transactionsCeMois || 0}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Volume d'épargne</Text>
              <Text style={styles.statValue}>
                {statistics.volumeEpargne ? 
                  `${statistics.volumeEpargne.toLocaleString()} FCFA` : 
                  '0 FCFA'
                }
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Volume de retraits</Text>
              <Text style={styles.statValue}>
                {statistics.volumeRetraits ? 
                  `${statistics.volumeRetraits.toLocaleString()} FCFA` : 
                  '0 FCFA'
                }
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Commissions générées</Text>
              <Text style={styles.statValue}>
                {statistics.commissionsGenerees ? 
                  `${statistics.commissionsGenerees.toLocaleString()} FCFA` : 
                  '0 FCFA'
                }
              </Text>
            </View>
          </Card>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="stats-chart" size={48} color={theme.colors.gray} />
          <Text style={styles.emptyText}>Statistiques non disponibles</Text>
        </View>
      )}
    </ScrollView>
  );

  // ✅ RENDU PRINCIPAL
  if (!collecteur) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Détails collecteur"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Informations du collecteur manquantes</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Détails collecteur"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditCollecteur}
          >
            <Ionicons name="pencil" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.contentContainer}>
        {/* En-tête du collecteur */}
        <Card style={styles.headerCard}>
          <View style={styles.collecteurHeader}>
            <View style={styles.collecteurInfo}>
              <Text style={styles.collecteurName}>
                {`${collecteur.prenom || ''} ${collecteur.nom || ''}`.trim() || 'Nom inconnu'}
              </Text>
              <Text style={styles.collecteurEmail}>{collecteur.adresseMail}</Text>
              <View style={[
                styles.statusBadge,
                collecteur.active ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={styles.statusText}>
                  {collecteur.active ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Boutons d'action */}
        <View style={styles.actionButtonsContainer}>
          <Button
            title={collecteur.active ? "Désactiver" : "Activer"}
            onPress={handleToggleStatus}
            style={[
              styles.actionButton,
              { backgroundColor: collecteur.active ? theme.colors.warning : theme.colors.success }
            ]}
          />
          <Button
            title="Commissions"
            onPress={handleManageCommissions}
            style={styles.actionButton}
            variant="outline"
          />
        </View>

        {/* Barre d'onglets */}
        {renderTabBar()}

        {/* Contenu des onglets */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'info' && renderInfoTab()}
            {activeTab === 'clients' && renderClientsTab()}
            {activeTab === 'transactions' && renderTransactionsTab()}
            {activeTab === 'stats' && renderStatsTab()}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  editButton: {
    padding: 8,
  },
  headerCard: {
    margin: 16,
    marginTop: 20,
  },
  collecteurHeader: {
    alignItems: 'center',
  },
  collecteurInfo: {
    alignItems: 'center',
  },
  collecteurName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  collecteurEmail: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
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
    color: theme.colors.text,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 4,
    ...theme.shadows.small,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: theme.colors.gray,
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.white,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
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
  clientsList: {
    flex: 1,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  clientAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  clientBalance: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  clientStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  validBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  invalidBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  clientStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  transactionClient: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
});

export default CollecteurDetailScreen;