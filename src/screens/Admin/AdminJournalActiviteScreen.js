// src/screens/Admin/AdminJournalActiviteScreen.js
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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

// Components
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import ActivityLogItem from '../../components/ActivityLogItem/ActivityLogItem';
import EmptyState from '../../components/EmptyState/EmptyState';
import DatePicker from '../../components/DatePicker/DatePicker';

// Services et hooks
import journalActiviteService from '../../services/journalActiviteService';
import { useAuth } from '../../hooks/useAuth';
import theme from '../../theme';

const AdminJournalActiviteScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  
  // ✅ Récupérer les paramètres passés par la navigation
  const { collecteurId, collecteurNom, agenceNom } = route.params || {};
  
  // États
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Charger les activités du collecteur
  const loadActivities = useCallback(async (date = selectedDate, page = 0, reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // ✅ MODIFICATION : Utiliser l'ID du collecteur spécifique au lieu de l'utilisateur connecté
      const targetUserId = collecteurId || user.id;
      
      console.log('📅 Chargement activités pour collecteur:', targetUserId, 'date:', format(date, 'yyyy-MM-dd'));

      const response = await journalActiviteService.getUserActivities(
        targetUserId,
        format(startOfDay(date), 'yyyy-MM-dd\'T\'HH:mm:ss'),
        format(endOfDay(date), 'yyyy-MM-dd\'T\'HH:mm:ss'),
        {
          page,
          size: 20,
          filter: selectedFilter !== 'all' ? selectedFilter : undefined
        }
      );

      if (response.success) {
        const newActivities = response.data || [];
        
        if (reset) {
          setActivities(newActivities);
          setCurrentPage(0);
        } else {
          setActivities(prev => [...prev, ...newActivities]);
        }
        
        setCurrentPage(page);
        setHasMore(newActivities.length === 20);
        
        // Charger les stats si c'est la première page
        if (reset) {
          await loadStats(date, targetUserId);
        }
      } else {
        throw new Error(response.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('❌ Erreur chargement activités:', error);
      setError(error.message);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [selectedDate, selectedFilter, collecteurId, user.id]);

  // Charger les statistiques
  const loadStats = useCallback(async (date, targetUserId) => {
    try {
      const response = await journalActiviteService.getUserActivityStats(
        targetUserId,
        format(startOfDay(date), 'yyyy-MM-dd'),
        format(endOfDay(date), 'yyyy-MM-dd')
      );
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('❌ Erreur stats:', error);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivities(selectedDate, 0, true);
  }, [loadActivities, selectedDate]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadActivities(selectedDate, currentPage + 1, false);
    }
  }, [loadActivities, selectedDate, currentPage, loadingMore, hasMore]);

  // Changer de date
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setActivities([]);
    loadActivities(date, 0, true);
  };

  // Changer de filtre
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setActivities([]);
    loadActivities(selectedDate, 0, true);
  };

  // Render activité
  const renderActivity = ({ item }) => (
    <ActivityLogItem
      activity={item}
      isAdmin={true} // ✅ Mode admin pour affichage enrichi
      onPress={() => handleActivityPress(item)}
    />
  );

  // Gérer le clic sur une activité
  const handleActivityPress = (activity) => {
    // TODO: Naviguer vers les détails si nécessaire
    console.log('Activité sélectionnée:', activity);
  };

  // Render header avec stats
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Info collecteur */}
      <Card style={styles.collecteurCard}>
        <View style={styles.collecteurInfo}>
          <Ionicons name="person-circle" size={40} color={theme.colors.primary} />
          <View style={styles.collecteurDetails}>
            <Text style={styles.collecteurNom}>{collecteurNom || 'Collecteur'}</Text>
            {agenceNom && <Text style={styles.agenceNom}>{agenceNom}</Text>}
          </View>
        </View>
      </Card>

      {/* Sélecteur de date */}
      <Card style={styles.dateCard}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color={theme.colors.primary} />
          <Text style={styles.dateText}>
            {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Stats du jour */}
      {stats && (
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistiques du jour</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalActions || 0}</Text>
              <Text style={styles.statLabel}>Actions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.clients || 0}</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.transactions || 0}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Filtres */}
      <Card style={styles.filtersCard}>
        <View style={styles.filtersContainer}>
          {[
            { key: 'all', label: 'Tout' },
            { key: 'CLIENT', label: 'Clients' },
            { key: 'TRANSACTION', label: 'Transactions' },
            { key: 'SYSTEM', label: 'Système' }
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.filterTextActive
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </View>
  );

  // Render loading
  if (loading && activities.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Journal d'Activité"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des activités...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Journal d'Activité"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={() => (
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => `${item.id}-${item.timestamp}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <EmptyState
            icon="document-text-outline"
            title="Aucune activité"
            message="Aucune activité trouvée pour cette date"
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => (
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        )}
        contentContainerStyle={activities.length === 0 ? styles.emptyContainer : null}
      />

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePicker
          date={selectedDate}
          onDateChange={handleDateChange}
          onCancel={() => setShowDatePicker(false)}
          visible={showDatePicker}
        />
      )}
    </SafeAreaView>
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
  collecteurCard: {
    marginBottom: theme.spacing.md,
  },
  collecteurInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collecteurDetails: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  collecteurNom: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  agenceNom: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dateCard: {
    marginBottom: theme.spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  dateText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    textTransform: 'capitalize',
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
  filtersCard: {
    marginBottom: theme.spacing.md,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  loadingMore: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
});

export default AdminJournalActiviteScreen;