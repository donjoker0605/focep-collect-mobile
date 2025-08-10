// src/screens/Admin/AdminCollecteurSupervisionScreen.js - CORRIGÉ
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// ❌ RETIRÉ : import Header from '../../components/Header/Header';
import collecteurService from '../../services/collecteurService';
import { adminCollecteurService } from '../../services';

const AdminCollecteurSupervisionScreen = ({ navigation }) => {
  const [collecteurs, setCollecteurs] = useState([]);
  const [filteredCollecteurs, setFilteredCollecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // 🔥 Charger UNIQUEMENT les collecteurs assignés à l'admin
  const loadCollecteurs = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      console.log('📊 Chargement collecteurs assignés pour supervision...');
      
      // 🆕 NOUVELLE LOGIQUE : Utiliser le service admin-collecteur
      const response = await adminCollecteurService.getAssignedCollecteurs();
      
      if (response && response.data) {
        const result = Array.isArray(response.data) 
          ? response.data 
          : Object.values(response.data).filter(item => 
              item && typeof item === 'object' && item.id
            );

        const enrichedData = result.map(collecteur => ({
          ...collecteur,
          id: collecteur.id || collecteur.collecteurId,
          displayName: `${collecteur.prenom || ''} ${collecteur.nom || ''}`.trim(),
          email: collecteur.adresseMail || collecteur.email,
          isActive: collecteur.active !== false,
          agenceNom: collecteur.agenceNom || 'N/A',
          // 📊 Récupérer les vraies stats depuis les données enrichies
          stats: {
            clients: collecteur.nombreClients || 0,
            collecte: collecteur.collecteJour || 0,
            performance: collecteur.performance ? `${collecteur.performance}%` : '0%'
          }
        }));

        setCollecteurs(enrichedData);
        setFilteredCollecteurs(enrichedData);
        console.log(`✅ ${result.length} collecteurs assignés chargés`);
      } else {
        throw new Error('Format de données invalide');
      }

    } catch (error) {
      console.error('❌ Erreur chargement collecteurs assignés:', error);
      setError(error.message);
      
      if (error.message.includes('Authentification')) {
        Alert.alert(
          'Erreur d\'authentification',
          'Veuillez vous reconnecter',
          [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
        );
      } else {
        Alert.alert('Erreur', error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  // Charger au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      loadCollecteurs();
    }, [loadCollecteurs])
  );

  // Filtrer les collecteurs
  useEffect(() => {
    let filtered = collecteurs;

    if (activeTab === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }

    if (searchText.trim()) {
      filtered = filtered.filter(collecteur =>
        collecteur.displayName?.toLowerCase().includes(searchText.toLowerCase()) ||
        collecteur.email?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredCollecteurs(filtered);
  }, [searchText, collecteurs, activeTab]);

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCollecteurs(false);
  }, [loadCollecteurs]);

  // Navigation vers le journal d'activité d'un collecteur
  const navigateToJournalActivite = (collecteur) => {
    navigation.navigate('AdminJournalActivite', {
      collecteurId: collecteur.id,
      collecteurNom: collecteur.displayName,
      agenceNom: collecteur.agenceNom
    });
  };

  // Navigation vers les détails d'un collecteur
  const navigateToDetails = (collecteur) => {
    navigation.navigate('CollecteurDetailScreen', {
      collecteurId: collecteur.id,
      collecteur: collecteur
    });
  };

  // Render collecteur item
  const renderCollecteurItem = ({ item }) => (
    <TouchableOpacity
      style={styles.collecteurCard}
      onPress={() => navigateToDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.collecteurInfo}>
          <View style={styles.statusIndicator}>
            <Ionicons
              name={item.isActive ? "checkmark-circle" : "close-circle"}
              size={20}
              color={item.isActive ? "#10B981" : "#EF4444"}
            />
          </View>
          <View>
            <Text style={styles.collecteurName}>{item.displayName}</Text>
            <Text style={styles.agenceText}>{item.agenceNom}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText,
            { color: item.isActive ? '#10B981' : '#EF4444' }
          ]}>
            {item.isActive ? 'ACTIF' : 'INACTIF'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.stats.clients}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.stats.collecte}</Text>
          <Text style={styles.statLabel}>Collecté</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.stats.performance}</Text>
          <Text style={styles.statLabel}>Performance</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => navigateToJournalActivite(item)}
        >
          <Ionicons name="document-text-outline" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Journal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={() => navigateToDetails(item)}
        >
          <MaterialIcons name="info-outline" size={18} color="#007AFF" />
          <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Détails</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render empty
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyText}>
        {searchText ? 'Aucun collecteur trouvé' : 'Aucun collecteur pour le moment'}
      </Text>
    </View>
  );

  // Render loading
  if (loading && collecteurs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* ❌ RETIRÉ : Header personnalisé */}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ❌ RETIRÉ : Header personnalisé */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un collecteur..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9CA3AF"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tous ({collecteurs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Actifs ({collecteurs.filter(c => c.isActive).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
          onPress={() => setActiveTab('inactive')}
        >
          <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
            Inactifs ({collecteurs.filter(c => !c.isActive).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{collecteurs.length}</Text>
          <Text style={styles.summaryLabel}>Collecteurs</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{collecteurs.filter(c => c.isActive).length}</Text>
          <Text style={styles.summaryLabel}>Actifs</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>0</Text>
          <Text style={styles.summaryLabel}>Attention</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredCollecteurs}
        renderItem={renderCollecteurItem}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  collecteurCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  collecteurInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    marginRight: 12,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  agenceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  primaryAction: {
    backgroundColor: '#007AFF',
  },
  secondaryAction: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default AdminCollecteurSupervisionScreen;