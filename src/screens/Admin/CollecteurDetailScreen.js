// src/screens/Admin/CollecteurDetailScreen.js
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { collecteurService, clientService } from '../../services';

const CollecteurDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { collecteur: initialCollecteur } = route.params;
  
  const [collecteur, setCollecteur] = useState(initialCollecteur);
  const [statistics, setStatistics] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info, clients, stats
  
  useEffect(() => {
    loadCollecteurDetails();
  }, []);

  const loadCollecteurDetails = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      // Charger les détails du collecteur
      const [collecteurResponse, statsResponse, clientsResponse] = await Promise.all([
        collecteurService.getCollecteurById(collecteur.id),
        collecteurService.getCollecteurStatistics(collecteur.id),
        clientService.getClientsByCollecteur(collecteur.id)
      ]);
      
      if (collecteurResponse.success) {
        setCollecteur(collecteurResponse.data);
      }
      
      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }
      
      if (clientsResponse.success) {
        setClients(Array.isArray(clientsResponse.data) ? clientsResponse.data : []);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du collecteur');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCollecteurDetails(false);
  };

  const handleEditCollecteur = () => {
    navigation.navigate('CollecteurCreationScreen', {
      mode: 'edit',
      collecteur,
      onRefresh: () => loadCollecteurDetails(false)
    });
  };

  const handleViewCommissions = () => {
    navigation.navigate('CommissionParametersScreen', {
      entityType: 'collecteur',
      selectedCollecteur: collecteur.id
    });
  };

  const handleViewReport = () => {
    navigation.navigate('ReportsScreen', {
      selectedReportType: 'collecteur',
      selectedCollecteur: collecteur.id
    });
  };

  const handleTransferClients = () => {
    navigation.navigate('TransfertCompteScreen', {
      sourceCollecteurId: collecteur.id
    });
  };

  const renderInfoTab = () => (
    <>
      {/* Informations personnelles */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom complet</Text>
          <Text style={styles.infoValue}>
            {collecteur.prenom} {collecteur.nom}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{collecteur.adresseMail}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>{collecteur.telephone}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>CNI</Text>
          <Text style={styles.infoValue}>{collecteur.numeroCni}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut</Text>
          <View style={[
            styles.statusBadge,
            collecteur.active ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={styles.statusText}>
              {collecteur.active ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Paramètres du compte */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Paramètres du compte</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Agence</Text>
          <Text style={styles.infoValue}>
            {collecteur.agenceNom || `Agence ${collecteur.agenceId}`}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Montant max retrait</Text>
          <Text style={styles.infoValue}>
            {new Intl.NumberFormat('fr-FR').format(collecteur.montantMaxRetrait || 0)} FCFA
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date de création</Text>
          <Text style={styles.infoValue}>
            {collecteur.dateCreation ? 
              format(new Date(collecteur.dateCreation), 'dd MMMM yyyy', { locale: fr }) :
              'Non disponible'
            }
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ancienneté</Text>
          <Text style={styles.infoValue}>
            {collecteur.ancienneteEnMois || 0} mois
          </Text>
        </View>
      </Card>

      {/* Actions rapides */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEditCollecteur}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewCommissions}
          >
            <Ionicons name="calculator-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Commissions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewReport}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Rapport</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTransferClients}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Transfert</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </>
  );

  const renderClientsTab = () => (
    <Card style={styles.card}>
      <View style={styles.clientsHeader}>
        <Text style={styles.sectionTitle}>
          Clients ({clients.length})
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ClientCreationScreen', {
            collecteurId: collecteur.id
          })}
        >
          <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {clients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>Aucun client enregistré</Text>
        </View>
      ) : (
        clients.map((client, index) => (
          <TouchableOpacity
            key={client.id || index}
            style={styles.clientItem}
            onPress={() => navigation.navigate('ClientDetailScreen', { client })}
          >
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>
                {client.prenom} {client.nom}
              </Text>
              <Text style={styles.clientPhone}>{client.telephone}</Text>
            </View>
            <View style={styles.clientStats}>
              <Text style={styles.clientBalance}>
                {new Intl.NumberFormat('fr-FR').format(client.solde || 0)} FCFA
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </Card>
  );

  const renderStatsTab = () => (
    <>
      {/* Vue d'ensemble */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statistics?.totalClients || 0}
            </Text>
            <Text style={styles.statLabel}>Clients total</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {statistics?.clientsActifs || 0}
            </Text>
            <Text style={styles.statLabel}>Clients actifs</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statistics?.tauxClientsActifs?.toFixed(1) || 0}%
            </Text>
            <Text style={styles.statLabel}>Taux activité</Text>
          </View>
        </View>
      </Card>

      {/* Statistiques financières */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Statistiques financières</Text>
        
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Total épargne</Text>
            <Text style={[styles.financeValue, { color: theme.colors.success }]}>
              {new Intl.NumberFormat('fr-FR').format(statistics?.totalEpargne || 0)} FCFA
            </Text>
          </View>
        </View>
        
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Total retraits</Text>
            <Text style={[styles.financeValue, { color: theme.colors.error }]}>
              {new Intl.NumberFormat('fr-FR').format(statistics?.totalRetraits || 0)} FCFA
            </Text>
          </View>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Solde net</Text>
            <Text style={[styles.financeValue, styles.netBalance]}>
              {new Intl.NumberFormat('fr-FR').format(statistics?.soldeNet || 0)} FCFA
            </Text>
          </View>
        </View>
      </Card>

      {/* Commissions */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Commissions</Text>
        
        <View style={styles.commissionInfo}>
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Commissions en attente</Text>
            <Text style={styles.commissionValue}>
              {new Intl.NumberFormat('fr-FR').format(statistics?.commissionsEnAttente || 0)} FCFA
            </Text>
          </View>
          
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Total commissions</Text>
            <Text style={styles.commissionValue}>
              {new Intl.NumberFormat('fr-FR').format(statistics?.totalCommissions || 0)} FCFA
            </Text>
          </View>
          
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Commissions du mois</Text>
            <Text style={styles.commissionValue}>
              {new Intl.NumberFormat('fr-FR').format(statistics?.commissionsMoisEnCours || 0)} FCFA
            </Text>
          </View>
        </View>
        
        <Button
          title="Calculer les commissions"
          onPress={() => navigation.navigate('CommissionCalculationScreen', {
            selectedCollecteur: collecteur.id
          })}
          style={styles.commissionButton}
        />
      </Card>
    </>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Détails collecteur"
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
        title="Détails collecteur"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleEditCollecteur}>
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
            style={[styles.tab, activeTab === 'clients' && styles.activeTab]}
            onPress={() => setActiveTab('clients')}
          >
            <Text style={[styles.tabText, activeTab === 'clients' && styles.activeTabText]}>
              Clients
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
          {activeTab === 'clients' && renderClientsTab()}
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
  clientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  clientStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 8,
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
  commissionInfo: {
    marginBottom: 16,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commissionLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  commissionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  commissionButton: {
    marginTop: 8,
  },
});

export default CollecteurDetailScreen;