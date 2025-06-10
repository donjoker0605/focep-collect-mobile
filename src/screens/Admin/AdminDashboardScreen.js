// src/screens/Admin/AdminDashboardScreen.js - VERSION CORRIGÉE AVEC API RÉELLE
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

	const formatCurrency = (amount) => {
	  if (!amount && amount !== 0) return '0 FCFA';
	  return `${amount
		.toFixed(2)
		.replace(/\d(?=(\d{3})+\.)/g, '$&,')
		.replace('.', ',')} FCFA`;
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
                  <Text style={styles.statValue}>{stats.totalCollecteurs}</Text>
                  <Text style={styles.statLabel}>Collecteurs</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="person" size={24} color={theme.colors.info} />
                  <Text style={styles.statValue}>{stats.totalClients}</Text>
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
                  onPress={() => navigation.navigate('CollecteurManagementScreen')}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="people" size={24} color={theme.colors.white} />
                  </View>
                  <Text style={styles.actionButtonText}>Gérer collecteurs</Text>
                </TouchableOpacity>
                
                {isSuperAdmin && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AgenceManagementScreen')}
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
                  onPress={() => navigation.navigate('ReportsScreen')}
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
                    <Text style={styles.statusValue}>{stats.collecteursActifs}</Text>
                    <Text style={styles.statusLabel}>Actifs</Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, styles.inactiveStatus]} />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusValue}>{stats.collecteursInactifs}</Text>
                    <Text style={styles.statusLabel}>Inactifs</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* ✅ ÉTAT DES CLIENTS */}
            <Card style={styles.clientsCard}>
              <Text style={styles.cardTitle}>État des clients</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, styles.activeStatus]} />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusValue}>{stats.clientsActifs}</Text>
                    <Text style={styles.statusLabel}>Actifs</Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, styles.inactiveStatus]} />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusValue}>{stats.clientsInactifs}</Text>
                    <Text style={styles.statusLabel}>Inactifs</Text>
                  </View>
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
                  {stats.commissionsEnAttente} commission(s) en attente de traitement
                </Text>
                <TouchableOpacity 
                  style={styles.alertButton}
                  onPress={() => navigation.navigate('CommissionReportScreen')}
                >
                  <Text style={styles.alertButtonText}>Traiter</Text>
                </TouchableOpacity>
              </Card>
            )}
          </View>
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
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    fontWeight: '500',
  },
  notificationButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 16,
  },
  statsCard: {
    marginBottom: 20,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    padding: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    margin: 4,
    ...theme.shadows.small,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  collecteursCard: {
    marginBottom: 20,
    padding: 16,
  },
  clientsCard: {
    marginBottom: 20,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  activeStatus: {
    backgroundColor: theme.colors.success,
  },
  inactiveStatus: {
    backgroundColor: theme.colors.error,
  },
  statusTextContainer: {
    alignItems: 'flex-start',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  alertCard: {
    marginBottom: 20,
    padding: 16,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
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
    fontWeight: '500',
  },
});

export default AdminDashboardScreen;