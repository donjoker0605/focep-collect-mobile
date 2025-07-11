// src/screens/Admin/AdminNotificationsScreen.js - VERSION CORRIGÉE
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
import { Ionicons } from '@expo/vector-icons'; 

import theme from '../../theme';
import adminNotificationService from '../../services/adminNotificationService';
import { formatTimeAgo, formatMontant } from '../../utils/formatters';

const { colors, spacing } = theme;

const SIZES = {
  base: spacing.sm,
  padding: spacing.md,
  radius: theme.borderRadius.md,
};

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
      
      // Démarrer polling intelligent avec votre backend
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
   * 📊 Chargement données initiales depuis votre backend
   */
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Utiliser vos endpoints
      const [dashboardResult, criticalResult] = await Promise.all([
        adminNotificationService.getDashboard(),
        adminNotificationService.getCriticalNotifications()
      ]);
      
      // ✅ CORRECTION : Adapter les données du backend à la structure attendue par le frontend
      const dashboardData = dashboardResult.data || {};
      const criticalData = criticalResult.data || [];
      
      // Mapper les données backend vers la structure frontend
      const mappedDashboard = {
        // Utiliser les stats du backend
        urgentNotifications: dashboardData.stats?.critiquesNonLues || 0,
        unreadNotifications: dashboardData.stats?.nonLues || 0,
        activitiesCount: dashboardData.stats?.total || 0,
        
        // Données additionnelles du backend
        criticalNotifications: dashboardData.criticalNotifications || [],
        recentNotifications: dashboardData.recentNotifications || [],
        lastUpdate: dashboardData.lastUpdate || new Date().toISOString(),
        
        // Stats détaillées si disponibles
        stats: {
          total: dashboardData.stats?.total || 0,
          critiques: dashboardData.stats?.critiques || 0,
          critiquesNonLues: dashboardData.stats?.critiquesNonLues || 0,
          nonLues: dashboardData.stats?.nonLues || 0,
          // Ajouter d'autres stats si nécessaire
          transactions: 0, // TODO: à implémenter côté backend si nécessaire
          nouveauxClients: 0, // TODO: à implémenter côté backend si nécessaire
          collecteursActifs: 0 // TODO: à implémenter côté backend si nécessaire
        }
      };
      
      setDashboard(mappedDashboard);
      setCriticalNotifications(criticalData);
      setLastUpdate(new Date());
      
      // ✅ LOG CORRIGÉ avec les bonnes propriétés
      console.log('✅ Données admin chargées depuis votre backend:', {
        activités: mappedDashboard.activitiesCount,
        urgentes: mappedDashboard.urgentNotifications,
        notifications: criticalData.length,
        stats: mappedDashboard.stats
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement données admin:', error);
      Alert.alert('Erreur', 'Impossible de charger les données admin');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 Callback polling intelligent - CORRIGÉ pour la structure backend
   */
  const handlePollingUpdate = (dashboardResult) => {
    if (dashboardResult && dashboardResult.data) {
      const dashboardData = dashboardResult.data;
      
      // Mapper les nouvelles données
      const mappedDashboard = {
        urgentNotifications: dashboardData.stats?.critiquesNonLues || 0,
        unreadNotifications: dashboardData.stats?.nonLues || 0,
        activitiesCount: dashboardData.stats?.total || 0,
        criticalNotifications: dashboardData.criticalNotifications || [],
        recentNotifications: dashboardData.recentNotifications || [],
        lastUpdate: dashboardData.lastUpdate || new Date().toISOString(),
        stats: dashboardData.stats || {}
      };
      
      // Détecter changements significatifs
      const hasSignificantChanges = dashboard && (
        mappedDashboard.urgentNotifications !== dashboard.urgentNotifications ||
        mappedDashboard.unreadNotifications !== dashboard.unreadNotifications
      );
      
      setDashboard(mappedDashboard);
      setLastUpdate(new Date());
      
      // Si changements significatifs, recharger notifications critiques
      if (hasSignificantChanges) {
        console.log('🔔 Changements significatifs - rechargement notifications');
        loadCriticalNotifications();
        
        // Vibration pour nouvelles urgentes si app active
        if (appState === 'active' && mappedDashboard.urgentNotifications > 0) {
          showUrgentNotificationAlert(mappedDashboard.urgentNotifications);
        }
      }
    }
  };

  /**
   * 🔔 Charger notifications critiques depuis votre backend - CORRIGÉ
   */
  const loadCriticalNotifications = async () => {
    try {
      const result = await adminNotificationService.getCriticalNotifications();
      const notifications = result.data || [];
      setCriticalNotifications(notifications);
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    }
  };

  /**
   * Marquer notification comme lue via votre backend - CORRIGÉ
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
   * 📊 Dashboard adapté à votre backend
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
              { backgroundColor: appState === 'active' ? colors.success : colors.warning }
            ]} />
            <Text style={styles.lastUpdateText}>
              {formatTimeAgo(lastUpdate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <DashboardStat
            icon="warning"
            label="Urgentes"
            value={dashboard.urgentNotifications}
            color={colors.error}
            onPress={() => filterNotifications('CRITIQUE')}
          />
          <DashboardStat
            icon="notifications"
            label="Non lues"
            value={dashboard.unreadNotifications}
            color={colors.warning}
            onPress={() => loadCriticalNotifications()}
          />
          <DashboardStat
            icon="trending-up"
            label="Activités"
            value={dashboard.activitiesCount}
            color={colors.primary}
            onPress={() => navigation.navigate('AdminCollecteurSupervision')}
          />
        </View>
        
        {/* Statistiques détaillées de votre backend */}
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
      <Ionicons name={icon} size={24} color={color} />
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
   * 🚨 Notification critique adaptée à votre backend
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
            <Ionicons
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
        
        {/* Données contextuelles de votre backend */}
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
      case 'CRITIQUE': return 'alert-circle';
      case 'HAUTE': return 'warning';
      default: return 'information-circle';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITIQUE': return colors.error;
      case 'HAUTE': return colors.warning;
      default: return colors.primary;
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
        {/* Dashboard intégré à votre backend */}
        {renderDashboard()}

        {/* Notifications Critiques de votre backend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Notifications Critiques ({criticalNotifications.length})
            </Text>
            <TouchableOpacity onPress={loadCriticalNotifications}>
              <Ionicons name="refresh" size={24} color={colors.primary} />
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
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
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

// ===== STYLES CORRIGÉS =====

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Dashboard
  dashboardContainer: {
    backgroundColor: colors.white,
    margin: SIZES.padding,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...theme.shadows.medium,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  dashboardTitle: {
    ...theme.fonts.style.h3,
    color: colors.text,
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
    ...theme.fonts.style.caption,
    color: colors.textLight,
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
    backgroundColor: colors.lightGray,
    borderRadius: SIZES.radius,
    marginHorizontal: 4,
  },
  statValue: {
    ...theme.fonts.style.h4,
    marginTop: 4,
  },
  statLabel: {
    ...theme.fonts.style.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
  
  // Statistiques détaillées
  detailedStats: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: SIZES.padding,
  },
  statsTitle: {
    ...theme.fonts.style.bodySmall,
    fontWeight: '600',
    color: colors.text,
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
    ...theme.fonts.style.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statItemLabel: {
    fontSize: 11,
    color: colors.textLight,
  },
  
  // Sections
  section: {
    backgroundColor: colors.white,
    margin: SIZES.padding,
    marginTop: 0,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...theme.shadows.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...theme.fonts.style.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  // Notifications
  notificationCard: {
    backgroundColor: colors.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: colors.gray,
  },
  notificationUnread: {
    backgroundColor: '#FFF3CD',
    borderLeftColor: colors.warning,
  },
  notificationUrgent: {
    backgroundColor: '#F8D7DA',
    borderLeftColor: colors.error,
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
    ...theme.fonts.style.bodySmall,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: 'bold',
  },
  groupedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  groupedText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationTime: {
    ...theme.fonts.style.caption,
    color: colors.textLight,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.darkGray,
    lineHeight: 18,
    marginBottom: SIZES.base,
  },
  contextData: {
    backgroundColor: colors.lightGray,
    padding: 8,
    borderRadius: 4,
    marginBottom: SIZES.base,
  },
  contextText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.warning,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgentIndicator: {
    backgroundColor: colors.error,
  },
  unreadText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // État vide
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.padding * 2,
  },
  emptyText: {
    ...theme.fonts.style.body,
    color: colors.text,
    fontWeight: '500',
    marginTop: 8,
  },
  emptySubtext: {
    ...theme.fonts.style.bodySmall,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
};

export default AdminNotificationsScreen;