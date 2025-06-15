// src/screens/Admin/ClientManagementScreen.js - NOUVELLE FONCTIONNALITÉ
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import SelectInput from '../../components/SelectInput/SelectInput';
import theme from '../../theme';
import { clientService, collecteurService } from '../../services';

const ClientManagementScreen = ({ navigation }) => {
  // États pour les données
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [sortBy, setSortBy] = useState('nom'); // nom, collecteur, date
  const [statusFilter, setStatusFilter] = useState('all'); // all, valid, invalid
  const [totalElements, setTotalElements] = useState(0);

  // Options de tri
  const sortOptions = [
    { id: 'nom', label: 'Nom du client' },
    { id: 'collecteur', label: 'Collecteur' },
    { id: 'date', label: 'Date de création' },
  ];

  // Charger les données au démarrage
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtrer quand les données ou filtres changent
  useEffect(() => {
    filterAndSortClients();
  }, [clients, searchQuery, selectedCollecteur, sortBy, statusFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les collecteurs et clients en parallèle
      const [collecteursResponse, clientsResponse] = await Promise.all([
        collecteurService.getAllCollecteurs(),
        clientService.getAllClients() // Récupère tous les clients de l'agence de l'admin
      ]);
      
      if (collecteursResponse.success) {
        const collecteursData = Array.isArray(collecteursResponse.data) ? collecteursResponse.data : [];
        setCollecteurs(collecteursData);
      }
      
      if (clientsResponse.success) {
        const clientsData = Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
        setClients(clientsData);
        setTotalElements(clientsData.length);
      } else {
        setError(clientsResponse.error || 'Erreur lors du chargement des clients');
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement initial:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      setClients([]);
      setCollecteurs([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortClients = () => {
    if (!Array.isArray(clients)) {
      setFilteredClients([]);
      return;
    }

    let filtered = [...clients];

    // ✅ FILTRER PAR COLLECTEUR
    if (selectedCollecteur) {
      filtered = filtered.filter(client => 
        client.collecteur && client.collecteur.id === selectedCollecteur
      );
    }

    // ✅ FILTRER PAR STATUT
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => 
        statusFilter === 'valid' ? client.valide : !client.valide
      );
    }

    // ✅ FILTRER PAR RECHERCHE
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(client => {
        if (!client) return false;
        
        return (
          (client.nom || '').toLowerCase().includes(searchLower) ||
          (client.prenom || '').toLowerCase().includes(searchLower) ||
          (client.numeroCompte || '').includes(searchQuery) ||
          (client.telephone || '').includes(searchQuery) ||
          (client.collecteur?.nom || '').toLowerCase().includes(searchLower) ||
          (client.collecteur?.prenom || '').toLowerCase().includes(searchLower)
        );
      });
    }

    // ✅ TRIER LES RÉSULTATS
    filtered.sort((a, b) => {
      if (!a || !b) return 0;
      
      switch (sortBy) {
        case 'nom':
          return `${a.nom || ''} ${a.prenom || ''}`.localeCompare(`${b.nom || ''} ${b.prenom || ''}`);
        case 'collecteur':
          const collecteurA = `${a.collecteur?.nom || ''} ${a.collecteur?.prenom || ''}`;
          const collecteurB = `${b.collecteur?.nom || ''} ${b.collecteur?.prenom || ''}`;
          return collecteurA.localeCompare(collecteurB);
        case 'date':
          return new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0);
        default:
          return 0;
      }
    });

    setFilteredClients(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData().finally(() => setRefreshing(false));
  };

  const handleViewClient = (client) => {
    if (!client) return;
    navigation.navigate('ClientDetailScreen', { client });
  };

  const handleEditClient = (client) => {
    if (!client) return;
    navigation.navigate('ClientEditScreen', { client });
  };

  const handleToggleClientStatus = async (client) => {
    if (!client) return;
    
    const newStatus = !client.valide;
    const action = newStatus ? 'valider' : 'invalider';
    
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} le client ${client.prenom} ${client.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const response = await clientService.toggleClientStatus(client.id, newStatus);
              if (response.success) {
                // Mettre à jour localement
                setClients(prev => prev.map(c => 
                  c.id === client.id ? { ...c, valide: newStatus } : c
                ));
                Alert.alert('Succès', `Client ${action} avec succès`);
              } else {
                Alert.alert('Erreur', response.error || `Erreur lors de la ${action}ion`);
              }
            } catch (err) {
              Alert.alert('Erreur', err.message || `Erreur lors de la ${action}ion`);
            }
          }
        }
      ]
    );
  };

  // ✅ OPTIONS SÉCURISÉES POUR LES SÉLECTEURS
  const collecteurOptions = [
    { id: null, label: 'Tous les collecteurs' },
    ...Array.isArray(collecteurs) 
      ? collecteurs.map(collecteur => ({
          id: collecteur.id,
          label: `${collecteur.prenom || ''} ${collecteur.nom || ''}`.trim() || 'Nom inconnu'
        }))
      : []
  ];

  // ✅ RENDU SÉCURISÉ DES CLIENTS
  const renderClientItem = ({ item }) => {
    if (!item) return null;

    return (
      <Card style={styles.clientCard}>
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {`${item.prenom || ''} ${item.nom || ''}`.trim() || 'Nom inconnu'}
            </Text>
            <Text style={styles.clientAccount}>
              Compte: {item.numeroCompte || 'Non renseigné'}
            </Text>
            <Text style={styles.clientCollecteur}>
              Collecteur: {item.collecteur ? 
                `${item.collecteur.prenom || ''} ${item.collecteur.nom || ''}`.trim() : 
                'Non assigné'
              }
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            item.valide ? styles.validBadge : styles.invalidBadge
          ]}>
            <Text style={styles.statusText}>
              {item.valide ? 'Validé' : 'Non validé'}
            </Text>
          </View>
        </View>

        <View style={styles.clientDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="call" size={16} color={theme.colors.gray} />
            <Text style={styles.detailText}>
              {item.telephone || 'Non renseigné'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={16} color={theme.colors.gray} />
            <Text style={styles.detailText}>
              {item.adresse || 'Non renseignée'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color={theme.colors.gray} />
            <Text style={styles.detailText}>
              Créé le: {item.dateCreation ? 
                new Date(item.dateCreation).toLocaleDateString('fr-FR') : 
                'Date inconnue'
              }
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewClient(item)}
          >
            <Ionicons name="eye" size={16} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Détails</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditClient(item)}
          >
            <Ionicons name="pencil" size={16} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleClientStatus(item)}
          >
            <Ionicons 
              name={item.valide ? "close-circle" : "checkmark-circle"} 
              size={16} 
              color={item.valide ? theme.colors.warning : theme.colors.success} 
            />
            <Text style={[
              styles.actionButtonText,
              { color: item.valide ? theme.colors.warning : theme.colors.success }
            ]}>
              {item.valide ? 'Invalider' : 'Valider'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // ✅ GESTION D'ERREUR
  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Gestion des clients"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInitialData}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Gestion des clients"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.contentContainer}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.colors.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.gray} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <SelectInput
              placeholder="Collecteur"
              value={selectedCollecteur}
              options={collecteurOptions}
              onChange={setSelectedCollecteur}
              style={styles.filterSelect}
            />
            
            <SelectInput
              placeholder="Tri"
              value={sortBy}
              options={sortOptions}
              onChange={setSortBy}
              style={styles.filterSelect}
            />
          </View>
          
          <View style={styles.statusFilters}>
            <TouchableOpacity
              style={[styles.statusButton, statusFilter === 'all' && styles.activeStatusButton]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.statusButtonText, statusFilter === 'all' && styles.activeStatusButtonText]}>
                Tous ({totalElements})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.statusButton, statusFilter === 'valid' && styles.activeStatusButton]}
              onPress={() => setStatusFilter('valid')}
            >
              <Text style={[styles.statusButtonText, statusFilter === 'valid' && styles.activeStatusButtonText]}>
                Validés
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.statusButton, statusFilter === 'invalid' && styles.activeStatusButton]}
              onPress={() => setStatusFilter('invalid')}
            >
              <Text style={[styles.statusButtonText, statusFilter === 'invalid' && styles.activeStatusButtonText]}>
                Non validés
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Liste des clients */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des clients...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredClients}
            renderItem={renderClientItem}
            keyExtractor={item => item?.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.clientsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={64} color={theme.colors.gray} />
                <Text style={styles.emptyText}>
                  {searchQuery.trim() !== '' || selectedCollecteur || statusFilter !== 'all'
                    ? 'Aucun client ne correspond à vos critères' 
                    : 'Aucun client disponible'}
                </Text>
              </View>
            }
          />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...theme.shadows.small,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 40,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterSelect: {
    flex: 1,
    marginRight: 8,
  },
  statusFilters: {
    flexDirection: 'row',
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: theme.colors.lightGray,
  },
  activeStatusButton: {
    backgroundColor: theme.colors.primary,
  },
  statusButtonText: {
    color: theme.colors.textLight,
    fontWeight: '500',
    fontSize: 14,
  },
  activeStatusButtonText: {
    color: theme.colors.white,
  },
  clientsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  clientCard: {
    marginBottom: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  clientAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  clientCollecteur: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  validBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  invalidBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  clientDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: theme.colors.lightGray,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
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
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 16,
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
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
});

export default ClientManagementScreen;