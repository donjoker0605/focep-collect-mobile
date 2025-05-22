// src/screens/Collecteur/DashboardScreen.js - IMPORTS CORRIGÉS
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ✅ IMPORTS CORRIGÉS - Named imports
import { getClients } from '../../api/client';
import { fetchJournalTransactions, getCollecteurDashboard } from '../../api/transaction';
import { getNotifications } from '../../api/notification';

// Components
import { Card, EmptyState } from '../../components';

// Services et hooks
import { useAuth } from '../../hooks/useAuth';
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState({
    soldeTotal: 0,
    totalRetraits: 0,
    totalClients: 0,
    totalTransactions: 0,
    totalEpargnes: 0,
    unreadNotifications: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  
  // Fonction pour charger les données du tableau de bord
  const loadDashboard = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      // Vérifier que l'utilisateur existe
      if (!user?.id) {
        throw new Error('Utilisateur non trouvé');
      }
      
      console.log('🔄 Chargement dashboard pour collecteur:', user.id);
      
      // ✅ APPELS API CORRIGÉS
      const [dashboardResult, clientsResult, transactionsResult, notificationsResult] = await Promise.allSettled([
        getCollecteurDashboard(user.id),
        getClients({ collecteurId: user.id, page: 0, size: 1 }),
        fetchJournalTransactions({ collecteurId: user.id, page: 0, size: 5 }),
        getNotifications(0, 1)
      ]);
      
      // Log des résultats pour debugging
      console.log('📊 Résultats API:', {
        dashboard: dashboardResult.status,
        clients: clientsResult.status,
        transactions: transactionsResult.status,
        notifications: notificationsResult.status
      });
      
      // Traiter les résultats avec fallbacks
      let dashboardData = {
        soldeTotal: 0,
        totalRetraits: 0,
        totalClients: 0,
        totalTransactions: 0,
        totalEpargnes: 0,
        unreadNotifications: 0
      };
      
      // Dashboard
      if (dashboardResult.status === 'fulfilled' && dashboardResult.value.success) {
        dashboardData = { ...dashboardData, ...dashboardResult.value.data };
        console.log('✅ Dashboard chargé:', dashboardResult.value.data);
      } else {
        console.warn('⚠️ Dashboard non disponible:', dashboardResult.reason?.message || 'Erreur inconnue');
      }
      
      // Clients
      if (clientsResult.status === 'fulfilled' && clientsResult.value.success) {
        dashboardData.totalClients = clientsResult.value.totalElements || 0;
        console.log('✅ Clients chargés:', clientsResult.value.totalElements);
      } else {
        console.warn('⚠️ Clients non disponibles:', clientsResult.reason?.message || 'Erreur inconnue');
      }
      
      // Transactions récentes
      if (transactionsResult.status === 'fulfilled' && transactionsResult.value.success) {
        const transactionsData = transactionsResult.value.data || [];
        setTransactions(transactionsData);
        console.log('✅ Transactions chargées:', transactionsData.length);
        
        // Si pas de dashboard dédié, calculer depuis les transactions
        if (dashboardResult.status === 'rejected') {
          const totals = transactionsData.reduce((acc, t) => {
            if (t.type === 'EPARGNE') {
              acc.totalEpargnes += t.montant || 0;
            } else if (t.type === 'RETRAIT') {
              acc.totalRetraits += t.montant || 0;
            }
            return acc;
          }, { totalEpargnes: 0, totalRetraits: 0 });
          
          dashboardData.totalEpargnes = totals.totalEpargnes;
          dashboardData.totalRetraits = totals.totalRetraits;
          dashboardData.soldeTotal = totals.totalEpargnes - totals.totalRetraits;
          dashboardData.totalTransactions = transactionsData.length;
        }
      } else {
        console.warn('⚠️ Transactions non disponibles:', transactionsResult.reason?.message || 'Erreur inconnue');
      }
      
      // Notifications
      if (notificationsResult.status === 'fulfilled') {
        dashboardData.unreadNotifications = notificationsResult.value.unreadCount || 0;
        console.log('✅ Notifications chargées:', notificationsResult.value.unreadCount);
      } else {
        console.warn('⚠️ Notifications non disponibles:', notificationsResult.reason?.message || 'Erreur inconnue');
      }
      
      setDashboard(dashboardData);
      console.log('📈 Dashboard final:', dashboardData);
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement du tableau de bord:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);
  
  // Charger les données au premier chargement et à chaque focus
  useEffect(() => {
    if (isFocused && user?.id) {
      loadDashboard();
    }
  }, [isFocused, loadDashboard, user?.id]);
  
  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    loadDashboard(true);
  };
  
  // Rendre l'en-tête du tableau de bord
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileSection}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>
            {user?.prenom || 'Collecteur'} {user?.nom || ''}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.white} />
          {dashboard?.unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {dashboard.unreadNotifications > 9 ? '9+' : dashboard.unreadNotifications.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.date}>
        {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
      </Text>
    </View>
  );
  
  // Rendre la section des soldes
  const renderBalances = () => (
    <View style={styles.balanceSection}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>Total Collecté</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(dashboard?.soldeTotal || 0)} FCFA
        </Text>
      </View>
      
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>Total Retrait</Text>
        <Text style={[styles.balanceAmount, styles.balanceNegative]}>
          -{formatCurrency(dashboard?.totalRetraits || 0)} FCFA
        </Text>
      </View>
    </View>
  );
  
  // Rendre la section des statistiques
  const renderStats = () => (
    <View style={styles.statsSection}>
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="people" size={24} color={theme.colors.info} />
            <Text style={styles.statValue}>{dashboard?.totalClients || 0}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
        </Card>
       
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="swap-horizontal" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{dashboard?.totalTransactions || 0}</Text>
            <Text style={styles.statLabel}>Opérations</Text>
          </View>
        </Card>
      </View>
      
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="arrow-down" size={24} color={theme.colors.success} />
            <Text style={styles.statValue}>{formatCurrency(dashboard?.totalEpargnes || 0)}</Text>
            <Text style={styles.statLabel}>Épargnes</Text>
          </View>
        </Card>
       
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Ionicons name="arrow-up" size={24} color={theme.colors.error} />
            <Text style={styles.statValue}>{formatCurrency(dashboard?.totalRetraits || 0)}</Text>
            <Text style={styles.statLabel}>Retraits</Text>
          </View>
        </Card>
      </View>
    </View>
  );
  
  // Rendu des actions rapides
  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Collecte', { selectedTab: 'epargne' })}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.success}20` }]}>
            <Ionicons name="arrow-down" size={24} color={theme.colors.success} />
          </View>
          <Text style={styles.actionText}>Nouvelle épargne</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Collecte', { selectedTab: 'retrait' })}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.error}20` }]}>
            <Ionicons name="arrow-up" size={24} color={theme.colors.error} />
          </View>
          <Text style={styles.actionText}>Nouveau retrait</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Clients')}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.info}20` }]}>
            <Ionicons name="people" size={24} color={theme.colors.info} />
          </View>
          <Text style={styles.actionText}>Mes clients</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Journal')}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
            <Ionicons name="document-text" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.actionText}>Journal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Rendre la section des transactions récentes
  const renderTransactions = () => (
    <View style={styles.transactionsSection}>
      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Transactions récentes</Text>
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Journal')}
        >
          <Text style={styles.viewAllText}>Voir tout</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {transactions.length === 0 ? (
        <EmptyState
          type="empty"
          title="Aucune transaction"
          message="Vous n'avez pas encore effectué de transactions."
          containerStyle={styles.emptyTransactions}
        />
      ) : (
        transactions.map((transaction, index) => (
          <Card key={transaction.id || index} style={styles.transactionCard}>
            <View style={styles.transactionRow}>
              <View style={styles.transactionIcon}>
                <Ionicons 
                  name={transaction.type === 'EPARGNE' ? 'arrow-down-circle' : 'arrow-up-circle'} 
                  size={24} 
                  color={transaction.type === 'EPARGNE' ? theme.colors.success : theme.colors.error} 
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>{transaction.type}</Text>
                <Text style={styles.transactionDate}>
                  {transaction.dateHeure ? 
                    format(new Date(transaction.dateHeure), 'dd MMM yyyy à HH:mm', { locale: fr }) :
                    'Date inconnue'
                  }
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'EPARGNE' ? theme.colors.success : theme.colors.error }
              ]}>
                {transaction.type === 'EPARGNE' ? '+' : '-'}{formatCurrency(transaction.montant || 0)} FCFA
              </Text>
            </View>
          </Card>
        ))
      )}
    </View>
  );
  
  // Rendu principal
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderHeader()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.white} />
          <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
        </View>
      ) : error ? (
        <View style={styles.content}>
          <EmptyState
            type="error"
            title="Erreur de chargement"
            message={error}
            actionButton
            actionButtonTitle="Réessayer"
            onActionButtonPress={handleRefresh}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {renderBalances()}
          {renderStats()}
          {renderQuickActions()}
          {renderTransactions()}
          
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
};

