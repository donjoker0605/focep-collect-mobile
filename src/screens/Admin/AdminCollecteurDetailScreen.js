// src/screens/Admin/AdminCollecteurDetailScreen.js - VERSION CORRIGÉE
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, BarChart } from 'react-native-chart-kit';

// ✅ IMPORT CORRIGÉ - Chemin depuis src/screens/Admin vers src/services
import adminCollecteurService from '../../services/adminCollecteurService';

const { width, height } = Dimensions.get('window');
const chartWidth = width - 40;

/**
 * 🔍 Écran de détail d'un collecteur spécifique
 * 
 * FONCTIONNALITÉS :
 * - Informations détaillées du collecteur
 * - Graphiques d'activité et tendances
 * - Liste des activités récentes
 * - Actions rapides (message, voir critiques)
 * - Statistiques sur plusieurs périodes
 * - Navigation vers activités critiques
 */
const AdminCollecteurDetailScreen = ({ route, navigation }) => {
  const { collecteurId, collecteurNom, agenceNom } = route.params;

  // =====================================
  // ÉTAT DU COMPOSANT
  // =====================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activites, setActivites] = useState({ content: [], totalElements: 0 });
  const [stats, setStats] = useState({});
  const [critiques, setCritiques] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7'); // 7, 14, 30 jours
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // =====================================
  // EFFETS ET CHARGEMENT DES DONNÉES
  // =====================================

  useEffect(() => {
    navigation.setOptions({
      title: collecteurNom,
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowMessageModal(true)}
        >
          <Ionicons name="mail-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, collecteurNom]);

  useEffect(() => {
    chargerDonnees();
  }, [selectedPeriod]);

  const chargerDonnees = useCallback(async (silencieux = false) => {
    try {
      if (!silencieux) {
        setLoading(true);
      }

      console.log(`📊 Chargement données collecteur ${collecteurId}, période: ${selectedPeriod} jours`);

      const dateDebut = format(subDays(new Date(), parseInt(selectedPeriod)), 'yyyy-MM-dd');
      const dateFin = format(new Date(), 'yyyy-MM-dd');

      // Chargement en parallèle
      const [activitesData, statsData, critiquesData] = await Promise.all([
        adminCollecteurService.getCollecteurActivities(collecteurId, dateFin, 0, 20),
        adminCollecteurService.getCollecteurDetailedStats(collecteurId, dateDebut, dateFin),
        adminCollecteurService.getCollecteurCriticalActivities(collecteurId, parseInt(selectedPeriod), 10),
      ]);

      setActivites(activitesData);
      setStats(statsData);
      setCritiques(critiquesData);

      console.log(`✅ Données chargées: ${activitesData.totalElements} activités, ${critiquesData.length} critiques`);

    } catch (error) {
      console.error('❌ Erreur chargement données collecteur:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du collecteur.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [collecteurId, selectedPeriod]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    chargerDonnees();
  }, [chargerDonnees]);

  // =====================================
  // HANDLERS D'ÉVÉNEMENTS
  // =====================================

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const handleVoirToutesActivites = () => {
    navigation.navigate('AdminCollecteurActivities', {
      collecteurId,
      collecteurNom,
    });
  };

  const handleVoirCritiques = () => {
    navigation.navigate('AdminCollecteurCritical', {
      collecteurId,
      collecteurNom,
      critiques,
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un message.');
      return;
    }

    try {
      setSendingMessage(true);
      
      // TODO: Appel API pour envoyer le message
      // await adminCollecteurService.sendMessageToCollecteur(collecteurId, messageText);
      
      // Simulation pour l'instant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Succès', 'Message envoyé au collecteur.');
      setShowMessageModal(false);
      setMessageText('');

    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    } finally {
      setSendingMessage(false);
    }
  };

  // =====================================
  // MÉTHODES DE RENDU DES COMPOSANTS
  // =====================================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.collecteurInfo}>
        <Text style={styles.collecteurNom}>{collecteurNom}</Text>
        <Text style={styles.agenceNom}>📍 {agenceNom}</Text>
      </View>
      
      <View style={styles.statsQuick}>
        <View style={styles.statQuick}>
          <Text style={styles.statQuickValue}>{stats.totalActivites || 0}</Text>
          <Text style={styles.statQuickLabel}>Activités</Text>
        </View>
        <View style={styles.statQuick}>
          <Text style={[styles.statQuickValue, { color: critiques.length > 0 ? '#F44336' : '#4CAF50' }]}>
            {critiques.length}
          </Text>
          <Text style={styles.statQuickLabel}>Critiques</Text>
        </View>
        <View style={styles.statQuick}>
          <Text style={styles.statQuickValue}>{stats.joursActifs || 0}</Text>
          <Text style={styles.statQuickLabel}>Jours actifs</Text>
        </View>
      </View>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <Text style={styles.sectionTitle}>Période d'analyse</Text>
      <View style={styles.periodButtons}>
        {['7', '14', '30'].map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period} jours
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderActivityChart = () => {
    if (!stats.activitesParJour || Object.keys(stats.activitesParJour).length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Activité quotidienne</Text>
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>Aucune donnée disponible</Text>
          </View>
        </View>
      );
    }

    // Préparation des données pour le graphique
    const sortedDates = Object.keys(stats.activitesParJour).sort();
    const chartData = {
      labels: sortedDates.slice(-7).map(date => format(parseISO(date), 'dd/MM')),
      datasets: [{
        data: sortedDates.slice(-7).map(date => stats.activitesParJour[date] || 0),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Activité quotidienne (7 derniers jours)</Text>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderActivityBreakdown = () => {
    if (!stats.repartitionActionsFormattee || stats.repartitionActionsFormattee.length === 0) {
      return null;
    }

    // Prendre les 5 actions les plus fréquentes
    const topActions = stats.repartitionActionsFormattee.slice(0, 5);
    const total = topActions.reduce((sum, item) => sum + item.value, 0);

    const chartData = {
      labels: topActions.map(item => item.label.replace('_', ' ')),
      datasets: [{
        data: topActions.map(item => item.value),
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Répartition par type d'action</Text>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
        />
        
        {/* Légende avec pourcentages */}
        <View style={styles.legend}>
          {topActions.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getActionColor(index) }]} />
              <Text style={styles.legendText}>
                {item.label}: {item.value} ({Math.round((item.value / total) * 100)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecentActivities = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Activités récentes</Text>
        <TouchableOpacity onPress={handleVoirToutesActivites}>
          <Text style={styles.seeAllText}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      
      {activites.content.length === 0 ? (
        <View style={styles.noActivitiesContainer}>
          <Ionicons name="list-outline" size={48} color="#ccc" />
          <Text style={styles.noActivitiesText}>Aucune activité récente</Text>
        </View>
      ) : (
        <View style={styles.activitiesList}>
          {activites.content.slice(0, 5).map((activite, index) => (
            <View key={`activite-${activite.id || index}`} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityIconText}>{activite.iconeAction}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityDescription} numberOfLines={1}>
                  {activite.descriptionFormattee}
                </Text>
                <Text style={styles.activityTime}>{activite.timeAgo}</Text>
              </View>
              {activite.estCritique && (
                <View style={styles.criticalBadge}>
                  <Ionicons name="warning" size={16} color="#F44336" />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderCriticalActivities = () => {
    if (critiques.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activités critiques</Text>
          <View style={styles.noCriticalContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
            <Text style={styles.noCriticalText}>Aucune activité critique détectée</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: '#F44336' }]}>
            🚨 Activités critiques ({critiques.length})
          </Text>
          <TouchableOpacity onPress={handleVoirCritiques}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.criticalList}>
          {critiques.slice(0, 3).map((critique, index) => (
            <View key={`critique-${critique.id || index}`} style={styles.criticalItem}>
              <View style={styles.criticalIcon}>
                <Ionicons name="warning" size={20} color="#F44336" />
              </View>
              <View style={styles.criticalContent}>
                <Text style={styles.criticalDescription} numberOfLines={2}>
                  {critique.descriptionFormattee}
                </Text>
                <Text style={styles.criticalTime}>{critique.timeAgo}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => setShowMessageModal(true)}
      >
        <Ionicons name="mail-outline" size={20} color="#007AFF" />
        <Text style={styles.actionButtonText}>Envoyer message</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleVoirCritiques}
      >
        <Ionicons name="warning-outline" size={20} color="#FF9800" />
        <Text style={styles.actionButtonText}>Voir critiques</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMessageModal = () => (
    <Modal
      visible={showMessageModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMessageModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowMessageModal(false)}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Message à {collecteurNom}</Text>
          <TouchableOpacity 
            onPress={handleSendMessage}
            disabled={sendingMessage || !messageText.trim()}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[
                styles.modalSendText,
                (!messageText.trim()) && styles.modalSendTextDisabled
              ]}>
                Envoyer
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <TextInput
            style={styles.messageInput}
            placeholder="Tapez votre message ici..."
            multiline
            numberOfLines={6}
            value={messageText}
            onChangeText={setMessageText}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {messageText.length}/500 caractères
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // =====================================
  // RENDU PRINCIPAL
  // =====================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderPeriodSelector()}
        {renderActivityChart()}
        {renderActivityBreakdown()}
        {renderRecentActivities()}
        {renderCriticalActivities()}
        {renderActionButtons()}
      </ScrollView>
      
      {renderMessageModal()}
    </SafeAreaView>
  );
};

// =====================================
// CONFIGURATION DES GRAPHIQUES
// =====================================

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#007AFF',
  },
  propsForLabels: {
    fontSize: 12,
  },
};

const getActionColor = (index) => {
  const colors = ['#007AFF', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'];
  return colors[index % colors.length];
};

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  
  // En-tête
  headerButton: {
    padding: 8,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  collecteurInfo: {
    marginBottom: 16,
  },
  collecteurNom: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  agenceNom: {
    fontSize: 16,
    color: '#6c757d',
  },
  statsQuick: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statQuick: {
    alignItems: 'center',
  },
  statQuickValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statQuickLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  
  // Sélecteur de période
  periodSelector: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  
  // Sections
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  seeAllText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Graphiques
  chartContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#6c757d',
  },
  
  // Listes d'activités
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  criticalBadge: {
    marginLeft: 8,
  },
  
  // Activités critiques
  criticalList: {
    gap: 12,
  },
  criticalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  criticalIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  criticalContent: {
    flex: 1,
  },
  criticalDescription: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 4,
  },
  criticalTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  
  // États vides
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
  },
  noActivitiesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noActivitiesText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
  },
  noCriticalContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCriticalText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 8,
  },
  
  // Boutons d'action
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  actionButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Modal de message
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  modalCancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalSendText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSendTextDisabled: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 8,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6c757d',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
});

export default AdminCollecteurDetailScreen;