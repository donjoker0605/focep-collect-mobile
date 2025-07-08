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
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, isToday, isYesterday, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

import adminCollecteurService from '../services/adminCollecteurService';

/**
 * 📋 Écran de toutes les activités d'un collecteur avec filtres avancés
 * 
 * FONCTIONNALITÉS :
 * - Liste paginée de toutes les activités
 * - Filtres avancés (dates, actions, entités)
 * - Recherche textuelle
 * - Tri configurable
 * - Export des données
 * - Vue détaillée de chaque activité
 */
const AdminCollecteurActivitiesScreen = ({ route, navigation }) => {
  const { collecteurId, collecteurNom } = route.params;

  // =====================================
  // ÉTAT DU COMPOSANT
  // =====================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activites, setActivites] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filtres
  const [filtres, setFiltres] = useState({
    dateDebut: subDays(new Date(), 7),
    dateFin: new Date(),
    action: '',
    entityType: '',
    recherche: '',
    success: '', // '', 'true', 'false'
  });

  // États UI
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('debut'); // 'debut' ou 'fin'
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');

  // =====================================
  // EFFETS ET CHARGEMENT
  // =====================================

  useEffect(() => {
    navigation.setOptions({
      title: `Activités - ${collecteurNom}`,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons name="filter-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleExport}
          >
            <Ionicons name="download-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, collecteurNom]);

  useEffect(() => {
    chargerActivites(true); // Reset
  }, [filtres, sortBy, sortDir]);

  const chargerActivites = useCallback(async (reset = false, silencieux = false) => {
    try {
      if (reset) {
        setCurrentPage(0);
        setActivites([]);
        setHasMore(true);
      }

      if (!silencieux && reset) {
        setLoading(true);
      } else if (!reset) {
        setLoadingMore(true);
      }

      const page = reset ? 0 : currentPage;
      const dateDebut = format(filtres.dateDebut, 'yyyy-MM-dd');
      const dateFin = format(filtres.dateFin, 'yyyy-MM-dd');

      console.log(`📋 Chargement activités collecteur ${collecteurId}, page ${page}`);

      let activitesData;

      // Utiliser la recherche avancée si des filtres sont appliqués
      const hasFilters = filtres.action || filtres.entityType || filtres.success || filtres.recherche;
      
      if (hasFilters) {
        const searchFilters = {
          page,
          size: 20,
          sortBy,
          sortDir,
          dateDebut,
          dateFin,
          ...(filtres.action && { action: filtres.action }),
          ...(filtres.entityType && { entityType: filtres.entityType }),
          ...(filtres.success && { success: filtres.success === 'true' }),
        };

        activitesData = await adminCollecteurService.searchCollecteurActivities(
          collecteurId,
          searchFilters
        );
      } else {
        activitesData = await adminCollecteurService.getCollecteurActivities(
          collecteurId,
          dateFin, // Date pour le endpoint simple
          page,
          20,
          sortBy,
          sortDir
        );
      }

      const nouvelles = activitesData.content || [];
      
      // Filtrage textuel côté client si nécessaire
      let activitesFiltrees = nouvelles;
      if (filtres.recherche) {
        const rechercheLower = filtres.recherche.toLowerCase();
        activitesFiltrees = nouvelles.filter(activite =>
          activite.action?.toLowerCase().includes(rechercheLower) ||
          activite.entityType?.toLowerCase().includes(rechercheLower) ||
          activite.username?.toLowerCase().includes(rechercheLower) ||
          activite.details?.toLowerCase().includes(rechercheLower)
        );
      }

      if (reset) {
        setActivites(activitesFiltrees);
      } else {
        setActivites(prev => [...prev, ...activitesFiltrees]);
      }

      setCurrentPage(page + 1);
      setTotalElements(activitesData.totalElements || 0);
      setHasMore(activitesFiltrees.length === 20); // Si moins de 20, on a tout

      console.log(`✅ ${activitesFiltrees.length} activités chargées (total: ${activitesData.totalElements})`);

    } catch (error) {
      console.error('❌ Erreur chargement activités:', error);
      if (!silencieux) {
        Alert.alert('Erreur', 'Impossible de charger les activités.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [collecteurId, filtres, sortBy, sortDir, currentPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    chargerActivites(true);
  }, [chargerActivites]);

  const onEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      chargerActivites(false);
    }
  }, [hasMore, loadingMore, loading, chargerActivites]);

  // =====================================
  // HANDLERS D'ÉVÉNEMENTS
  // =====================================

  const handleDatePickerOpen = (mode) => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && event.type === 'set') {
      setFiltres(prev => ({
        ...prev,
        [datePickerMode === 'debut' ? 'dateDebut' : 'dateFin']: selectedDate,
      }));
    }
  };

  const handleResetFilters = () => {
    setFiltres({
      dateDebut: subDays(new Date(), 7),
      dateFin: new Date(),
      action: '',
      entityType: '',
      recherche: '',
      success: '',
    });
    setShowFiltersModal(false);
  };

  const handleApplyFilters = () => {
    setShowFiltersModal(false);
    // Le useEffect se chargera du rechargement
  };

  const handleSortChange = () => {
    const options = [
      { key: 'timestamp', label: 'Date/Heure', dir: 'desc' },
      { key: 'timestamp', label: 'Date/Heure (ancien)', dir: 'asc' },
      { key: 'action', label: 'Action (A-Z)', dir: 'asc' },
      { key: 'action', label: 'Action (Z-A)', dir: 'desc' },
      { key: 'durationMs', label: 'Durée (rapide)', dir: 'asc' },
      { key: 'durationMs', label: 'Durée (lent)', dir: 'desc' },
    ];

    Alert.alert(
      'Trier par',
      'Choisissez le critère de tri',
      options.map(option => ({
        text: option.label,
        onPress: () => {
          setSortBy(option.key);
          setSortDir(option.dir);
        },
        style: (sortBy === option.key && sortDir === option.dir) ? 'cancel' : 'default',
      }))
    );
  };

  const handleExport = () => {
    Alert.alert(
      'Export des activités',
      'Fonctionnalité d\'export à implémenter',
      [{ text: 'OK' }]
    );
  };

  // =====================================
  // COMPOSANTS DE RENDU
  // =====================================

  const renderHeader = () => {
    const hasActiveFilters = filtres.action || filtres.entityType || 
                           filtres.success || filtres.recherche ||
                           filtres.dateDebut.toDateString() !== subDays(new Date(), 7).toDateString() ||
                           filtres.dateFin.toDateString() !== new Date().toDateString();

    return (
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalElements}</Text>
            <Text style={styles.statLabel}>Activités trouvées</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activites.length}</Text>
            <Text style={styles.statLabel}>Affichées</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { 
              color: activites.filter(a => a.estCritique).length > 0 ? '#F44336' : '#4CAF50' 
            }]}>
              {activites.filter(a => a.estCritique).length}
            </Text>
            <Text style={styles.statLabel}>Critiques</Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, hasActiveFilters && styles.controlButtonActive]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons name="filter-outline" size={16} color={hasActiveFilters ? '#fff' : '#007AFF'} />
            <Text style={[styles.controlButtonText, hasActiveFilters && styles.controlButtonTextActive]}>
              Filtres{hasActiveFilters ? ' (actifs)' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleSortChange}>
            <Ionicons name="swap-vertical-outline" size={16} color="#007AFF" />
            <Text style={styles.controlButtonText}>Trier</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActivityItem = ({ item, index }) => {
    const dateActivite = parseISO(item.timestamp);
    let dateLabel;

    if (isToday(dateActivite)) {
      dateLabel = `Aujourd'hui à ${format(dateActivite, 'HH:mm')}`;
    } else if (isYesterday(dateActivite)) {
      dateLabel = `Hier à ${format(dateActivite, 'HH:mm')}`;
    } else {
      dateLabel = format(dateActivite, 'dd/MM à HH:mm', { locale: fr });
    }

    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          item.estCritique && styles.activityItemCritical,
          index === activites.length - 1 && styles.activityItemLast,
        ]}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityIcon}>
            <Text style={styles.activityIconText}>{item.iconeAction}</Text>
          </View>
          
          <View style={styles.activityContent}>
            <Text style={styles.activityDescription} numberOfLines={1}>
              {item.descriptionFormattee}
            </Text>
            <Text style={styles.activityTime}>{dateLabel}</Text>
            
            {item.entityType && (
              <Text style={styles.activityEntity}>
                {item.entityType} #{item.entityId}
              </Text>
            )}
          </View>

          <View style={styles.activityMeta}>
            {item.success === false && (
              <View style={styles.errorBadge}>
                <Ionicons name="close-circle" size={16} color="#F44336" />
              </View>
            )}
            
            {item.estCritique && (
              <View style={styles.criticalBadge}>
                <Ionicons name="warning" size={16} color="#FF9800" />
              </View>
            )}

            {item.durationMs && item.durationMs > 2000 && (
              <View style={styles.slowBadge}>
                <Text style={styles.slowBadgeText}>{Math.round(item.durationMs / 1000)}s</Text>
              </View>
            )}
          </View>
        </View>

        {item.errorMessage && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorMessageText} numberOfLines={2}>
              {item.errorMessage}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleActivityPress = (activite) => {
    // Navigation vers un écran de détail ou modal
    Alert.alert(
      'Détails de l\'activité',
      `Action: ${activite.action}\nDate: ${activite.timestampFormate}\nStatut: ${activite.success === false ? 'Échec' : 'Succès'}`,
      [{ text: 'OK' }]
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFiltersModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFiltersModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
            <Text style={styles.modalCancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filtres avancés</Text>
          <TouchableOpacity onPress={handleApplyFilters}>
            <Text style={styles.modalApplyText}>Appliquer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Période */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Période</Text>
            
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Du</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => handleDatePickerOpen('debut')}
                >
                  <Text style={styles.dateButtonText}>
                    {format(filtres.dateDebut, 'dd/MM/yyyy')}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Au</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => handleDatePickerOpen('fin')}
                >
                  <Text style={styles.dateButtonText}>
                    {format(filtres.dateFin, 'dd/MM/yyyy')}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Type d'action</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Ex: CREATE_CLIENT, LOGIN, etc."
              value={filtres.action}
              onChangeText={(text) => setFiltres(prev => ({ ...prev, action: text }))}
            />
          </View>

          {/* Type d'entité */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Type d'entité</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Ex: CLIENT, MOUVEMENT, etc."
              value={filtres.entityType}
              onChangeText={(text) => setFiltres(prev => ({ ...prev, entityType: text }))}
            />
          </View>

          {/* Statut */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Statut</Text>
            <View style={styles.statusButtons}>
              {[
                { key: '', label: 'Tous' },
                { key: 'true', label: 'Succès' },
                { key: 'false', label: 'Échec' },
              ].map(status => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.statusButton,
                    filtres.success === status.key && styles.statusButtonActive
                  ]}
                  onPress={() => setFiltres(prev => ({ ...prev, success: status.key }))}
                >
                  <Text style={[
                    styles.statusButtonText,
                    filtres.success === status.key && styles.statusButtonTextActive
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recherche textuelle */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Recherche dans le contenu</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Rechercher dans les actions, entités, détails..."
              value={filtres.recherche}
              onChangeText={(text) => setFiltres(prev => ({ ...prev, recherche: text }))}
            />
          </View>

          {/* Actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerLoaderText}>Chargement...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Aucune activité trouvée</Text>
      <Text style={styles.emptyMessage}>
        Aucune activité ne correspond aux critères de recherche.
        Essayez de modifier les filtres ou la période.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleResetFilters}>
        <Text style={styles.emptyButtonText}>Réinitialiser les filtres</Text>
      </TouchableOpacity>
    </View>
  );

  // =====================================
  // RENDU PRINCIPAL
  // =====================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des activités...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {activites.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={activites}
          renderItem={renderActivityItem}
          keyExtractor={(item, index) => `activite-${item.id || index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderFiltersModal()}

      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'debut' ? filtres.dateDebut : filtres.dateFin}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
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
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  
  // Contrôles
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    gap: 6,
  },
  controlButtonActive: {
    backgroundColor: '#007AFF',
  },
  controlButtonText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
  },
  controlButtonTextActive: {
    color: '#fff',
  },
  
  // Liste
  listContainer: {
    padding: 16,
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItemCritical: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  activityItemLast: {
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginBottom: 2,
  },
  activityEntity: {
    fontSize: 12,
    color: '#007AFF',
  },
  activityMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  
  // Badges
  errorBadge: {
    padding: 2,
  },
  criticalBadge: {
    padding: 2,
  },
  slowBadge: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  slowBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Message d'erreur
  errorMessage: {
    marginTop: 8,
    backgroundColor: '#fff5f5',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  errorMessageText: {
    fontSize: 12,
    color: '#F44336',
  },
  
  // Footer loader
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    color: '#6c757d',
    fontSize: 14,
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
    color: '#6c757d',
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
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
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
  
  // Modal de filtres
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
    color: '#6c757d',
    fontSize: 16,
  },
  modalApplyText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  
  // Sections de filtres
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  filterInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  // Dates
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#212529',
  },
  
  // Boutons de statut
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
  },
  statusButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  
  // Actions des filtres
  filterActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  resetButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AdminCollecteurActivitiesScreen;