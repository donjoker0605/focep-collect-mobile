// src/screens/Admin/AdminDashboardScreen.js - VERSION FINALE CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { useAdmin } from '../../hooks/useAdmin';

const AdminDashboardScreen = ({ navigation }) => {
  const { 
    dashboardStats, 
    dashboardLoading, 
    error,
    loadDashboard,
    isAdmin,
    isSuperAdmin 
  } = useAdmin();
  
  const [refreshing, setRefreshing] = useState(false);

  // ✅ REDIRECTION SI PAS ADMIN
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert(
        'Accès non autorisé',
        'Vous n\'avez pas les droits d\'administrateur.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [isAdmin, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  // ✅ FORMATAGE CURRENCY CORRIGÉ
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)} FCFA`;
  };

  const formatNumber = (number) => {
    if (!number && number !== 0) return '0';
    return new Intl.NumberFormat('fr-FR').format(number);
  };

  // ✅ DONNÉES PAR DÉFAUT SÉCURISÉES
  const stats = dashboardStats || {
    totalCollecteurs: 0,
    totalClients: 0,
    totalEpargne: 0,
    totalRetrait: 0,
    collecteursActifs: 0,
    collecteursInactifs: 0,
    clientsActifs: 0,
    clientsInactifs: 0,
    agencesActives: 0,
    commissionsEnAttente: 0
  };

  // ✅ GESTION DES ERREURS
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Tableau de bord"
          showBackButton={false}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Dashboard Admin"
        showBackButton={false}
        rightComponent={
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {dashboardLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {/* ✅ CARTE STATISTIQUES PRINCIPALES */}
            <Card style={styles.statsCard}>
              <Text style={styles.statsTitle}>Vue d'ensemble</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={24} color={theme.colors.primary} />
                  <Text style={styles.statValue}>{formatNumber(stats.totalCollecteurs)}</Text>
                  <Text style={styles.statLabel}>Collecteurs</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="person" size={24} color={theme.colors.info} />
                  <Text style={styles.statValue}>{formatNumber(stats.totalClients)}</Text>
                  <Text style={styles.statLabel}>Clients</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="arrow-down" size={24} color={theme.colors.success} />
                  <Text style={styles.statValue}>{formatCurrency(stats.totalEpargne)}</Text>
                  <Text style={styles.statLabel}>Total Épargne</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="arrow-up" size={24} color={theme.colors.error} />
                  <Text style={styles.statValue}>{formatCurrency(stats.totalRetrait)}</Text>
                  <Text style={styles.statLabel}>Total Retrait</Text>
                </View>
              </View>
            </Card>

            {/* ✅ ACTIONS RAPIDES ADMIN */}
            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Actions administrateur</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CollecteurManagement')}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="people" size={24} color={theme.colors.white} />
                  </View>
                  <Text style={styles.actionButtonText}>Gérer collecteurs</Text>
                </TouchableOpacity>
                
                {isSuperAdmin && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AgenceManagement')}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="business" size={24} color={theme.colors.white} />
                    </View>
                    <Text style={styles.actionButtonText}>Gérer agences</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CommissionParametersScreen')}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="settings" size={24} color={theme.colors.white} />
                  </View>
                  <Text style={styles.actionButtonText}>Paramètres commission</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('TransfertCompteScreen')}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="swap-horizontal" size={24} color={theme.colors.white} />
                  </View>
                  <Text style={styles.actionButtonText}>Transferts comptes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Reports')}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="document-text" size={24} color={theme.colors.white} />
                  </View>
                  <Text style={styles.actionButtonText}>Rapports</Text>
                </TouchableOpacity>
                
                {isSuperAdmin && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ParameterManagementScreen')}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="cog" size={24} color={theme.colors.white} />
                    </View>
                    <Text style={styles.actionButtonText}>Paramètres système</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ✅ ÉTAT DES COLLECTEURS */}
            <Card style={styles.collecteursCard}>
              <Text style={styles.cardTitle}>État des collecteurs</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, styles.activeStatus]} />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusValue}>{formatNumber(stats.collecteursActifs)}</Text>
                    <Text style={styles.statusLabel}>Actifs</Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, styles.inactiveStatus]} />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusValue}>{formatNumber(stats.collecteursInactifs)}</Text>
                    <Text style={styles.statusLabel}>Inactifs</Text>
                  </View>
                </View>
              </View>
              
              {/* ✅ POURCENTAGE D'ACTIVITÉ */}
              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Taux d'activité</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${stats.totalCollecteurs > 0 
                          ? (stats.collecteursActifs / stats.totalCollecteurs) * 100 
                          : 0}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {stats.totalCollecteurs > 0 
                    ? `${Math.round((stats.collecteursActifs / stats.totalCollecteurs) * 100)}%`
                    : '0%'}
                </Text>
              </View>
            </Card>

            {/* ✅ ÉTAT DES CLIENTS */}
            <Card style={styles.clientsCard}>
              <Text style={styles.cardTitle}>État des clients</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, styles.activeStatus]} />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusValue}>{formatNumber(stats.clientsActifs)}</Text>
                    <Text style={styles.statusLabel}>Actifs</Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, styles.inactiveStatus]} />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusValue}>{formatNumber(stats.clientsInactifs)}</Text>
                    <Text style={styles.statusLabel}>Inactifs</Text>
                  </View>
                </View>
              </View>
              
              {/* ✅ POURCENTAGE D'ACTIVITÉ CLIENTS */}
              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Taux d'activité clients</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${stats.totalClients > 0 
                          ? (stats.clientsActifs / stats.totalClients) * 100 
                          : 0}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {stats.totalClients > 0 
                    ? `${Math.round((stats.clientsActifs / stats.totalClients) * 100)}%`
                    : '0%'}
                </Text>
              </View>
            </Card>

            {/* ✅ SOLDE NET */}
            <Card style={styles.soldeCard}>
              <Text style={styles.cardTitle}>Solde net</Text>
              <View style={styles.soldeContainer}>
                <Ionicons 
                  name="wallet-outline" 
                  size={32} 
                  color={theme.colors.primary} 
                />
                <View style={styles.soldeTextContainer}>
                  <Text style={styles.soldeValue}>
                    {formatCurrency((stats.totalEpargne || 0) - (stats.totalRetrait || 0))}
                  </Text>
                  <Text style={styles.soldeLabel}>Épargne - Retraits</Text>
                </View>
              </View>
            </Card>

            {/* ✅ ALERTES SYSTÈME */}
            {stats.commissionsEnAttente > 0 && (
              <Card style={[styles.alertCard, styles.warningCard]}>
                <View style={styles.alertHeader}>
                  <Ionicons name="warning" size={24} color={theme.colors.warning} />
                  <Text style={styles.alertTitle}>Commissions en attente</Text>
                </View>
                <Text style={styles.alertMessage}>
                  {formatNumber(stats.commissionsEnAttente)} commissions en attente de traitement
                </Text>
                <TouchableOpacity 
                  style={styles.alertButton}
                  onPress={() => navigation.navigate('CommissionParametersScreen')}
                >
                  <Text style={styles.alertButtonText}>Traiter</Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* ✅ RACCOURCIS RAPIDES */}
            <Card style={styles.shortcutsCard}>
              <Text style={styles.cardTitle}>Raccourcis rapides</Text>
              <View style={styles.shortcutsGrid}>
                <TouchableOpacity 
                  style={styles.shortcutItem}
                  onPress={() => navigation.navigate('CollecteurManagement')}
                >
                  <Ionicons name="person-add" size={20} color={theme.colors.primary} />
                  <Text style={styles.shortcutText}>Nouveau collecteur</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shortcutItem}
                  onPress={() => navigation.navigate('Reports')}
                >
                  <Ionicons name="download" size={20} color={theme.colors.primary} />
                  <Text style={styles.shortcutText}>Télécharger rapport</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shortcutItem}
                  onPress={() => navigation.navigate('TransfertCompteScreen')}
                >
                  <Ionicons name="repeat" size={20} color={theme.colors.primary} />
                  <Text style={styles.shortcutText}>Transfert comptes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shortcutItem}
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <Ionicons name="notifications" size={20} color={theme.colors.primary} />
                  <Text style={styles.shortcutText}>Notifications</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ✅ STYLES COMPLETS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  notificationButton: {
    padding: 8,
  },
  statsContainer: {
    gap: 16,
  },
  statsCard: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  quickActions: {
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '48%',
    flexGrow: 1,
  },
  actionIconContainer: {
    marginBottom: 8,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  collecteursCard: {
    padding: 20,
  },
  clientsCard: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  activeStatus: {
    backgroundColor: theme.colors.success,
  },
  inactiveStatus: {
    backgroundColor: theme.colors.error,
  },
  statusTextContainer: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  soldeCard: {
    padding: 20,
  },
  soldeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soldeTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  soldeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  soldeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  alertCard: {
    padding: 20,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.warning,
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 16,
  },
  alertButton: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  shortcutsCard: {
    padding: 20,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shortcutItem: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minWidth: '48%',
    flexGrow: 1,
  },
  shortcutText: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;