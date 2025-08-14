// src/screens/SuperAdmin/ClientConsultationScreen.js
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

const ClientConsultationScreen = ({ navigation }) => {
  const {
    loading,
    error,
    agences,
    loadAgences,
    clearError
  } = useSuperAdmin();

  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [collecteurs, setCollecteurs] = useState([]);
  
  // Filtres
  const [filters, setFilters] = useState({
    agenceId: '',
    adminId: '',
    collecteurId: '',
    status: '',
    typeCompte: '',
    searchText: '',
    soldeMin: '',
    soldeMax: '',
    dateDebut: '',
    dateFin: '',
  });
  
  const [modalVisible, setModalVisible] = useState(false);

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'suspended', label: 'Suspendu' },
    { value: 'blocked', label: 'Bloqué' },
  ];

  const typeCompteOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
    { value: 'vip', label: 'VIP' },
  ];

  useEffect(() => {
    loadAgences();
    loadAllClients();
    loadAllAdmins();
    loadAllCollecteurs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, filters]);

  useEffect(() => {
    // Charger les admins de l'agence sélectionnée
    if (filters.agenceId) {
      loadAdminsByAgence(filters.agenceId);
    } else {
      setFilters(prev => ({ ...prev, adminId: '', collecteurId: '' }));
    }
  }, [filters.agenceId]);

  useEffect(() => {
    // Charger les collecteurs de l'admin sélectionné
    if (filters.adminId) {
      loadCollecteursByAdmin(filters.adminId);
    } else {
      setFilters(prev => ({ ...prev, collecteurId: '' }));
    }
  }, [filters.adminId]);

  const loadAllClients = async () => {
    setLoadingClients(true);
    try {
      // Simuler l'appel API pour récupérer tous les clients
      setTimeout(() => {
        const mockClients = [
          {
            id: 1,
            nom: 'Ndour',
            prenom: 'Awa',
            telephone: '77 111 11 11',
            cni: '1234567890123',
            adresse: 'Dakar, Plateau',
            status: 'active',
            typeCompte: 'standard',
            soldeCompte: 75000,
            agence: {
              id: 1,
              nomAgence: 'Agence Dakar Centre',
              codeAgence: 'DAK001'
            },
            admin: {
              id: 1,
              nom: 'Dupont',
              prenom: 'Jean'
            },
            collecteur: {
              id: 1,
              nom: 'Diop',
              prenom: 'Moussa'
            },
            dateCreation: '2024-01-15T10:00:00',
            derniereTransaction: '2024-12-10T14:30:00',
            nombreTransactions: 45,
            activiteRecente: {
              derniereConnexion: '2024-12-11T16:20:00',
              transactionsMois: 12,
              montantMoyenTransaction: 15000
            },
            limites: {
              quotidienne: 200000,
              mensuelle: 2000000,
              utiliseQuotidienne: 45000,
              utiliseMensuelle: 320000
            }
          },
          {
            id: 2,
            nom: 'Gueye',
            prenom: 'Modou',
            telephone: '77 222 22 22',
            cni: '2345678901234',
            adresse: 'Dakar, Medina',
            status: 'active',
            typeCompte: 'premium',
            soldeCompte: 450000,
            agence: {
              id: 1,
              nomAgence: 'Agence Dakar Centre',
              codeAgence: 'DAK001'
            },
            admin: {
              id: 1,
              nom: 'Dupont',
              prenom: 'Jean'
            },
            collecteur: {
              id: 1,
              nom: 'Diop',
              prenom: 'Moussa'
            },
            dateCreation: '2024-02-20T09:15:00',
            derniereTransaction: '2024-12-11T11:45:00',
            nombreTransactions: 89,
            activiteRecente: {
              derniereConnexion: '2024-12-11T18:10:00',
              transactionsMois: 28,
              montantMoyenTransaction: 32000
            },
            limites: {
              quotidienne: 500000,
              mensuelle: 5000000,
              utiliseQuotidienne: 125000,
              utiliseMensuelle: 890000
            }
          },
          {
            id: 3,
            nom: 'Kane',
            prenom: 'Mariama',
            telephone: '77 333 33 33',
            cni: '3456789012345',
            adresse: 'Thiès, Centre',
            status: 'inactive',
            typeCompte: 'standard',
            soldeCompte: 12000,
            agence: {
              id: 2,
              nomAgence: 'Agence Thiès',
              codeAgence: 'THI001'
            },
            admin: {
              id: 3,
              nom: 'Diallo',
              prenom: 'Amadou'
            },
            collecteur: {
              id: 3,
              nom: 'Fall',
              prenom: 'Ibrahima'
            },
            dateCreation: '2024-03-10T11:30:00',
            derniereTransaction: '2024-11-25T09:20:00',
            nombreTransactions: 23,
            activiteRecente: {
              derniereConnexion: '2024-11-30T14:55:00',
              transactionsMois: 3,
              montantMoyenTransaction: 8500
            },
            limites: {
              quotidienne: 200000,
              mensuelle: 2000000,
              utiliseQuotidienne: 0,
              utiliseMensuelle: 25500
            }
          },
          {
            id: 4,
            nom: 'Diagne',
            prenom: 'Cheikh',
            telephone: '77 444 44 44',
            cni: '4567890123456',
            adresse: 'Saint-Louis, Nord',
            status: 'active',
            typeCompte: 'vip',
            soldeCompte: 1250000,
            agence: {
              id: 3,
              nomAgence: 'Agence Saint-Louis',
              codeAgence: 'STL001'
            },
            admin: {
              id: 4,
              nom: 'Ba',
              prenom: 'Fatou'
            },
            collecteur: {
              id: 4,
              nom: 'Ndiaye',
              prenom: 'Fatima'
            },
            dateCreation: '2024-01-08T13:45:00',
            derniereTransaction: '2024-12-11T17:50:00',
            nombreTransactions: 156,
            activiteRecente: {
              derniereConnexion: '2024-12-11T18:30:00',
              transactionsMois: 42,
              montantMoyenTransaction: 65000
            },
            limites: {
              quotidienne: 1000000,
              mensuelle: 10000000,
              utiliseQuotidienne: 250000,
              utiliseMensuelle: 2750000
            }
          },
          {
            id: 5,
            nom: 'Sow',
            prenom: 'Bineta',
            telephone: '77 555 55 55',
            cni: '5678901234567',
            adresse: 'Saint-Louis, Sud',
            status: 'suspended',
            typeCompte: 'standard',
            soldeCompte: 85000,
            agence: {
              id: 3,
              nomAgence: 'Agence Saint-Louis',
              codeAgence: 'STL001'
            },
            admin: {
              id: 4,
              nom: 'Ba',
              prenom: 'Fatou'
            },
            collecteur: {
              id: 5,
              nom: 'Sarr',
              prenom: 'Ousmane'
            },
            dateCreation: '2024-04-12T09:30:00',
            derniereTransaction: '2024-12-05T15:30:00',
            nombreTransactions: 34,
            activiteRecente: {
              derniereConnexion: '2024-12-08T10:15:00',
              transactionsMois: 8,
              montantMoyenTransaction: 12000
            },
            limites: {
              quotidienne: 200000,
              mensuelle: 2000000,
              utiliseQuotidienne: 0,
              utiliseMensuelle: 96000
            }
          },
        ];
        setClients(mockClients);
        setLoadingClients(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setLoadingClients(false);
    }
  };

  const loadAllAdmins = async () => {
    try {
      const mockAdmins = [
        { id: 1, nom: 'Dupont', prenom: 'Jean', agenceId: 1 },
        { id: 2, nom: 'Martin', prenom: 'Sophie', agenceId: 1 },
        { id: 3, nom: 'Diallo', prenom: 'Amadou', agenceId: 2 },
        { id: 4, nom: 'Ba', prenom: 'Fatou', agenceId: 3 },
      ];
      setAdmins(mockAdmins);
    } catch (error) {
      console.error('Erreur lors du chargement des admins:', error);
    }
  };

  const loadAllCollecteurs = async () => {
    try {
      const mockCollecteurs = [
        { id: 1, nom: 'Diop', prenom: 'Moussa', adminId: 1, agenceId: 1 },
        { id: 2, nom: 'Seck', prenom: 'Aminata', adminId: 1, agenceId: 1 },
        { id: 3, nom: 'Fall', prenom: 'Ibrahima', adminId: 3, agenceId: 2 },
        { id: 4, nom: 'Ndiaye', prenom: 'Fatima', adminId: 4, agenceId: 3 },
        { id: 5, nom: 'Sarr', prenom: 'Ousmane', adminId: 4, agenceId: 3 },
      ];
      setCollecteurs(mockCollecteurs);
    } catch (error) {
      console.error('Erreur lors du chargement des collecteurs:', error);
    }
  };

  const loadAdminsByAgence = (agenceId) => {
    return admins.filter(admin => admin.agenceId === parseInt(agenceId));
  };

  const loadCollecteursByAdmin = (adminId) => {
    return collecteurs.filter(collecteur => collecteur.adminId === parseInt(adminId));
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Filtre par agence
    if (filters.agenceId) {
      filtered = filtered.filter(client => client.agence.id === parseInt(filters.agenceId));
    }

    // Filtre par admin
    if (filters.adminId) {
      filtered = filtered.filter(client => client.admin.id === parseInt(filters.adminId));
    }

    // Filtre par collecteur
    if (filters.collecteurId) {
      filtered = filtered.filter(client => client.collecteur.id === parseInt(filters.collecteurId));
    }

    // Filtre par statut
    if (filters.status) {
      filtered = filtered.filter(client => client.status === filters.status);
    }

    // Filtre par type de compte
    if (filters.typeCompte) {
      filtered = filtered.filter(client => client.typeCompte === filters.typeCompte);
    }

    // Filtre par solde minimum
    if (filters.soldeMin) {
      filtered = filtered.filter(client => client.soldeCompte >= parseFloat(filters.soldeMin));
    }

    // Filtre par solde maximum
    if (filters.soldeMax) {
      filtered = filtered.filter(client => client.soldeCompte <= parseFloat(filters.soldeMax));
    }

    // Filtre par texte de recherche
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(client =>
        client.nom.toLowerCase().includes(searchLower) ||
        client.prenom.toLowerCase().includes(searchLower) ||
        client.telephone.includes(filters.searchText) ||
        client.cni.includes(filters.searchText) ||
        client.adresse.toLowerCase().includes(searchLower)
      );
    }

    setFilteredClients(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgences();
    await loadAllClients();
    await loadAllAdmins();
    await loadAllCollecteurs();
    setRefreshing(false);
  };

  const resetFilters = () => {
    setFilters({
      agenceId: '',
      adminId: '',
      collecteurId: '',
      status: '',
      typeCompte: '',
      searchText: '',
      soldeMin: '',
      soldeMax: '',
      dateDebut: '',
      dateFin: '',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.agenceId) count++;
    if (filters.adminId) count++;
    if (filters.collecteurId) count++;
    if (filters.status) count++;
    if (filters.typeCompte) count++;
    if (filters.searchText) count++;
    if (filters.soldeMin) count++;
    if (filters.soldeMax) count++;
    return count;
  };

  const handleViewClient = (client) => {
    navigation.navigate('ClientDetail', { client });
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
      case 'blocked': return theme.colors.error;
      default: return theme.colors.gray;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'suspended': return 'Suspendu';
      case 'blocked': return 'Bloqué';
      default: return status;
    }
  };

  const getTypeCompteColor = (type) => {
    switch (type) {
      case 'standard': return theme.colors.gray;
      case 'premium': return theme.colors.primary;
      case 'vip': return theme.colors.warning;
      default: return theme.colors.gray;
    }
  };

  const getTypeCompteIcon = (type) => {
    switch (type) {
      case 'standard': return 'person';
      case 'premium': return 'diamond';
      case 'vip': return 'star';
      default: return 'person';
    }
  };

  const renderClientItem = (client) => (
    <Card key={client.id} style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {client.prenom.charAt(0)}{client.nom.charAt(0)}
          </Text>
        </View>
        
        <View style={styles.clientInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.clientName}>
              {client.prenom} {client.nom}
            </Text>
            <View style={[styles.typeContainer, { backgroundColor: getTypeCompteColor(client.typeCompte) }]}>
              <Ionicons 
                name={getTypeCompteIcon(client.typeCompte)} 
                size={12} 
                color={theme.colors.white} 
              />
              <Text style={styles.typeText}>{client.typeCompte.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.clientPhone}>{client.telephone}</Text>
          <Text style={styles.clientCni}>CNI: {client.cni}</Text>
          <Text style={styles.clientAddress}>{client.adresse}</Text>
          
          <View style={styles.hierarchyContainer}>
            <Text style={styles.hierarchyText}>
              {client.agence.nomAgence} → {client.admin.prenom} {client.admin.nom} → {client.collecteur.prenom} {client.collecteur.nom}
            </Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(client.status) }
          ]}>
            <Text style={styles.statusText}>
              {getStatusText(client.status)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewClient(client)}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.clientStats}>
        <View style={styles.mainStatsRow}>
          <View style={styles.statItem}>
            <Ionicons name="wallet" size={16} color={theme.colors.success} />
            <Text style={styles.statValue}>{formatMontant(client.soldeCompte)}</Text>
            <Text style={styles.statLabel}>Solde actuel</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="repeat" size={16} color={theme.colors.info} />
            <Text style={styles.statValue}>{client.nombreTransactions}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={16} color={theme.colors.primary} />
            <Text style={styles.statValue}>{formatMontant(client.activiteRecente.montantMoyenTransaction)}</Text>
            <Text style={styles.statLabel}>Moy. transaction</Text>
          </View>
        </View>

        <View style={styles.limitesContainer}>
          <Text style={styles.limitesTitle}>Limites & Utilisation</Text>
          <View style={styles.limiteRow}>
            <Text style={styles.limiteLabel}>Quotidienne:</Text>
            <Text style={styles.limiteValue}>
              {formatMontant(client.limites.utiliseQuotidienne)} / {formatMontant(client.limites.quotidienne)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((client.limites.utiliseQuotidienne / client.limites.quotidienne) * 100, 100)}%`,
                  backgroundColor: (client.limites.utiliseQuotidienne / client.limites.quotidienne) > 0.8 ? 
                                 theme.colors.error : theme.colors.success
                }
              ]} 
            />
          </View>
        </div>

        <View style={styles.activiteContainer}>
          <View style={styles.activiteRow}>
            <View style={styles.activiteItem}>
              <Ionicons name="time" size={14} color={theme.colors.textLight} />
              <Text style={styles.activiteText}>
                Dernière connexion: {formatDate(client.activiteRecente.derniereConnexion)}
              </Text>
            </View>
          </View>
          <View style={styles.activiteRow}>
            <View style={styles.activiteItem}>
              <Ionicons name="calendar" size={14} color={theme.colors.textLight} />
              <Text style={styles.activiteText}>
                {client.activiteRecente.transactionsMois} transactions ce mois
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );

  const getFilteredAdmins = () => {
    if (!filters.agenceId) return [];
    return loadAdminsByAgence(filters.agenceId);
  };

  const getFilteredCollecteurs = () => {
    if (!filters.adminId) return [];
    return loadCollecteursByAdmin(filters.adminId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Consultation Clients"
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
            placeholder="Rechercher un client..."
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
              <Text style={styles.summaryValue}>{filteredClients.length}</Text>
              <Text style={styles.summaryLabel}>Clients trouvés</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {filteredClients.filter(c => c.status === 'active').length}
              </Text>
              <Text style={styles.summaryLabel}>Actifs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatMontant(filteredClients.reduce((sum, c) => sum + c.soldeCompte, 0))}
              </Text>
              <Text style={styles.summaryLabel}>Solde Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {filteredClients.reduce((sum, c) => sum + c.nombreTransactions, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Transactions</Text>
            </View>
          </View>
        </Card>

        {/* Liste des clients */}
        {loadingClients ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des clients...</Text>
          </View>
        ) : filteredClients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.gray} />
            <Text style={styles.emptyTitle}>Aucun client trouvé</Text>
            <Text style={styles.emptyText}>
              {getActiveFiltersCount() > 0
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucun client n\'est enregistré dans le système'}
            </Text>
            {getActiveFiltersCount() > 0 && (
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.clientsList}>
            {filteredClients.map(renderClientItem)}
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
                  onValueChange={(value) => setFilters({...filters, agenceId: value, adminId: '', collecteurId: ''})}
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
                  onValueChange={(value) => setFilters({...filters, adminId: value, collecteurId: ''})}
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
              <Text style={styles.formLabel}>Collecteur</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.collecteurId}
                  onValueChange={(value) => setFilters({...filters, collecteurId: value})}
                  style={styles.picker}
                  enabled={!!filters.adminId}
                >
                  <Picker.Item label="Tous les collecteurs" value="" />
                  {getFilteredCollecteurs().map(collecteur => (
                    <Picker.Item
                      key={collecteur.id}
                      label={`${collecteur.prenom} ${collecteur.nom}`}
                      value={collecteur.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
              {!filters.adminId && (
                <Text style={styles.helperText}>Sélectionnez d'abord un administrateur</Text>
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
                placeholder="Nom, prénom, téléphone, CNI, adresse..."
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Solde minimum (FCFA)</Text>
              <TextInput
                style={styles.textInput}
                value={filters.soldeMin}
                onChangeText={(text) => setFilters({...filters, soldeMin: text})}
                placeholder="Ex: 50000"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Solde maximum (FCFA)</Text>
              <TextInput
                style={styles.textInput}
                value={filters.soldeMax}
                onChangeText={(text) => setFilters({...filters, soldeMax: text})}
                placeholder="Ex: 1000000"
                keyboardType="numeric"
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
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: theme.colors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  clientsList: {
    gap: 12,
  },
  clientCard: {
    padding: 16,
  },
  clientHeader: {
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
  clientInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    color: theme.colors.white,
    marginLeft: 2,
    fontWeight: 'bold',
  },
  clientPhone: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  clientCni: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  clientAddress: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  hierarchyContainer: {
    marginBottom: 6,
  },
  hierarchyText: {
    fontSize: 12,
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
  clientStats: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mainStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  limitesContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 6,
  },
  limitesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  limiteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  limiteLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  limiteValue: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text,
  },
  progressBar: {
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  activiteContainer: {
    gap: 4,
  },
  activiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activiteText: {
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

export default ClientConsultationScreen;