// src/screens/Admin/AdminCollecteurSupervisionScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Components
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import EmptyState from '../../components/EmptyState/EmptyState';

// Services
import adminCollecteurService from '../../services/adminCollecteurService';
import { useAuth } from '../../hooks/useAuth';
import theme from '../../theme';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminCollecteurSupervisionScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // États
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredCollecteurs, setFilteredCollecteurs] = useState([]);

  // Charger les collecteurs
  const loadCollecteurs = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
        setError(null);
      }

      console.log('📊 Chargement collecteurs pour supervision...');
      
      // ✅ UTILISER LE NOUVEAU SERVICE ADMIN
      const result = await adminCollecteurService.getCollecteursActivitySummary();
      
      if (Array.isArray(result)) {
        setCollecteurs(result);
        setFilteredCollecteurs(result);
        console.log(`✅ ${result.length} collecteurs chargés`);
      } else {
        throw new Error('Format de données invalide');
      }

    } catch (error) {
      console.error('❌ Erreur chargement collecteurs:', error);
      setError(error.message);
      
      // Fallback avec données vides plutôt que crash
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

  // Filtrer les collecteurs selon la recherche
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredCollecteurs(collecteurs);
    } else {
      const filtered = collecteurs.filter(collecteur =>
        collecteur.displayName?.toLowerCase().includes(searchText.toLowerCase()) ||
        collecteur.agenceNom?.toLowerCase().includes(searchText.toLowerCase()) ||
        collecteur.email?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCollecteurs(filtered);
    }
  }, [searchText, collecteurs]);

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCollecteurs(false);
  }, [loadCollecteurs]);

  // Naviguer vers le journal d'activité d'un collecteur
  const navigateToJournalActivite = (collecteur) => {
    navigation.navigate('AdminJournalActivite', {
      collecteurId: collecteur.id,
      collecteurNom: collecteur.displayName,
      agenceNom: collecteur.agenceNom
    });
  };

  // Naviguer vers les détails d'un collecteur
  const navigateToCollecteurDetail = (collecteur) => {
    navigation.navigate('AdminCollecteurDetail', {
      collecteurId: collecteur.id,
      collecteurNom: collecteur.displayName,
      agenceNom: collecteur.agenceNom
    });
  };

  // Render item collecteur
  const renderCollecteur = ({ item }) => (
    <CollecteurCard
      collecteur={item}
      onPressDetail={() => navigateToCollecteurDetail(item)}
      onPressJournal={() => navigateToJournalActivite(item)}
    />
  );

  // Render header avec recherche
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un collecteur..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Statistiques globales */}
      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>Vue d'ensemble</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{collecteurs.length}</Text>
            <Text style={styles.statLabel}>Collecteurs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {collecteurs.filter(c => c.statut === 'ACTIF').length}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {collecteurs.filter(c => c.statut === 'ATTENTION').length}
            </Text>
            <Text style={styles.statLabel}>Attention</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  // Render loading
  if (loading && collecteurs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Supervision Collecteurs"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des collecteurs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Supervision Collecteurs"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={() => (
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredCollecteurs}
        renderItem={renderCollecteur}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <EmptyState
            icon="people-outline"
            title="Aucun collecteur"
            message={searchText ? "Aucun collecteur trouvé pour cette recherche" : "Aucun collecteur disponible"}
            actionLabel="Actualiser"
            onAction={onRefresh}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={filteredCollecteurs.length === 0 ? styles.emptyContainer : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Composant Card pour un collecteur
const CollecteurCard = ({ collecteur, onPressDetail, onPressJournal }) => {
  return (
    <Card style={styles.collecteurCard}>
      {/* Header avec nom et statut */}
      <View style={styles.collecteurHeader}>
        <View style={styles.collecteurInfo}>
          <View style={[styles.statusIndicator, { backgroundColor: collecteur.statusColor }]} />
          <View style={styles.collecteurDetails}>
            <Text style={styles.collecteurNom}>{collecteur.displayName}</Text>
            <Text style={styles.agenceNom}>{collecteur.agenceNom}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons 
            name={collecteur.statusIcon} 
            size={16} 
            color={collecteur.statusColor} 
          />
          <Text style={[styles.statusText, { color: collecteur.statusColor }]}>
            {collecteur.statut}
          </Text>
        </View>
      </View>

      {/* Métriques */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{collecteur.nombreClients}</Text>
          <Text style={styles.metricLabel}>Clients</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {formatCurrency(collecteur.collecteJour)}
          </Text>
          <Text style={styles.metricLabel}>Collecte</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{collecteur.performance}%</Text>
          <Text style={styles.metricLabel}>Performance</Text>
        </View>
      </View>

      {/* Dernière connexion */}
      {collecteur.dernierConnexion && (
        <Text style={styles.lastConnection}>
          Dernière connexion: {formatDate(collecteur.dernierConnexion)}
        </Text>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]} 
          onPress={onPressJournal}
        >
          <Ionicons name="document-text" size={16} color={theme.colors.white} />
          <Text style={styles.primaryButtonText}>Journal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]} 
          onPress={onPressDetail}
        >
          <Ionicons name="analytics" size={16} color={theme.colors.primary} />
          <Text style={styles.secondaryButtonText}>Détails</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    padding: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  statsCard: {
    marginBottom: theme.spacing.md,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  collecteurCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  collecteurHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  collecteurInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  collecteurDetails: {
    flex: 1,
  },
  collecteurNom: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  agenceNom: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  lastConnection: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
});

export default AdminCollecteurSupervisionScreen;