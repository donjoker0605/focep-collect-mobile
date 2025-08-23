// src/screens/SuperAdmin/AgenceManagementScreen.js
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
import { useSuperAdmin } from '../../hooks/useSuperAdmin';

const AgenceManagementScreen = ({ navigation }) => {
  const {
    loading,
    error,
    agences,
    loadAgences,
    clearError
  } = useSuperAdmin();

  const [filteredAgences, setFilteredAgences] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAgences();
  }, []);

  useEffect(() => {
    filterAgences();
  }, [searchQuery, filter, agences]);

  const filterAgences = () => {
    let filtered = agences || [];

    // Filtrer par statut
    if (filter !== 'all') {
      filtered = filtered.filter(agence => 
        filter === 'active' ? agence.active : !agence.active
      );
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(agence =>
        agence.nomAgence.toLowerCase().includes(query) ||
        agence.adresse.toLowerCase().includes(query) ||
        agence.email.toLowerCase().includes(query) ||
        agence.telephone.includes(searchQuery)
      );
    }

    setFilteredAgences(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgences();
    setRefreshing(false);
  };

  const handleAddAgence = () => {
    navigation.navigate('AgenceCreation');
  };

  const handleEditAgence = (agence) => {
    console.log('handleEditAgence appelé avec:', agence);
    console.log('Navigation directe vers AgenceCreation avec mode edit');
    navigation.navigate('AgenceCreation', { 
      mode: 'edit', 
      agence: agence 
    });
  };

  const handleToggleStatus = (agence) => {
    const newStatus = !agence.active;
    const action = newStatus ? 'activer' : 'désactiver';

    Alert.alert(
      `Confirmation`,
      `Êtes-vous sûr de vouloir ${action} l'agence ${agence.nomAgence} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            // TODO: Implémenter l'API de changement de statut d'agence
            // Pour l'instant, juste un message informatif
            Alert.alert(
              'Information', 
              'La fonction de changement de statut sera implémentée dans la prochaine version.'
            );
          },
        },
      ]
    );
  };

  const handleViewAgence = (agence) => {
    navigation.navigate('AgenceDetail', { agence });
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
          item.active ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={styles.statusText}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={styles.agenceDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.adresse}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.telephone}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            Créée le {item.dateCreation ? new Date(item.dateCreation).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewAgence(item)}
        >
          <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Détails</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditAgence(item)}
        >
          <Ionicons name="pencil-outline" size={18} color={theme.colors.secondary} />
          <Text style={[styles.actionButtonText, { color: theme.colors.secondary }]}>Modifier</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleToggleStatus(item)}
          disabled={loading}
        >
          <Ionicons 
            name={item.active ? "close-circle-outline" : "checkmark-circle-outline"} 
            size={18} 
            color={item.active ? theme.colors.warning : theme.colors.success} 
          />
          <Text 
            style={[
              styles.actionButtonText, 
              { color: item.active ? theme.colors.warning : theme.colors.success }
            ]}
          >
            {item.active ? 'Désactiver' : 'Activer'}
          </Text>
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddAgence}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
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
        
        {/* Gestion des erreurs */}
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

        {/* Liste des agences */}
        {loading && !refreshing && filteredAgences.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des agences...</Text>
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
              !loading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="business" size={64} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyText}>
                    {searchQuery.trim() !== '' 
                      ? 'Aucune agence ne correspond à votre recherche' 
                      : 'Aucune agence trouvée'}
                  </Text>
                  {searchQuery.trim() === '' && (
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={handleAddAgence}
                    >
                      <Text style={styles.emptyButtonText}>Ajouter une agence</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
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
    fontSize: 16,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: 4,
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
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: theme.colors.errorLight || 'rgba(255, 59, 48, 0.1)',
    borderColor: theme.colors.error,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
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
});

export default AgenceManagementScreen;