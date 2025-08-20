// src/screens/SuperAdmin/CollecteurMonitoringScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import superAdminService from '../../services/superAdminService';

const CollecteurMonitoringScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statistiques, setStatistiques] = useState(null);
  const [collecteursInactifs, setCollecteursInactifs] = useState([]);
  const [actionsCorrectives, setActionsCorrectives] = useState([]);
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStatistiques(),
        loadCollecteursInactifs(),
        loadActionsCorrectivesDisponibles(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données de monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonitoringData();
    setRefreshing(false);
  };

  const loadStatistiques = async () => {
    try {
      const result = await superAdminService.getMonitoringStatistics();
      if (result.success) {
        setStatistiques(result.data);
      } else {
        console.error('Erreur statistiques:', result.error);
      }
    } catch (error) {
      console.error('Erreur loadStatistiques:', error);
    }
  };

  const loadCollecteursInactifs = async () => {
    try {
      const result = await superAdminService.getCollecteursInactifs();
      if (result.success) {
        setCollecteursInactifs(result.data || []);
      } else {
        console.error('Erreur collecteurs inactifs:', result.error);
      }
    } catch (error) {
      console.error('Erreur loadCollecteursInactifs:', error);
    }
  };

  const loadActionsCorrectivesDisponibles = async () => {
    try {
      const result = await superAdminService.getActionsCorrectivesDisponibles();
      if (result.success) {
        setActionsCorrectives(result.data || []);
      } else {
        console.error('Erreur actions correctives:', result.error);
      }
    } catch (error) {
      console.error('Erreur loadActionsCorrectivesDisponibles:', error);
    }
  };

  const handleCollecteurPress = (collecteur) => {
    setSelectedCollecteur(collecteur);
    setActionModalVisible(true);
  };

  const executeActionCorrective = async (action, motif = '') => {
    if (!selectedCollecteur) return;

    try {
      const result = await superAdminService.executeActionCorrective(
        selectedCollecteur.collecteurId,
        action,
        motif || `Action ${action} depuis le monitoring`
      );

      if (result.success) {
        Alert.alert(
          'Action Exécutée',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => {
                setActionModalVisible(false);
                loadMonitoringData(); // Refresh data
              },
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      console.error('Erreur executeActionCorrective:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'exécution de l\'action');
    }
  };

  const getStatusColor = (joursInactivite) => {
    if (joursInactivite < 20) return theme.colors.warning;
    if (joursInactivite < 30) return theme.colors.error;
    return theme.colors.darkRed;
  };

  const getRecommandedAction = (collecteur) => {
    if (collecteur.joursInactivite > 30) {
      return { action: 'DESACTIVER', label: 'Désactiver', color: theme.colors.error };
    } else if (collecteur.joursInactivite > 20) {
      return { action: 'ENVOYER_NOTIFICATION', label: 'Notifier', color: theme.colors.warning };
    } else {
      return { action: 'ENVOYER_NOTIFICATION', label: 'Surveiller', color: theme.colors.info };
    }
  };

  const renderStatistiqueCard = () => {
    if (!statistiques) return null;

    return (
      <Card style={styles.statsCard}>
        <Text style={styles.cardTitle}>📊 Statistiques Globales</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistiques.totalCollecteurs}</Text>
            <Text style={styles.statLabel}>Total Collecteurs</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {statistiques.collecteursActifs}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>
              {statistiques.collecteursInactifs}
            </Text>
            <Text style={styles.statLabel}>Inactifs</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
              {statistiques.pourcentageInactiviteFormate}
            </Text>
            <Text style={styles.statLabel}>% Inactivité</Text>
          </View>
        </View>

        <View style={styles.seuilInfo}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.seuilText}>
            Seuil d'inactivité: {statistiques.seuilInactiviteJours} jours
          </Text>
        </View>
      </Card>
    );
  };

  const renderCollecteurInactif = (collecteur, index) => {
    const statusColor = getStatusColor(collecteur.joursInactivite);
    const recommendedAction = getRecommandedAction(collecteur);

    return (
      <TouchableOpacity
        key={index}
        style={styles.collecteurCard}
        onPress={() => handleCollecteurPress(collecteur)}
      >
        <View style={styles.collecteurHeader}>
          <View style={styles.collecteurInfo}>
            <Text style={styles.collecteurName}>{collecteur.nomComplet}</Text>
            <Text style={styles.collecteurAgence}>{collecteur.agenceNom}</Text>
          </View>
          
          <View style={[styles.inactivityBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.inactivityText}>
              {collecteur.joursInactivite}j
            </Text>
          </View>
        </View>

        <View style={styles.collecteurDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={14} color={theme.colors.textLight} />
            <Text style={styles.detailText}>{collecteur.email}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color={theme.colors.textLight} />
            <Text style={styles.detailText}>{collecteur.telephone}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={14} color={theme.colors.textLight} />
            <Text style={styles.detailText}>{collecteur.nombreClients} clients</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textLight} />
            <Text style={styles.detailText}>
              Dernière activité: {collecteur.derniereActiviteFormatee}
            </Text>
          </View>
        </View>

        <View style={styles.actionRecommendee}>
          <Text style={styles.actionLabel}>Action recommandée:</Text>
          <View style={[styles.actionBadge, { backgroundColor: recommendedAction.color }]}>
            <Text style={styles.actionText}>{recommendedAction.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActionModal = () => (
    <Modal
      visible={actionModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setActionModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setActionModalVisible(false)}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Actions Correctives</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedCollecteur && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.collecteurInfoCard}>
              <Text style={styles.collecteurModalName}>
                {selectedCollecteur.nomComplet}
              </Text>
              <Text style={styles.collecteurModalDetails}>
                {selectedCollecteur.agenceNom} • Inactif depuis {selectedCollecteur.joursInactivite} jours
              </Text>
              <Text style={styles.collecteurModalDetails}>
                {selectedCollecteur.nombreClients} clients • {selectedCollecteur.email}
              </Text>
            </Card>

            <Card style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>🚨 Actions Disponibles</Text>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.notifyButton]}
                onPress={() => executeActionCorrective('ENVOYER_NOTIFICATION')}
              >
                <Ionicons name="notifications" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Envoyer Notification</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deactivateButton]}
                onPress={() => {
                  Alert.alert(
                    'Confirmation',
                    `Êtes-vous sûr de vouloir désactiver ${selectedCollecteur.nomComplet} ?`,
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Désactiver',
                        style: 'destructive',
                        onPress: () => executeActionCorrective('DESACTIVER'),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="ban" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Désactiver Collecteur</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.transferButton]}
                onPress={() => {
                  Alert.alert(
                    'Fonctionnalité Non Disponible',
                    'Le transfert automatique de clients sera implémenté prochainement.'
                  );
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Transférer Clients</Text>
              </TouchableOpacity>
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Monitoring Collecteurs"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du monitoring...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Monitoring Collecteurs"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistiques */}
        {renderStatistiqueCard()}

        {/* Collecteurs inactifs */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🚨 Collecteurs Inactifs ({collecteursInactifs.length})
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {collecteursInactifs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
              <Text style={styles.emptyText}>
                Aucun collecteur inactif détecté !
              </Text>
              <Text style={styles.emptySubtext}>
                Tous les collecteurs ont été actifs ces 15 derniers jours.
              </Text>
            </View>
          ) : (
            <View style={styles.collecteursList}>
              {collecteursInactifs.map(renderCollecteurInactif)}
            </View>
          )}
        </Card>

        {/* Actions rapides */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚡ Actions Rapides</Text>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <Ionicons name="people" size={20} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Gestion des Utilisateurs</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('ExportExcel')}
          >
            <Ionicons name="download" size={20} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Exporter Données</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {renderActionModal()}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  statsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  seuilInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  seuilText: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  refreshButton: {
    padding: 8,
  },
  collecteursList: {
    gap: 12,
  },
  collecteurCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  collecteurHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  collecteurInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  collecteurAgence: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  inactivityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactivityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  collecteurDetails: {
    gap: 4,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.textLight,
    flex: 1,
  },
  actionRecommendee: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    gap: 12,
  },
  quickActionText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  collecteurInfoCard: {
    marginBottom: 16,
  },
  collecteurModalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  collecteurModalDetails: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  notifyButton: {
    backgroundColor: theme.colors.info,
  },
  deactivateButton: {
    backgroundColor: theme.colors.error,
  },
  transferButton: {
    backgroundColor: theme.colors.warning,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});

export default CollecteurMonitoringScreen;