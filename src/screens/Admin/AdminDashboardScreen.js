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

  // 🔥 AJOUT : Navigation vers supervision des collecteurs
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

  // Cartes de gestion principales
  const managementCards = [
    {
      id: 'collecteurs',
      title: 'Gérer les collecteurs',
      icon: 'people',
      color: theme.colors.primary,
      count: stats?.totalCollecteurs || 0,
      onPress: navigateToCollecteurManagement,
    },
    {
      id: 'supervision',
      title: 'Superviser les collecteurs',
      icon: 'eye',
      color: theme.colors.secondary,
      count: stats?.collecteursActifs || 0,
      onPress: navigateToCollecteurSupervision,
    },
    {
      id: 'clients',
      title: 'Gérer les clients',
      icon: 'person-add',
      color: theme.colors.secondary,
      count: stats?.totalClients || 0,
      onPress: navigateToClientManagement,
    },
    {
      id: 'reports',
      title: 'Rapports',
      icon: 'bar-chart',
      color: theme.colors.warning,
      onPress: navigateToReports,
    },
    {
      id: 'commissions',
      title: 'Paramètres de commissions',
      icon: 'calculator',
      color: theme.colors.info,
      onPress: () => navigation.navigate('CommissionParametersScreen'),
    }
  ];

  // Outils administratifs
  const adminTools = [
    {
      id: 'transferts',
      title: 'Transferts de comptes',
      icon: 'swap-horizontal',
      color: theme.colors.purple,
      onPress: () => navigation.navigate('TransfertCompteScreen'),
    },
    {
      id: 'journal',
      title: 'Journal & Clôture',
      icon: 'journal',
      color: theme.colors.orange,
      onPress: () => navigation.navigate('JournalClotureScreen'),
    },
    {
      id: 'commission-calc',
      title: 'Calcul des commissions',
      icon: 'calculator-outline',
      color: theme.colors.teal,
      onPress: navigateToCommissions,
    },
    {
      id: 'commission-v2',
      title: 'Commission FOCEP v2',
      icon: 'trending-up',
      color: theme.colors.success,
      badge: 'NOUVEAU',
      onPress: () => navigation.navigate('CommissionCalculationV2Screen'),
    },
    {
      id: 'rubriques',
      title: 'Rubriques Rémunération',
      icon: 'list-outline',
      color: theme.colors.info,
      onPress: () => navigation.navigate('RubriqueRemunerationScreen'),
    }
  ];

  // Actions rapides
  const quickActions = [
    {
      id: 'new-collecteur',
      title: 'Nouveau collecteur',
      icon: 'person-add',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('CollecteurCreationScreen'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      color: theme.colors.info,
      onPress: () => navigation.navigate('AdminNotifications'),
    },
    {
      id: 'supervision',
      title: 'Supervision',
      icon: 'eye',
      color: theme.colors.success,
      onPress: navigateToCollecteurSupervision,
    }
  ];

  const formatCurrency = (amount) => {
    return `${new Intl.NumberFormat('fr-FR').format(amount || 0)} FCFA`;
  };

  const renderStatCard = (title, value, icon, color, subtitle) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {/* 🔥 SUPPRESSION : Header supprimé car géré par Stack Navigator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.headerGradient}
      >
        {/* 🔥 SUPPRESSION : Header personnalisé supprimé */}
        {/* Le titre sera géré par Stack Navigator */}
        
        {/* Informations utilisateur - CONSERVÉES */}
        <View style={[styles.userInfo, { paddingTop: insets.top + 56 }]}>
          <Text style={styles.welcomeText}>Bienvenue,</Text>
          <Text style={styles.userName}>{user?.nom || 'Administrateur'}</Text>
          <Text style={styles.agenceName}>
            {user?.agenceName || `Agence ${user?.agenceId || 'principale'}`}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Vue d'ensemble financière */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Vue d'ensemble financière</Text>
          <Card style={styles.financeCard}>
            <View style={styles.financeRow}>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Total Épargne</Text>
                <Text style={[styles.financeValue, { color: theme.colors.success }]}>
                  {formatCurrency(stats?.totalEpargne)}
                </Text>
              </View>
              <View style={styles.financeDivider} />
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Total Retraits</Text>
                <Text style={[styles.financeValue, { color: theme.colors.error }]}>
                  {formatCurrency(stats?.totalRetrait)}
                </Text>
              </View>
            </View>
            <View style={styles.netBalanceContainer}>
              <Text style={styles.netBalanceLabel}>Solde Net</Text>
              <Text style={styles.netBalanceValue}>
                {formatCurrency(stats?.soldeNet)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Statistiques rapides */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statsScroll}
          >
            {renderStatCard(
              'Collecteurs',
              stats?.totalCollecteurs || 0,
              'people',
              theme.colors.primary,
              `${stats?.collecteursActifs || 0} actifs`
            )}
            {renderStatCard(
              'Clients',
              stats?.totalClients || 0,
              'person',
              theme.colors.secondary,
              `${stats?.clientsActifs || 0} actifs`
            )}
            {renderStatCard(
              'Commissions',
              stats?.commissionsEnAttente || 0,
              'cash',
              theme.colors.warning,
              'En attente'
            )}
            {renderStatCard(
              'Agences',
              stats?.agencesActives || 1,
              'business',
              theme.colors.info,
              'Actives'
            )}
          </ScrollView>
        </View>

        {/* Cartes de gestion */}
        <View style={styles.managementSection}>
          <Text style={styles.sectionTitle}>Gestion</Text>
          <View style={styles.cardsGrid}>
            {managementCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.managementCard}
                onPress={card.onPress}
                activeOpacity={0.8}
              >
                <Card style={[styles.managementCardContent, { borderTopColor: card.color }]}>
                  <View style={[styles.cardIconContainer, { backgroundColor: `${card.color}20` }]}>
                    <Ionicons name={card.icon} size={28} color={card.color} />
                  </View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  {card.count !== undefined && (
                    <Text style={styles.cardCount}>{card.count}</Text>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Outils administratifs */}
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Outils administratifs</Text>
          {adminTools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              onPress={tool.onPress}
              activeOpacity={0.8}
            >
              <Card style={styles.toolCard}>
                <View style={[styles.toolIconContainer, { backgroundColor: `${tool.color}20` }]}>
                  <Ionicons name={tool.icon} size={24} color={tool.color} />
                </View>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAction}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dernière mise à jour */}
        {stats?.lastUpdate && (
          <Text style={styles.lastUpdate}>
            Dernière mise à jour: {format(new Date(stats.lastUpdate), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  userInfo: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: 4,
  },
  agenceName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginTop: -20,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  financeCard: {
    padding: 20,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  financeItem: {
    flex: 1,
    alignItems: 'center',
  },
  financeDivider: {
    width: 1,
    backgroundColor: theme.colors.lightGray,
    marginHorizontal: 20,
  },
  financeLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  financeValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  netBalanceContainer: {
    backgroundColor: theme.colors.primary,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  netBalanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  netBalanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsScroll: {
    paddingHorizontal: 20,
  },
  statCard: {
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  statSubtitle: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  managementSection: {
    padding: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  managementCard: {
    width: '50%',
    padding: 8,
  },
  managementCardContent: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  cardCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 8,
  },
  toolsSection: {
    padding: 20,
    paddingTop: 0,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  toolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toolTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  quickActionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});

export default AdminDashboardScreen;