// Styles (gardez vos styles existants)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
   marginTop: 16,
   color: theme.colors.white,
   fontSize: 16,
 },
 balanceSection: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   marginBottom: 20,
 },
 balanceCard: {
   flex: 1,
   backgroundColor: theme.colors.white,
   borderRadius: 16,
   padding: 16,
   marginHorizontal: 6,
   alignItems: 'center',
   ...theme.shadows.small,
 },
 balanceTitle: {
   fontSize: 14,
   color: theme.colors.textLight,
   marginBottom: 8,
 },
 balanceAmount: {
   fontSize: 18,
   fontWeight: 'bold',
   color: theme.colors.text,
 },
 balanceNegative: {
   color: theme.colors.error,
 },
 statsSection: {
   marginBottom: 24,
 },
 statsRow: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   marginBottom: 12,
 },
 statCard: {
   flex: 1,
   marginHorizontal: 6,
   padding: 16,
 },
 statContent: {
   alignItems: 'center',
 },
 statValue: {
   fontSize: 20,
   fontWeight: 'bold',
   color: theme.colors.text,
   marginVertical: 8,
 },
 statLabel: {
   fontSize: 12,
   color: theme.colors.textLight,
 },
 sectionTitle: {
   fontSize: 18,
   fontWeight: 'bold',
   color: theme.colors.text,
   marginBottom: 12,
 },
 quickActionsSection: {
   marginBottom: 24,
 },
 actionsGrid: {
   flexDirection: 'row',
   flexWrap: 'wrap',
   justifyContent: 'space-between',
 },
 actionItem: {
   width: '48%',
   backgroundColor: theme.colors.white,
   borderRadius: 16,
   padding: 16,
   marginBottom: 16,
   alignItems: 'center',
   ...theme.shadows.small,
 },
 actionIcon: {
   width: 50,
   height: 50,
   borderRadius: 25,
   justifyContent: 'center',
   alignItems: 'center',
   marginBottom: 12,
 },
 actionText: {
   fontSize: 14,
   fontWeight: '500',
   color: theme.colors.text,
   textAlign: 'center',
 },
 transactionsSection: {
   marginBottom: 16,
 },
 transactionsHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 12,
 },
 viewAllButton: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 viewAllText: {
   fontSize: 14,
   color: theme.colors.primary,
   marginRight: 4,
 },
 emptyTransactions: {
   height: 150,
   marginBottom: 16,
 },
 transactionCard: {
   marginBottom: 8,
   padding: 12,
 },
 transactionRow: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 transactionIcon: {
   marginRight: 12,
 },
 transactionInfo: {
   flex: 1,
 },
 transactionType: {
   fontSize: 16,
   fontWeight: '500',
   color: theme.colors.text,
 },
 transactionDate: {
   fontSize: 12,
   color: theme.colors.textLight,
   marginTop: 2,
 },
 transactionAmount: {
   fontSize: 16,
   fontWeight: 'bold',
 },
});

export default DashboardScreen;