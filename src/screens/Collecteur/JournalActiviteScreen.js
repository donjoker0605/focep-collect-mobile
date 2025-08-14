// src/screens/Collecteur/JournalActiviteScreen.js
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

const JournalActiviteScreen = ({ navigation }) => {
  const { user } = useAuth();
  
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

  // Charger les activités
  const loadActivities = useCallback(async (date = selectedDate, page = 0, reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(0);
      } else {
        setLoadingMore(true);
      }

      setError(null);
      
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await journalActiviteService.getUserActivities(
        user.id, 
        dateString, 
        { 
          page, 
          size: 20,
          sortBy: 'timestamp',
          sortDir: 'desc'
        }
      );

      if (response.success && response.data) {
        const newActivities = response.data.content || [];
        
        if (reset || page === 0) {
          setActivities(newActivities);
        } else {
          setActivities(prev => [...prev, ...newActivities]);
        }

        setHasMore(!response.data.last);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Erreur chargement activités:', err);
      setError(err.message || 'Erreur lors du chargement');
      if (reset) {
        setActivities([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user.id, selectedDate]);

  // Charger les statistiques
  const loadStats = useCallback(async (date = selectedDate) => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await journalActiviteService.getUserActivityStats(
        user.id,
        dateString,
        dateString
      );

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  }, [user.id, selectedDate]);

  // Effet initial
  useEffect(() => {
    loadActivities(selectedDate, 0, true);
    loadStats(selectedDate);
  }, [selectedDate]);

  // Gestionnaires d'événements
  const handleRefresh = () => {
    setRefreshing(true);
    loadActivities(selectedDate, 0, true);
    loadStats(selectedDate);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadActivities(selectedDate, currentPage + 1, false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleActivityPress = (activity) => {
    // Afficher les détails de l'activité
    Alert.alert(
      activity.actionDisplayName,
      `Entité: ${activity.entityDisplayName || 'N/A'}\n` +
      `Heure: ${format(new Date(activity.timestamp), 'HH:mm:ss', { locale: fr })}\n` +
      `Durée: ${activity.durationMs || 0}ms\n` +
      `IP: ${activity.ipAddress || 'N/A'}`,
      [{ text: 'OK' }]
    );
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    // Le filtrage se fait maintenant dans filteredActivities
  };

  // Filtrage des activités selon le filtre sélectionné
  const filteredActivities = activities.filter(activity => {
    if (selectedFilter === 'all') return true;
    return activity.action === selectedFilter;
  });

  // Rendu des éléments
  const renderActivity = ({ item }) => (
    <ActivityLogItem
      activity={item}
      onPress={null}
    />
  );

  const renderStatsCard = () => {
    if (!stats) return null;

    const totalActivities = Object.values(stats).reduce((sum, count) => sum + count, 0);

    return (
      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>Activités du jour</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalActivities}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          {Object.entries(stats).slice(0, 3).map(([action, count]) => (
            <View key={action} style={styles.statItem}>
              <Text style={styles.statNumber}>{count}</Text>
              <Text style={styles.statLabel}>{getActionDisplayName(action)}</Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderDateSelector = () => (
    <Card style={styles.dateCard}>
      <TouchableOpacity 
        style={styles.dateSelector}
        onPress={() => setShowDatePicker(true)}
      >
        <View style={styles.dateInfo}>
          <Ionicons name="calendar" size={20} color={theme.colors.primary} />
          <Text style={styles.dateText}>
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textLight} />
      </TouchableOpacity>
    </Card>
  );

  const renderFilterTabs = () => {
    const filters = [
      { key: 'all', label: 'Toutes', icon: 'apps' },
      { key: 'CREATE_CLIENT', label: 'Créations', icon: 'person-add' },
      { key: 'TRANSACTION_EPARGNE', label: 'Épargnes', icon: 'arrow-down-circle' },
      { key: 'TRANSACTION_RETRAIT', label: 'Retraits', icon: 'arrow-up-circle' }
    ];

    return (
      <View style={styles.filterContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.filterTabActive
            ]}
            onPress={() => handleFilterChange(filter.key)}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={selectedFilter === filter.key ? theme.colors.white : theme.colors.textLight} 
            />
            <Text style={[
              styles.filterLabel,
              selectedFilter === filter.key && styles.filterLabelActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  };

  const getActionDisplayName = (action) => {
    const actionNames = {
      'CREATE_CLIENT': 'Créations',
      'MODIFY_CLIENT': 'Modifications',
      'DELETE_CLIENT': 'Suppressions',
      'LOGIN': 'Connexions',
      'LOGOUT': 'Déconnexions',
      'TRANSACTION_EPARGNE': 'Épargnes',
      'TRANSACTION_RETRAIT': 'Retraits'
    };
    return actionNames[action] || action;
  };

  // Rendu principal
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Journal d'Activité" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du journal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Journal d'Activité" 
        showBackButton 
        rightIcon={
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        {renderDateSelector()}
        {renderStatsCard()}
        {renderFilterTabs()}

        {error ? (
          <Card style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
              <Text style={styles.errorTitle}>Erreur de chargement</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : activities.length === 0 ? (
          <EmptyState
            icon="document-text"
            title="Aucune activité"
            message="Aucune activité enregistrée pour cette date"
            actionTitle="Rafraîchir"
            onAction={handleRefresh}
          />
        ) : (
          <FlatList
            data={filteredActivities}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {showDatePicker && (
        <DatePicker
          date={selectedDate}
          onDateChange={handleDateChange}
          onClose={() => setShowDatePicker(false)}
          mode="date"
          maximumDate={new Date()}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  dateCard: {
    margin: 16,
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
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
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginLeft: 4,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: theme.colors.white,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorCard: {
    margin: 16,
    padding: 24,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: theme.colors.white,
    fontWeight: '500',
  },
});

export default JournalActiviteScreen;