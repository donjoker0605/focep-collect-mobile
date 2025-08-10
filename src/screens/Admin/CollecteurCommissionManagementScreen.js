// src/screens/Admin/CollecteurCommissionManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import businessRulesService from '../../services/businessRulesService';
import seniorityService from '../../services/seniorityService';
import adminCollecteurService from '../../services/adminCollecteurService';

/**
 * 🎯 ÉCRAN GESTION COMMISSION COLLECTEURS (ADMIN)
 * 
 * FONCTIONNALITÉS:
 * - Liste des collecteurs avec ancienneté
 * - Accès aux clients de chaque collecteur  
 * - Configuration paramètres commission
 * - Respect des règles métier (pas de suppression)
 */
const CollecteurCommissionManagementScreen = ({ navigation, route }) => {
  // États principaux
  const [collecteurs, setCollecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour les fonctionnalités avancées
  const [seniorityReport, setSeniorityReport] = useState(null);
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Charger les données en parallèle
      const [collecteursResponse, seniorityResponse] = await Promise.allSettled([
        adminCollecteurService.getCollecteurs(),
        seniorityService.getSeniorityReport()
      ]);

      // Traiter les collecteurs
      if (collecteursResponse.status === 'fulfilled' && collecteursResponse.value.success) {
        const collecteursData = Array.isArray(collecteursResponse.value.data) 
          ? collecteursResponse.value.data 
          : collecteursResponse.value.data?.content || [];
        
        // Enrichir avec données d'ancienneté
        const enrichedCollecteurs = await enrichCollecteursWithSeniority(collecteursData);
        setCollecteurs(enrichedCollecteurs);
      }

      // Traiter le rapport d'ancienneté
      if (seniorityResponse.status === 'fulfilled' && seniorityResponse.value.success) {
        setSeniorityReport(seniorityResponse.value.data);
      }

    } catch (err) {
      console.error('❌ Erreur chargement données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Enrichit les données des collecteurs avec leurs informations d'ancienneté
   */
  const enrichCollecteursWithSeniority = async (collecteursData) => {
    const enriched = await Promise.all(
      collecteursData.map(async (collecteur) => {
        try {
          const seniorityResponse = await seniorityService.getCollecteurSeniority(collecteur.id);
          
          if (seniorityResponse.success) {
            return {
              ...collecteur,
              seniority: seniorityResponse.data,
              seniorityInfo: seniorityService.getSeniorityDisplayInfo(seniorityResponse.data.niveauAnciennete)
            };
          }
        } catch (error) {
          console.warn(`⚠️ Ancienneté indisponible pour collecteur ${collecteur.id}`);
        }
        
        return {
          ...collecteur,
          seniority: null,
          seniorityInfo: seniorityService.getSeniorityDisplayInfo('NOUVEAU')
        };
      })
    );

    return enriched;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  // ================================
  // 🎯 ACTIONS COLLECTEUR
  // ================================

  const handleViewCollecteurClients = async (collecteur) => {
    try {
      console.log('👥 Navigation vers clients collecteur:', collecteur.id);
      
      navigation.navigate('CollecteurClientsScreen', {
        collecteurId: collecteur.id,
        collecteurName: collecteur.displayName || `${collecteur.prenom} ${collecteur.nom}`,
        canConfigureCommissions: true // Mode admin
      });

    } catch (error) {
      console.error('❌ Erreur navigation clients:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder aux clients de ce collecteur');
    }
  };

  const handleToggleCollecteurStatus = async (collecteur) => {
    const newStatus = !collecteur.active;
    const action = newStatus ? 'activer' : 'désactiver';
    
    Alert.alert(
      'Confirmation',
      `Voulez-vous ${action} le collecteur ${collecteur.prenom} ${collecteur.nom} ?\n\n⚠️ Cette action affectera l'accès à l'application et les calculs de commission.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const response = await businessRulesService.toggleCollecteurStatus(
                collecteur.id, 
                newStatus,
                `${action} par admin depuis l'app mobile`
              );
              
              if (response.success) {
                Alert.alert('Succès', `Collecteur ${action} avec succès`);
                loadData(false); // Recharger les données
                
                // Afficher les actions recommandées si désactivation
                if (!newStatus && response.nextActions) {
                  Alert.alert(
                    'Actions recommandées',
                    response.nextActions.join('\n• '),
                    [{ text: 'Compris' }]
                  );
                }
              } else {
                Alert.alert('Erreur', response.error || `Erreur lors de la ${action}ion`);
              }
            } catch (err) {
              console.error(`❌ Erreur ${action}ion:`, err);
              Alert.alert('Erreur', err.message || `Erreur lors de la ${action}ion`);
            }
          }
        }
      ]
    );
  };

  const handleViewSeniorityDetails = (collecteur) => {
    if (!collecteur.seniority) {
      Alert.alert('Info', 'Données d\'ancienneté non disponibles pour ce collecteur');
      return;
    }

    const seniority = collecteur.seniority;
    const info = collecteur.seniorityInfo;

    Alert.alert(
      `🏆 Ancienneté - ${collecteur.prenom} ${collecteur.nom}`,
      `📅 ${seniority.ancienneteSummary}\n` +
      `📈 Niveau: ${info.label}\n` +
      `💰 Coefficient: ${info.coefficient}\n` +
      `${info.description}\n\n` +
      `${seniority.eligibleForPromotion ? '🎉 Éligible pour promotion !' : '⏳ Prochaine promotion dans quelques mois'}`,
      [{ text: 'Fermer' }]
    );
  };

  // ================================
  // 📊 ACTIONS RAPPORT
  // ================================

  const handleViewSeniorityReport = () => {
    if (!seniorityReport) {
      Alert.alert('Info', 'Rapport d\'ancienneté non disponible');
      return;
    }

    navigation.navigate('SeniorityReportScreen', {
      reportData: seniorityReport
    });
  };

  const handleUpdateAllSeniority = async () => {
    Alert.alert(
      'Mise à jour ancienneté',
      'Recalculer l\'ancienneté de tous les collecteurs ?\n\nCette opération peut prendre quelques instants.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await seniorityService.updateAllCollecteursSeniority();
              
              if (response.success) {
                const result = response.data;
                Alert.alert(
                  'Mise à jour terminée',
                  `📊 ${result.totalCollecteurs} collecteurs traités\n` +
                  `🔄 ${result.collecteursUpdated} mis à jour\n` +
                  `🎉 ${result.promotions} promotions`,
                  [{ text: 'OK', onPress: () => loadData(false) }]
                );
              }
            } catch (error) {
              console.error('❌ Erreur mise à jour ancienneté:', error);
              Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // ================================
  // 🎨 COMPOSANTS DE RENDU
  // ================================

  const renderCollecteurItem = ({ item: collecteur }) => {
    const seniority = collecteur.seniority;
    const seniorityInfo = collecteur.seniorityInfo;

    return (
      <Card style={styles.collecteurCard}>
        {/* Header avec infos principales */}
        <View style={styles.collecteurHeader}>
          <View style={styles.collecteurInfo}>
            <Text style={styles.collecteurName}>
              {collecteur.prenom} {collecteur.nom}
            </Text>
            <Text style={styles.collecteurAgence}>
              📍 {collecteur.agence?.nom || 'Agence non définie'}
            </Text>
            <Text style={styles.collecteurEmail}>
              📧 {collecteur.adresseMail}
            </Text>
          </View>
          
          {/* Badge statut */}
          <View style={[
            styles.statusBadge,
            collecteur.active ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={styles.statusText}>
              {collecteur.active ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

        {/* Informations d'ancienneté */}
        {seniority && (
          <TouchableOpacity 
            style={styles.senioritySection}
            onPress={() => handleViewSeniorityDetails(collecteur)}
          >
            <View style={styles.seniorityInfo}>
              <View style={[styles.seniorityBadge, { backgroundColor: seniorityInfo.color }]}>
                <Ionicons name={seniorityInfo.icon} size={16} color="white" />
                <Text style={styles.seniorityLabel}>{seniorityInfo.label}</Text>
              </View>
              <Text style={styles.seniorityText}>
                📅 {seniority.ancienneteSummary} • 💰 {seniorityInfo.coefficient}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleViewCollecteurClients(collecteur)}
          >
            <Ionicons name="people-outline" size={18} color="white" />
            <Text style={styles.actionButtonText}>Clients</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, collecteur.active ? styles.warningButton : styles.successButton]}
            onPress={() => handleToggleCollecteurStatus(collecteur)}
          >
            <Ionicons 
              name={collecteur.active ? "close-circle-outline" : "checkmark-circle-outline"} 
              size={18} 
              color="white" 
            />
            <Text style={styles.actionButtonText}>
              {collecteur.active ? 'Désactiver' : 'Activer'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.sectionTitle}>Gestion Commission Collecteurs</Text>
      <Text style={styles.sectionSubtitle}>
        {collecteurs.length} collecteur{collecteurs.length !== 1 ? 's' : ''} • 
        {seniorityReport ? ` Ancienneté moyenne: ${seniorityReport.moyenneAncienneteMois?.toFixed(1)} mois` : ''}
      </Text>
      
      {/* Boutons d'action globaux */}
      <View style={styles.globalActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.infoButton]}
          onPress={handleViewSeniorityReport}
          disabled={!seniorityReport}
        >
          <Ionicons name="analytics-outline" size={18} color="white" />
          <Text style={styles.actionButtonText}>Rapport</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleUpdateAllSeniority}
        >
          <Ionicons name="refresh-outline" size={18} color="white" />
          <Text style={styles.actionButtonText}>MAJ Ancienneté</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ================================
  // 🖼️ RENDU PRINCIPAL
  // ================================

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Gestion Commissions" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des collecteurs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Gestion Commissions" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Gestion Commissions" 
        showBack 
        onBack={() => navigation.goBack()}
      />
      
      <FlatList
        data={collecteurs}
        renderItem={renderCollecteurItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>Aucun collecteur trouvé</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ================================
// 🎨 STYLES
// ================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Header section
  headerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
  },
  globalActions: {
    flexDirection: 'row',
    gap: 12,
  },

  // Collecteur card
  collecteurCard: {
    marginBottom: 16,
    padding: 16,
  },
  collecteurHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  collecteurInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  collecteurAgence: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  collecteurEmail: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  
  // Status badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Seniority section
  senioritySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  seniorityInfo: {
    flex: 1,
  },
  seniorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  seniorityLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  seniorityText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  successButton: {
    backgroundColor: theme.colors.success,
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  infoButton: {
    backgroundColor: '#6366F1',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

export default CollecteurCommissionManagementScreen;