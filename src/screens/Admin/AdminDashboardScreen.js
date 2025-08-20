// src/screens/Admin/AdminDashboardScreen.js - CORRECTION ERREUR SYNTAXE
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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import Card from '../../components/Card/Card';
import theme from '../../theme';
import { adminService, adminCollecteurService } from '../../services';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboardScreen = ({ navigation }) => {
  const insets = Platform.OS === 'web' ? { top: 0, bottom: 0 } : useSafeAreaInsets();
  const { user, logout } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // 🆕 NOUVEAU

  useEffect(() => {
    loadDashboardStats();
  }, []);

  // 🆕 NOUVEAU: Recharger quand la période change
  useEffect(() => {
    loadDashboardStats(false);
  }, [selectedPeriod]);

  const loadDashboardStats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const response = await adminService.getDashboardStats(selectedPeriod); // 🆕 NOUVEAU paramètre
      
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

  // Navigation handlers
  const navigateToCollecteurSupervision = () => {
    navigation.navigate('AdminCollecteurSupervision');
  };

  const navigateToCollecteurManagement = () => {
    navigation.navigate('CollecteurManagementScreen');
  };

  const navigateToClientManagement = () => {
    // Navigation vers le NOUVEAU écran admin clients
    navigation.navigate('AdminClientManagement');
  };

  const navigateToReports = () => {
    navigation.navigate('ReportsScreen');
  };

  const navigateToCommissions = () => {
    navigation.navigate('CommissionCalculationV2Screen');
  };

  // FONCTION DE DÉCONNEXION - VERSION WEB-COMPATIBLE
  const handleLogout = async () => {
    console.log('🚨 BOUTON DE DÉCONNEXION CLIQUÉ !');
    
    // Pour React Native Web, utiliser confirm au lieu d'Alert
    if (Platform.OS === 'web') {
      console.log('🌐 Mode web détecté - utilisation de window.confirm');
      const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      
      if (!confirmed) {
        console.log('❌ Déconnexion annulée par l\'utilisateur');
        return;
      }
      
      console.log('✅ Déconnexion confirmée par l\'utilisateur');
    } else {
      // Pour mobile, utiliser Alert comme d'habitude
      console.log('📱 Mode mobile détecté - utilisation d\'Alert');
      Alert.alert(
        'Confirmation',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => console.log('❌ Déconnexion annulée par l\'utilisateur'),
          },
          {
            text: 'Déconnexion',
            style: 'destructive',
            onPress: () => performLogout(),
          },
        ]
      );
      return; // Sortir ici pour mobile, performLogout sera appelé par l'Alert
    }
    
    // Exécuter la déconnexion (pour web ou après confirmation mobile)
    await performLogout();
  };

  const performLogout = async () => {
    try {
      console.log('🔄 Déconnexion admin en cours...');
      setLoading(true);
      
      const result = await logout();
      console.log('📊 Résultat logout:', result);
      
      console.log('✅ Déconnexion réussie - navigation automatique via AuthContext');
      
      // Pour le web, forcer le rechargement si nécessaire
      if (Platform.OS === 'web') {
        console.log('🔄 Rechargement de la page web...');
        setTimeout(() => {
          window.location.href = window.location.origin;
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      
      if (Platform.OS === 'web') {
        alert('Erreur lors de la déconnexion: ' + error.message);
      } else {
        Alert.alert('Erreur', 'Impossible de se déconnecter');
      }
    } finally {
      setLoading(false);
    }
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
      id: 'rubriques',
      title: 'Rubriques Rémunération',
      icon: 'list-outline',
      color: theme.colors.info,
      onPress: () => navigation.navigate('RubriqueRemunerationScreen'),
    },
    {
      id: 'remuneration-process',
      title: 'Processus Rémunération',
      icon: 'wallet-outline',
      color: theme.colors.purple,
      badge: 'NOUVEAU',
      onPress: () => navigation.navigate('RemunerationProcessScreen'),
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {Platform.OS === 'web' ? (
        <View style={[styles.headerGradient, styles.headerGradientWeb]}>
          {/* Bouton de déconnexion */}
          <TouchableOpacity 
            onPress={handleLogout} 
            style={[styles.logoutButton, { top: insets.top + 10 }]}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View style={styles.logoutButtonContent}>
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="log-out-outline" size={20} color="white" />
              )}
              <Text style={styles.logoutButtonText}>
                {loading ? 'Déconnexion...' : 'Déconnexion'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={[styles.userInfo, { paddingTop: insets.top + 56 }]}>
            <Text style={styles.welcomeText}>Bienvenue,</Text>
            <Text style={styles.userName}>{user?.nom || 'Administrateur'} {user?.prenom || ''}</Text>
            <Text style={styles.agenceName}>
              {user?.agenceName || `Agence ${user?.agenceId || 'principale'}`}
            </Text>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.headerGradient}
        >
          {/* Bouton de déconnexion */}
          <TouchableOpacity 
            onPress={handleLogout} 
            style={[styles.logoutButton, { top: insets.top + 10 }]}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View style={styles.logoutButtonContent}>
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="log-out-outline" size={20} color="white" />
              )}
              <Text style={styles.logoutButtonText}>
                {loading ? 'Déconnexion...' : 'Déconnexion'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={[styles.userInfo, { paddingTop: insets.top + 56 }]}>
            <Text style={styles.welcomeText}>Bienvenue,</Text>
            <Text style={styles.userName}>{user?.nom || 'Administrateur'} {user?.prenom || ''}</Text>
            <Text style={styles.agenceName}>
              {user?.agenceName || `Agence ${user?.agenceId || 'principale'}`}
            </Text>
          </View>
        </LinearGradient>
      )}

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
        {/* 🆕 NOUVEAU: Sélecteur de période */}
        <View style={styles.periodSelector}>
          <Text style={styles.periodTitle}>Période d'analyse</Text>
          <View style={styles.periodButtons}>
            {[
              { key: 'today', label: "Aujourd'hui", icon: 'today' },
              { key: 'week', label: 'Semaine', icon: 'calendar' },
              { key: 'month', label: 'Mois', icon: 'calendar-outline' },
              { key: 'all', label: 'Tout', icon: 'infinite' }
            ].map(period => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.key)}
              >
                <Ionicons
                  name={period.icon}
                  size={16}
                  color={selectedPeriod === period.key ? 'white' : theme.colors.textLight}
                />
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vue d'ensemble financière par période */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>
            Vue d'ensemble - {selectedPeriod === 'today' ? "Aujourd'hui" : 
                            selectedPeriod === 'week' ? 'Cette semaine' :
                            selectedPeriod === 'month' ? 'Ce mois' : 'Toutes périodes'}
          </Text>
          <Card style={styles.financeCard}>
            <View style={styles.financeRow}>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>
                  {selectedPeriod === 'today' ? 'Épargne Aujourd\'hui' :
                   selectedPeriod === 'week' ? 'Épargne Semaine' :
                   selectedPeriod === 'month' ? 'Épargne Mois' : 'Épargne Totale'}
                </Text>
                <Text style={[styles.financeValue, { color: theme.colors.success }]}>
                  {formatCurrency(
                    selectedPeriod === 'today' ? (stats?.epargneAujourdhui || 0) :
                    selectedPeriod === 'week' ? (stats?.epargneSemaine || 0) :
                    selectedPeriod === 'month' ? (stats?.epargneMois || 0) :
                    (stats?.totalEpargne || 0)
                  )}
                </Text>
              </View>
              <View style={styles.financeDivider} />
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>
                  {selectedPeriod === 'today' ? 'Retraits Aujourd\'hui' :
                   selectedPeriod === 'week' ? 'Retraits Semaine' :
                   selectedPeriod === 'month' ? 'Retraits Mois' : 'Retraits Totaux'}
                </Text>
                <Text style={[styles.financeValue, { color: theme.colors.error }]}>
                  {formatCurrency(
                    selectedPeriod === 'today' ? (stats?.retraitsAujourdhui || 0) :
                    selectedPeriod === 'week' ? (stats?.retraitsSemaine || 0) :
                    selectedPeriod === 'month' ? (stats?.retraitsMois || 0) :
                    (stats?.totalRetrait || 0)
                  )}
                </Text>
              </View>
            </View>
            
            {/* 🔥 NOUVEAU: Commissions simulées mensuelles */}
            <View style={styles.commissionsSection}>
              <Text style={styles.commissionsLabel}>Commissions Simulées (Mois)</Text>
              <Text style={[styles.commissionsValue, { color: theme.colors.warning }]}>
                {formatCurrency((stats?.totalEpargne || 0) * 0.025 * 1.5)} {/* Simulation 2.5% * facteur saisonnalité */}
              </Text>
              <Text style={styles.commissionsNote}>
                Projection basée sur l'activité actuelle
              </Text>
            </View>
            
            <View style={styles.netBalanceContainer}>
              <Text style={styles.netBalanceLabel}>
                {selectedPeriod === 'today' ? 'Solde Net du Jour' :
                 selectedPeriod === 'week' ? 'Solde Net Semaine' :
                 selectedPeriod === 'month' ? 'Solde Net Mois' : 'Solde Net Total'}
              </Text>
              <Text style={styles.netBalanceValue}>
                {formatCurrency(
                  selectedPeriod === 'today' ? (stats?.soldeAujourdhui || 0) :
                  selectedPeriod === 'week' ? (stats?.soldeSemaine || 0) :
                  selectedPeriod === 'month' ? (stats?.soldeMois || 0) :
                  ((stats?.totalEpargne || 0) - (stats?.totalRetrait || 0))
                )}
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
              'Collecteurs Assignés',
              stats?.totalCollecteursAssignes || stats?.totalCollecteurs || 0,
              'people',
              theme.colors.primary,
              `${stats?.collecteursActifs || 0} actifs`
            )}
            {renderStatCard(
              'Clients Accessibles',
              stats?.totalClientsAccessibles || stats?.totalClients || 0,
              'person',
              theme.colors.secondary,
              `${stats?.clientsActifs || 0} actifs`
            )}
            {/* 🔥 SUPPRESSION: Stats "Commissions en attente" et "Relations admin-collecteur" selon requirements */}
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

        {/* Actions rapides - CORRECTION ICI */}
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
  headerGradientWeb: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
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
  // 🆕 NOUVEAUX STYLES: Sélecteur de période
  periodSelector: {
    padding: 20,
    paddingBottom: 10,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 6,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  overviewSection: {
    padding: 20,
    paddingTop: 10,
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
    marginBottom: 16,
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
  logoutButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // 🔥 NOUVEAUX STYLES: Section commissions simulées
  commissionsSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  commissionsLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  commissionsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commissionsNote: {
    fontSize: 11,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
});

export default AdminDashboardScreen;