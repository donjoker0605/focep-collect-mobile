// src/screens/Admin/CollecteurManagementScreen.js - VERSION CORRIGÉE
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

// MODIFICATION: Importer le hook au lieu des données mockées
import { useAdminCollecteurs } from '../../hooks/useAdminCollecteurs';

const CollecteurManagementScreen = ({ navigation }) => {
  // MODIFICATION: Utiliser le hook au lieu des données mockées
  const {
    collecteurs,
    loading,
    error,
    hasMore,
    totalElements,
    refreshing,
    fetchCollecteurs,
    createCollecteur,
    updateCollecteur,
    toggleCollecteurStatus,
    refreshCollecteurs,
    loadMoreCollecteurs,
    clearError,
  } = useAdminCollecteurs();

  // États locaux pour les filtres
  const [filteredCollecteurs, setFilteredCollecteurs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive

  // MODIFICATION: Utiliser les collecteurs du hook
  useEffect(() => {
    filterCollecteurs();
  }, [searchQuery, filter, collecteurs]);

  const filterCollecteurs = () => {
    let filtered = collecteurs;

    // Filtrer par statut
    if (filter !== 'all') {
      filtered = filtered.filter(collecteur => 
        filter === 'active' ? collecteur.active : !collecteur.active
      );
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(collecteur =>
        collecteur.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collecteur.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collecteur.adresseMail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (collecteur.telephone && collecteur.telephone.includes(searchQuery))
      );
    }

    setFilteredCollecteurs(filtered);
  };

  // MODIFICATION: Utiliser la fonction du hook
  const onRefresh = () => {
    refreshCollecteurs();
  };

  const handleAddCollecteur = () => {
    navigation.navigate('CollecteurCreationScreen');
  };

  const handleEditCollecteur = (collecteur) => {
    navigation.navigate('CollecteurCreationScreen', { 
      mode: 'edit', 
      collecteur 
    });
  };

  // MODIFICATION: Utiliser la fonction du hook
  const handleToggleStatus = async (collecteur) => {
    const newStatus = !collecteur.active;
    const action = newStatus ? 'activer' : 'désactiver';

    Alert.alert(
      `Confirmation`,
      `Êtes-vous sûr de vouloir ${action} le compte de ${collecteur.prenom} ${collecteur.nom} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            const result = await toggleCollecteurStatus(collecteur.id, newStatus);
            
            if (result.success) {
              const message = newStatus
                ? `Le compte de ${collecteur.prenom} ${collecteur.nom} a été activé avec succès.`
                : `Le compte de ${collecteur.prenom} ${collecteur.nom} a été désactivé avec succès.`;
              
              Alert.alert('Succès', message);
            } else {
              Alert.alert('Erreur', result.error || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleViewCollecteur = (collecteur) => {
    navigation.navigate('CollecteurDetailScreen', { collecteur });
  };

  const renderCollecteurItem = ({ item }) => (
    <Card style={styles.collecteurCard}>
      <View style={styles.collecteurHeader}>
        <View style={styles.collecteurInfo}>
          <Text style={styles.collecteurName}>{item.prenom} {item.nom}</Text>
          <Text style={styles.collecteurEmail}>{item.adresseMail}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.active ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={styles.statusText}>
            {item.active ? 'Actif' : 'Inactif'}
          </Text>
        </View>
      </View>
      
      <View style={styles.collecteurDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.detailText}>{item.telephone || 'Non renseigné'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="business-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.detailText}>
            {item.agence?.nomAgence || 'Agence non définie'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.detailText}>
            {item.totalClients || 0} client{(item.totalClients || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewCollecteur(item)}
        >
          <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Voir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditCollecteur(item)}
        >
          <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Modifier</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleToggleStatus(item)}
        >
          <Ionicons 
            name={item.active ? "close-circle-outline" : "checkmark-circle-outline"} 
            size={18} 
            color={item.active ? theme.colors.error : theme.colors.success} 
          />
          <Text 
            style={[
              styles.actionButtonText, 
              { color: item.active ? theme.colors.error : theme.colors.success }
            ]}
          >
            {item.active ? 'Désactiver' : 'Activer'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  // MODIFICATION: Gestion d'erreur du hook
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Gestion des collecteurs"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              clearError();
              fetchCollecteurs();
            }}
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
        title="Gestion des collecteurs"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCollecteur}
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
              placeholder="Rechercher un collecteur..."
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
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              Tous ({totalElements})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'active' && styles.activeFilterButton]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>
              Actifs
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'inactive' && styles.activeFilterButton]}
            onPress={() => setFilter('inactive')}
          >
            <Text style={[styles.filterText, filter === 'inactive' && styles.activeFilterText]}>
              Inactifs
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Liste des collecteurs */}
        {loading && collecteurs.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des collecteurs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCollecteurs}
            renderItem={renderCollecteurItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.collecteursList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            onEndReached={loadMoreCollecteurs}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && collecteurs.length > 0 ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={64} color={theme.colors.gray} />
                <Text style={styles.emptyText}>
                  {searchQuery.trim() !== '' 
                    ? 'Aucun collecteur ne correspond à votre recherche' 
                    : 'Aucun collecteur disponible'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleAddCollecteur}
                >
                  <Text style={styles.emptyButtonText}>Ajouter un collecteur</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// MODIFICATION: Ajout de styles pour l'état d'erreur
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
  collecteursList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  collecteurCard: {
    marginBottom: 16,
  },
  collecteurHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collecteurInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  collecteurEmail: {
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
  collecteurDetails: {
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
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
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
  // MODIFICATION: Nouveaux styles pour l'état d'erreur
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

export default CollecteurManagementScreen;