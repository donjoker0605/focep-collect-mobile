// src/screens/Admin/AdminJournalActiviteScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '../../components/Header/Header';
import journalActiviteService from '../../services/journalActiviteService';
import collecteurService from '../../services/collecteurService';

const AdminJournalActiviteScreen = ({ navigation, route }) => {
  const { collecteurId, collecteurNom, agenceNom } = route.params || {};
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);
  const [collecteurInfo, setCollecteurInfo] = useState(null);
  const [stats, setStats] = useState({
    totalActivities: 0,
    clientsCreated: 0,
    transactions: 0,
    modifications: 0
  });

  // Récupérer les informations du collecteur
  const loadCollecteurInfo = useCallback(async () => {
    if (!collecteurId) return;
    
    try {
      const response = await collecteurService.getCollecteurById(collecteurId);
      if (response && response.data) {
        setCollecteurInfo(response.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement info collecteur:', error);
    }
  }, [collecteurId]);

  // Charger les activités
  const loadActivities = useCallback(async (showLoader = true) => {
    if (!collecteurId) {
      Alert.alert('Erreur', 'ID du collecteur manquant');
      navigation.goBack();
      return;
    }

    if (showLoader) setLoading(true);
    setError(null);

    try {
      console.log(`📅 Chargement activités pour collecteur: ${collecteurId} date: ${format(selectedDate, 'yyyy-MM-dd')}`);
      
      const response = await journalActiviteService.getUserActivities(
        collecteurId,
        selectedDate
      );

      if (response && response.data) {
        const activitiesData = Array.isArray(response.data) 
          ? response.data 
          : Object.values(response.data).filter(item => item && item.id);

        // Enrichir les données
        const enrichedActivities = activitiesData.map(activity => ({
          ...activity,
          formattedTime: formatActivityTime(activity.timestamp || activity.dateCreation),
          icon: getActivityIcon(activity.action || activity.type),
          color: getActivityColor(activity.action || activity.type),
          displayTitle: getActivityTitle(activity.action || activity.type),
        }));

        setActivities(enrichedActivities);
        calculateStats(enrichedActivities);
        
        console.log(`✅ ${enrichedActivities.length} activités chargées`);
      } else {
        setActivities([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement activités:', error);
      setError(error.message);
      
      // Si l'erreur est liée au format de date, essayer un format alternatif
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('date')) {
        console.log('🔄 Tentative avec format de date alternatif...');
        try {
          const alternativeResponse = await journalActiviteService.getUserActivities(
            collecteurId,
            format(selectedDate, 'yyyy-MM-dd')
          );
          if (alternativeResponse && alternativeResponse.data) {
            setActivities(alternativeResponse.data);
          }
        } catch (retryError) {
          Alert.alert('Erreur', 'Impossible de charger le journal d\'activité');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [collecteurId, selectedDate, navigation]);

  // Calculer les statistiques
  const calculateStats = (activitiesList) => {
    const stats = {
      totalActivities: activitiesList.length,
      clientsCreated: activitiesList.filter(a => 
        a.action === 'CREATE_CLIENT' || a.type === 'CLIENT_CREATION'
      ).length,
      transactions: activitiesList.filter(a => 
        a.action === 'CREATE_TRANSACTION' || a.type === 'TRANSACTION'
      ).length,
      modifications: activitiesList.filter(a => 
        a.action === 'MODIFY_CLIENT' || a.type === 'MODIFICATION'
      ).length,
    };
    setStats(stats);
  };

  // Formatter le temps de l'activité
  const formatActivityTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = parseISO(timestamp);
      if (isToday(date)) {
        return `Aujourd'hui à ${format(date, 'HH:mm')}`;
      } else if (isYesterday(date)) {
        return `Hier à ${format(date, 'HH:mm')}`;
      } else {
        return format(date, 'dd MMM à HH:mm', { locale: fr });
      }
    } catch (error) {
      return format(new Date(timestamp), 'HH:mm');
    }
  };

  // Obtenir l'icône selon le type d'activité
  const getActivityIcon = (action) => {
    const iconMap = {
      'CREATE_CLIENT': 'person-add',
      'MODIFY_CLIENT': 'person',
      'CREATE_TRANSACTION': 'cash',
      'DELETE_CLIENT': 'person-remove',
      'LOGIN': 'log-in',
      'LOGOUT': 'log-out',
      'VIEW_CLIENT': 'eye',
      'EXPORT_DATA': 'download',
    };
    return iconMap[action] || 'document-text';
  };

  // Obtenir la couleur selon le type d'activité
  const getActivityColor = (action) => {
    const colorMap = {
      'CREATE_CLIENT': '#10B981',
      'MODIFY_CLIENT': '#F59E0B',
      'CREATE_TRANSACTION': '#3B82F6',
      'DELETE_CLIENT': '#EF4444',
      'LOGIN': '#6B7280',
      'LOGOUT': '#6B7280',
    };
    return colorMap[action] || '#6B7280';
  };

  // Obtenir le titre de l'activité
  const getActivityTitle = (action) => {
    const titleMap = {
      'CREATE_CLIENT': 'Nouveau client créé',
      'MODIFY_CLIENT': 'Client modifié',
      'CREATE_TRANSACTION': 'Transaction effectuée',
      'DELETE_CLIENT': 'Client supprimé',
      'LOGIN': 'Connexion',
      'LOGOUT': 'Déconnexion',
      'VIEW_CLIENT': 'Consultation client',
      'EXPORT_DATA': 'Export de données',
    };
    return titleMap[action] || action;
  };

  // Charger les données au focus
  useFocusEffect(
    useCallback(() => {
      loadCollecteurInfo();
      loadActivities();
    }, [loadCollecteurInfo, loadActivities])
  );

  // Gérer le changement de date
  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivities(false);
  }, [loadActivities]);

  // Render activity item
  const renderActivityItem = ({ item }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => {
        if (item.entityId && item.entityType === 'CLIENT') {
          // Navigation vers le détail du client si applicable
          navigation.navigate('ClientDetailScreen', { clientId: item.entityId });
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.activityHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.displayTitle}</Text>
          {item.details && (
            <Text style={styles.activityDetails} numberOfLines={2}>
              {item.details}
            </Text>
          )}
          <Text style={styles.activityTime}>{item.formattedTime}</Text>
        </View>
        {item.entityId && (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  // Render empty
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={64} color="#9CA3AF" />
      <Text style={styles.emptyText}>
        Aucune activité pour cette date
      </Text>
      <Text style={styles.emptySubtext}>
        Les activités du collecteur apparaîtront ici
      </Text>
    </View>
  );

  // Render header with date navigation
  const renderDateNavigation = () => (
    <View style={styles.dateNavContainer}>
      <TouchableOpacity
        style={styles.dateNavButton}
        onPress={() => handleDateChange(-1)}
      >
        <Ionicons name="chevron-back" size={24} color="#007AFF" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.dateDisplay}
        onPress={() => {
          // TODO: Implémenter un date picker
          Alert.alert('Info', 'Sélecteur de date à implémenter');
        }}
      >
        <Text style={styles.dateText}>
          {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.dateNavButton}
        onPress={() => handleDateChange(1)}
        disabled={isToday(selectedDate)}
      >
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={isToday(selectedDate) ? '#D1D5DB' : '#007AFF'} 
        />
      </TouchableOpacity>
    </View>
  );

  // Render stats
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.totalActivities}</Text>
        <Text style={styles.statLabel}>Activités</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.clientsCreated}</Text>
        <Text style={styles.statLabel}>Clients créés</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.transactions}</Text>
        <Text style={styles.statLabel}>Transactions</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.modifications}</Text>
        <Text style={styles.statLabel}>Modifications</Text>
      </View>
    </View>
  );

  // Render loading
  if (loading && activities.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title={`Journal - ${collecteurNom || 'Collecteur'}`}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={`Journal - ${collecteurNom || 'Collecteur'}`}
        subtitle={agenceNom}
        onBack={() => navigation.goBack()}
        rightComponent={() => (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // TODO: Implémenter export
              Alert.alert('Info', 'Export à implémenter');
            }}
          >
            <Ionicons name="download-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      />

      {renderDateNavigation()}
      {renderStats()}

      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
  headerButton: {
    padding: 8,
  },
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateNavButton: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default AdminJournalActiviteScreen;