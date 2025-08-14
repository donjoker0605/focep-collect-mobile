// src/screens/Collecteur/DashboardScreen.js - NAVIGATION CORRIGÉE
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Services et Hooks
import { collecteurService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import { useCollecteurNavigation } from '../../navigation/CollecteurStack';
import theme from '../../theme';
import journalActiviteService from '../../services/journalActiviteService';

// 🔥 CORRECTION: Utilisation de la navigation standard
import { useNavigation } from '@react-navigation/native';

// COMPOSANTS DE REMPLACEMENT TEMPORAIRES
const Header = ({ title, showNotificationButton, onNotificationPress }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerTitle}>{title}</Text>
    {showNotificationButton && (
      <TouchableOpacity onPress={onNotificationPress}>
        <Ionicons name="notifications-outline" size={24} color="white" />
      </TouchableOpacity>
    )}
  </View>
);

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const StatCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const LoadingSpinner = ({ size = "large" }) => (
  <ActivityIndicator size={size} color={theme.colors.primary} />
);

const EmptyState = ({ type, title, message, buttonText, onButtonPress, icon, compact }) => (
  <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
    {icon && <Ionicons name={icon} size={48} color={theme.colors.textLight} />}
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    {buttonText && (
      <TouchableOpacity style={styles.emptyButton} onPress={onButtonPress}>
        <Text style={styles.emptyButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const TransactionItem = ({ transaction, onPress }) => (
  <TouchableOpacity style={styles.transactionItem} onPress={onPress}>
    <View style={styles.transactionInfo}>
      <Text style={styles.transactionType}>{transaction.type || 'Transaction'}</Text>
      <Text style={styles.transactionDate}>{transaction.date || 'Aujourd\'hui'}</Text>
    </View>
    <Text style={styles.transactionAmount}>
      {(transaction.montant || 0).toLocaleString()} FCFA
    </Text>
  </TouchableOpacity>
);

const RecentActivitiesPreview = ({ userId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivities();
  }, [userId]);

  const loadRecentActivities = async () => {
    if (!userId) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await journalActiviteService.getUserActivities(
        userId, 
        today, 
        { page: 0, size: 3 }
      );
      
      if (response.success && response.data) {
        setActivities(response.data.content || []);
      }
    } catch (error) {
      console.error('Erreur chargement activités récentes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.recentActivitiesLoading}>
        <LoadingSpinner size="small" />
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.recentActivitiesEmpty}>
        <Text style={styles.emptyActivitiesText}>Aucune activité aujourd'hui</Text>
      </View>
    );
  }

  return (
    <View style={styles.recentActivitiesList}>
      {activities.map((activity, index) => (
        <View key={activity.id} style={styles.activityPreviewItem}>
          <View style={styles.activityIcon}>
            <Ionicons 
              name={getActivityIcon(activity.action)} 
              size={16} 
              color={getActivityColor(activity.action)} 
            />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{activity.actionDisplayName}</Text>
            <Text style={styles.activityTime}>{activity.timeAgo}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Fonctions utilitaires pour l'aperçu
const getActivityIcon = (action) => {
  const icons = {
    'CREATE_CLIENT': 'person-add',
    'MODIFY_CLIENT': 'create',
    'TRANSACTION_EPARGNE': 'arrow-down-circle',
    'TRANSACTION_RETRAIT': 'arrow-up-circle',
    'LOGIN': 'log-in'
  };
  return icons[action] || 'information-circle';
};

const getActivityColor = (action) => {
  const colors = {
    'CREATE_CLIENT': theme.colors.success,
    'MODIFY_CLIENT': theme.colors.warning,
    'TRANSACTION_EPARGNE': theme.colors.success,
    'TRANSACTION_RETRAIT': theme.colors.warning,
    'LOGIN': theme.colors.primary
  };
  return colors[action] || theme.colors.textLight;
};

const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // 🔥 CORRECTION: Utilisation des fonctions de navigation appropriées
  const { goToAddClient, goToClientList } = useCollecteurNavigation(navigation);
  
  // États
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Charger les données du dashboard
  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setError('Utilisateur non authentifié');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const response = await collecteurService.getCollecteurDashboard(user.id);
      
      if (response.success) {
        setDashboard(response.data);
        
        // Afficher un avertissement si des données par défaut sont utilisées
        if (response.warning) {
          console.warn('Dashboard:', response.warning);
        }
      } else {
        setError(response.error || 'Erreur lors du chargement du dashboard');
      }
    } catch (err) {
      console.error('Erreur dashboard:', err);
      setError(err.message || 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Rafraîchir les données
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  // Charger les données au montage
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // 🔥 CORRECTION: Naviguer vers un écran spécifique avec les bonnes méthodes
  const navigateToScreen = (screenName, params = {}) => {
    switch (screenName) {
      case 'AddClient':
        // Utiliser la fonction de navigation appropriée
        goToAddClient();
        break;
      case 'Clients':
        goToClientList();
        break;
      case 'Collecte':
        navigation.navigate('Collecte', params);
        break;
      case 'Journal':
        navigation.navigate('Journal', params);
        break;
      case 'JournalActivite':
        navigation.navigate('JournalActivite', params);
        break;
      case 'Notifications':
        navigation.navigate('Notifications', params);
        break;
      default:
        console.warn(`Navigation vers ${screenName} non configurée`);
        break;
    }
  };

  // Affichage de l'état de chargement
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Tableau de bord"
          showNotificationButton={true}
          onNotificationPress={() => navigateToScreen('Notifications')}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Chargement du dashboard...</Text>
        </View>
      </View>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Tableau de bord"
          showNotificationButton={true}
          onNotificationPress={() => navigateToScreen('Notifications')}
        />
        <View style={styles.errorContainer}>
          <EmptyState
            type="error"
            title="Erreur"
            message={error}
            buttonText="Réessayer"
            onButtonPress={loadDashboard}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Tableau de bord"
        showNotificationButton={true}
        onNotificationPress={() => navigateToScreen('Notifications')}
      />
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Message de bienvenue */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Bonjour, {user?.prenom || user?.nom || 'Collecteur'}
          </Text>
          <Text style={styles.welcomeSubtext}>
            Voici votre résumé d'activité
          </Text>
          
          {/* Indicateur de période filtrée */}
          {dashboard?.periodInfo?.isFiltered && (
            <View style={styles.periodInfoContainer}>
              <Ionicons name="information-circle" size={16} color={theme.colors.info} />
              <Text style={styles.periodInfoText}>
                Données depuis dernière clôture ({dashboard.periodInfo.fromDate})
              </Text>
            </View>
          )}
        </View>

        {/* Statistiques principales */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Clients"
            value={dashboard?.totalClients || 0}
            icon="people"
            color={theme.colors.primary}
            onPress={() => navigateToScreen('Clients')}
          />
          
          <StatCard
            title="Épargne Totale"
            value={`${(dashboard?.totalEpargne || 0).toLocaleString()} FCFA`}
            icon="wallet"
            color={theme.colors.success}
            onPress={() => navigateToScreen('Collecte', { selectedTab: 'epargne' })}
          />
          
          <StatCard
            title="Retraits Totaux"
            value={`${(dashboard?.totalRetraits || 0).toLocaleString()} FCFA`}
            icon="cash"
            color={theme.colors.warning}
            onPress={() => navigateToScreen('Collecte', { selectedTab: 'retrait' })}
          />
          
          <StatCard
            title="Solde Total"
            value={`${(dashboard?.soldeTotal || 0).toLocaleString()} FCFA`}
            icon="analytics"
            color={theme.colors.info}
            onPress={() => navigateToScreen('Journal')}
          />
        </View>

        {/* Actions rapides */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.cardTitle}>Actions rapides</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigateToScreen('Collecte', { selectedTab: 'epargne' })}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.success} />
              <Text style={styles.quickActionText}>Épargne</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigateToScreen('Collecte', { selectedTab: 'retrait' })}
            >
              <Ionicons name="remove-circle" size={24} color={theme.colors.warning} />
              <Text style={styles.quickActionText}>Retrait</Text>
            </TouchableOpacity>
            
            {/* 🔥 CORRECTION: Utilisation de la fonction de navigation appropriée */}
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigateToScreen('AddClient')}
            >
              <Ionicons name="person-add" size={24} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>Nouveau client</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigateToScreen('JournalActivite')}
            >
              <Ionicons name="document-text" size={24} color={theme.colors.info} />
              <Text style={styles.quickActionText}>Journal</Text>
            </TouchableOpacity>
          </View>
        </Card>
		
		{/* Activités récentes */}
		<Card style={styles.recentActivitiesCard}>
		  <View style={styles.cardHeader}>
			<Text style={styles.cardTitle}>Activités récentes</Text>
			<TouchableOpacity onPress={() => navigateToScreen('JournalActivite')}>
			  <Text style={styles.seeAllText}>Voir tout</Text>
			</TouchableOpacity>
		  </View>
		  
		  <RecentActivitiesPreview userId={user?.id} />
		</Card>
      </ScrollView>
    </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
    ),
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    borderLeftWidth: 4,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
    ),
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
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
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  periodInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${theme.colors.info}10`,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info,
  },
  periodInfoText: {
    fontSize: 14,
    color: theme.colors.info,
    marginLeft: 8,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  quickActionsCard: {
    padding: 16,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
    ),
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateCompact: {
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  recentActivitiesCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  recentActivitiesLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  recentActivitiesEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyActivitiesText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  recentActivitiesList: {
    paddingVertical: 4,
  },
  activityPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
});

export default DashboardScreen;