// src/screens/Admin/AdminNotificationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import adminNotificationService from '../../services/adminNotificationService';
import { formatTimeAgo, formatMontant } from '../../utils/formatters';
import { COLORS, SIZES } from '../../constants/theme';

const AdminNotificationsScreen = ({ navigation }) => {
  // États principaux
  const [dashboard, setDashboard] = useState(null);
  const [criticalNotifications, setCriticalNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [appState, setAppState] = useState(AppState.currentState);

  // ===== GESTION LIFECYCLE =====
  
  useFocusEffect(
    useCallback(() => {
      console.log('🚨 AdminNotifications: Focus - Démarrage polling');
      
      // Charger données initiales
      loadInitialData();
      
      // Démarrer polling intelligent avec ton backend
      adminNotificationService.startIntelligentPolling(handlePollingUpdate);
      
      return () => {
        console.log('🚨 AdminNotifications: Blur - Arrêt polling');
        adminNotificationService.stopPolling();
      };
    }, [])
  );

  // Gérer changements d'état de l'app pour optimiser polling
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state change:', appState, '->', nextAppState);
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  /**
   * 📊 Chargement données initiales depuis ton backend
   */
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Utiliser tes endpoints
      const [dashboardData, criticalData] = await Promise.all([
        adminNotificationService.getDashboard(60),
        adminNotificationService.getCriticalNotifications()
      ]);
      
      setDashboard(dashboardData);
      setCriticalNotifications(criticalData);
      setLastUpdate(new Date());
      
      console.log('✅ Données admin chargées depuis ton backend:', {
        activités: dashboardData.activitiesCount,
        urgentes: dashboardData.urgentNotifications,
        notifications: criticalData.length
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement données admin:', error);
      Alert.alert('Erreur', 'Impossible de charger les données admin');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 Callback polling intelligent - gère les changements significatifs
   */
  const handlePollingUpdate = (newDashboard, hasSignificantChanges) => {
    if (newDashboard) {
      setDashboard(newDashboard);
      setLastUpdate(new Date());
      
      // Si changements significatifs, recharger notifications critiques
      if (hasSignificantChanges) {
        console.log('🔔 Changements significatifs - rechargement notifications');
        loadCriticalNotifications();
        
        // Vibration pour nouvelles urgentes si app active
        if (appState === 'active' && newDashboard.urgentNotifications > 0) {
          showUrgentNotificationAlert(newDashboard.urgentNotifications);
        }
      }
    }
  };

  /**
   * 🚨 Alerte pour notifications urgentes
   */
  const showUrgentNotificationAlert = (urgentCount) => {
    Alert.alert(
      '🚨 Notification Urgente',
      `Vous avez ${urgentCount} notification${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''}`,
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Voir', onPress: () => loadCriticalNotifications() }
      ],
      { cancelable: true }
    );
  };

  /**
   * 🔔 Charger notifications critiques depuis ton backend
   */
  const loadCriticalNotifications = async () => {
    try {
      const notifications = await adminNotificationService.getCriticalNotifications();
      setCriticalNotifications(notifications);
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    }
  };

  /**
   * Marquer notification comme lue via ton backend
   */
  const handleMarkAsRead = async (notificationId) => {
    try {
      await adminNotificationService.markAsRead(notificationId);
      
      // Mise à jour locale
      setCriticalNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, lu: true, dateLecture: new Date() }
            : notif
        )
      );
      
      console.log('✅ Notification marquée comme lue via backend:', notificationId);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer la notification comme lue');
    }
  };

  /**
   * 🔄 Pull to refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // ===== COMPOSANTS DE RENDU =====

  /**
   * 📊 Dashboard adapté à ton backend
   */
  const renderDashboard = () => {
    if (!dashboard) return null;

    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Dashboard Admin</Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: appState === 'active' ? COLORS.success : COLORS.warning }
            ]} />
            <Text style={styles.lastUpdateText}>
              {formatTimeAgo(lastUpdate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <DashboardStat
            icon="error"
            label="Urgentes"
            value={dashboard.urgentNotifications}
            color={COLORS.error}
            onPress={() => filterNotifications('CRITIQUE')}
          />
          <DashboardStat
            icon="notifications"
            label="Non lues"
            value={dashboard.unreadNotifications}
            color={COLORS.warning}
            onPress={() => loadCriticalNotifications()}
          />
          <DashboardStat
            icon="trending-up"
            label="Activités"
            value={dashboard.activitiesCount}
            color={COLORS.primary}
            onPress={() => navigation.navigate('AdminActivitiesDetail')}
          />
        </View>
        
        {/* Statistiques détaillées de ton backend */}
        {dashboard.stats && (
          <View style={styles.detailedStats}>
            <Text style={styles.statsTitle}>Statistiques détaillées</Text>
            <View style={styles.statsGrid}>
              <StatItem label="Transactions" value={dashboard.stats.transactions} />
              <StatItem label="Nouveaux clients" value={dashboard.stats.nouveauxClients} />
              <StatItem label="Collecteurs actifs" value={dashboard.stats.collecteursActifs} />
            </View>
          </View>
        )}
      </View>
    );
  };

  /**
   * 📊 Composant statistique
   */
  const DashboardStat = ({ icon, label, value, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <Icon name={icon} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
      <Text style={styles.statItemValue}>{value}</Text>
      <Text style={styles.statItemLabel}>{label}</Text>
    </View>
  );

  /**
   * 🚨 Notification critique adaptée à ton backend
   */
  const renderCriticalNotification = ({ item }) => {
    const isUnread = !item.lu;
    const isUrgent = item.priority === 'CRITIQUE';
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          isUnread && styles.notificationUnread,
          isUrgent && styles.notificationUrgent
        ]}
        onPress={() => handleMarkAsRead(item.id)}
        disabled={item.lu}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleRow}>
            <Icon
              name={getPriorityIcon(item.priority)}
              size={22}
              color={getPriorityColor(item.priority)}
            />
            <Text style={[
              styles.notificationTitle,
              isUnread && styles.notificationTitleUnread
            ]}>
              {item.title}
            </Text>
            {item.groupedCount > 1 && (
              <View style={styles.groupedBadge}>
                <Text style={styles.groupedText}>+{item.groupedCount - 1}</Text>
              </View>
            )}
          </View>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(new Date(item.dateCreation))}
          </Text>
        </View>
        
        <Text style={styles.notificationMessage}>
          {item.message}
        </Text>
        
        {/* Données contextuelles de ton backend */}
        {item.data && (
          <View style={styles.contextData}>
            <Text style={styles.contextText}>
              Collecteur ID: {item.collecteurId}
            </Text>
            {item.entityId && (
              <Text style={styles.contextText}>
                Entité concernée: {item.entityId}
              </Text>
            )}
          </View>
        )}
        
        {isUnread && (
          <View style={[
            styles.unreadIndicator,
            isUrgent && styles.urgentIndicator
          ]}>
            <Text style={styles.unreadText}>
              {isUrgent ? 'URGENT' : 'Nouveau'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ===== HELPERS =====

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITIQUE': return 'error';
      case 'HAUTE': return 'warning';
      default: return 'info';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITIQUE': return COLORS.error;
      case 'HAUTE': return COLORS.warning;
      default: return COLORS.info;
    }
  };

  const filterNotifications = (priority) => {
    const filtered = criticalNotifications.filter(n => n.priority === priority);
    setCriticalNotifications(filtered);
  };

  // ===== RENDER PRINCIPAL =====

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard intégré à ton backend */}
        {renderDashboard()}

        {/* Notifications Critiques de ton backend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Notifications Critiques ({criticalNotifications.length})
            </Text>
            <TouchableOpacity onPress={loadCriticalNotifications}>
              <Icon name="refresh" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {criticalNotifications.length > 0 ? (
            <FlatList
              data={criticalNotifications}
              renderItem={renderCriticalNotification}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="check-circle" size={48} color={COLORS.success} />
              <Text style={styles.emptyText}>Aucune notification critique</Text>
              <Text style={styles.emptySubtext}>
                Système de polling en cours (intervalle adaptatif)
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ===== STYLES =====

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Dashboard
  dashboardContainer: {
    backgroundColor: COLORS.white,
    margin: SIZES.padding,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  lastUpdateText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SIZES.base,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  
  // Statistiques détaillées
  detailedStats: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SIZES.padding,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statItemLabel: {
    fontSize: 11,
    color: COLORS.gray,
  },
  
  // Sections
  section: {
    backgroundColor: COLORS.white,
    margin: SIZES.padding,
    marginTop: 0,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  
  // Notifications
  notificationCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gray,
  },
  notificationUnread: {
    backgroundColor: '#FFF3CD',
    borderLeftColor: COLORS.warning,
  },
  notificationUrgent: {
    backgroundColor: '#F8D7DA',
    borderLeftColor: COLORS.error,
  },
  notificationHeader: {
    marginBottom: SIZES.base,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginLeft: 8,
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: 'bold',
  },
  groupedBadge: {
    backgroundColor: COLORS.info,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  groupedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: SIZES.base,
  },
  contextData: {
    backgroundColor: COLORS.lightBlue,
    padding: 8,
    borderRadius: 4,
    marginBottom: SIZES.base,
  },
  contextText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgentIndicator: {
    backgroundColor: COLORS.error,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // État vide
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.padding * 2,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
  },
};

export default AdminNotificationsScreen;
    