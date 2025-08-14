// src/screens/SuperAdmin/AdminConsultationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';

const AdminConsultationScreen = ({ navigation }) => {
  const {
    loading,
    error,
    agences,
    loadAgences,
    clearError
  } = useSuperAdmin();

  const [refreshing, setRefreshing] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  
  // Filtres
  const [filters, setFilters] = useState({
    agenceId: '',
    status: '',
    searchText: '',
    dateDebut: '',
    dateFin: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
  ];

  useEffect(() => {
    loadAgences();
    loadAllAdmins();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [admins, filters]);

  const loadAllAdmins = async () => {
    setLoadingAdmins(true);
    try {
      // Simuler l'appel API pour récupérer tous les admins
      setTimeout(() => {
        const mockAdmins = [
          {
            id: 1,
            nom: 'Dupont',
            prenom: 'Jean',
            adresseMail: 'jean.dupont@agence1.com',
            telephone: '77 123 45 67',
            status: 'active',
            agence: {
              id: 1,
              nomAgence: 'Agence Dakar Centre',
              codeAgence: 'DAK001'
            },
            totalCollecteurs: 5,
            totalClients: 150,
            dateCreation: '2024-01-15T10:00:00',
            derniereConnexion: '2024-12-10T14:30:00',
          },
          {
            id: 2,
            nom: 'Martin',
            prenom: 'Sophie',
            adresseMail: 'sophie.martin@agence1.com',
            telephone: '77 234 56 78',
            status: 'active',
            agence: {
              id: 1,
              nomAgence: 'Agence Dakar Centre',
              codeAgence: 'DAK001'
            },
            totalCollecteurs: 3,
            totalClients: 89,
            dateCreation: '2024-02-20T09:15:00',
            derniereConnexion: '2024-12-11T16:45:00',
          },
          {
            id: 3,
            nom: 'Diallo',
            prenom: 'Amadou',
            adresseMail: 'amadou.diallo@agence2.com',
            telephone: '77 345 67 89',
            status: 'inactive',
            agence: {
              id: 2,
              nomAgence: 'Agence Thiès',
              codeAgence: 'THI001'
            },
            totalCollecteurs: 2,
            totalClients: 45,
            dateCreation: '2024-03-10T11:30:00',
            derniereConnexion: '2024-11-28T10:20:00',
          },
          {
            id: 4,
            nom: 'Ba',
            prenom: 'Fatou',
            adresseMail: 'fatou.ba@agence3.com',
            telephone: '77 456 78 90',
            status: 'active',
            agence: {
              id: 3,
              nomAgence: 'Agence Saint-Louis',
              codeAgence: 'STL001'
            },
            totalCollecteurs: 7,
            totalClients: 203,
            dateCreation: '2024-01-08T13:45:00',
            derniereConnexion: '2024-12-11T18:10:00',
          },
        ];
        setAdmins(mockAdmins);
        setLoadingAdmins(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors du chargement des admins:', error);
      setLoadingAdmins(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...admins];

    // Filtre par agence
    if (filters.agenceId) {
      filtered = filtered.filter(admin => admin.agence.id === parseInt(filters.agenceId));
    }

    // Filtre par statut
    if (filters.status) {
      filtered = filtered.filter(admin => admin.status === filters.status);
    }

    // Filtre par texte de recherche
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(admin =>
        admin.nom.toLowerCase().includes(searchLower) ||
        admin.prenom.toLowerCase().includes(searchLower) ||
        admin.adresseMail.toLowerCase().includes(searchLower) ||
        admin.agence.nomAgence.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAdmins(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgences();
    await loadAllAdmins();
    setRefreshing(false);
  };

  const resetFilters = () => {
    setFilters({
      agenceId: '',
      status: '',
      searchText: '',
      dateDebut: '',
      dateFin: '',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.agenceId) count++;
    if (filters.status) count++;
    if (filters.searchText) count++;
    if (filters.dateDebut) count++;
    if (filters.dateFin) count++;
    return count;
  };

  const handleViewAdmin = (admin) => {
    navigation.navigate('AdminDetail', { admin });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAdminItem = (admin) => (
    <Card key={admin.id} style={styles.adminCard}>
      <View style={styles.adminHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {admin.prenom.charAt(0)}{admin.nom.charAt(0)}
          </Text>
        </View>
        
        <View style={styles.adminInfo}>
          <Text style={styles.adminName}>{admin.prenom} {admin.nom}</Text>
          <Text style={styles.adminEmail}>{admin.adresseMail}</Text>
          <Text style={styles.adminAgence}>{admin.agence.nomAgence}</Text>
          
          <View style={[
            styles.statusBadge,
            admin.status === 'active' ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={styles.statusText}>
              {admin.status === 'active' ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewAdmin(admin)}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.adminStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.statValue}>{admin.totalCollecteurs}</Text>
          <Text style={styles.statLabel}>Collecteurs</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="person-outline" size={16} color={theme.colors.info} />
          <Text style={styles.statValue}>{admin.totalClients}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.statValue}>{formatDate(admin.derniereConnexion)}</Text>
          <Text style={styles.statLabel}>Dernière connexion</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Consultation Admins"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="filter" size={24} color={theme.colors.white} />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {/* Barre de recherche rapide */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un admin..."
            value={filters.searchText}
            onChangeText={(text) => setFilters({...filters, searchText: text})}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <Card style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Résumé des résultats */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{filteredAdmins.length}</Text>
              <Text style={styles.summaryLabel}>Administrateurs trouvés</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {filteredAdmins.filter(a => a.status === 'active').length}
              </Text>
              <Text style={styles.summaryLabel}>Actifs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {new Set(filteredAdmins.map(a => a.agence.id)).size}
              </Text>
              <Text style={styles.summaryLabel}>Agences</Text>
            </View>
          </View>
        </Card>

        {/* Liste des admins */}
        {loadingAdmins ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des administrateurs...</Text>
          </View>
        ) : filteredAdmins.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.gray} />
            <Text style={styles.emptyTitle}>Aucun administrateur trouvé</Text>
            <Text style={styles.emptyText}>
              {filters.searchText || filters.agenceId || filters.status
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucun administrateur n\'est enregistré dans le système'}
            </Text>
            {getActiveFiltersCount() > 0 && (
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.adminsList}>
            {filteredAdmins.map(renderAdminItem)}
          </View>
        )}
      </ScrollView>

      {/* Modal des filtres */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtres de recherche</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetButton}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Agence</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.agenceId}
                  onValueChange={(value) => setFilters({...filters, agenceId: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="Toutes les agences" value="" />
                  {agences.map(agence => (
                    <Picker.Item
                      key={agence.id}
                      label={`${agence.nomAgence} (${agence.codeAgence})`}
                      value={agence.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Statut</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.status}
                  onValueChange={(value) => setFilters({...filters, status: value})}
                  style={styles.picker}
                >
                  {statusOptions.map(option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Recherche textuelle</Text>
              <TextInput
                style={styles.textInput}
                value={filters.searchText}
                onChangeText={(text) => setFilters({...filters, searchText: text})}
                placeholder="Nom, prénom, email, agence..."
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  filterButton: {
    position: 'relative',
    padding: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  errorCard: {
    backgroundColor: theme.colors.errorLight,
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.error,
    fontSize: 14,
  },
  errorButton: {
    padding: 8,
  },
  errorButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  adminsList: {
    gap: 12,
  },
  adminCard: {
    padding: 16,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  adminAgence: {
    fontSize: 13,
    color: theme.colors.primary,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.white,
  },
  viewButton: {
    padding: 8,
  },
  adminStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  resetButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminConsultationScreen;