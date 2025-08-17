// src/screens/Admin/CollecteurManagementScreen.js
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
import { useAuth } from '../../hooks/useAuth';

const CollecteurManagementScreen = ({ navigation }) => {
  // 🔥 DÉTECTION DU RÔLE POUR PERMISSIONS DIFFÉRENCIÉES
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  // États pour les données - INITIALISATION SÉCURISÉE
  const [collecteurs, setCollecteurs] = useState([]);
  const [filteredCollecteurs, setFilteredCollecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
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
        // VÉRIFICATION AVANT ASSIGNATION
        const collecteursData = Array.isArray(response.data) ? response.data : [];
        setCollecteurs(collecteursData);
        setTotalElements(collecteursData.length);
      } else {
        setError(response.error || 'Erreur lors du chargement des collecteurs');
        setCollecteurs([]); // FALLBACK SÉCURISÉ
      }
    } catch (err) {
      console.error('Erreur lors du chargement des collecteurs:', err);
      setError(err.message || 'Erreur lors du chargement des collecteurs');
      setCollecteurs([]); // FALLBACK SÉCURISÉ
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCollecteurs = () => {
    // VÉRIFICATION AVANT FILTER
    if (!Array.isArray(collecteurs)) {
      setFilteredCollecteurs([]);
      return;
    }

    let filtered = [...collecteurs]; // COPIE SÉCURISÉE

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
    navigation.navigate('CollecteurCreationScreen', {
      onRefresh: () => loadCollecteurs(false)
    });
  };

  // 🔥 FONCTION CONDITIONNELLE - Seuls les SuperAdmin peuvent modifier les collecteurs
  const handleEditCollecteur = (collecteur) => {
    if (!isSuperAdmin) {
      Alert.alert('Accès refusé', 'Seuls les Super Administrateurs peuvent modifier les collecteurs');
      return;
    }
    
    navigation.navigate('CollecteurCreationScreen', { 
      mode: 'edit', 
      collecteur,
      onRefresh: () => loadCollecteurs(false)
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

  // RENDU SÉCURISÉ DES COLLECTEURS
  const renderCollecteurItem = ({ item }) => {
    // VÉRIFICATION DE L'ITEM
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

        <View style={styles.collecteurStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Clients</Text>
            <Text style={styles.statValue}>{item.totalClients || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Montant max retrait</Text>
            <Text style={styles.statValue}>{item.montantMaxRetrait || 0} FCFA</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Détails</Text>
          </TouchableOpacity>
          
          {/* 🔥 BOUTON MODIFIER CONDITIONNEL - Visible uniquement pour SuperAdmin */}
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditCollecteur(item)}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(item)}
          >
            <Ionicons 
              name={item.active ? "pause-circle-outline" : "play-circle-outline"} 
              size={20} 
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

  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Gestion des collecteurs"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des collecteurs...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Gestion des collecteurs"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadCollecteurs()}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Gestion des collecteurs"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleAddCollecteur}>
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={theme.colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un collecteur..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.textLight}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalElements}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {collecteurs.filter(c => c && c.active).length}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>
              {collecteurs.filter(c => c && !c.active).length}
            </Text>
            <Text style={styles.statLabel}>Inactifs</Text>
          </View>
        </View>

        {/* Filtres */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'active' && styles.activeFilter]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>
              Actifs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'inactive' && styles.activeFilter]}
            onPress={() => setFilter('inactive')}
          >
            <Text style={[styles.filterText, filter === 'inactive' && styles.activeFilterText]}>
              Inactifs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des collecteurs */}
        <FlatList
          data={filteredCollecteurs}
          renderItem={renderCollecteurItem}
          keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun collecteur trouvé' : 'Aucun collecteur enregistré'}
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddCollecteur}>
                <Text style={styles.emptyButtonText}>Ajouter un collecteur</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  activeFilterText: {
    color: theme.colors.white,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  collecteurCard: {
    marginBottom: 12,
    padding: 16,
  },
  collecteurHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  collecteurInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  collecteurEmail: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  collecteurStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.lightGray,
  },
  statItem: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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