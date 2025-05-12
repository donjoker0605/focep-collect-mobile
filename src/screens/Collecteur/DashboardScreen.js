// src/screens/Collecteur/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Components
import { 
  BalanceCard, 
  StatsCard, 
  EnhancedTransactionItem,
  EmptyState,
  ProgressIndicator
} from '../../components';

// Services et hooks
import { useAuth } from '../../hooks/useAuth';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { 
  getCollecteurDashboard, 
  fetchRecentTransactions, 
  getCommissionsSummary 
} from '../../api/dashboard';

// Theme et utilitaires
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { syncStatus, pendingCount, syncNow } = useOfflineSync();
  
  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [commissionsSummary, setCommissionsSummary] = useState(null);
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
      
      // Charger les données du tableau de bord
      const dashboardData = await getCollecteurDashboard(user.id);
      setDashboard(dashboardData);
      
      // Charger les transactions récentes
      setTransactionsLoading(true);
      const transactionsData = await fetchRecentTransactions({ 
        collecteurId: user.id, 
        page: 0, 
        size: 5 
      });
      setTransactions(transactionsData.content || []);
      setTransactionsLoading(false);
      
      // Charger le résumé des commissions
      const commissionsData = await getCommissionsSummary({ collecteurId: user.id });
      setCommissionsSummary(commissionsData);
    } catch (err) {
      console.error('Erreur lors du chargement du tableau de bord:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);
  
  // Charger les données au premier chargement et à chaque focus
  useEffect(() => {
    if (isFocused) {
      loadDashboard();
    }
  }, [isFocused, loadDashboard]);
  
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
          <Text style={styles.userName}>{user.prenom} {user.nom}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.white} />
          {/* Badge de notification si nécessaire */}
          {dashboard?.unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {dashboard.unreadNotifications > 9 ? '9+' : dashboard.unreadNotifications}
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
  
  // Modifier la fonction renderBalances pour afficher comme votre référence
const renderBalances = () => (
  <View style={styles.balanceSection}>
    <View style={styles.balanceCard}>
      <Text style={styles.balanceTitle}>Total Collecté</Text>
      <Text style={styles.balanceAmount}>
        {formatCurrency(dashboard?.soldeTotal || 0, true, 2).replace(' FCFA', '')}
      </Text>
    </View>
    
    <View style={styles.balanceCard}>
      <Text style={styles.balanceTitle}>Total Retrait</Text>
      <Text style={[styles.balanceAmount, styles.balanceNegative]}>
        -{formatCurrency(dashboard?.totalRetraits || 0, true, 2).replace(' FCFA', '')}
      </Text>
    </View>
  </View>
);

// Ajouter une barre de progression après le renderBalances
const renderProgressBar = () => (
  <View style={styles.progressBarContainer}>
    <View style={styles.progressBar}>
      <View 
        style={[
          styles.progressBarFill, 
          { width: `${dashboard?.progressionObjectif || 0}%` }
        ]} 
      />
    </View>
    <Text style={styles.progressBarText}>
      {dashboard?.progressionObjectif || 0}% de {formatCurrency(dashboard?.objectifMensuel || 0)}
    </Text>
  </View>
);
  
  // Rendre la section des statistiques
  const renderStats = () => (
    <View style={styles.statsSection}>
      <View style={styles.statsRow}>
        <StatsCard
          title="Clients"
          value={dashboard?.totalClients?.toString() || "0"}
          icon="people"
          iconColor={theme.colors.info}
          variant="minimal"
          style={styles.statCard}
          showPercentChange={dashboard?.clientsPercentChange !== undefined}
          percentChange={dashboard?.clientsPercentChange || 0}
          compareLabel="vs mois dernier"
          onPress={() => navigation.navigate('Clients')}
        />
       
        <StatsCard
          title="Opérations"
          value={dashboard?.totalTransactions?.toString() || "0"}
          icon="swap-horizontal"
          iconColor={theme.colors.primary}
          variant="minimal"
          style={styles.statCard}
          showPercentChange={dashboard?.transactionsPercentChange !== undefined}
          percentChange={dashboard?.transactionsPercentChange || 0}
          compareLabel="vs mois dernier"
          onPress={() => navigation.navigate('Journal')}
        />
      </View>
     
      {/* Afficher les opérations en attente de synchronisation s'il y en a */}
      {renderSyncStats()}
      
      <View style={styles.statsRow}>
        <StatsCard
          title="Épargnes"
          value={formatCurrency(dashboard?.totalEpargnes || 0)}
          unit="FCFA"
          icon="arrow-down"
          iconColor={theme.colors.success}
          variant="minimal"
          style={styles.statCard}
          showPercentChange={dashboard?.epargnesPercentChange !== undefined}
          percentChange={dashboard?.epargnesPercentChange || 0}
          compareLabel="vs mois dernier"
          onPress={() => navigation.navigate('Collecte', { selectedTab: 'epargne' })}
        />
       
        <StatsCard
          title="Retraits"
          value={formatCurrency(dashboard?.totalRetraits || 0)}
          unit="FCFA"
          icon="arrow-up"
          iconColor={theme.colors.error}
          variant="minimal"
          style={styles.statCard}
          showPercentChange={dashboard?.retraitsPercentChange !== undefined}
          percentChange={dashboard?.retraitsPercentChange || 0}
          compareLabel="vs mois dernier"
          onPress={() => navigation.navigate('Collecte', { selectedTab: 'retrait' })}
        />
      </View>
    </View>
  );
  
  // Fonction pour afficher les opérations en attente de synchronisation
  const renderSyncStats = () => {
    if (pendingCount > 0) {
      return (
        <View style={styles.statsRow}>
          <StatsCard
            title="Opérations en attente"
            value={pendingCount.toString()}
            icon="cloud-upload"
            iconColor={theme.colors.warning}
            onPress={syncNow}
            variant="minimal"
            style={[styles.statCard, styles.syncStatsCard]}
          />
        </View>
      );
    }
    return null;
  };
  
  // Rendre la section des objectifs
  const renderCommissions = () => {
    if (!commissionsSummary) return null;
    
    const percentComplete = commissionsSummary.objectifMensuel > 0 
      ? (commissionsSummary.montantCollecte / commissionsSummary.objectifMensuel) * 100
      : 0;
    
    return (
      <View style={styles.objectiveSection}>
        <Text style={styles.sectionTitle}>Commissions & rémunération</Text>
        
        <View style={styles.objectiveCard}>
          <View style={styles.objectiveHeader}>
            <Text style={styles.objectiveTitle}>Objectif mensuel</Text>
            <Text style={styles.objectiveAmount}>
              {formatCurrency(commissionsSummary.montantCollecte)} / {formatCurrency(commissionsSummary.objectifMensuel)} FCFA
            </Text>
          </View>
          
          <ProgressIndicator 
            progress={Math.min(percentComplete / 100, 1)}
            progressColor={theme.colors.primary}
            height={12}
            percentagePosition="right"
          />
          
          <View style={styles.commissionInfo}>
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>Commission du mois</Text>
              <Text style={styles.commissionValue}>
                {formatCurrency(commissionsSummary.commissionActuelle)} FCFA
              </Text>
            </View>
            
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>Rémunération estimée</Text>
              <Text style={styles.commissionValue}>
                {formatCurrency(commissionsSummary.remunerationEstimee)} FCFA
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
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
      
      {transactionsLoading ? (
        <View style={styles.loadingTransactions}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <EmptyState
          type="empty"
          title="Aucune transaction"
          message="Vous n'avez pas encore effectué de transactions."
          containerStyle={styles.emptyTransactions}
        />
      ) : (
        transactions.map((transaction, index) => (
          <EnhancedTransactionItem
            key={transaction.id || index}
            type={transaction.type}
            date={format(new Date(transaction.dateHeure), 'dd MMM yyyy à HH:mm', { locale: fr })}
            amount={transaction.montant}
            isIncome={transaction.type === 'Épargne'}
            status={transaction.status}
            clientInfo={transaction.client}
            reference={transaction.reference}
            showClient
            onPress={() => navigation.navigate('CollecteDetail', { transaction })}
          />
        ))
      )}
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
          {renderCommissions()}
          {renderTransactions()}
          
          <View style={{ height: 20 }} /> {/* Espace en bas */}
        </ScrollView>
      )}
    </View>
  );
};

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
  progressBarContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 6,
  },
  progressBarText: {
    fontSize: 12,
    color: theme.colors.white,
    textAlign: 'right',
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
    marginBottom: 20,
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
  },
  syncStatsCard: {
    backgroundColor: `${theme.colors.warning}10`,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.warning,
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
  objectiveSection: {
    marginBottom: 24,
  },
  objectiveCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.small,
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  objectiveTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  objectiveAmount: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  commissionInfo: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commissionItem: {
    flex: 1,
    alignItems: 'center',
  },
  commissionLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  commissionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
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
  loadingTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTransactions: {
    height: 150,
    marginBottom: 16,
  },
});

export default DashboardScreen;