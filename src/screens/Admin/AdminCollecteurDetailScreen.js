// src/screens/Admin/AdminCollecteurDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Components
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import EmptyState from '../../components/EmptyState/EmptyState';

// Services
import adminCollecteurService from '../../services/adminCollecteurService';
import theme from '../../theme';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminCollecteurDetailScreen = ({ navigation, route }) => {
  const { collecteurId, collecteurNom, agenceNom } = route.params || {};
  
  // États
  const [collecteur, setCollecteur] = useState(null);
  const [stats, setStats] = useState(null);
  const [journaux, setJournaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Charger les détails du collecteur
  const loadCollecteurDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
        setError(null);
      }

      console.log('📊 Chargement détails collecteur:', collecteurId);
      
      // Charger en parallèle les données du collecteur
      const [collecteurResult, statsResult, journauxResult] = await Promise.allSettled([
        adminCollecteurService.getCollecteurById(collecteurId),
        adminCollecteurService.getCollecteurStats(collecteurId),
        adminCollecteurService.getCollecteurJournaux(collecteurId)
      ]);

      // Traiter les résultats
      if (collecteurResult.status === 'fulfilled') {
        setCollecteur(collecteurResult.value.data);
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data);
      }

      if (journauxResult.status === 'fulfilled') {
        setJournaux(journauxResult.value.data || []);
      }

      // Vérifier s'il y a eu des erreurs critiques
      const hasErrors = [collecteurResult, statsResult, journauxResult]
        .some(result => result.status === 'rejected');

      if (hasErrors && showLoader) {
        console.warn('⚠️ Certaines données n\'ont pas pu être chargées');
      }

    } catch (error) {
      console.error('❌ Erreur chargement détails collecteur:', error);
      setError(error.message);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [collecteurId]);

  // Charger au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      if (collecteurId) {
        loadCollecteurDetails();
      }
    }, [loadCollecteurDetails, collecteurId])
  );

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCollecteurDetails(false);
  }, [loadCollecteurDetails]);

  // Navigation vers le journal d'activité
  const navigateToJournalActivite = () => {
    navigation.navigate('AdminJournalActivite', {
      collecteurId,
      collecteurNom,
      agenceNom
    });
  };

  // Actions sur le collecteur
  const handleCollecteurAction = (action) => {
    switch (action) {
      case 'message':
        // TODO: Implémenter envoi de message
        Alert.alert('Info', 'Fonctionnalité à implémenter');
        break;
      case 'suspend':
        // TODO: Implémenter suspension
        Alert.alert('Info', 'Fonctionnalité à implémenter');
        break;
      case 'edit':
        navigation.navigate('CollecteurCreationScreen', {
          mode: 'edit',
          collecteur: collecteur
        });
        break;
      default:
        break;
    }
  };

  // Render loading
  if (loading && !collecteur) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={collecteurNom || 'Détails Collecteur'}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={collecteurNom || 'Détails Collecteur'}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={() => (
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
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
        {/* Informations du collecteur */}
        {collecteur && (
          <Card style={styles.collecteurCard}>
            <View style={styles.collecteurHeader}>
              <View style={styles.collecteurInfo}>
                <Ionicons name="person-circle" size={48} color={theme.colors.primary} />
                <View style={styles.collecteurDetails}>
                  <Text style={styles.collecteurNom}>
                    {collecteur.prenom} {collecteur.nom}
                  </Text>
                  <Text style={styles.collecteurEmail}>{collecteur.email}</Text>
                  <Text style={styles.agenceInfo}>{agenceNom}</Text>
                </View>
              </View>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: collecteur.actif ? theme.colors.success : theme.colors.error }
                ]} />
                <Text style={styles.statusText}>
                  {collecteur.actif ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Statistiques */}
        {stats && (
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>📊 Statistiques</Text>
            <View style={styles.statsGrid}>
              <StatItem
                label="Clients"
                value={stats.nombreClients || 0}
                icon="people"
                color={theme.colors.primary}
              />
              <StatItem
                label="Collecte du jour"
                value={formatCurrency(stats.collecteJour || 0)}
                icon="card"
                color={theme.colors.success}
              />
              <StatItem
                label="Transactions"
                value={stats.transactionsDuJour || 0}
                icon="swap-horizontal"
                color={theme.colors.info}
              />
              <StatItem
                label="Performance"
                value={`${stats.performance || 0}%`}
                icon="trending-up"
                color={theme.colors.warning}
              />
            </View>
          </Card>
        )}

        {/* Actions rapides */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>⚡ Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              title="Journal d'activité"
              icon="document-text"
              color={theme.colors.primary}
              onPress={navigateToJournalActivite}
            />
            <ActionButton
              title="Modifier"
              icon="create"
              color={theme.colors.warning}
              onPress={() => handleCollecteurAction('edit')}
            />
            <ActionButton
              title="Message"
              icon="mail"
              color={theme.colors.info}
              onPress={() => handleCollecteurAction('message')}
            />
            <ActionButton
              title="Suspendre"
              icon="pause-circle"
              color={theme.colors.error}
              onPress={() => handleCollecteurAction('suspend')}
            />
          </View>
        </Card>

        {/* Journaux récents */}
        <Card style={styles.journauxCard}>
          <View style={styles.journauxHeader}>
            <Text style={styles.sectionTitle}>📓 Journaux récents</Text>
            <TouchableOpacity onPress={navigateToJournalActivite}>
              <Text style={styles.viewAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {journaux.length > 0 ? (
            journaux.slice(0, 5).map((journal, index) => (
              <JournalItem key={journal.id || index} journal={journal} />
            ))
          ) : (
            <EmptyState
              icon="document-outline"
              title="Aucun journal"
              message="Aucun journal trouvé pour ce collecteur"
              style={styles.emptyState}
            />
          )}
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Composant pour une statistique
const StatItem = ({ label, value, icon, color }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Composant pour un bouton d'action
const ActionButton = ({ title, icon, color, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.actionIconContainer, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

// Composant pour un item de journal
const JournalItem = ({ journal }) => (
  <View style={styles.journalItem}>
    <View style={styles.journalInfo}>
      <Text style={styles.journalDate}>
        {formatDate(journal.dateCreation)}
      </Text>
      <Text style={styles.journalStatus}>
        {journal.clotureEffectuee ? 'Clôturé' : 'En cours'}
      </Text>
    </View>
    <Text style={styles.journalMontant}>
      {formatCurrency(journal.montantTotal || 0)}
    </Text>
  </View>
);

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
  collecteurCard: {
    margin: theme.spacing.md,
  },
  collecteurHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collecteurInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collecteurDetails: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  collecteurNom: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  collecteurEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  agenceInfo: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  actionsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  journauxCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  journauxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  journalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  journalInfo: {
    flex: 1,
  },
  journalDate: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  journalStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  journalMontant: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyState: {
    paddingVertical: theme.spacing.xl,
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
});

export default AdminCollecteurDetailScreen;