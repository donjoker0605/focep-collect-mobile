// src/screens/Admin/AdminDashboardScreen.js - NAVIGATION CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { adminService } from '../../services';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const response = await adminService.getDashboardStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardStats(false);
  };

  // ✅ CORRECTION : Navigation vers les écrans appropriés
  const navigateToCollecteurSupervision = () => {
    navigation.navigate('AdminCollecteurSupervision');
  };

  const navigateToCollecteurManagement = () => {
    navigation.navigate('CollecteurManagementScreen');
  };

  const navigateToClientManagement = () => {
    navigation.navigate('ClientManagementScreen');
  };

  const navigateToReports = () => {
    navigation.navigate('ReportsScreen');
  };

  const navigateToCommissions = () => {
    navigation.navigate('CommissionCalculationScreen');
  };

  // Cartes de supervision (accès rapide aux données)
  const supervisionCards = [
    {
      id: 'collecteurs-actifs',
      title: 'Collecteurs Actifs',
      icon: 'people',
      color: theme.colors.success,
      count: stats?.collecteursActifs || 0,
      total: stats?.totalCollecteurs || 0,
      // ✅ CORRECTION : Navigation vers supervision
      onPress: navigateToCollecteurSupervision,
    },
    {
      id: 'clients-actifs',
      title: 'Clients Actifs',
      icon: 'person',
      color: theme.colors.primary,
      count: stats?.clientsActifs || 0,
      total: stats?.totalClients || 0,
      onPress: navigateToClientManagement,
    },
    {
      id: 'commissions-attente',
      title: 'Commissions',
      icon: 'card',
      color: theme.colors.warning,
      count: stats?.commissionsEnAttente || 0,
      onPress: navigateToCommissions,
    },
  ];

  // Cartes de gestion (actions administratives)
  const managementCards = [
    {
      id: 'gestion-collecteurs',
      title: 'Gérer les collecteurs',
      icon: 'people-outline',
      color: theme.colors.primary,
      description: 'Créer, modifier, désactiver',
      onPress: navigateToCollecteurManagement,
    },
    {
      id: 'gestion-clients',
      title: 'Gérer les clients',
      icon: 'person-add-outline',
      color: theme.colors.secondary,
      description: 'Visualiser et gérer les clients',
      onPress: navigateToClientManagement,
    },
    {
      id: 'rapports',
      title: 'Rapports et Analytics',
      icon: 'analytics-outline',
      color: theme.colors.info,
      description: 'Tableaux de bord et rapports',
      onPress: navigateToReports,
    },
    {
      id: 'transferts',
      title: 'Transferts de Comptes',
      icon: 'swap-horizontal-outline',
      color: theme.colors.warning,
      description: 'Gérer les transferts',
      onPress: () => navigation.navigate('TransfertCompteScreen'),
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header 
          title="Tableau de bord" 
          showNotificationButton={true}
          onNotificationPress={() => navigation.navigate('AdminNotifications')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header 
          title="Tableau de bord" 
          showNotificationButton={true}
          onNotificationPress={() => navigation.navigate('AdminNotifications')}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadDashboardStats()}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header 
        title="Tableau de bord" 
        showNotificationButton={true}
        onNotificationPress={() => navigation.navigate('AdminNotifications')}
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec informations utilisateur */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.headerGradient}
        >
          <Text style={styles.welcomeText}>Bonjour {user?.prenom || 'Admin'}</Text>
          <Text style={styles.dateText}>
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </Text>
          <Text style={styles.agenceText}>
            {stats?.periode || 'Administration'}
          </Text>
        </LinearGradient>

        {/* Section Supervision - Vue d'ensemble */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>
          <View style={styles.cardsContainer}>
            {supervisionCards.map((card) => (
              <SupervisionCard
                key={card.id}
                {...card}
              />
            ))}
          </View>
        </View>

        {/* Section Gestion - Actions administratives */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Gestion</Text>
          <View style={styles.managementGrid}>
            {managementCards.map((card) => (
              <ManagementCard
                key={card.id}
                {...card}
              />
            ))}
          </View>
        </View>

        {/* Section Statistiques financières */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Finances</Text>
          <Card style={styles.financialCard}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Total Épargne</Text>
                <Text style={styles.financialValue}>
                  {(stats?.totalEpargne || 0).toLocaleString()} FCFA
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Total Retrait</Text>
                <Text style={styles.financialValue}>
                  {(stats?.totalRetrait || 0).toLocaleString()} FCFA
                </Text>
              </View>
            </View>
            <View style={styles.financialDivider} />
            <View style={styles.financialSummary}>
              <Text style={styles.financialSummaryLabel}>Solde Net</Text>
              <Text style={[
                styles.financialSummaryValue,
                { color: (stats?.soldeNet || 0) >= 0 ? theme.colors.success : theme.colors.error }
              ]}>
                {(stats?.soldeNet || 0).toLocaleString()} FCFA
              </Text>
            </View>
          </Card>
        </View>

        {/* Section Taux de performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Performance</Text>
          <Card style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <PerformanceIndicator
                label="Taux Clients Actifs"
                value={stats?.tauxClientsActifs || 0}
                max={100}
                color={theme.colors.success}
              />
              <PerformanceIndicator
                label="Taux Collecteurs Actifs"
                value={stats?.tauxCollecteursActifs || 0}
                max={100}
                color={theme.colors.primary}
              />
            </View>
          </Card>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

// Composant pour les cartes de supervision
const SupervisionCard = ({ title, icon, color, count, total, onPress }) => (
  <TouchableOpacity style={styles.supervisionCard} onPress={onPress}>
    <View style={styles.supervisionCardContent}>
      <Ionicons name={icon} size={24} color={color} />
      <View style={styles.supervisionCardText}>
        <Text style={styles.supervisionCardTitle}>{title}</Text>
        <Text style={styles.supervisionCardCount}>
          {count}{total ? `/${total}` : ''}
        </Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

// Composant pour les cartes de gestion
const ManagementCard = ({ title, icon, color, description, onPress }) => (
  <TouchableOpacity style={styles.managementCard} onPress={onPress}>
    <View style={[styles.managementCardIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={32} color={color} />
    </View>
    <Text style={styles.managementCardTitle}>{title}</Text>
    <Text style={styles.managementCardDescription}>{description}</Text>
  </TouchableOpacity>
);

// Composant pour les indicateurs de performance
const PerformanceIndicator = ({ label, value, max, color }) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <View style={styles.performanceIndicator}>
      <Text style={styles.performanceLabel}>{label}</Text>
      <View style={styles.performanceBarContainer}>
        <View style={[
          styles.performanceBar,
          { width: `${percentage}%`, backgroundColor: color }
        ]} />
      </View>
      <Text style={styles.performanceValue}>{percentage}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  headerGradient: {
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.9,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  agenceText: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.8,
    marginTop: 8,
  },
  section: {
    marginVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardsContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  supervisionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  supervisionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supervisionCardText: {
    marginLeft: theme.spacing.md,
  },
  supervisionCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  supervisionCardCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 2,
  },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
  },
  managementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    width: '48%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  managementCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  managementCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  managementCardDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  financialCard: {
    marginHorizontal: theme.spacing.md,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  financialDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  financialSummary: {
    alignItems: 'center',
  },
  financialSummaryLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  financialSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  performanceCard: {
    marginHorizontal: theme.spacing.md,
  },
  performanceRow: {
    gap: theme.spacing.lg,
  },
  performanceIndicator: {
    marginBottom: theme.spacing.md,
  },
  performanceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  performanceBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  performanceBar: {
    height: '100%',
    borderRadius: 4,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'right',
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
});

export default AdminDashboardScreen;