// src/screens/SuperAdmin/AdminManagementScreen.js
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

const AdminManagementScreen = ({ navigation }) => {
  const {
    loading,
    error,
    admins,
    loadAdmins,
    resetAdminPassword,
    clearError
  } = useSuperAdmin();

  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [searchQuery, filter, admins]);

  const filterAdmins = () => {
    let filtered = admins || [];

    // Filtrer par statut
    if (filter !== 'all') {
      filtered = filtered.filter(admin => 
        filter === 'active' ? admin.active : !admin.active
      );
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(admin =>
        admin.nom.toLowerCase().includes(query) ||
        admin.prenom.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query) ||
        (admin.agenceNom && admin.agenceNom.toLowerCase().includes(query))
      );
    }

    setFilteredAdmins(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdmins();
    setRefreshing(false);
  };

  const handleAddAdmin = () => {
    navigation.navigate('AdminCreation');
  };

  const handleResetPassword = (admin) => {
    Alert.prompt(
      'Réinitialisation de mot de passe',
      `Nouveau mot de passe pour ${admin.displayName}`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: async (newPassword) => {
            if (newPassword && newPassword.length >= 8) {
              const success = await resetAdminPassword(admin.id, newPassword, 'Reset par SuperAdmin');
              if (success) {
                Alert.alert('Succès', 'Mot de passe réinitialisé avec succès');
              }
            } else {
              Alert.alert('Erreur', 'Le mot de passe doit faire au moins 8 caractères');
            }
          },
        },
      ],
      'secure-text',
      '',
      'default'
    );
  };

  const handleViewAdmin = (admin) => {
    navigation.navigate('AdminDetail', { adminId: admin.id });
  };

  const renderAdminItem = ({ item }) => (
    <Card style={styles.adminCard}>
      <View style={styles.adminHeader}>
        <View style={styles.adminInfo}>
          <Text style={styles.adminName}>{item.displayName}</Text>
          <Text style={styles.adminEmail}>{item.email}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.active ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={styles.statusText}>
            {item.statusText}
          </Text>
        </View>
      </View>
      
      <View style={styles.adminDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.agenceNom || 'Aucune agence'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            Créé le {item.dateCreation ? new Date(item.dateCreation).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewAdmin(item)}
        >
          <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Détails</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleResetPassword(item)}
          disabled={loading}
        >
          <Ionicons name="key-outline" size={18} color={theme.colors.warning} />
          <Text style={[styles.actionButtonText, { color: theme.colors.warning }]}>
            Mot de passe
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Gestion des administrateurs"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddAdmin}
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
              placeholder="Rechercher un administrateur..."
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

        {/* Liste des administrateurs */}
        {loading && !refreshing && filteredAdmins.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des administrateurs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAdmins}
            renderItem={renderAdminItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.adminsList}
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
                  <Ionicons name="people" size={64} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyText}>
                    {searchQuery.trim() !== '' 
                      ? 'Aucun administrateur ne correspond à votre recherche' 
                      : 'Aucun administrateur trouvé'}
                  </Text>
                  {searchQuery.trim() === '' && (
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={handleAddAdmin}
                    >
                      <Text style={styles.emptyButtonText}>Ajouter un administrateur</Text>
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
  adminsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  adminCard: {
    marginBottom: 16,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  adminEmail: {
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
  adminDetails: {
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

export default AdminManagementScreen;