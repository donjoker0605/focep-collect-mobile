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

// Données fictives pour la démo
const mockAdmins = [
  {
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    adresseMail: 'jean.dupont@focep.cm',
    telephone: '+237 655 123 456',
    agence: {
      id: 1,
      nomAgence: 'Agence Centrale'
    },
    status: 'active',
    totalCollecteurs: 5,
  },
  {
    id: 2,
    nom: 'Martin',
    prenom: 'Sophie',
    adresseMail: 'sophie.martin@focep.cm',
    telephone: '+237 677 234 567',
    agence: {
      id: 1,
      nomAgence: 'Agence Centrale'
    },
    status: 'active',
    totalCollecteurs: 3,
  },
  {
    id: 3,
    nom: 'Dubois',
    prenom: 'Pierre',
    adresseMail: 'pierre.dubois@focep.cm',
    telephone: '+237 698 345 678',
    agence: {
      id: 2,
      nomAgence: 'Agence Nord'
    },
    status: 'inactive',
    totalCollecteurs: 0,
  },
];

const AdminManagementScreen = ({ navigation }) => {
  const [admins, setAdmins] = useState(mockAdmins);
  const [filteredAdmins, setFilteredAdmins] = useState(mockAdmins);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    filterAdmins();
  }, [searchQuery, filter, admins]);

  const filterAdmins = () => {
    let filtered = admins;

    // Filtrer par statut
    if (filter !== 'all') {
      filtered = filtered.filter(admin => admin.status === filter);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(admin =>
        admin.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.adresseMail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.telephone.includes(searchQuery)
      );
    }

    setFilteredAdmins(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);

    // Simuler une requête API
    setTimeout(() => {
      // Dans une implémentation réelle, vous récupéreriez les données du serveur
      setRefreshing(false);
    }, 1500);
  };

  const handleAddAdmin = () => {
    navigation.navigate('AdminCreationScreen');
  };

  const handleEditAdmin = (admin) => {
    navigation.navigate('AdminEditScreen', { admin });
  };

  const handleToggleStatus = (admin) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';

    Alert.alert(
      `Confirmation`,
      `Êtes-vous sûr de vouloir ${action} le compte de ${admin.prenom} ${admin.nom} ?`,
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
              const updatedAdmins = admins.map(a => {
                if (a.id === admin.id) {
                  return { ...a, status: newStatus };
                }
                return a;
              });
              
              setAdmins(updatedAdmins);
              setIsLoading(false);
              
              const message = newStatus === 'active'
                ? `Le compte de ${admin.prenom} ${admin.nom} a été activé avec succès.`
                : `Le compte de ${admin.prenom} ${admin.nom} a été désactivé avec succès.`;
              
              Alert.alert('Succès', message);
            }, 1000);
          },
        },
      ]
    );
  };

  const handleViewAdmin = (admin) => {
    navigation.navigate('AdminDetail', { admin });
  };

  const renderAdminItem = ({ item }) => (
    <Card style={styles.adminCard}>
      <View style={styles.adminHeader}>
        <View style={styles.adminInfo}>
          <Text style={styles.adminName}>{item.prenom} {item.nom}</Text>
          <Text style={styles.adminEmail}>{item.adresseMail}</Text>
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
      
      <View style={styles.adminDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.detailText}>{item.telephone}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="business-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.detailText}>{item.agence.nomAgence}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>
              {item.totalCollecteurs} collecteur{item.totalCollecteurs !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewAdmin(item)}
        >
          <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Voir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditAdmin(item)}
        >
          <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Modifier</Text>
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
        
        {/* Liste des administrateurs */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
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
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={64} color={theme.colors.gray} />
                <Text style={styles.emptyText}>
                  {searchQuery.trim() !== '' 
                    ? 'Aucun administrateur ne correspond à votre recherche' 
                    : 'Aucun administrateur disponible'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleAddAdmin}
                >
                  <Text style={styles.emptyButtonText}>Ajouter un administrateur</Text>
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
});

export default AdminManagementScreen;