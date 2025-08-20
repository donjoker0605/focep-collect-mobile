// src/screens/Admin/AdminJournalActiviteScreen.js - CORRIGÉ
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
// ❌ RETIRÉ : import Header from '../../components/Header/Header';
import ActivityLogItem from '../../components/ActivityLogItem/ActivityLogItem';
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
      
      // 🔥 CORRECTION : Utiliser le bon service avec le bon format de date
      const response = await journalActiviteService.getUserActivities(
        collecteurId,
        selectedDate // Le service va gérer le formatage
      );

      if (response && response.data) {
        // Gérer à la fois les formats Array et Page
        let activitiesData = [];
        
        if (Array.isArray(response.data)) {
          activitiesData = response.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          // Format Page de Spring
          activitiesData = response.data.content;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          activitiesData = response.data.data;
        }

        // 🔥 CORRECTION : Pas besoin d'enrichir les données, ActivityLogItem s'en charge
        const enrichedActivities = activitiesData;

        setActivities(enrichedActivities);
        calculateStats(enrichedActivities);
        
        console.log(`✅ ${enrichedActivities.length} activités chargées pour ActivityLogItem`);
        console.log('🔍 Première activité (debug):', enrichedActivities[0]);
      } else {
        setActivities([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement activités:', error);
      setError(error.message);
      
      // Gestion d'erreur améliorée
      if (error.response?.status === 400) {
        Alert.alert('Erreur', 'Format de date invalide');
      } else if (error.response?.status === 403) {
        Alert.alert('Erreur', 'Vous n\'avez pas accès à ces données');
      } else {
        Alert.alert('Erreur', 'Impossible de charger le journal d\'activité');
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

  // 🔥 SUPPRIMÉ : Fonctions de formatage déplacées vers ActivityLogItem + activityFormatter

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

  // 🔥 CORRECTION : Utiliser le composant ActivityLogItem qui gère l'activityFormatter
  const renderActivityItem = ({ item }) => (
    <ActivityLogItem
      activity={item}
      isAdmin={true}
      onPress={(activity) => {
        if (activity.entityId && activity.entityType === 'CLIENT') {
          navigation.navigate('ClientDetailScreen', { clientId: activity.entityId });
        }
      }}
    />
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
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  // 🔥 SUPPRIMÉ : Styles spécifiques aux activités, gérés par ActivityLogItem
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