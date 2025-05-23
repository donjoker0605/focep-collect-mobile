// src/screens/Admin/AdminDashboardScreen.js - Tableau de bord pour administrateurs
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';

const AdminDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simuler un appel API
    setTimeout(() => {
      setRefreshing(false);
      // Mettre à jour les statistiques
    }, 1500);
  };

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')} FCFA`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Tableau de bord"
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
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Résumé de l'activité</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color={theme.colors.primary} />
                <Text style={styles.statValue}>{stats.totalCollecteurs}</Text>
                <Text style={styles.statLabel}>Collecteurs</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="person" size={24} color={theme.colors.primary} />
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

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('CollecteurManagementScreen')}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="people" size={24} color={theme.colors.white} />
                </View>
                <Text style={styles.actionButtonText}>Gérer les collecteurs</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('ParameterManagementScreen')}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="settings" size={24} color={theme.colors.white} />
                </View>
                <Text style={styles.actionButtonText}>Paramètres de collecte</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('TransfertCompteScreen')}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="swap-horizontal" size={24} color={theme.colors.white} />
                </View>
                <Text style={styles.actionButtonText}>Transfert de comptes</Text>
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
            </View>
          </View>

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
        </View>
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
});

export default AdminDashboardScreen;