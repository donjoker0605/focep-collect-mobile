// src/screens/Collecteur/JournalActiviteScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import theme from '../../theme';
import journalActiviteService from '../../services/journalActiviteService';

const JournalActiviteScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const filters = [
    { id: 'ALL', label: 'Tout', icon: 'list' },
    { id: 'CLIENT', label: 'Clients', icon: 'person' },
    { id: 'TRANSACTION', label: 'Transactions', icon: 'cash' },
    { id: 'SYSTEM', label: 'Système', icon: 'settings' }
  ];

  const loadActivities = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      
      const response = await journalActiviteService.getUserActivities(
        user.id,
        selectedDate,
        { filter: filter !== 'ALL' ? filter : undefined }
      );
      
      setActivities(response.data?.content || []);
    } catch (error) {
      console.error('Erreur chargement activités:', error);
      Alert.alert('Erreur', 'Impossible de charger le journal d\'activité');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, selectedDate, filter]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivities(false);
  }, [loadActivities]);

  const getActionIcon = (action) => {
    const icons = {
      'CREATE_CLIENT': 'person-add',
      'MODIFY_CLIENT': 'create',
      'UPDATE_CLIENT_LOCATION': 'location',
      'EPARGNE': 'arrow-down-circle',
      'RETRAIT': 'arrow-up-circle',
      'LOGIN': 'log-in',
      'LOGOUT': 'log-out'
    };
    return icons[action] || 'ellipsis-horizontal';
  };

  const getActionColor = (action) => {
    const colors = {
      'CREATE_CLIENT': theme.colors.success,
      'MODIFY_CLIENT': theme.colors.warning,
      'UPDATE_CLIENT_LOCATION': theme.colors.info,
      'EPARGNE': theme.colors.success,
      'RETRAIT': theme.colors.error,
      'LOGIN': theme.colors.info,
      'LOGOUT': theme.colors.textLight
    };
    return colors[action] || theme.colors.text;
  };

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const buildActivityDescription = (item) => {
    switch (item.action) {
      case 'CREATE_CLIENT':
        return `Nouveau client créé`;
      case 'MODIFY_CLIENT':
        return `Client modifié`;
      case 'UPDATE_CLIENT_LOCATION':
        return `Localisation client mise à jour`;
      case 'EPARGNE':
        return `Épargne enregistrée`;
      case 'RETRAIT':
        return `Retrait effectué`;
      case 'LOGIN':
        return `Connexion depuis ${item.ipAddress || 'IP inconnue'}`;
      case 'LOGOUT':
        return 'Déconnexion';
      default:
        return item.description || 'Action système';
    }
  };

  const navigateToEntity = (entityType, entityId) => {
    if (!entityType || !entityId) return;
    
    switch (entityType) {
      case 'CLIENT':
        navigation.navigate('ClientDetail', { clientId: entityId });
        break;
      case 'MOUVEMENT':
        navigation.navigate('TransactionDetail', { transactionId: entityId });
        break;
      default:
        console.log('Navigation non gérée pour:', entityType);
    }
  };

  const renderActivityItem = ({ item }) => (
    <Card style={styles.activityCard}>
      <TouchableOpacity
        onPress={() => navigateToEntity(item.entityType, item.entityId)}
        activeOpacity={0.7}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityIconContainer}>
            <Ionicons
              name={getActionIcon(item.action)}
              size={20}
              color={getActionColor(item.action)}
            />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>
              {item.actionDisplayName || item.action}
            </Text>
            <Text style={styles.activityDescription}>
              {buildActivityDescription(item)}
            </Text>
          </View>
          <Text style={styles.activityTime}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Journal d'Activité" 
        showBackButton
        rightComponent={
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar" size={24} color="white" />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </Text>
          <Text style={styles.activityCount}>
            {activities.length} action{activities.length > 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map(filterType => (
            <TouchableOpacity
              key={filterType.id}
              onPress={() => setFilter(filterType.id)}
              style={[
                styles.filterButton,
                filter === filterType.id && styles.filterButtonActive
              ]}
            >
              <Ionicons
                name={filterType.icon}
                size={16}
                color={filter === filterType.id ? theme.colors.white : theme.colors.primary}
                style={styles.filterIcon}
              />
              <Text style={[
                styles.filterText,
                filter === filterType.id && styles.filterTextActive
              ]}>
                {filterType.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
            keyExtractor={item => item.id.toString()}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                message="Aucune activité pour cette date"
                icon="calendar-outline"
              />
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
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  activityCount: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  filters: {
    height: 50,
    marginBottom: 10,
  },
  filtersContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  activityCard: {
    marginBottom: 10,
    padding: 0,
    overflow: 'hidden',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
});

export default JournalActiviteScreen;