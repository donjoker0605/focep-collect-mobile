// src/screens/SuperAdmin/AgenceDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import superAdminService from '../../services/superAdminService';
import theme from '../../theme';

const AgenceDetailScreen = ({ navigation, route }) => {
  const { agence } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [agenceDetails, setAgenceDetails] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [collecteurs, setCollecteurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, admins, collecteurs, clients

  useEffect(() => {
    if (agence && agence.id) {
      fetchAgenceDetails();
    } else {
      Alert.alert('Erreur', 'Aucune agence sélectionnée');
      navigation.goBack();
    }
  }, [agence]);

  const fetchAgenceDetails = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les détails complets de l'agence
      const response = await superAdminService.getAgenceDetailsComplete(agence.id);
      
      if (response.success) {
        setAgenceDetails(response.data);
        setAdmins(response.data.admins || []);
        setCollecteurs(response.data.collecteurs || []);
        setClients(response.data.clients || []);
      } else {
        Alert.alert('Erreur', response.error || 'Impossible de charger les détails de l\'agence');
      }
    } catch (error) {
      console.error('Erreur fetchAgenceDetails:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAgenceDetails();
    setRefreshing(false);
  };

  const handleEditAgence = () => {
    console.log('handleEditAgence appelé dans AgenceDetailScreen');
    if (!agenceDetails) {
      console.log('Aucun détail d\'agence disponible');
      return;
    }
    
    console.log('Détails de l\'agence:', agenceDetails);
    console.log('Navigation directe vers AgenceCreation avec mode edit depuis AgenceDetailScreen');
    navigation.navigate('AgenceCreation', { 
      mode: 'edit', 
      agence: agenceDetails 
    });
  };

  const handleToggleStatus = async () => {
    if (!agenceDetails) return;
    
    const newStatus = agenceDetails.active ? 'désactiver' : 'activer';
    
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir ${newStatus} l'agence ${agenceDetails.nomAgence} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await superAdminService.toggleAgenceStatus(agenceDetails.id);
              
              if (response.success) {
                Alert.alert('Succès', `Agence ${newStatus}e avec succès`);
                await fetchAgenceDetails(); // Recharger les données
              } else {
                Alert.alert('Erreur', response.error || 'Impossible de modifier le statut');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewCollecteur = (collecteur) => {
    // Naviguer vers les détails du collecteur ou afficher les clients
    navigation.navigate('CollecteurDetail', { collecteur });
  };

  const handleViewClient = (client) => {
    // Naviguer vers les détails du client
    navigation.navigate('ClientDetail', { client });
  };

  const getFilteredData = () => {
    switch (selectedFilter) {
      case 'admins':
        return admins;
      case 'collecteurs':
        return collecteurs;
      case 'clients':
        return clients;
      default:
        return [];
    }
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('all')}
      >
        <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
          Vue d'ensemble
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'admins' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('admins')}
      >
        <Text style={[styles.filterButtonText, selectedFilter === 'admins' && styles.filterButtonTextActive]}>
          Admins ({admins.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'collecteurs' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('collecteurs')}
      >
        <Text style={[styles.filterButtonText, selectedFilter === 'collecteurs' && styles.filterButtonTextActive]}>
          Collecteurs ({collecteurs.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'clients' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('clients')}
      >
        <Text style={[styles.filterButtonText, selectedFilter === 'clients' && styles.filterButtonTextActive]}>
          Clients ({clients.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAgenceInfo = () => (
    <Card style={styles.agenceInfoCard}>
      <View style={styles.agenceHeader}>
        <View style={styles.agenceHeaderLeft}>
          <Text style={styles.agenceName}>{agenceDetails?.nomAgence}</Text>
          <Text style={styles.agenceCode}>Code: {agenceDetails?.codeAgence}</Text>
        </View>
        <View style={[styles.statusBadge, agenceDetails?.active ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, agenceDetails?.active ? styles.activeText : styles.inactiveText]}>
            {agenceDetails?.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={styles.agenceDetails}>
        <Text style={styles.detailText}>📍 {agenceDetails?.adresse}</Text>
        <Text style={styles.detailText}>📞 {agenceDetails?.telephone}</Text>
        <Text style={styles.detailText}>👤 Responsable: {agenceDetails?.responsable}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{agenceDetails?.nombreAdmins || 0}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{agenceDetails?.nombreCollecteurs || 0}</Text>
          <Text style={styles.statLabel}>Collecteurs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{agenceDetails?.nombreClients || 0}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
      </View>

      {/* Soldes des comptes d'agence */}
      {agenceDetails?.soldesComptes && (
        <View style={styles.soldesSection}>
          <Text style={styles.soldesTitle}>💰 Soldes des comptes</Text>
          <View style={styles.soldesGrid}>
            <View style={styles.soldeItem}>
              <Text style={styles.soldeLabel}>C.A</Text>
              <Text style={styles.soldeValue}>
                {parseFloat(agenceDetails.soldesComptes.compte_agence || 0).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  minimumFractionDigits: 0
                })}
              </Text>
            </View>
            <View style={styles.soldeItem}>
              <Text style={styles.soldeLabel}>C.P.C</Text>
              <Text style={styles.soldeValue}>
                {parseFloat(agenceDetails.soldesComptes.compte_produit_collecte || 0).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  minimumFractionDigits: 0
                })}
              </Text>
            </View>
            <View style={styles.soldeItem}>
              <Text style={styles.soldeLabel}>C.C.C</Text>
              <Text style={styles.soldeValue}>
                {parseFloat(agenceDetails.soldesComptes.compte_charge_collecte || 0).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  minimumFractionDigits: 0
                })}
              </Text>
            </View>
            <View style={styles.soldeItem}>
              <Text style={styles.soldeLabel}>C.P.C.C</Text>
              <Text style={styles.soldeValue}>
                {parseFloat(agenceDetails.soldesComptes.compte_passage_commission_collecte || 0).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  minimumFractionDigits: 0
                })}
              </Text>
            </View>
            <View style={styles.soldeItem}>
              <Text style={styles.soldeLabel}>C.P.T</Text>
              <Text style={styles.soldeValue}>
                {parseFloat(agenceDetails.soldesComptes.compte_passage_taxe || 0).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  minimumFractionDigits: 0
                })}
              </Text>
            </View>
            <View style={styles.soldeItem}>
              <Text style={styles.soldeLabel}>C.T</Text>
              <Text style={styles.soldeValue}>
                {parseFloat(agenceDetails.soldesComptes.compte_taxe || 0).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  minimumFractionDigits: 0
                })}
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.toggleButton} onPress={handleToggleStatus}>
        <Text style={styles.toggleButtonText}>
          {agenceDetails?.active ? 'Désactiver l\'agence' : 'Activer l\'agence'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderUserList = () => {
    const data = getFilteredData();
    
    if (data.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun {selectedFilter} trouvé</Text>
        </Card>
      );
    }

    return data.map((item, index) => {
      if (selectedFilter === 'admins') {
        return (
          <Card key={item.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <Text style={styles.userName}>{item.nom} {item.prenom}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Admin</Text>
              </View>
            </View>
            <Text style={styles.userDetail}>📧 {item.email}</Text>
            <Text style={styles.userDetail}>📞 {item.telephone}</Text>
          </Card>
        );
      } else if (selectedFilter === 'collecteurs') {
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.userCard}
            onPress={() => handleViewCollecteur(item)}
          >
            <View style={styles.userHeader}>
              <Text style={styles.userName}>{item.nom} {item.prenom}</Text>
              <View style={[styles.statusBadge, item.active ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusText, item.active ? styles.activeText : styles.inactiveText]}>
                  {item.active ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>
            <Text style={styles.userDetail}>📧 {item.adresseMail}</Text>
            <Text style={styles.userDetail}>📞 {item.telephone}</Text>
            <Text style={styles.userDetail}>💰 Max retrait: {item.montantMaxRetrait} FCFA</Text>
          </TouchableOpacity>
        );
      } else if (selectedFilter === 'clients') {
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.userCard}
            onPress={() => handleViewClient(item)}
          >
            <View style={styles.userHeader}>
              <Text style={styles.userName}>{item.nom} {item.prenom}</Text>
              <View style={[styles.statusBadge, item.valide ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusText, item.valide ? styles.activeText : styles.inactiveText]}>
                  {item.valide ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>
            <Text style={styles.userDetail}>📞 {item.telephone}</Text>
            <Text style={styles.userDetail}>🆔 CNI: {item.cni}</Text>
            <Text style={styles.userDetail}>👤 Collecteur: {item.collecteurNom}</Text>
          </TouchableOpacity>
        );
      }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Détails de l'agence" onBackPress={() => navigation.goBack()} />
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
        title="Détails de l'agence" 
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditAgence}
          >
            <Ionicons name="pencil" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderAgenceInfo()}
        {renderFilterButtons()}
        
        {selectedFilter === 'all' ? (
          <View style={styles.overviewContainer}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Résumé</Text>
              <Text style={styles.summaryText}>
                Cette agence compte {agenceDetails?.nombreAdmins || 0} administrateur(s), 
                {agenceDetails?.nombreCollecteurs || 0} collecteur(s) et {agenceDetails?.nombreClients || 0} client(s).
              </Text>
              <Text style={styles.summaryText}>
                Taux d'activité: {agenceDetails?.tauxCollecteursActifs?.toFixed(1) || 0}% collecteurs, 
                {agenceDetails?.tauxClientsActifs?.toFixed(1) || 0}% clients.
              </Text>
            </Card>
          </View>
        ) : (
          <View style={styles.userListContainer}>
            {renderUserList()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  agenceInfoCard: {
    marginBottom: 16,
  },
  agenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  agenceHeaderLeft: {
    flex: 1,
  },
  agenceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  agenceCode: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeBadge: {
    backgroundColor: '#e8f5e8',
  },
  inactiveBadge: {
    backgroundColor: '#ffeaea',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#2e7d32',
  },
  inactiveText: {
    color: '#d32f2f',
  },
  agenceDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  toggleButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  overviewContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  userListContainer: {
    marginBottom: 16,
  },
  userCard: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  roleBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  // Styles pour les soldes des comptes
  soldesSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  soldesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  soldesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  soldeItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  soldeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  soldeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
});

export default AgenceDetailScreen;