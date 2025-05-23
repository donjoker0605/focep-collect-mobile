// src/screens/Collecteur/DashboardScreen.js - VERSION UNIFIÉE
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import {
  Header,
  Card,
  StatCard,
  TransactionItem,
  LoadingSpinner,
  EmptyState
} from '../../components';

// Services et Hooks
import { collecteurService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import theme from '../../theme';

const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
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
      
      // ✅ UTILISATION DU SERVICE UNIFIÉ
      const response = await ApiService.getCollecteurDashboard(user.id);
      
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

  // Naviguer vers un écran spécifique
  const navigateToScreen = (screenName, params = {}) => {
    navigation.navigate(screenName, params);
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

        {/* Statistiques du jour */}
        <Card style={styles.todayStatsCard}>
          <Text style={styles.cardTitle}>Activité du jour</Text>
          
          <View style={styles.todayStatsRow}>
            <View style={styles.todayStatItem}>
              <Text style={styles.todayStatValue}>
                {dashboard?.transactionsAujourdhui || 0}
              </Text>
              <Text style={styles.todayStatLabel}>Transactions</Text>
            </View>
            
            <View style={styles.todayStatItem}>
              <Text style={styles.todayStatValue}>
                {(dashboard?.montantEpargneAujourdhui || 0).toLocaleString()}
              </Text>
              <Text style={styles.todayStatLabel}>Épargne (FCFA)</Text>
            </View>
            
            <View style={styles.todayStatItem}>
              <Text style={styles.todayStatValue}>
                {(dashboard?.montantRetraitAujourdhui || 0).toLocaleString()}
              </Text>
              <Text style={styles.todayStatLabel}>Retraits (FCFA)</Text>
            </View>
          </View>
        </Card>

        {/* Journal actuel */}
        {dashboard?.journalActuel && (
          <Card style={styles.journalCard}>
            <View style={styles.journalHeader}>
              <Text style={styles.cardTitle}>Journal actuel</Text>
              <TouchableOpacity 
                onPress={() => navigateToScreen('Journal')}
                style={styles.journalViewButton}
              >
                <Text style={styles.journalViewButtonText}>Voir détails</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.journalInfo}>
              <Text style={styles.journalStatus}>
                Statut: {dashboard.journalActuel.statut}
              </Text>
              <Text style={styles.journalDate}>
                Du {new Date(dashboard.journalActuel.dateDebut).toLocaleDateString()} 
                au {new Date(dashboard.journalActuel.dateFin).toLocaleDateString()}
              </Text>
              <Text style={styles.journalBalance}>
                Solde: {(dashboard.journalActuel.soldeActuel || 0).toLocaleString()} FCFA
              </Text>
            </View>
          </Card>
        )}

        {/* Transactions récentes */}
        <Card style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.cardTitle}>Transactions récentes</Text>
            <TouchableOpacity 
              onPress={() => navigateToScreen('Journal')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllButtonText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {dashboard?.transactionsRecentes?.length > 0 ? (
            dashboard.transactionsRecentes.slice(0, 5).map((transaction, index) => (
              <TransactionItem
                key={transaction.id || index}
                transaction={transaction}
                onPress={() => navigateToScreen('TransactionDetail', { transactionId: transaction.id })}
              />
            ))
          ) : (
            <EmptyState
              type="no-data"
              title="Aucune transaction"
              message="Aucune transaction récente à afficher"
              icon="swap-horizontal-outline"
              compact={true}
            />
          )}
        </Card>

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
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigateToScreen('ClientAddEdit', { mode: 'add' })}
            >
              <Ionicons name="person-add" size={24} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>Nouveau client</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigateToScreen('Journal')}
            >
              <Ionicons name="document-text" size={24} color={theme.colors.info} />
              <Text style={styles.quickActionText}>Journal</Text>
            </TouchableOpacity>
          </View>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  todayStatsCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  todayStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayStatItem: {
    alignItems: 'center',
  },
  todayStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  todayStatLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  journalCard: {
    padding: 16,
    marginBottom: 16,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  journalViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journalViewButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    marginRight: 4,
  },
  journalInfo: {
    gap: 8,
  },
  journalStatus: {
    fontSize: 14,
    color: theme.colors.text,
  },
  journalDate: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  journalBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
  },
  transactionsCard: {
    padding: 16,
    marginBottom: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
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
    ...theme.shadows.small,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default DashboardScreen;