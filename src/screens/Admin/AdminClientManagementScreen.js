// src/screens/Admin/AdminClientManagementScreen.js - HOTFIX AFFICHAGE
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { adminCollecteurService } from '../../services';

const AdminClientManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // 🔥 NOUVELLE LOGIQUE : Utiliser les clients accessibles via admin-collecteur
  const [allAssignedClients, setAllAssignedClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [clientsRefreshing, setClientsRefreshing] = useState(false);
  const [canAccess, setCanAccess] = useState(true);
  const userRole = 'admin';

  // 🔍 DEBUG - Surveiller les changements de données
  useEffect(() => {
    console.log('🔍 AdminClientManagementScreen - Données clients mises à jour:', {
      count: allAssignedClients.length,
      clients: allAssignedClients.map(c => ({ id: c.id, nom: c.nom, prenom: c.prenom })),
      loading: clientsLoading,
      error: clientsError,
      canAccess
    });
  }, [allAssignedClients, clientsLoading, clientsError, canAccess]);

  // États locaux
  const [collecteurs, setCollecteurs] = useState([]);
  const [loadingCollecteurs, setLoadingCollecteurs] = useState(true);
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'by-collecteur'
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalCollecteurs: 0
  });

  // Clients filtrés selon la recherche et les critères AVEC RECHERCHE SEMI-AUTOMATIQUE
  const filteredClients = useMemo(() => {
    // Si une recherche est en cours, utiliser les résultats de recherche
    if (searchQuery.trim().length >= 2) {
      let filtered = searchResults;
      
      // Appliquer le filtre collecteur sur les résultats de recherche
      if (selectedCollecteur) {
        filtered = filtered.filter(c => c.collecteurId === selectedCollecteur.id);
      }
      
      return filtered;
    }
    
    // Sinon, utiliser la logique normale
    let filtered = allAssignedClients;
    
    // Filtrer par collecteur sélectionné
    if (selectedCollecteur) {
      filtered = filtered.filter(c => c.collecteurId === selectedCollecteur.id);
    }
    
    return filtered;
  }, [allAssignedClients, selectedCollecteur, searchQuery, searchResults]);

  // 🔥 CHARGEMENT DES COLLECTEURS ASSIGNÉS
  const loadCollecteurs = useCallback(async () => {
    try {
      setLoadingCollecteurs(true);
      const response = await adminCollecteurService.getAssignedCollecteurs({ size: 100 });
      
      if (response.success) {
        const collecteursData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.content || [];
        
        setCollecteurs(collecteursData);
        console.log('✅ Collecteurs assignés chargés:', collecteursData.length);
        
        // Charger aussi tous les clients de ces collecteurs
        await loadAllAssignedClients(collecteursData);
      } else {
        console.error('❌ Erreur chargement collecteurs assignés:', response.error);
        setClientsError(response.error || 'Erreur chargement collecteurs');
      }
    } catch (error) {
      console.error('❌ Erreur chargement collecteurs assignés:', error);
      setClientsError(error.message);
    } finally {
      setLoadingCollecteurs(false);
    }
  }, []);

  // 🔥 CHARGEMENT DE TOUS LES CLIENTS DES COLLECTEURS ASSIGNÉS
  const loadAllAssignedClients = useCallback(async (collecteursData = collecteurs) => {
    try {
      setClientsLoading(true);
      setClientsError(null);
      const allClients = [];
      
      for (const collecteur of collecteursData) {
        try {
          const clientsResponse = await adminCollecteurService.getAssignedCollecteurClients(
            collecteur.id,
            { page: 0, size: 100 }
          );
          
          if (clientsResponse.data) {
            const collecteurClients = Array.isArray(clientsResponse.data)
              ? clientsResponse.data
              : clientsResponse.data.content || [];
            
            // Enrichir avec info collecteur
            const enrichedClients = collecteurClients.map(client => ({
              ...client,
              collecteurNom: `${collecteur.prenom} ${collecteur.nom}`,
              collecteurId: collecteur.id,
              valide: client.active !== false
            }));
            
            allClients.push(...enrichedClients);
          }
        } catch (clientError) {
          console.warn(`⚠️ Erreur clients collecteur ${collecteur.id}:`, clientError.message);
        }
      }
      
      setAllAssignedClients(allClients);
      console.log(`✅ ${allClients.length} clients accessibles chargés`);
    } catch (error) {
      console.error('❌ Erreur chargement clients assignés:', error);
      setClientsError(error.message);
    } finally {
      setClientsLoading(false);
      setClientsRefreshing(false);
    }
  }, [collecteurs]);

  // 📊 CALCUL DES STATISTIQUES
  const calculateStats = useCallback(() => {
    console.log('📊 Calcul des stats pour', allAssignedClients.length, 'clients assignés');
    const activeClients = allAssignedClients.filter(c => c.valide).length;
    const inactiveClients = allAssignedClients.filter(c => !c.valide).length;
    
    const newStats = {
      totalClients: allAssignedClients.length,
      activeClients,
      inactiveClients,
      totalCollecteurs: collecteurs.length
    };
    
    setStats(newStats);
    console.log('📊 Stats calculées:', newStats);
  }, [allAssignedClients, collecteurs.length]);

  // 🔍 GESTION DE LA RECHERCHE SEMI-AUTOMATIQUE AMÉLIORÉE
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    
    // Debouncing pour éviter trop de calculs
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (text.trim().length === 0) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    const newTimeout = setTimeout(() => {
      performSearch(text.trim());
    }, 300); // Délai de 300ms pour la recherche semi-automatique
    
    setSearchTimeout(newTimeout);
  }, [searchTimeout]);
  
  const performSearch = useCallback((query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    const searchLower = query.toLowerCase();
    const results = allAssignedClients.filter(client => {
      if (!client) return false;
      
      // Recherche dans nom complet
      const fullName = `${client.prenom || ''} ${client.nom || ''}`.toLowerCase();
      if (fullName.includes(searchLower)) return true;
      
      // Recherche dans téléphone
      const phone = (client.telephone || '').toLowerCase();
      if (phone.includes(searchLower)) return true;
      
      // Recherche dans CNI
      const cni = (client.numeroCni || '').toLowerCase();
      if (cni.includes(searchLower)) return true;
      
      // Recherche dans collecteur
      const collecteur = (client.collecteurNom || '').toLowerCase();
      if (collecteur.includes(searchLower)) return true;
      
      // Recherche dans ville
      const ville = (client.ville || '').toLowerCase();
      if (ville.includes(searchLower)) return true;
      
      // Recherche dans quartier
      const quartier = (client.quartier || '').toLowerCase();
      if (quartier.includes(searchLower)) return true;
      
      return false;
    });
    
    setSearchResults(results);
    setIsSearching(false);
    console.log(`🔍 Recherche "${query}" : ${results.length} résultats trouvés`);
  }, [allAssignedClients]);

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
    // 🔥 Utiliser le nom correct de l'écran dans AdminStack
    navigation.navigate('ClientDetailScreen', {
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
    setClientsRefreshing(true);
    await loadCollecteurs();
  }, [loadCollecteurs]);

  // Fonction refresh pour la compatibility
  const refreshClients = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Chargement initial
  useFocusEffect(
    useCallback(() => {
      loadCollecteurs();
    }, [loadCollecteurs])
  );
  
  // 🧹 NETTOYAGE DES TIMEOUTS
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

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
              DEBUG: {allAssignedClients.length} clients assignés • {filteredClients.length} filtrés • Loading: {clientsLoading ? 'OUI' : 'NON'} • 
              CanAccess: {canAccess ? 'OUI' : 'NON'}
            </Text>
          </View>
        )}

        {/* Statistiques */}
        {renderStatsCard()}

        {/* Barre de recherche */}
        {/* 🔍 BARRE DE RECHERCHE SEMI-AUTOMATIQUE AMÉLIORÉE */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher clients (nom, téléphone, CNI, ville...)" 
            value={searchQuery}
            onChangeText={handleSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.searchSpinner} />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* 🔍 INDICATEUR RÉSULTATS DE RECHERCHE */}
        {searchQuery.trim().length >= 2 && (
          <View style={styles.searchResultsIndicator}>
            <Text style={styles.searchResultsText}>
              {isSearching 
                ? 'Recherche en cours...'
                : `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''} pour "${searchQuery}"`
              }
            </Text>
            {searchResults.length > 0 && !isSearching && (
              <Text style={styles.searchHint}>
                Tapez pour affiner ou effacez pour voir tous les clients
              </Text>
            )}
          </View>
        )}

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
              {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} accessible{filteredClients.length > 1 ? 's' : ''}
              {searchQuery && ` (recherche: "${searchQuery}")`}
              {selectedCollecteur && ` - ${selectedCollecteur.nom}`}
            </Text>
            
            <FlatList
              data={filteredClients}
              renderItem={renderClientItem}
              keyExtractor={item => `assigned-${item.id}`}
              refreshControl={
                <RefreshControl 
                  refreshing={clientsRefreshing} 
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={64} color={theme.colors.textLight} />
                  <Text style={styles.emptyText}>
                    {searchQuery 
                      ? 'Aucun client trouvé pour cette recherche' 
                      : collecteurs.length === 0 
                        ? 'Aucun collecteur assigné' 
                        : 'Aucun client accessible'
                    }
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {collecteurs.length === 0 
                      ? 'Demandez à votre super admin de vous assigner des collecteurs'
                      : !searchQuery && 'Vos collecteurs assignés n\'ont pas encore de clients'
                    }
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={filteredClients.length === 0 ? styles.emptyListContainer : undefined}
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
  // NOUVEAUX STYLES POUR RECHERCHE SEMI-AUTOMATIQUE
  searchSpinner: {
    marginRight: 8,
  },
  searchResultsIndicator: {
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchResultsText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  searchHint: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default AdminClientManagementScreen;