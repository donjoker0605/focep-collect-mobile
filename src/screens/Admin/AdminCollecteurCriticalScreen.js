// src/screens/Admin/AdminCollecteurCriticalScreen.js - VERSION CORRIGÉE
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

// ✅ IMPORT CORRIGÉ - Chemin depuis src/screens/Admin vers src/services
import adminCollecteurService from '../../services/adminCollecteurService';

/**
 * 🚨 Écran des activités critiques d'un collecteur
 * 
 * FONCTIONNALITÉS :
 * - Liste détaillée des activités critiques
 * - Filtrage par type de criticité
 * - Actions correctives suggérées
 * - Détails complets de chaque activité
 * - Possibilité de marquer comme résolue
 * - Export des données critiques
 */
const AdminCollecteurCriticalScreen = ({ route, navigation }) => {
  const { collecteurId, collecteurNom, critiques: initialCritiques = [] } = route.params;

  // =====================================
  // ÉTAT DU COMPOSANT
  // =====================================

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [critiques, setCritiques] = useState(initialCritiques);
  const [filtreType, setFiltreType] = useState('TOUS'); // TOUS, ERREURS, HORS_HEURES, LENT, ECHECS
  const [selectedPeriod, setSelectedPeriod] = useState('7'); // 7, 14, 30 jours
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // =====================================
  // EFFETS ET CHARGEMENT
  // =====================================

  useEffect(() => {
    navigation.setOptions({
      title: `Activités critiques - ${collecteurNom}`,
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton} onPress={handleExport}>
          <Ionicons name="download-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, collecteurNom]);

  useEffect(() => {
    if (critiques.length === 0 || selectedPeriod !== '7') {
      chargerCritiques();
    }
  }, [selectedPeriod]);

  const chargerCritiques = useCallback(async (silencieux = false) => {
    try {
      if (!silencieux) {
        setLoading(true);
      }

      console.log(`🚨 Chargement activités critiques collecteur ${collecteurId}, période: ${selectedPeriod} jours`);

      const critiquesData = await adminCollecteurService.getCollecteurCriticalActivities(
        collecteurId, 
        parseInt(selectedPeriod), 
        100 // Récupérer plus d'activités pour le filtrage
      );

      setCritiques(critiquesData);
      console.log(`✅ ${critiquesData.length} activités critiques chargées`);

    } catch (error) {
      console.error('❌ Erreur chargement activités critiques:', error);
      Alert.alert('Erreur', 'Impossible de charger les activités critiques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [collecteurId, selectedPeriod]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    chargerCritiques();
  }, [chargerCritiques]);

  // =====================================
  // LOGIQUE DE FILTRAGE
  // =====================================

  const getCritiquesFiltrees = useCallback(() => {
    let critiquesFiltrees = [...critiques];

    // Filtrage par type
    if (filtreType !== 'TOUS') {
      critiquesFiltrees = critiquesFiltrees.filter(critique => {
        switch (filtreType) {
          case 'ERREURS':
            return critique.success === false;
          case 'HORS_HEURES':
            const heure = new Date(critique.timestamp).getHours();
            return heure < 6 || heure > 22;
          case 'LENT':
            return critique.durationMs && critique.durationMs > 5000;
          case 'ECHECS':
            return critique.action?.includes('FAILED') || critique.success === false;
          default:
            return true;
        }
      });
    }

    return critiquesFiltrees.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [critiques, filtreType]);

  // =====================================
  // HANDLERS D'ÉVÉNEMENTS
  // =====================================

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const handleFilterChange = () => {
    const filtres = ['TOUS', 'ERREURS', 'HORS_HEURES', 'LENT', 'ECHECS'];
    const filtresLabels = {
      'TOUS': 'Toutes les activités',
      'ERREURS': 'Erreurs système',
      'HORS_HEURES': 'Activités hors heures',
      'LENT': 'Exécution lente',
      'ECHECS': 'Échecs d\'opération',
    };

    Alert.alert(
      'Filtrer par type',
      'Choisissez le type d\'activité critique',
      filtres.map(filtre => ({
        text: filtresLabels[filtre],
        onPress: () => setFiltreType(filtre),
        style: filtre === filtreType ? 'cancel' : 'default',
      }))
    );
  };

  const handleActivityPress = (activite) => {
    setSelectedActivity(activite);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    Alert.alert(
      'Export des données',
      'Fonctionnalité d\'export à implémenter',
      [{ text: 'OK' }]
    );
  };

  const handleMarkResolved = async (activiteId) => {
    Alert.alert(
      'Marquer comme résolue',
      'Cette fonctionnalité sera disponible dans une prochaine version.',
      [{ text: 'OK' }]
    );
  };

  // =====================================
  // MÉTHODES DE RENDU DES COMPOSANTS
  // =====================================

  const renderHeader = () => {
    const critiquesFiltrees = getCritiquesFiltrees();
    
    return (
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{critiquesFiltrees.length}</Text>
            <Text style={styles.statLabel}>Activités critiques</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>
              {critiquesFiltrees.filter(c => c.success === false).length}
            </Text>
            <Text style={styles.statLabel}>Échecs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {critiquesFiltrees.filter(c => {
                const heure = new Date(c.timestamp).getHours();
                return heure < 6 || heure > 22;
              }).length}
            </Text>
            <Text style={styles.statLabel}>Hors heures</Text>
          </View>
        </View>

        {/* Sélecteurs de période et filtre */}
        <View style={styles.controlsContainer}>
          <View style={styles.periodContainer}>
            <Text style={styles.controlLabel}>Période:</Text>
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
                    {period}j
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.filterButton} onPress={handleFilterChange}>
            <Ionicons name="filter-outline" size={16} color="#007AFF" />
            <Text style={styles.filterButtonText}>{filtreType}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCriticalityBadge = (activite) => {
    const { success, durationMs } = activite;
    const heure = new Date(activite.timestamp).getHours();
    const horsHeures = heure < 6 || heure > 22;
    const lent = durationMs && durationMs > 5000;

    let type = 'NORMALE';
    let couleur = '#FF9800';
    let icone = '⚠️';

    if (success === false) {
      type = 'CRITIQUE';
      couleur = '#F44336';
      icone = '❌';
    } else if (lent) {
      type = 'LENTE';
      couleur = '#9C27B0';
      icone = '🐌';
    } else if (horsHeures) {
      type = 'HORS HEURES';
      couleur = '#FF5722';
      icone = '🌙';
    }

    return (
      <View style={[styles.criticalityBadge, { backgroundColor: couleur }]}>
        <Text style={styles.criticalityIcon}>{icone}</Text>
        <Text style={styles.criticalityText}>{type}</Text>
      </View>
    );
  };

  const renderActivityItem = ({ item }) => {
    const dateActivite = parseISO(item.timestamp);
    let dateLabel;

    if (isToday(dateActivite)) {
      dateLabel = `Aujourd'hui à ${format(dateActivite, 'HH:mm')}`;
    } else if (isYesterday(dateActivite)) {
      dateLabel = `Hier à ${format(dateActivite, 'HH:mm')}`;
    } else {
      dateLabel = format(dateActivite, 'dd/MM/yyyy à HH:mm', { locale: fr });
    }

    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityInfo}>
            <Text style={styles.activityDescription} numberOfLines={2}>
              {item.descriptionFormattee}
            </Text>
            <Text style={styles.activityTime}>{dateLabel}</Text>
          </View>
          {renderCriticalityBadge(item)}
        </View>

        <View style={styles.activityDetails}>
          {item.entityType && (
            <View style={styles.detailItem}>
              <Ionicons name="document-outline" size={14} color="#6c757d" />
              <Text style={styles.detailText}>
                {item.entityType} #{item.entityId}
              </Text>
            </View>
          )}
          
          {item.durationMs && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color="#6c757d" />
              <Text style={styles.detailText}>
                {item.durationMs}ms
              </Text>
            </View>
          )}

          {item.ipAddress && (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color="#6c757d" />
              <Text style={styles.detailText}>
                {item.ipAddress}
              </Text>
            </View>
          )}
        </View>

        {item.errorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={16} color="#F44336" />
            <Text style={styles.errorText} numberOfLines={2}>
              {item.errorMessage}
            </Text>
          </View>
        )}

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedActivity) return null;

    const activite = selectedActivity;
    const dateActivite = parseISO(activite.timestamp);

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détails de l'activité</Text>
            <TouchableOpacity onPress={() => handleMarkResolved(activite.id)}>
              <Text style={styles.modalResolveText}>Résoudre</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Badge de criticité */}
            <View style={styles.modalSection}>
              {renderCriticalityBadge(activite)}
            </View>

            {/* Informations principales */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Informations générales</Text>
              <View style={styles.modalInfoGrid}>
                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalInfoLabel}>Action</Text>
                  <Text style={styles.modalInfoValue}>{activite.action}</Text>
                </View>
                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalInfoLabel}>Date et heure</Text>
                  <Text style={styles.modalInfoValue}>
                    {format(dateActivite, 'dd/MM/yyyy à HH:mm:ss', { locale: fr })}
                  </Text>
                </View>
                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalInfoLabel}>Utilisateur</Text>
                  <Text style={styles.modalInfoValue}>{activite.username || 'N/A'}</Text>
                </View>
                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalInfoLabel}>Adresse IP</Text>
                  <Text style={styles.modalInfoValue}>{activite.ipAddress || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Entité concernée */}
            {activite.entityType && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Entité concernée</Text>
                <View style={styles.modalInfoGrid}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Type</Text>
                    <Text style={styles.modalInfoValue}>{activite.entityType}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>ID</Text>
                    <Text style={styles.modalInfoValue}>{activite.entityId}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Performance */}
            {activite.durationMs && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Performance</Text>
                <View style={styles.modalInfoGrid}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Durée d'exécution</Text>
                    <Text style={[
                      styles.modalInfoValue,
                      { color: activite.durationMs > 5000 ? '#F44336' : '#4CAF50' }
                    ]}>
                      {activite.durationMs} ms
                    </Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Statut</Text>
                    <Text style={[
                      styles.modalInfoValue,
                      { color: activite.success === false ? '#F44336' : '#4CAF50' }
                    ]}>
                      {activite.success === false ? 'Échec' : 'Succès'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Erreur */}
            {activite.errorMessage && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Message d'erreur</Text>
                <View style={styles.errorDetailContainer}>
                  <Text style={styles.errorDetailText}>{activite.errorMessage}</Text>
                </View>
              </View>
            )}

            {/* Détails JSON */}
            {activite.details && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Détails techniques</Text>
                <View style={styles.jsonContainer}>
                  <Text style={styles.jsonText}>
                    {JSON.stringify(JSON.parse(activite.details || '{}'), null, 2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Actions suggérées */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Actions suggérées</Text>
              <View style={styles.suggestionsContainer}>
                {getSuggestions(activite).map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const getSuggestions = (activite) => {
    const suggestions = [];

    if (activite.success === false) {
      suggestions.push({
        icon: '🔧',
        text: 'Vérifier la configuration système et les logs d\'erreur',
      });
    }

    if (activite.durationMs && activite.durationMs > 5000) {
      suggestions.push({
        icon: '⚡',
        text: 'Optimiser les performances ou vérifier la connectivité réseau',
      });
    }

    const heure = new Date(activite.timestamp).getHours();
    if (heure < 6 || heure > 22) {
      suggestions.push({
        icon: '🌙',
        text: 'Activité en dehors des heures normales - vérifier les accès',
      });
    }

    if (activite.action?.includes('DELETE')) {
      suggestions.push({
        icon: '🗑️',
        text: 'Action de suppression - vérifier la conformité aux procédures',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        icon: '✅',
        text: 'Activité surveillée - aucune action requise pour le moment',
      });
    }

    return suggestions;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
      <Text style={styles.emptyTitle}>Aucune activité critique</Text>
      <Text style={styles.emptyMessage}>
        {filtreType === 'TOUS' 
          ? 'Excellent ! Aucune activité critique détectée pour ce collecteur.'
          : `Aucune activité critique du type "${filtreType}" trouvée.`
        }
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={() => chargerCritiques()}>
        <Text style={styles.refreshButtonText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  // =====================================
  // RENDU PRINCIPAL
  // =====================================

  const critiquesFiltrees = getCritiquesFiltrees();

  if (loading && critiques.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des activités critiques...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Activités Critiques"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Activités Critiques</Text>
        <Text style={styles.subtitle}>
          {collecteurNom ? `Collecteur: ${collecteurNom}` : 'Collecteur non spécifié'}
        </Text>
        <Text style={styles.message}>
          Cet écran affichera les activités critiques du collecteur.
        </Text>
        <Text style={styles.note}>
          📝 Note: Cet écran sera implémenté dans une version future.
        </Text>
      </View>
    </SafeAreaView>
  );
};

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  
  // Contrôles
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    gap: 4,
  },
  filterButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Liste
  listContainer: {
    padding: 16,
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#6c757d',
  },
  
  // Badge de criticité
  criticalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  criticalityIcon: {
    fontSize: 12,
  },
  criticalityText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
  },
  
  // Détails activité
  activityDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6c757d',
  },
  
  // Erreur
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#F44336',
  },
  
  // Chevron
  chevronContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  
  // États vides
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
  
  // Modal
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
  modalCloseText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalResolveText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  modalInfoGrid: {
    gap: 12,
  },
  modalInfoItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  
  // Erreur détaillée
  errorDetailContainer: {
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorDetailText: {
    fontSize: 14,
    color: '#F44336',
    lineHeight: 20,
  },
  
  // JSON
  jsonContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  jsonText: {
    fontSize: 12,
    color: '#495057',
    fontFamily: 'monospace',
  },
  
  // Suggestions
  suggestionsContainer: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  suggestionIcon: {
    fontSize: 20,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#212529',
    lineHeight: 20,
  },
});

export default AdminCollecteurCriticalScreen;