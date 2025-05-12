// src/screens/Admin/AgenceManagementScreen.js
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
import EmptyState from '../../components/EmptyState/EmptyState';
import theme from '../../theme';
import { useAuth } from '../../hooks/useAuth';

// API Service pour les agences (à créer)
// import { getAllAgences, createAgence, updateAgence } from '../../api/agence';

// Données fictives pour la démo
const mockAgences = [
  {
    id: 1,
    nomAgence: 'Agence Centrale',
    adresse: 'Rue de la République, Douala',
    telephone: '+237 655 123 456',
    email: 'agence.centrale@focep.cm',
    status: 'active',
    nombreCollecteurs: 12,
    nombreClients: 452,
  },
  {
    id: 2,
    nomAgence: 'Agence Nord',
    adresse: 'Avenue du Président, Yaoundé',
    telephone: '+237 677 234 567',
    email: 'agence.nord@focep.cm',
    status: 'active',
    nombreCollecteurs: 8,
    nombreClients: 310,
  },
  {
    id: 3,
    nomAgence: 'Agence Est',
    adresse: 'Boulevard Central, Bertoua',
    telephone: '+237 698 345 678',
    email: 'agence.est@focep.cm',
    status: 'inactive',
    nombreCollecteurs: 0,
    nombreClients: 0,
  },
];

const AgenceManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [agences, setAgences] = useState(mockAgences);
  const [filteredAgences, setFilteredAgences] = useState(mockAgences);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Vérifier si l'utilisateur est super admin
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    filterAgences();
  }, [searchQuery, filter, agences]);

  const filterAgences = () => {
    let filtered = agences;

    // Filtrer par statut
    if (filter !== 'all') {
      filtered = filtered.filter(agence => agence.status === filter);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(agence =>
        agence.nomAgence.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agence.adresse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agence.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agence.telephone.includes(searchQuery)
      );
    }

    setFilteredAgences(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);

    // Simuler une requête API
    setTimeout(() => {
      // Dans une implémentation réelle, charger les données depuis l'API
      // getAllAgences().then(data => setAgences(data));
      setRefreshing(false);
    }, 1500);
  };

  const handleAddAgence = () => {
    // Navigation vers l'écran de création d'agence
    navigation.navigate('AgenceCreateScreen');
  };

  const handleEditAgence = (agence) => {
    // Navigation vers l'écran d'édition d'agence
    navigation.navigate('AgenceEditScreen', { agence });
  };

  const handleToggleStatus = (agence) => {
    const newStatus = agence.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';

    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir ${action} l'agence ${agence.nomAgence} ?`,
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
              const updatedAgences = agences.map(a => {
                if (a.id === agence.id) {
                  return { ...a, status: newStatus };
                }
                return a;
              });
              
              setAgences(updatedAgences);
              setIsLoading(false);
              
              const message = newStatus === 'active'
                ? `L'agence ${agence.nomAgence} a été activée avec succès.`
                : `L'agence ${agence.nomAgence} a été désactivée avec succès.`;
              
              Alert.alert('Succès', message);
            }, 1000);
          },
        },
      ]
    );
  };

  const handleViewAgence = (agence) => {
    // Navigation vers l'écran de détail d'agence
    navigation.navigate('AgenceDetailScreen', { agence });
  };

  const handleViewCollecteurs = (agence) => {
    // Navigation vers l'écran de collecteurs de l'agence
    navigation.navigate('CollecteurManagementScreen', { agenceId: agence.id });
  };

  const handleAgenceParameters = (agence) => {
    // Navigation vers l'écran de paramètres de commission pour l'agence
    navigation.navigate('CommissionParametersScreen', { 
      entityType: 'agence',
      entityId: agence.id,
      entityName: agence.nomAgence
    });
  };

  const renderAgenceItem = ({ item }) => (
    <Card style={styles.agenceCard}>
      <View style={styles.agenceHeader}>
        <View style={styles.agenceInfo}>
          <Text style={styles.agenceName}>{item.nomAgence}</Text>
          <Text style={styles.agenceEmail}>{item.email}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.status === 'active' ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={styles.agenceDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.detailText}>{item.adresse}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.detailText}>{item.telephone}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>
              {item.nombreCollecteurs} collecteur{item.nombreCollecteurs !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>
              {item.nombreClients} client{item.nombreClients !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewAgence(item)}
        >
          <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Voir</Text>
        </TouchableOpacity>
        
        {isSuperAdmin && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditAgence(item)}
          >
            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>
        )}
        
        {isSuperAdmin && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleToggleStatus(item)}
            disabled={item.nombreCollecteurs > 0 && item.status === 'active'}
          >
            <Ionicons 
              name={item.status === 'active' ? "close-circle-outline" : "checkmark-circle-outline"} 
              size={18} 
              color={
                item.nombreCollecteurs > 0 && item.status === 'active'
                ? theme.colors.gray
                : item.status === 'active' 
                  ? theme.colors.error 
                  : theme.colors.success
              } 
            />
            <Text 
              style={[
                styles.actionButtonText, 
                { 
                  color: item.nombreCollecteurs > 0 && item.status === 'active'
                  ? theme.colors.gray
                  : item.status === 'active' 
                    ? theme.colors.error 
                    : theme.colors.success
                }
              ]}
            >
              {item.status === 'active' ? 'Désactiver' : 'Activer'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewCollecteurs(item)}
        >
          <Ionicons name="people" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Collecteurs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleAgenceParameters(item)}
        >
          <Ionicons name="settings-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Paramètres</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Gestion des agences"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          isSuperAdmin ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddAgence}
            >
              <Ionicons name="add" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          ) : null
        }
      />
      
      <View style={styles.contentContainer}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.colors.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une agence..."
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
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>Toutes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'active' && styles.activeFilterButton]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>Actives</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'inactive' && styles.activeFilterButton]}
            onPress={() => setFilter('inactive')}
          >
            <Text style={[styles.filterText, filter === 'inactive' && styles.activeFilterText]}>Inactives</Text>
          </TouchableOpacity>
        </View>
        
        {/* Liste des agences */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAgences}
            renderItem={renderAgenceItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.agencesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                type="info"
                title="Aucune agence trouvée"
                message={searchQuery.trim() !== '' 
                  ? 'Aucune agence ne correspond à votre recherche' 
                  : 'Aucune agence disponible'}
                actionButton={isSuperAdmin}
                actionButtonTitle="Ajouter une agence"
                onActionButtonPress={handleAddAgence}
              />
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
  addButton: {
    padding: 8,
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
  agencesList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  agenceCard: {
    marginBottom: 16,
    padding: 16,
  },
  agenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agenceInfo: {
    flex: 1,
  },
  agenceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  agenceEmail: {
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
  agenceDetails: {
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
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: theme.colors.lightGray,
    paddingTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minWidth: '25%',
    marginBottom: 8,
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
});

export default AgenceManagementScreen;