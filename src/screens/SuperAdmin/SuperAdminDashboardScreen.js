// src/screens/SuperAdmin/SuperAdminDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import StatsCard from '../../components/StatsCard/StatsCard';
import theme from '../../theme';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { useAuth } from '../../hooks/useAuth';

const SuperAdminDashboardScreen = ({ navigation }) => {
  const {
    loading,
    error,
    dashboardStats,
    loadDashboardStats,
    clearError
  } = useSuperAdmin();
  
  const { logout } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    console.log('🔄 handleLogout appelé');
    
    // Pour le web, utiliser window.confirm au lieu d'Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (confirmed) {
        try {
          console.log('🔄 Tentative de déconnexion...');
          await logout();
          console.log('✅ Déconnexion réussie');
        } catch (error) {
          console.error('❌ Erreur de déconnexion:', error);
          window.alert('Impossible de se déconnecter');
        }
      }
    } else {
      // Pour mobile, utiliser Alert normal
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Déconnexion',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🔄 Tentative de déconnexion...');
                await logout();
                console.log('✅ Déconnexion réussie');
              } catch (error) {
                console.error('❌ Erreur de déconnexion:', error);
                Alert.alert('Erreur', 'Impossible de se déconnecter');
              }
            }
          }
        ]
      );
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardStats();
    setRefreshing(false);
  };

  const formatPercentage = (value) => {
    return value ? `${value.toFixed(1)}%` : '0%';
  };

  const formatNumber = (value) => {
    return value || 0;
  };

  if (loading && !dashboardStats) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Dashboard Super Admin" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Dashboard Super Admin" 
        showBack={false}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleLogout} 
              style={styles.logoutButton}
            >
              <Ionicons 
                name="log-out-outline" 
                size={24} 
                color={theme.colors.white} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onRefresh} disabled={loading}>
              <Ionicons 
                name="refresh" 
                size={24} 
                color={loading ? theme.colors.textSecondary : theme.colors.white} 
              />
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <Card style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Résumé global */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>Vue d'ensemble</Text>
          <Text style={styles.summarySubtitle}>
            Système de collecte journalière FOCEP
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {formatNumber(dashboardStats?.totalAgences)}
              </Text>
              <Text style={styles.summaryStatLabel}>Agences</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {formatNumber(dashboardStats?.totalAdmins)}
              </Text>
              <Text style={styles.summaryStatLabel}>Admins</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {formatNumber(dashboardStats?.totalCollecteurs)}
              </Text>
              <Text style={styles.summaryStatLabel}>Collecteurs</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {formatNumber(dashboardStats?.totalClients)}
              </Text>
              <Text style={styles.summaryStatLabel}>Clients</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Statistiques détaillées */}
        <View style={styles.statsGrid}>
          <StatsCard
            title="Agences Actives"
            value={formatNumber(dashboardStats?.totalAgencesActives)}
            total={formatNumber(dashboardStats?.totalAgences)}
            percentage={formatPercentage(dashboardStats?.tauxAgencesActives)}
            icon="business"
            color={theme.colors.success}
            onPress={() => navigation.navigate('AgenceManagement')}
          />
          
          <StatsCard
            title="Collecteurs Actifs"
            value={formatNumber(dashboardStats?.totalCollecteursActifs)}
            total={formatNumber(dashboardStats?.totalCollecteurs)}
            percentage={formatPercentage(dashboardStats?.tauxCollecteursActifs)}
            icon="people"
            color={theme.colors.info}
          />
          
          <StatsCard
            title="Clients Actifs"
            value={formatNumber(dashboardStats?.totalClientsActifs)}
            total={formatNumber(dashboardStats?.totalClients)}
            percentage={formatPercentage(dashboardStats?.tauxClientsActifs)}
            icon="person-circle"
            color={theme.colors.warning}
          />
          
          <StatsCard
            title="Admins Système"
            value={formatNumber(dashboardStats?.totalAdmins)}
            total={formatNumber(dashboardStats?.totalAdmins)}
            percentage="100%"
            icon="shield-checkmark"
            color={theme.colors.primary}
            onPress={() => navigation.navigate('AdminManagement')}
          />
        </View>

        {/* Actions rapides */}
        <Card style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AgenceCreation')}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.actionText}>Nouvelle Agence</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminCreation')}
            >
              <Ionicons name="person-add" size={24} color={theme.colors.success} />
              <Text style={styles.actionText}>Nouvel Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('UserManagement')}
            >
              <Ionicons name="people" size={24} color={theme.colors.info} />
              <Text style={styles.actionText}>Utilisateurs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={24} color={theme.colors.warning} />
              <Text style={styles.actionText}>Actualiser</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Informations système */}
        {dashboardStats?.lastUpdate && (
          <Card style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>
                Dernière mise à jour : {new Date(dashboardStats.lastUpdate).toLocaleString()}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorCard: {
    backgroundColor: theme.colors.errorLight,
    marginBottom: theme.spacing.md,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.error,
    fontSize: 14,
  },
  errorButton: {
    padding: theme.spacing.sm,
  },
  errorButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: theme.spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  actionsCard: {
    marginBottom: theme.spacing.md,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    width: '48%',
    marginBottom: theme.spacing.sm,
  },
  actionText: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: theme.spacing.xs,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    marginRight: 16,
    padding: 4,
  },
});

export default SuperAdminDashboardScreen;