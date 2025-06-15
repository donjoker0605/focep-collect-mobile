// src/screens/Admin/AdminDashboardScreen.js - VERSION COMPLÈTE AVEC TOUS LES BOUTONS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import StatCard from '../../components/StatCard/StatCard';
import theme from '../../theme';
import { adminService } from '../../services';

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      
      const response = await adminService.getDashboardStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      console.error('Erreur dashboard admin:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadDashboardStats(true);
  };

  // ✅ FONCTIONS DE NAVIGATION COMPLÈTES
  const handleNavigateToCollecteurs = () => {
    navigation.navigate('CollecteurManagementScreen');
  };

  const handleNavigateToClients = () => {
    navigation.navigate('ClientManagementScreen');
  };

  const handleNavigateToReports = () => {
    navigation.navigate('ReportsScreen');
  };

  const handleNavigateToCommissions = () => {
    navigation.navigate('CommissionParametersScreen');
  };

  const handleNavigateToTransferts = () => {
    navigation.navigate('TransfertCompteScreen');
  };

  const handleNavigateToJournalCloture = () => {
    navigation.navigate('JournalClotureScreen');
  };

  const handleNavigateToCommissionCalculation = () => {
    navigation.navigate('CommissionCalculationScreen');
  };

  const handleCreateCollecteur = () => {
    navigation.navigate('CollecteurCreationScreen');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'newTransaction':
        Alert.alert('Information', 'Redirection vers les transactions en cours de développement');
        break;
      case 'viewNotifications':
        navigation.navigate('NotificationsScreen');
        break;
      case 'backup':
        Alert.alert('Information', 'Sauvegarde en cours de développement');
        break;
      default:
        break;
    }
  };

  // ✅ CARTES DE GESTION PRINCIPALES
  const managementCards = [
    {
      id: 'collecteurs',
      title: 'Gérer les collecteurs',
      description: 'Créer, modifier et gérer vos collecteurs',
      icon: 'people',
      color: theme.colors.primary,
      onPress: handleNavigateToCollecteurs,
      count: stats?.totalCollecteurs || 0,
      subtitle: `${stats?.collecteursActifs || 0} actifs`
    },
    {
      id: 'clients',
      title: 'Gérer les clients',
      description: 'Voir et gérer tous les clients de votre agence',
      icon: 'person-add',
      color: theme.colors.success,
      onPress: handleNavigateToClients,
      count: stats?.totalClients || 0,
      subtitle: `${stats?.clientsValides || 0} validés`
    },
    {
      id: 'reports',
      title: 'Rapports',
      description: 'Générer et consulter les rapports',
      icon: 'bar-chart',
      color: theme.colors.warning,
      onPress: handleNavigateToReports,
      count: stats?.commissionsEnAttente || 0,
      subtitle: 'En attente'
    },
    {
      id: 'commissions',
      title: 'Paramètres de commissions',
      description: 'Configurer les commissions des collecteurs',
      icon: 'settings',
      color: theme.colors.secondary,
      onPress: handleNavigateToCommissions,
      count: null,
      subtitle: 'Configuration'
    }
  ];

  // ✅ OUTILS ADMINISTRATIFS
  const adminTools = [
    {
      id: 'transferts',
      title: 'Transferts de comptes',
      description: 'Transférer des clients entre collecteurs',
      icon: 'swap-horizontal',
      color: theme.colors.primary,
      onPress: handleNavigateToTransferts
    },
    {
      id: 'journal',
      title: 'Journal & Clôture',
      description: 'Gérer les journaux et les clôtures',
      icon: 'journal',
      color: theme.colors.info,
      onPress: handleNavigateToJournalCloture
    },
    {
      id: 'commission-calc',
      title: 'Calcul des commissions',
      description: 'Calculer et traiter les commissions',
      icon: 'calculator',
      color: theme.colors.success,
      onPress: handleNavigateToCommissionCalculation
    }
  ];

  // ✅ ACTIONS RAPIDES
  const quickActions = [
    {
      id: 'new-collecteur',
      title: 'Nouveau collecteur',
      icon: 'person-add',
      color: theme.colors.primary,
      onPress: handleCreateCollecteur
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      color: theme.colors.warning,
      onPress: () => handleQuickAction('viewNotifications')
    },
    {
      id: 'backup',
      title: 'Sauvegarde',
      icon: 'cloud-upload',
      color: theme.colors.info,
      onPress: () => handleQuickAction('backup')
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Tableau de bord Admin"
        showBackButton={false}
      />
      
      <ScrollView 
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Card style={styles.errorCard}>
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadDashboardStats()}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <>
            {/* Statistiques principales */}
            <View style={styles.statsContainer}>
              <StatCard
                title="Collecteurs"
                value={stats?.totalCollecteurs || 0}
                subtitle={`${stats?.collecteursActifs || 0} actifs`}
                icon="people"
                color={theme.colors.primary}
                loading={loading}
              />
              
              <StatCard
                title="Clients"
                value={stats?.totalClients || 0}
                subtitle={`${stats?.clientsValides || 0} validés`}
                icon="person-add"
                color={theme.colors.success}
                loading={loading}
              />
              
              <StatCard
                title="Épargnes"
                value={stats?.totalEpargnes ? `${(stats.totalEpargnes / 1000000).toFixed(1)}M` : '0'}
                subtitle="FCFA"
                icon="trending-up"
                color={theme.colors.info}
                loading={loading}
              />
              
              <StatCard
                title="Retraits"
                value={stats?.totalRetraits ? `${(stats.totalRetraits / 1000000).toFixed(1)}M` : '0'}
                subtitle="FCFA"
                icon="trending-down"
                color={theme.colors.warning}
                loading={loading}
              />
            </View>

            {/* Gestion principale */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gestion principale</Text>
              <View style={styles.cardsGrid}>
                {managementCards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.managementCard}
                    onPress={card.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.cardIcon, { backgroundColor: `${card.color}20` }]}>
                      <Ionicons name={card.icon} size={28} color={card.color} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      <Text style={styles.cardDescription}>{card.description}</Text>
                      {card.count !== null && (
                        <View style={styles.cardStats}>
                          <Text style={styles.cardCount}>{card.count}</Text>
                          <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Outils administratifs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Outils administratifs</Text>
              <View style={styles.toolsGrid}>
                {adminTools.map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    style={styles.toolCard}
                    onPress={tool.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.toolIcon, { backgroundColor: tool.color }]}>
                      <Ionicons name={tool.icon} size={24} color={theme.colors.white} />
                    </View>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions rapides */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions rapides</Text>
              <View style={styles.quickActionsContainer}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionButton}
                    onPress={action.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                      <Ionicons name={action.icon} size={20} color={theme.colors.white} />
                    </View>
                    <Text style={styles.quickActionText}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Résumé des commissions */}
            {stats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Commissions</Text>
                <Card style={styles.commissionsCard}>
                  <View style={styles.commissionRow}>
                    <View style={styles.commissionItem}>
                      <Text style={styles.commissionLabel}>En attente</Text>
                      <Text style={styles.commissionValue}>{stats.commissionsEnAttente || 0}</Text>
                    </View>
                    <View style={styles.commissionItem}>
                      <Text style={styles.commissionLabel}>Total généré</Text>
                      <Text style={styles.commissionValue}>
                        {stats.totalCommissions ? 
                          `${(stats.totalCommissions / 1000).toFixed(0)}K` : 
                          '0'
                        } FCFA
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.viewCommissionsButton}
                    onPress={handleNavigateToCommissionCalculation}
                  >
                    <Text style={styles.viewCommissionsText}>Gérer les commissions</Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  cardsGrid: {
    gap: 12,
  },
  managementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  commissionsCard: {
    padding: 16,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  commissionItem: {
    alignItems: 'center',
  },
  commissionLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  commissionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  viewCommissionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  viewCommissionsText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  errorCard: {
    margin: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;