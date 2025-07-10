// src/screens/Admin/AdminCollecteurSupervisionScreen.js - VERSION CORRIGÉE
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ✅ IMPORT CORRIGÉ - Chemin depuis src/screens/Admin vers src/services
import adminCollecteurService from '../../services/adminCollecteurService';

const { width } = Dimensions.get('window');

/**
 * 🎯 Écran de supervision des collecteurs par les administrateurs
 * 
 * FONCTIONNALITÉS :
 * - Vue d'ensemble de tous les collecteurs accessibles
 * - Statuts en temps réel (ACTIF, ATTENTION, INACTIF)
 * - Métriques d'activité par collecteur
 * - Navigation vers les détails d'un collecteur
 * - Rafraîchissement pull-to-refresh
 * - Filtrage et tri des collecteurs
 * 
 * PERMISSIONS :
 * - ADMIN : Voit les collecteurs de son agence
 * - SUPER_ADMIN : Voit tous les collecteurs
 */
const AdminCollecteurSupervisionScreen = ({ navigation }) => {
  // =====================================
  // ÉTAT DU COMPOSANT
  // =====================================

  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('TOUS'); // TOUS, ACTIF, ATTENTION, INACTIF
  const [triePar, setTriePar] = useState('priorite'); // priorite, nom, activite, agence

  // =====================================
  // EFFETS ET CALLBACKS
  // =====================================

  useEffect(() => {
    chargerCollecteurs();
  }, []);

  useEffect(() => {
    // Auto-refresh toutes les 5 minutes quand l'écran est actif
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        chargerCollecteurs(true); // Chargement silencieux
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  const chargerCollecteurs = useCallback(async (silencieux = false) => {
    try {
      if (!silencieux) {
        setLoading(true);
      }
      setError(null);

      console.log('📊 Chargement résumé activités collecteurs...');
      
      // Récupération des données pour aujourd'hui
      const aujourd_hui = new Date().toISOString().split('T')[0];
      const resume = await adminCollecteurService.getCollecteursActivitySummary(
        aujourd_hui, 
        aujourd_hui
      );

      console.log(`✅ ${resume.length} collecteurs récupérés`);
      setCollecteurs(resume);

    } catch (err) {
      console.error('❌ Erreur chargement collecteurs:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      
      // Afficher une alerte seulement si ce n'est pas un chargement silencieux
      if (!silencieux) {
        Alert.alert(
          'Erreur',
          'Impossible de charger les données des collecteurs. Vérifiez votre connexion.',
          [{ text: 'Réessayer', onPress: () => chargerCollecteurs() }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    chargerCollecteurs();
  }, [chargerCollecteurs]);

  // =====================================
  // LOGIQUE DE FILTRAGE ET TRI
  // =====================================

  const getCollecteursFiltres = useCallback(() => {
    let collecteursFiltres = [...collecteurs];

    // Filtrage par statut
    if (filtreStatut !== 'TOUS') {
      collecteursFiltres = collecteursFiltres.filter(c => c.statut === filtreStatut);
    }

    // Tri
    collecteursFiltres.sort((a, b) => {
      switch (triePar) {
        case 'priorite':
          // Tri par priorité (INACTIF > ATTENTION > ACTIF)
          return (a.niveauPriorite || 4) - (b.niveauPriorite || 4);
        
        case 'nom':
          return (a.collecteurNom || '').localeCompare(b.collecteurNom || '');
        
        case 'activite':
          return (b.totalActivites || 0) - (a.totalActivites || 0);
        
        case 'agence':
          return (a.agenceNom || '').localeCompare(b.agenceNom || '');
        
        default:
          return 0;
      }
    });

    return collecteursFiltres;
  }, [collecteurs, filtreStatut, triePar]);

  // =====================================
  // HANDLERS D'ÉVÉNEMENTS
  // =====================================

  const handleCollecteurPress = (collecteur) => {
    console.log('🔍 Navigation vers détails collecteur:', collecteur.collecteurId);
    
    navigation.navigate('AdminCollecteurDetail', {
      collecteurId: collecteur.collecteurId,
      collecteurNom: collecteur.collecteurNom,
      agenceNom: collecteur.agenceNom,
    });
  };

  const handleFiltrePress = () => {
    const filtres = ['TOUS', 'ACTIF', 'ATTENTION', 'INACTIF'];
    
    Alert.alert(
      'Filtrer par statut',
      'Choisissez le statut à afficher',
      filtres.map(filtre => ({
        text: filtre,
        onPress: () => setFiltreStatut(filtre),
        style: filtre === filtreStatut ? 'cancel' : 'default',
      }))
    );
  };

  const handleTriPress = () => {
    const options = [
      { key: 'priorite', label: 'Priorité' },
      { key: 'nom', label: 'Nom' },
      { key: 'activite', label: 'Activité' },
      { key: 'agence', label: 'Agence' },
    ];
    
    Alert.alert(
      'Trier par',
      'Choisissez le critère de tri',
      options.map(option => ({
        text: option.label,
        onPress: () => setTriePar(option.key),
        style: option.key === triePar ? 'cancel' : 'default',
      }))
    );
  };

  // =====================================
  // COMPOSANTS D'AFFICHAGE
  // =====================================

  const renderStatutBadge = (statut, couleurStatut, iconeStatut) => (
    <View style={[styles.statutBadge, { backgroundColor: couleurStatut }]}>
      <Text style={styles.statutIcon}>{iconeStatut}</Text>
      <Text style={styles.statutText}>{statut}</Text>
    </View>
  );

  const renderMetrique = (label, valeur, icone, couleur = '#666') => (
    <View style={styles.metrique}>
      <Ionicons name={icone} size={16} color={couleur} />
      <Text style={styles.metriqueLabel}>{label}</Text>
      <Text style={[styles.metriqueValeur, { color: couleur }]}>{valeur}</Text>
    </View>
  );

  const renderDerniereActivite = (derniereActivite) => {
    if (!derniereActivite) {
      return <Text style={styles.derniereActiviteText}>Aucune activité</Text>;
    }

    const date = parseISO(derniereActivite);
    let dateText;

    if (isToday(date)) {
      dateText = `Aujourd'hui à ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      dateText = `Hier à ${format(date, 'HH:mm')}`;
    } else {
      dateText = format(date, 'dd/MM à HH:mm', { locale: fr });
    }

    return <Text style={styles.derniereActiviteText}>{dateText}</Text>;
  };

  const renderCollecteurItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.collecteurCard,
        item.necessiteAttention && styles.collecteurCardAttention
      ]}
      onPress={() => handleCollecteurPress(item)}
      activeOpacity={0.7}
    >
      {/* En-tête avec nom et statut */}
      <View style={styles.collecteurHeader}>
        <View style={styles.collecteurInfo}>
          <Text style={styles.collecteurNom} numberOfLines={1}>
            {item.collecteurNom}
          </Text>
          <Text style={styles.agenceNom} numberOfLines={1}>
            📍 {item.agenceNom}
          </Text>
        </View>
        {renderStatutBadge(item.statut, item.couleurStatut, item.iconeStatut)}
      </View>

      {/* Métriques d'activité */}
      <View style={styles.metriquesContainer}>
        {renderMetrique(
          'Activités',
          item.totalActivites || 0,
          'pulse-outline',
          item.totalActivites > 10 ? '#4CAF50' : '#FF9800'
        )}
        
        {renderMetrique(
          'Jours actifs',
          item.joursActifs || 0,
          'calendar-outline',
          item.joursActifs > 0 ? '#4CAF50' : '#F44336'
        )}
        
        {item.activitesCritiques > 0 && renderMetrique(
          'Critiques',
          item.activitesCritiques,
          'warning-outline',
          '#F44336'
        )}
        
        {renderMetrique(
          'Score',
          `${item.scoreActivite || 0}%`,
          'trophy-outline',
          item.scoreActivite >= 75 ? '#4CAF50' : item.scoreActivite >= 50 ? '#FF9800' : '#F44336'
        )}
      </View>

      {/* Dernière activité */}
      <View style={styles.derniereActiviteContainer}>
        <Ionicons name="time-outline" size={14} color="#666" />
        {renderDerniereActivite(item.derniereActivite)}
      </View>

      {/* Indicateur de flèche */}
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Supervision Collecteurs</Text>
      <Text style={styles.subtitle}>
        {getCollecteursFiltres().length} collecteur{getCollecteursFiltres().length > 1 ? 's' : ''}
        {filtreStatut !== 'TOUS' && ` - ${filtreStatut}`}
      </Text>
      
      {/* Boutons de filtre et tri */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleFiltrePress}>
          <Ionicons name="filter-outline" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Filtrer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleTriPress}>
          <Ionicons name="swap-vertical-outline" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Trier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Aucun collecteur</Text>
      <Text style={styles.emptyMessage}>
        {filtreStatut === 'TOUS' 
          ? 'Aucun collecteur trouvé dans votre agence.'
          : `Aucun collecteur avec le statut "${filtreStatut}".`
        }
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => chargerCollecteurs()}>
        <Text style={styles.retryButtonText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Chargement des collecteurs...</Text>
    </View>
  );

  // =====================================
  // RENDU PRINCIPAL
  // =====================================

  if (loading && collecteurs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderLoading()}
      </SafeAreaView>
    );
  }

  const collecteursFiltres = getCollecteursFiltres();

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête avec statistiques */}
      {renderHeader()}
      
      {/* Liste des collecteurs */}
      {collecteursFiltres.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={collecteursFiltres}
          renderItem={renderCollecteurItem}
          keyExtractor={(item) => `collecteur-${item.collecteurId}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              title="Actualisation..."
            />
          }
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  
  // Boutons d'action
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  actionButtonText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
  },
  
  // Liste
  listContainer: {
    padding: 16,
  },
  
  // Carte collecteur
  collecteurCard: {
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
  collecteurCardAttention: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  
  // En-tête collecteur
  collecteurHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  collecteurInfo: {
    flex: 1,
    marginRight: 12,
  },
  collecteurNom: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  agenceNom: {
    fontSize: 14,
    color: '#6c757d',
  },
  
  // Badge de statut
  statutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statutIcon: {
    fontSize: 12,
  },
  statutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  
  // Métriques
  metriquesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metrique: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metriqueLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  metriqueValeur: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Dernière activité
  derniereActiviteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  derniereActiviteText: {
    fontSize: 12,
    color: '#6c757d',
  },
  
  // Chevron
  chevronContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  
  // États vides et de chargement
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
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  
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

export default AdminCollecteurSupervisionScreen;