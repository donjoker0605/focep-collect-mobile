// src/screens/SuperAdmin/CollecteurConsultationScreen.js
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
import superAdminService from '../../services/superAdminService';

const CollecteurConsultationScreen = ({ navigation }) => {
  const {
    loading,
    error,
    agences,
    loadAgences,
    clearError
  } = useSuperAdmin();

  const [refreshing, setRefreshing] = useState(false);
  const [collecteurs, setCollecteurs] = useState([]);
  const [filteredCollecteurs, setFilteredCollecteurs] = useState([]);
  const [loadingCollecteurs, setLoadingCollecteurs] = useState(false);
  const [admins, setAdmins] = useState([]);
  
  // Filtres
  const [filters, setFilters] = useState({
    agenceId: '',
    adminId: '',
    status: '',
    searchText: '',
    typeCompte: '',
    dateDebut: '',
    dateFin: '',
  });
  
  const [modalVisible, setModalVisible] = useState(false);

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'suspended', label: 'Suspendu' },
  ];

  const typeCompteOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'principal', label: 'Principal' },
    { value: 'assistant', label: 'Assistant' },
  ];

  useEffect(() => {
    loadAgences();
    loadAllCollecteurs();
    loadAllAdmins();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [collecteurs, filters]);

  useEffect(() => {
    // Charger les admins de l'agence sélectionnée
    const loadAdminsForAgence = async () => {
      if (filters.agenceId) {
        const agenceAdmins = await loadAdminsByAgence(filters.agenceId);
        // Mettre à jour la liste des admins locaux pour le filtrage
        setAdmins(prevAdmins => {
          // Fusionner avec les admins existants pour éviter les doublons
          const mergedAdmins = [...prevAdmins];
          agenceAdmins.forEach(newAdmin => {
            if (!mergedAdmins.find(admin => admin.id === newAdmin.id)) {
              mergedAdmins.push(newAdmin);
            }
          });
          return mergedAdmins;
        });
      } else {
        setFilters(prev => ({ ...prev, adminId: '' }));
      }
    };
    loadAdminsForAgence();
  }, [filters.agenceId]);

  const loadAllCollecteurs = async () => {
    setLoadingCollecteurs(true);
    try {
      const result = await superAdminService.getAllCollecteurs();
      if (result.success) {
        // Adapter les données du backend au format attendu par l'interface
        const adaptedCollecteurs = result.data.map(collecteur => ({
          id: collecteur.id,
          nom: collecteur.nom,
          prenom: collecteur.prenom,
          adresseMail: collecteur.adresseMail,
          telephone: collecteur.telephone,
          status: collecteur.active ? 'active' : 'inactive',
          typeCompte: 'principal', // Valeur par défaut - peut être ajustée selon la logique métier
          agence: collecteur.agence || { id: null, nomAgence: 'N/A', codeAgence: 'N/A' },
          admin: { id: null, nom: 'N/A', prenom: 'N/A' }, // Sera mis à jour après chargement des admins
          totalClients: collecteur.totalClients || 0,
          soldeCompte: collecteur.soldeCompte || 0,
          nombreTransactions: collecteur.nombreTransactions || 0,
          dateCreation: collecteur.dateCreation,
          derniereActivite: collecteur.derniereActivite || collecteur.dateModification,
          performance: {
            collectesMois: 0, // Données à calculer côté backend
            objectifMois: 30,
            tauxReussite: 85.0
          }
        }));
        setCollecteurs(adaptedCollecteurs);
      } else {
        console.error('Erreur API:', result.error);
        setCollecteurs([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des collecteurs:', error);
      setCollecteurs([]);
    } finally {
      setLoadingCollecteurs(false);
    }
  };

  const loadAllAdmins = async () => {
    try {
      const result = await superAdminService.getAllAdmins();
      if (result.success) {
        // Adapter les données du backend
        const adaptedAdmins = result.data.map(admin => ({
          id: admin.id,
          nom: admin.nom,
          prenom: admin.prenom,
          agenceId: admin.agence?.id || null
        }));
        setAdmins(adaptedAdmins);
      } else {
        console.error('Erreur API admins:', result.error);
        setAdmins([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des admins:', error);
      setAdmins([]);
    }
  };

  const loadAdminsByAgence = async (agenceId) => {
    try {
      const result = await superAdminService.getAdminsByAgence(agenceId);
      if (result.success) {
        return result.data.map(admin => ({
          id: admin.id,
          nom: admin.nom,
          prenom: admin.prenom,
          agenceId: admin.agence?.id || null
        }));
      } else {
        console.error('Erreur API admins par agence:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des admins par agence:', error);
      return [];
    }
  };

  const applyFilters = () => {
    let filtered = [...collecteurs];

    // Filtre par agence
    if (filters.agenceId) {
      filtered = filtered.filter(collecteur => collecteur.agence.id === parseInt(filters.agenceId));
    }

    // Filtre par admin
    if (filters.adminId) {
      filtered = filtered.filter(collecteur => collecteur.admin.id === parseInt(filters.adminId));
    }

    // Filtre par statut
    if (filters.status) {
      filtered = filtered.filter(collecteur => collecteur.status === filters.status);
    }

    // Filtre par type de compte
    if (filters.typeCompte) {
      filtered = filtered.filter(collecteur => collecteur.typeCompte === filters.typeCompte);
    }

    // Filtre par texte de recherche
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(collecteur =>
        collecteur.nom.toLowerCase().includes(searchLower) ||
        collecteur.prenom.toLowerCase().includes(searchLower) ||
        collecteur.adresseMail.toLowerCase().includes(searchLower) ||
        collecteur.telephone.includes(filters.searchText) ||
        collecteur.agence.nomAgence.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCollecteurs(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgences();
    await loadAllCollecteurs();
    await loadAllAdmins();
    setRefreshing(false);
  };

  const resetFilters = () => {
    setFilters({
      agenceId: '',
      adminId: '',
      status: '',
      searchText: '',
      typeCompte: '',
      dateDebut: '',
      dateFin: '',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.agenceId) count++;
    if (filters.adminId) count++;
    if (filters.status) count++;
    if (filters.typeCompte) count++;
    if (filters.searchText) count++;
    return count;
  };

  const handleViewCollecteur = (collecteur) => {
    navigation.navigate('CollecteurDetail', { collecteur });
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

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'inactive': return theme.colors.gray;
      case 'suspended': return theme.colors.warning;
      default: return theme.colors.gray;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'suspended': return 'Suspendu';
      default: return status;
    }
  };

  const renderCollecteurItem = (collecteur) => (
    <Card key={collecteur.id} style={styles.collecteurCard}>
      <View style={styles.collecteurHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {collecteur.prenom.charAt(0)}{collecteur.nom.charAt(0)}
          </Text>
        </View>
        
        <View style={styles.collecteurInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.collecteurName}>
              {collecteur.prenom} {collecteur.nom}
            </Text>
            <View style={styles.typeContainer}>
              <Ionicons 
                name={collecteur.typeCompte === 'principal' ? 'star' : 'star-outline'} 
                size={14} 
                color={collecteur.typeCompte === 'principal' ? theme.colors.warning : theme.colors.gray} 
              />
              <Text style={styles.typeText}>{collecteur.typeCompte}</Text>
            </View>
          </View>
          
          <Text style={styles.collecteurEmail}>{collecteur.adresseMail}</Text>
          <Text style={styles.collecteurPhone}>{collecteur.telephone}</Text>
          
          <View style={styles.agenceContainer}>
            <Text style={styles.agenceText}>
              {collecteur.agence.nomAgence} - {collecteur.admin.prenom} {collecteur.admin.nom}
            </Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(collecteur.status) }
          ]}>
            <Text style={styles.statusText}>
              {getStatusText(collecteur.status)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewCollecteur(collecteur)}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.collecteurStats}>
        <View style={styles.statGroup}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={theme.colors.primary} />
            <Text style={styles.statValue}>{collecteur.totalClients}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="wallet" size={16} color={theme.colors.success} />
            <Text style={styles.statValue}>{formatMontant(collecteur.soldeCompte)}</Text>
            <Text style={styles.statLabel}>Solde</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="repeat" size={16} color={theme.colors.info} />
            <Text style={styles.statValue}>{collecteur.nombreTransactions}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
        </View>

        <View style={styles.performanceContainer}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Performance ce mois:</Text>
            <Text style={styles.performanceValue}>
              {collecteur.performance.collectesMois}/{collecteur.performance.objectifMois} 
              ({collecteur.performance.tauxReussite}%)
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(collecteur.performance.collectesMois / collecteur.performance.objectifMois) * 100}%`,
                  backgroundColor: collecteur.performance.tauxReussite >= 90 ? theme.colors.success : 
                                 collecteur.performance.tauxReussite >= 75 ? theme.colors.warning : theme.colors.error
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.lastActivityContainer}>
          <Ionicons name="time" size={14} color={theme.colors.textLight} />
          <Text style={styles.lastActivityText}>
            Dernière activité: {formatDate(collecteur.derniereActivite)}
          </Text>
        </View>
      </View>
    </Card>
  );

  const getFilteredAdmins = () => {
    if (!filters.agenceId) return [];
    return admins.filter(admin => admin.agenceId === parseInt(filters.agenceId));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Consultation Collecteurs"
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
            placeholder="Rechercher un collecteur..."
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
              <Text style={styles.summaryValue}>{filteredCollecteurs.length}</Text>
              <Text style={styles.summaryLabel}>Collecteurs trouvés</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {filteredCollecteurs.filter(c => c.status === 'active').length}
              </Text>
              <Text style={styles.summaryLabel}>Actifs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {filteredCollecteurs.reduce((sum, c) => sum + c.totalClients, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Clients</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatMontant(filteredCollecteurs.reduce((sum, c) => sum + c.soldeCompte, 0))}
              </Text>
              <Text style={styles.summaryLabel}>Solde Total</Text>
            </View>
          </View>
        </Card>

        {/* Liste des collecteurs */}
        {loadingCollecteurs ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des collecteurs...</Text>
          </View>
        ) : filteredCollecteurs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-outline" size={64} color={theme.colors.gray} />
            <Text style={styles.emptyTitle}>Aucun collecteur trouvé</Text>
            <Text style={styles.emptyText}>
              {getActiveFiltersCount() > 0
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucun collecteur n\'est enregistré dans le système'}
            </Text>
            {getActiveFiltersCount() > 0 && (
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.collecteursList}>
            {filteredCollecteurs.map(renderCollecteurItem)}
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
              <Text style={styles.resetButtonModal}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Agence</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.agenceId}
                  onValueChange={(value) => setFilters({...filters, agenceId: value, adminId: ''})}
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
              <Text style={styles.formLabel}>Administrateur</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.adminId}
                  onValueChange={(value) => setFilters({...filters, adminId: value})}
                  style={styles.picker}
                  enabled={!!filters.agenceId}
                >
                  <Picker.Item label="Tous les administrateurs" value="" />
                  {getFilteredAdmins().map(admin => (
                    <Picker.Item
                      key={admin.id}
                      label={`${admin.prenom} ${admin.nom}`}
                      value={admin.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
              {!filters.agenceId && (
                <Text style={styles.helperText}>Sélectionnez d'abord une agence</Text>
              )}
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
              <Text style={styles.formLabel}>Type de compte</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.typeCompte}
                  onValueChange={(value) => setFilters({...filters, typeCompte: value})}
                  style={styles.picker}
                >
                  {typeCompteOptions.map(option => (
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
                placeholder="Nom, prénom, email, téléphone..."
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
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  collecteursList: {
    gap: 12,
  },
  collecteurCard: {
    padding: 16,
  },
  collecteurHeader: {
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
  collecteurInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    color: theme.colors.textLight,
    marginLeft: 2,
  },
  collecteurEmail: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  collecteurPhone: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  agenceContainer: {
    marginBottom: 6,
  },
  agenceText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.white,
  },
  viewButton: {
    padding: 8,
  },
  collecteurStats: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  performanceContainer: {
    marginBottom: 8,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  performanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  lastActivityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lastActivityText: {
    fontSize: 11,
    color: theme.colors.textLight,
    marginLeft: 4,
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
  resetButtonModal: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
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
  helperText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
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

export default CollecteurConsultationScreen;