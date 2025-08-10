// src/screens/Admin/ClientManagementScreen.js
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
import { clientService } from '../../services';

const ClientManagementScreen = ({ navigation }) => {
  // États pour les données
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [totalElements, setTotalElements] = useState(0);

  // Charger les clients au démarrage
  useEffect(() => {
    loadClients();
  }, []);

  // Filtrer quand les données ou filtres changent
  useEffect(() => {
    filterClients();
  }, [searchQuery, filter, clients]);

  const loadClients = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const response = await clientService.getAllClients();
      
      if (response.success) {
        // La réponse a une structure paginée: {data: {content: [...], totalElements: N}}
        const clientsData = response.data?.content || response.data || [];
        const total = response.data?.totalElements || clientsData.length || 0;
        
        console.log('📋 Clients reçus:', {
          clientsData: Array.isArray(clientsData) ? clientsData.length : 'not array',
          total,
          firstClient: clientsData[0] || null
        });
        
        setClients(Array.isArray(clientsData) ? clientsData : []);
        setTotalElements(total);
      } else {
        setError(response.error || 'Erreur lors du chargement des clients');
        setClients([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
      setError(err.message || 'Erreur lors du chargement des clients');
      setClients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterClients = () => {
    if (!Array.isArray(clients)) {
      setFilteredClients([]);
      return;
    }

    let filtered = [...clients];

    // Filtrer par statut
    if (filter !== 'all') {
      filtered = filtered.filter(client => 
        client && (filter === 'active' ? client.valide : !client.valide)
      );
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(client => {
        if (!client) return false;
        
        const searchLower = searchQuery.toLowerCase();
        return (
          (client.nom || '').toLowerCase().includes(searchLower) ||
          (client.prenom || '').toLowerCase().includes(searchLower) ||
          (client.telephone || '').includes(searchQuery) ||
          (client.collecteurNom || '').toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredClients(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients(false);
  };

  const handleViewDetails = (client) => {
    if (!client) return;
    navigation.navigate('ClientDetailScreen', { client });
  };

  const handleToggleStatus = async (client) => {
    if (!client) return;
    
    const newStatus = !client.valide;
    const action = newStatus ? 'activer' : 'désactiver';
    
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} ${client.prenom} ${client.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const response = await clientService.toggleClientStatus(client.id, newStatus);
              if (response.success) {
                loadClients(false);
                Alert.alert('Succès', `Client ${action} avec succès`);
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

  const renderClientItem = ({ item }) => {
    if (!item) return null;

    return (
      <Card style={styles.clientCard}>
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {`${item.prenom || ''} ${item.nom || ''}`.trim() || 'Nom inconnu'}
            </Text>
            <Text style={styles.clientPhone}>
              {item.telephone || 'Téléphone non renseigné'}
            </Text>
            <Text style={styles.collecteurName}>
              Collecteur: {item.collecteurNom || 'Non assigné'}
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

        <View style={styles.clientStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Épargne totale</Text>
            <Text style={styles.statValue}>{item.totalEpargne || 0} FCFA</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Dernière opération</Text>
            <Text style={styles.statValue}>
              {item.derniereOperation || 'Aucune'}
            </Text>
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
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(item)}
          >
            <Ionicons 
              name={item.valide ? "close-circle-outline" : "checkmark-circle-outline"} 
              size={20} 
              color={item.valide ? theme.colors.error : theme.colors.success} 
            />
            <Text style={[
              styles.actionButtonText,
              { color: item.valide ? theme.colors.error : theme.colors.success }
            ]}>
              {item.valide ? 'Désactiver' : 'Activer'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Gestion des clients"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des clients...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Gestion des clients"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadClients()}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Gestion des clients"
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        {/* Barre de recherche et filtres */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={theme.colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un client..."
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
              {clients.filter(c => c && c.valide).length}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>
              {clients.filter(c => c && !c.valide).length}
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

        {/* Liste des clients */}
        <FlatList
          data={filteredClients}
          renderItem={renderClientItem}
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
                {searchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
              </Text>
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
  clientCard: {
    marginBottom: 12,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  collecteurName: {
    fontSize: 14,
    color: theme.colors.primary,
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
  clientStats: {
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