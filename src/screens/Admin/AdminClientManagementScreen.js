// src/screens/Admin/AdminClientManagementScreen.js - HOTFIX AFFICHAGE
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import useClients from '../../hooks/useClients';
import adminService from '../../services/adminService';

const AdminClientManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // Hook principal pour tous les clients
  const {
    clients: allClients,
    loading: clientsLoading,
    error: clientsError,
    refreshing: clientsRefreshing,
    userRole,
    canAccess,
    refreshClients,
    searchClients,
    clearError,
    totalClients
  } = useClients(); // Pas de collecteurId = tous les clients de l'agence

  // 🔍 DEBUG - Surveiller les changements de données
  useEffect(() => {
    console.log('🔍 AdminClientManagementScreen - Données clients mises à jour:', {
      count: allClients.length,
      clients: allClients.map(c => ({ id: c.id, nom: c.nom, prenom: c.prenom })),
      loading: clientsLoading,
      error: clientsError,
      canAccess
    });
  }, [allClients, clientsLoading, clientsError, canAccess]);

  // États locaux
  const [collecteurs, setCollecteurs] = useState([]);
  const [loadingCollecteurs, setLoadingCollecteurs] = useState(true);
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'by-collecteur'
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalCollecteurs: 0
  });

  // Hook pour les clients d'un collecteur spécifique
  const {
    clients: collecteurClients,
    loading: collecteurClientsLoading,
    refreshClients: refreshCollecteurClients,
  } = useClients(selectedCollecteur?.id);

  // 🔄 CHARGEMENT DES COLLECTEURS
  const loadCollecteurs = useCallback(async () => {
    try {
      setLoadingCollecteurs(true);
      const response = await adminService.getCollecteurs({ size: 100 });
      
      if (response.success) {
        const collecteursData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.content || [];
        
        setCollecteurs(collecteursData);
        console.log('✅ Collecteurs chargés:', collecteursData.length);
      } else {
        console.error('❌ Erreur chargement collecteurs:', response.error);
      }
    } catch (error) {
      console.error('❌ Erreur chargement collecteurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les collecteurs');
    } finally {
      setLoadingCollecteurs(false);
    }
  }, []);

  // 📊 CALCUL DES STATISTIQUES
  const calculateStats = useCallback(() => {
    console.log('📊 Calcul des stats pour', allClients.length, 'clients');
    const activeClients = allClients.filter(c => c.valide).length;
    const inactiveClients = allClients.filter(c => !c.valide).length;
    
    const newStats = {
      totalClients: allClients.length,
      activeClients,
      inactiveClients,
      totalCollecteurs: collecteurs.length
    };
    
    setStats(newStats);
    console.log('📊 Stats calculées:', newStats);
  }, [allClients, collecteurs.length]);

  // 🔍 GESTION DE LA RECHERCHE
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    if (text.length === 0) {
      if (activeTab === 'all') {
        refreshClients();
      } else if (selectedCollecteur) {
        refreshCollecteurClients();
      }
    } else if (text.length >= 2) {
      if (activeTab === 'all') {
        searchClients(text);
      }
    }
  }, [activeTab, selectedCollecteur, refreshClients, refreshCollecteurClients, searchClients]);

  // 📋 CHANGEMENT D'ONGLET
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSelectedCollecteur(null);
  }, []);

  // 👤 SÉLECTION D'UN COLLECTEUR
  const handleSelectCollecteur = useCallback((collecteur) => {
    setSelectedCollecteur(collecteur);
    setSearchQuery('');
    console.log('👤 Collecteur sélectionné:', collecteur.id, collecteur.nom);
  }, []);

  // 🎯 NAVIGATION VERS DÉTAILS CLIENT
  const handleClientPress = useCallback((client) => {
    navigation.navigate('ClientDetail', {
      client: client,
      clientId: client.id,
      isAdminView: true,
      collecteurInfo: selectedCollecteur
    });
  }, [navigation, selectedCollecteur]);

  // 🏢 NAVIGATION VERS DÉTAILS COLLECTEUR
  const handleCollecteurPress = useCallback((collecteur) => {
    navigation.navigate('CollecteurDetailScreen', {
      collecteurId: collecteur.id,
      collecteur: collecteur
    });
  }, [navigation]);

  // ➕ CRÉATION D'UN NOUVEAU CLIENT
  const handleAddClient = useCallback(() => {
    if (selectedCollecteur) {
      navigation.navigate('ClientAddEdit', { 
        mode: 'add',
        presetCollecteur: selectedCollecteur
      });
    } else {
      navigation.navigate('ClientAddEdit', { mode: 'add' });
    }
  }, [navigation, selectedCollecteur]);

  // 🔄 RAFRAÎCHISSEMENT GLOBAL
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Rafraîchissement global...');
    await Promise.all([
      loadCollecteurs(),
      refreshClients()
    ]);
  }, [loadCollecteurs, refreshClients]);

  // Chargement initial
  useFocusEffect(
    useCallback(() => {
      loadCollecteurs();
    }, [loadCollecteurs])
  );

  // Calcul des stats quand les données changent
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // 🔍 GESTION DES ERREURS
  useEffect(() => {
    if (clientsError) {
      console.error('❌ Erreur clients:', clientsError);
      Alert.alert('Erreur', clientsError);
    }
  }, [clientsError]);

  // 🎨 RENDU CARD STATISTIQUES
  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>📊 Vue d'ensemble</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalClients}</Text>
          <Text style={styles.statLabel}>Total clients</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>
            {stats.activeClients}
          </Text>
          <Text style={styles.statLabel}>Actifs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.error }]}>
            {stats.inactiveClients}
          </Text>
          <Text style={styles.statLabel}>Inactifs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {stats.totalCollecteurs}
          </Text>
          <Text style={styles.statLabel}>Collecteurs</Text>
        </View>
      </View>
    </Card>
  );

  // 🎨 RENDU ITEM CLIENT - AVEC DEBUG
  const renderClientItem = ({ item, index }) => {
    console.log(`🎨 Rendu client ${index}:`, { id: item.id, nom: item.nom, prenom: item.prenom });
    
    return (
      <Card style={styles.clientCard}>
        <TouchableOpacity onPress={() => handleClientPress(item)}>
          <View style={styles.clientHeader}>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>
                {item.prenom} {item.nom}
              </Text>
              <Text style={styles.clientDetails}>
                CNI: {item.numeroCni}
              </Text>
              <Text style={styles.clientDetails}>
                Tél: {item.telephone}
              </Text>
              {item.collecteurNom && (
                <Text style={styles.clientCollecteur}>
                  Collecteur: {item.collecteurNom}
                </Text>
              )}
            </View>
            
            <View style={styles.clientActions}>
              <View style={[
                styles.statusBadge,
                item.valide ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={styles.statusText}>
                  {item.valide ? 'Actif' : 'Inactif'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  // 🎨 RENDU PRINCIPAL
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Gestion des clients"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleAddClient}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        {/* 🔍 DEBUG INFO */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              DEBUG: {allClients.length} clients • Loading: {clientsLoading ? 'OUI' : 'NON'} • 
              CanAccess: {canAccess ? 'OUI' : 'NON'}
            </Text>
          </View>
        )}

        {/* Statistiques */}
        {renderStatsCard()}

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans tous les clients..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* 🔍 SECTION DEBUG */}
        {!canAccess ? (
          <View style={styles.noAccessContainer}>
            <Ionicons name="lock-closed" size={48} color={theme.colors.textLight} />
            <Text style={styles.noAccessText}>
              Accès non autorisé aux données clients
            </Text>
            <Text style={styles.noAccessSubtext}>
              Rôle: {userRole} • Veuillez vérifier vos permissions
            </Text>
          </View>
        ) : clientsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des clients...</Text>
          </View>
        ) : clientsError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={styles.errorText}>
              Erreur: {clientsError}
            </Text>
            <TouchableOpacity onPress={refreshClients} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // 🎨 LISTE DES CLIENTS
          <View style={styles.clientsContainer}>
            <Text style={styles.sectionTitle}>
              {allClients.length} client{allClients.length > 1 ? 's' : ''} trouvé{allClients.length > 1 ? 's' : ''}
            </Text>
            
            <FlatList
              data={allClients}
              renderItem={renderClientItem}
              keyExtractor={item => `all-${item.id}`}
              refreshControl={
                <RefreshControl 
                  refreshing={clientsRefreshing} 
                  onRefresh={refreshClients}
                  colors={[theme.colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={64} color={theme.colors.textLight} />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'Aucun client trouvé' : 'Aucun client dans cette agence'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {!searchQuery && 'Les clients devraient s\'afficher ici'}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={allClients.length === 0 ? styles.emptyListContainer : undefined}
            />
          </View>
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
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  debugInfo: {
    backgroundColor: '#fff3cd',
    padding: 8,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  statsCard: {
    margin: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 25,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: theme.colors.text,
  },
  clientsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  clientCard: {
    marginBottom: 12,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  clientCollecteur: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  clientActions: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 32,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AdminClientManagementScreen;