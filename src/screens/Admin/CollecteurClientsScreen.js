// src/screens/Admin/CollecteurClientsScreen.js
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
import theme from '../../theme';

// Données fictives pour la démo
const mockClients = [
  {
    id: 1,
    nom: 'Dupont',
    prenom: 'Marie',
    numeroCompte: '37305D0100015254',
    solde: 124500.0,
    status: 'active',
  },
  {
    id: 2,
    nom: 'Martin',
    prenom: 'Jean',
    numeroCompte: '37305D0100015255',
    solde: 56700.0,
    status: 'active',
  },
  {
    id: 3,
    nom: 'Dubois',
    prenom: 'Sophie',
    numeroCompte: '37305D0100015256',
    solde: 83200.0,
    status: 'inactive',
  },
  {
    id: 4,
    nom: 'Bernard',
    prenom: 'Michel',
    numeroCompte: '37305D0100015257',
    solde: 42100.0,
    status: 'active',
  },
];

const CollecteurClientsScreen = ({ navigation, route }) => {
  const { collecteurId } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [collecteurInfo, setCollecteurInfo] = useState(null);

  useEffect(() => {
    if (collecteurId) {
      fetchCollecteurInfo();
      fetchClients();
    } else {
      Alert.alert('Erreur', 'Identifiant du collecteur manquant');
      navigation.goBack();
    }
  }, [collecteurId]);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, filter]);

  const fetchCollecteurInfo = () => {
    // Simuler une requête API
    setTimeout(() => {
      setCollecteurInfo({
        id: collecteurId,
        nom: 'Dupont',
        prenom: 'Jean',
      });
    }, 500);
  };

  const fetchClients = () => {
    // Simuler une requête API
    setTimeout(() => {
      setClients(mockClients);
      setFilteredClients(mockClients);
      setIsLoading(false);
    }, 1000);
  };

  const filterClients = () => {
    let filtered = clients;

    // Filtrer par statut
    if (filter !== 'all') {
      filtered = filtered.filter(client => client.status === filter);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(client =>
        client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.numeroCompte.includes(searchQuery)
      );
    }

    setFilteredClients(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simuler une requête API
    setTimeout(() => {
      fetchClients();
      setRefreshing(false);
    }, 1500);
  };

  const handleViewClient = (client) => {
    navigation.navigate('ClientDetail', { client });
  };

  const handleToggleStatus = (client) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';

    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir ${action} le compte de ${client.prenom} ${client.nom} ?`,
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
              const updatedClients = clients.map(c => {
                if (c.id === client.id) {
                  return { ...c, status: newStatus };
                }
                return c;
              });
              
              setClients(updatedClients);
              setIsLoading(false);
              
              const message = newStatus === 'active'
                ? `Le compte de ${client.prenom} ${client.nom} a été activé avec succès.`
                : `Le compte de ${client.prenom} ${client.nom} a été désactivé avec succès.`;
              
              Alert.alert('Succès', message);
            }, 1000);
          },
        },
      ]
    );
  };

  const handleTransferClient = (client) => {
    navigation.navigate('TransfertCompte', { 
      preSelectedClients: [client.id],
      collecteurId: collecteurId 
    });
  };

  const renderClientItem = ({ item }) => (
    <Card style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.prenom} {item.nom}</Text>
          <Text style={styles.clientAccount}>{item.numeroCompte}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.status === 'active' ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Actif' : 'Inactif'}
          </Text>
        </View>
      </View>
      
      <View style={styles.clientBalance}>
        <Text style={styles.balanceLabel}>Solde actuel</Text>
        <Text style={styles.balanceValue}>{item.solde.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')} FCFA</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewClient(item)}
        >
          <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Voir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleToggleStatus(item)}
        >
          <Ionicons 
            name={item.status === 'active' ? "close-circle-outline" : "checkmark-circle-outline"} 
            size={18} 
            color={item.status === 'active' ? theme.colors.error : theme.colors.success} 
          />
          <Text 
            style={[
              styles.actionButtonText, 
              { color: item.status === 'active' ? theme.colors.error : theme.colors.success }
            ]}
          >
            {item.status === 'active' ? 'Désactiver' : 'Activer'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleTransferClient(item)}
        >
          <Ionicons name="swap-horizontal-outline" size={18} color={theme.colors.info} />
          <Text style={[styles.actionButtonText, { color: theme.colors.info }]}>Transférer</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={collecteurInfo ? `Clients de ${collecteurInfo.prenom} ${collecteurInfo.nom}` : "Clients du collecteur"}
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
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>Tous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'active' && styles.activeFilterButton]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>Actifs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'inactive' && styles.activeFilterButton]}
            onPress={() => setFilter('inactive')}
          >
            <Text style={[styles.filterText, filter === 'inactive' && styles.activeFilterText]}>Inactifs</Text>
          </TouchableOpacity>
        </View>
        
        {/* Liste des clients */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredClients}
            renderItem={renderClientItem}
            keyExtractor={item => item.id.toString()}
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
                  {searchQuery.trim() !== '' 
                    ? 'Aucun client ne correspond à votre recherche' 
                    : 'Aucun client disponible pour ce collecteur'}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: theme.colors.lightGray,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  activeFilterText: {
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
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
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
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
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
  clientBalance: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
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
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default CollecteurClientsScreen;