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
import { collecteurService } from '../../services';

const CollecteurManagementScreen = ({ navigation }) => {
  // États pour les données
  const [collecteurs, setCollecteurs] = useState([]); // ✅ INITIALISATION CORRECTE
  const [filteredCollecteurs, setFilteredCollecteurs] = useState([]); // ✅ INITIALISATION CORRECTE
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [totalElements, setTotalElements] = useState(0);

  // Charger les collecteurs au démarrage
  useEffect(() => {
    loadCollecteurs();
  }, []);

  // Filtrer quand les données ou filtres changent
  useEffect(() => {
    filterCollecteurs();
  }, [searchQuery, filter, collecteurs]);

  const loadCollecteurs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const response = await collecteurService.getAllCollecteurs();
      
      if (response.success) {
        // ✅ VÉRIFICATION AVANT ASSIGNATION
        const collecteursData = Array.isArray(response.data) ? response.data : [];
        setCollecteurs(collecteursData);
        setTotalElements(collecteursData.length);
      } else {
        setError(response.error || 'Erreur lors du chargement des collecteurs');
        setCollecteurs([]); // ✅ FALLBACK SÉCURISÉ
      }
    } catch (err) {
      console.error('Erreur lors du chargement des collecteurs:', err);
      setError(err.message || 'Erreur lors du chargement des collecteurs');
      setCollecteurs([]); // ✅ FALLBACK SÉCURISÉ
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCollecteurs = () => {
    // ✅ VÉRIFICATION AVANT FILTER
    if (!Array.isArray(collecteurs)) {
      setFilteredCollecteurs([]);
      return;
    }

    let filtered = [...collecteurs]; // ✅ COPIE SÉCURISÉE

    // Filtrer par statut
    if (filter !== 'all') {
      filtered = filtered.filter(collecteur => 
        collecteur && (filter === 'active' ? collecteur.active : !collecteur.active)
      );
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(collecteur => {
        if (!collecteur) return false;
        
        const searchLower = searchQuery.toLowerCase();
        return (
          (collecteur.nom || '').toLowerCase().includes(searchLower) ||
          (collecteur.prenom || '').toLowerCase().includes(searchLower) ||
          (collecteur.adresseMail || '').toLowerCase().includes(searchLower) ||
          (collecteur.telephone || '').includes(searchQuery)
        );
      });
    }

    setFilteredCollecteurs(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCollecteurs(false);
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

  const handleToggleStatus = async (collecteur) => {
    if (!collecteur) return;
    
    const newStatus = !collecteur.active;
    const action = newStatus ? 'activer' : 'désactiver';
    
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} ${collecteur.prenom} ${collecteur.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const response = await collecteurService.toggleStatus(collecteur.id, newStatus);
              if (response.success) {
                loadCollecteurs(false);
                Alert.alert('Succès', `Collecteur ${action} avec succès`);
              } else {
                Alert.alert('Erreur', response.error || `Erreur lors de l'${action}ion`);
              }
            } catch (err) {
              Alert.alert('Erreur', err.message || `Erreur lors de l'${action}ion`);
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = (collecteur) => {
    if (!collecteur) return;
    navigation.navigate('CollecteurDetailScreen', { collecteur });
  };

  // ✅ VÉRIFICATION SÉCURISÉE POUR LE RENDU
  const renderCollecteurItem = ({ item }) => {
    // ✅ VÉRIFICATION DE L'ITEM
    if (!item) return null;

    return (
      <Card style={styles.collecteurCard}>
        <View style={styles.collecteurHeader}>
          <View style={styles.collecteurInfo}>
            <Text style={styles.collecteurName}>
              {`${item.prenom || ''} ${item.nom || ''}`.trim() || 'Nom inconnu'}
            </Text>
            <Text style={styles.collecteurEmail}>
              {item.adresseMail || 'Email non renseigné'}
            </Text>
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
            <Ionicons name="call" size={16} color={theme.colors.gray} />
            <Text style={styles.detailText}>
              {item.telephone || 'Non renseigné'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="business" size={16} color={theme.colors.gray} />
            <Text style={styles.detailText}>
              {item.agence?.nomAgence || 'Agence non définie'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash" size={16} color={theme.colors.gray} />
            <Text style={styles.detailText}>
              Montant max: {item.montantMaxRetrait || 0} FCFA
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="eye" size={16} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Détails</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditCollecteur(item)}
          >
            <Ionicons name="pencil" size={16} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(item)}
          >
            <Ionicons 
              name={item.active ? "pause" : "play"} 
              size={16} 
              color={item.active ? theme.colors.warning : theme.colors.success} 
            />
            <Text style={[
              styles.actionButtonText,
              { color: item.active ? theme.colors.warning : theme.colors.success }
            ]}>
              {item.active ? 'Désactiver' : 'Activer'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // ✅ RENDU CONDITIONNEL AVEC GESTION D'ERREUR
  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Gestion des collecteurs"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadCollecteurs()}
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
        showBackButton={true}
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
            data={filteredCollecteurs} // ✅ TOUJOURS UN TABLEAU
            renderItem={renderCollecteurItem}
            keyExtractor={item => item?.id?.toString() || Math.random().toString()} // ✅ FALLBACK SÉCURISÉ
            contentContainerStyle={styles.collecteursList}
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