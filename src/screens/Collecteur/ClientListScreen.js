// src/screens/Collecteur/ClientListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import theme from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { clientService } from '../../services';


const ClientListScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  // Charger les VRAIS clients depuis l'API
  const loadClients = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      // Appel API réel
      console.log('🔄 Chargement des clients pour collecteur:', user.id);
      const clientsData = await clientService.getClientsByCollecteur(user.id);
      
      // S'assurer que c'est un tableau
      const clientsList = Array.isArray(clientsData) ? clientsData : [];
      console.log(`✅ ${clientsList.length} clients chargés`);
      
      setClients(clientsList);
      
    } catch (err) {
      console.error('❌ Erreur chargement clients:', err);
      setError(err.message || 'Erreur lors du chargement des clients');
      setClients([]); // Tableau vide en cas d'erreur
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  // Charger les clients au montage du composant et à chaque changement de statut de connexion
  useEffect(() => {
    if (user?.id) {
      loadClients();
    }
  }, [user?.id, loadClients]);

  // Filtrer les clients lorsque les filtres ou la recherche changent
  useEffect(() => {
    let filtered = clients;

    if (filter !== 'all') {
      filtered = filtered.filter(client => 
        filter === 'active' ? client.valide : !client.valide
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(client =>
        client.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.numeroCni?.includes(searchQuery) ||
        client.telephone?.includes(searchQuery)
      );
    }

    setFilteredClients(filtered);
  }, [searchQuery, filter, clients]);

  // Fonction de filtrage des clients
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
        (client.numeroCompte && client.numeroCompte.includes(searchQuery)) ||
        (client.numeroCni && client.numeroCni.includes(searchQuery)) ||
        (client.telephone && client.telephone.includes(searchQuery))
      );
    }

    setFilteredClients(filtered);
  };

  // Fonction de rafraîchissement
  const onRefresh = () => {
    loadClients(true);
  };

  const handleAddClient = () => {
    // Navigation vers l'écran d'ajout de client
    navigation.navigate('ClientAddEdit', { mode: 'add' });
  };

  const handleEditClient = (client) => {
    // Navigation vers l'écran de modification de client
    navigation.navigate('ClientAddEdit', { mode: 'edit', client });
  };

  const handleViewClient = (client) => {
    // Navigation vers l'écran de détail du client
    navigation.navigate('ClientDetail', { client });
  };

  // Rendu de l'indicateur d'état
  const renderErrorBanner = () => {
    if (!error) return null;
    
    return (
      <View style={styles.errorBanner}>
        <Ionicons 
          name={isOnline ? "information-circle" : "cloud-offline"} 
          size={20} 
          color={theme.colors.white} 
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  };

  const handleToggleStatus = (client) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'désactiver';

    Alert.alert(
      `Confirmation`,
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

  const renderClientItem = ({ item }) => (
    <Card style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.prenom} {item.nom}</Text>
          <Text style={styles.clientAccount}>
            {item.numeroCompte || `Client #${item.id}`}
          </Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.valide ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={styles.statusText}>
            {item.valide ? 'Actif' : 'Inactif'}
          </Text>
        </View>
      </View>
      
      <View style={styles.clientDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="id-card-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.detailText}>{item.numeroCni}</Text>
        </View>
        {item.telephone && (
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={16} color={theme.colors.textLight} />
            <Text style={styles.detailText}>{item.telephone}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewClient(item)}
        >
          <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Voir</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Mes Clients"
        showBackButton={false}
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddClient}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.contentContainer}>
        {/* Afficher l'indicateur d'erreur/connexion */}
        {renderErrorBanner()}
        
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
                    : 'Aucun client disponible'}
                </Text>
                {searchQuery.trim() === '' && (
                  <Button
                    title="Ajouter un client"
                    onPress={handleAddClient}
                    variant="outlined"
                    style={styles.emptyButton}
                  />
                )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  soldeText: {
    color: theme.colors.primary,
    fontWeight: '500',
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
    width: 200,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 8,
  },
  errorText: {
    color: theme.colors.white,
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  }
});

export default ClientListScreen;