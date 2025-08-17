// src/screens/Admin/RemunerationProcessScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import CollecteurSelector from '../../components/CollecteurSelector/CollecteurSelector';
import StatsCard from '../../components/StatsCard/StatsCard';
import DataTable from '../../components/DataTable/DataTable';

import { useRemuneration } from '../../hooks/useRemuneration';
import { useCollecteurs } from '../../hooks/useCollecteurs';
import colors from '../../theme/colors';
import { formatters } from '../../utils/formatters';

/**
 * 🔥 NOUVEAU: Écran de processus de rémunération basé sur les commissions non rémunérées
 * Plus de sélection de période - on travaille uniquement sur les calculs existants
 */
export default function RemunerationProcessScreen({ navigation }) {
  // États de base  
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Hook de rémunération
  const {
    loading,
    error,
    commissionsNonRemunerees,
    historiqueRemunerations,
    rubriques,
    selectedCommissions,
    loadAllData,
    toggleCommissionSelection,
    selectAllCommissions,
    clearCommissionSelection,
    processRemuneration,
    calculateTotalRemuneration,
    clearError
  } = useRemuneration();

  const { collecteurs, loading: collecteursLoading } = useCollecteurs();

  // 🔥 NOUVEAU: Chargement des données quand un collecteur est sélectionné
  useEffect(() => {
    if (selectedCollecteur) {
      loadCollecteurData();
    }
  }, [selectedCollecteur]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error]);

  const loadCollecteurData = async () => {
    if (!selectedCollecteur) return;

    try {
      const result = await loadAllData(selectedCollecteur.id);
      
      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible de charger les données du collecteur');
      }
    } catch (error) {
      console.error('Erreur chargement données collecteur:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du collecteur');
    }
  };

  const handleRefresh = async () => {
    if (!selectedCollecteur) return;
    
    setRefreshing(true);
    await loadCollecteurData();
    setRefreshing(false);
  };

  // 🔥 NOUVEAU: Helper pour les confirmations cross-platform
  const showAlert = (title, message, buttons = []) => {
    if (Platform.OS === 'web') {
      // Pour le web, utiliser window.confirm/alert
      if (buttons.length === 2) {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result && buttons[1].onPress) {
          buttons[1].onPress();
        } else if (!result && buttons[0].onPress) {
          buttons[0].onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        if (buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  // 🔥 NOUVEAU: Gestion de la rémunération avec confirmation
  const handleProcessRemuneration = async () => {
    if (!selectedCollecteur) {
      showAlert('Erreur', 'Veuillez sélectionner un collecteur', [{ text: 'OK' }]);
      return;
    }

    if (selectedCommissions.length === 0) {
      showAlert('Erreur', 'Veuillez sélectionner au moins une commission à rémunérer', [{ text: 'OK' }]);
      return;
    }

    const totalCalculation = calculateTotalRemuneration();
    
    // 🔥 CONFIRMATION OBLIGATOIRE
    showAlert(
      'Confirmer la rémunération',
      `Voulez-vous vraiment procéder à la rémunération ?\n\n` +
      `Collecteur: ${selectedCollecteur.nom}\n` +
      `Commissions sélectionnées: ${selectedCommissions.length}\n` +
      `Montant total: ${formatters.formatMoney(totalCalculation.montantFinalRemuneration)}\n\n` +
      `⚠️ Cette action est irréversible !`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            console.log('🚀 Début processus rémunération...');
            const result = await processRemuneration(
              selectedCollecteur.id,
              selectedCommissions,
              rubriques.filter(r => r.active)
            );

            if (result.success) {
              const remunerationData = result.data;
              const successMessage = 
                `Rémunération effectuée avec succès !\\n\\n` +
                `Détails de l'opération :\\n` +
                `• Total rémunération: ${remunerationData?.totalRubriqueVi ? formatters.formatMoney(remunerationData.totalRubriqueVi) : 'N/A'}\\n` +
                `• Montant EMF: ${remunerationData?.montantEMF ? formatters.formatMoney(remunerationData.montantEMF) : 'N/A'}\\n` +
                `• Commissions traitées: ${selectedCommissions.length}\\n\\n` +
                `L'historique a été mis à jour et les commissions marquées comme rémunérées.`;
              
              showAlert('Succès', successMessage, [
                { text: 'OK' }
              ]);
              
              // Réinitialiser la sélection
              clearCommissionSelection();
              
              console.log('🎉 Rémunération terminée avec succès:', remunerationData);
            } else {
              showAlert('Erreur', result.error || 'Erreur lors de la rémunération', [
                { text: 'OK' }
              ]);
            }
          }
        }
      ]
    );
  };

  // Préparation des données pour les tableaux
  const prepareCommissionsTableData = () => {
    if (!commissionsNonRemunerees || commissionsNonRemunerees.length === 0) {
      return [];
    }

    return commissionsNonRemunerees.map(commission => ({
      id: commission.id,
      periode: `${commission.dateDebut} → ${commission.dateFin}`,
      dateCalcul: formatters.formatDate(commission.dateCalcul),
      montantCommission: formatters.formatMoney(commission.montantCommissionTotal || 0),
      montantTVA: formatters.formatMoney(commission.montantTvaTotal || 0),
      nombreClients: commission.nombreClients || 0,
      selected: selectedCommissions.includes(commission.id)
    }));
  };

  const prepareHistoriqueTableData = () => {
    if (!historiqueRemunerations || historiqueRemunerations.length === 0) {
      return [];
    }

    return historiqueRemunerations.map(historique => ({
      id: historique.id,
      periode: historique.periode || '-',
      dateRemuneration: formatters.formatDate(historique.dateRemuneration),
      montantS: formatters.formatMoney(historique.montantSInitial || 0),
      totalRubriques: formatters.formatMoney(historique.totalRubriquesVi || 0),
      montantTotal: formatters.formatMoney((historique.montantSInitial || 0) + (historique.totalRubriquesVi || 0)),
      status: historique.effectuePar ? 'COMPLETED' : 'UNKNOWN'
    }));
  };

  const commissionsColumns = [
    { field: 'periode', title: 'Période', width: '25%' },
    { field: 'dateCalcul', title: 'Date Calcul', width: '15%' },
    { field: 'montantCommission', title: 'Commission S', width: '15%' },
    { field: 'montantTVA', title: 'TVA', width: '12%' },
    { field: 'nombreClients', title: 'Clients', width: '10%' },
    { field: 'selected', title: 'Sélection', width: '13%' }
  ];

  const historiqueColumns = [
    { field: 'periode', title: 'Période', width: '25%' },
    { field: 'dateRemuneration', title: 'Date Rémunération', width: '20%' },
    { field: 'montantS', title: 'Montant S', width: '15%' },
    { field: 'totalRubriques', title: 'Rubriques', width: '15%' },
    { field: 'montantTotal', title: 'Total', width: '15%' },
    { field: 'status', title: 'Statut', width: '10%' }
  ];

  // Calculs pour les statistiques
  const getStats = () => {
    const totalCommissions = commissionsNonRemunerees.length;
    const selectedCount = selectedCommissions.length;
    const totalCalculation = calculateTotalRemuneration();
    
    console.log('📊 Stats - Total commissions:', totalCommissions);
    console.log('📊 Stats - Selected count:', selectedCount);
    console.log('📊 Stats - Selected commissions:', selectedCommissions);
    
    return {
      totalCommissions,
      selectedCount,
      totalMontant: totalCalculation.montantFinalRemuneration,
      totalRubriques: rubriques.filter(r => r.active).length
    };
  };

  const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Processus Rémunération</Text>
          <View style={styles.headerRight}>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>V2</Text>
            </View>
          </View>
        </View>

        {/* Sélection Collecteur */}
        <Card style={styles.selectionCard}>
          <Text style={styles.sectionTitle}>1. Sélection Collecteur</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Collecteur</Text>
            <CollecteurSelector
              collecteurs={collecteurs}
              selectedCollecteur={selectedCollecteur}
              onSelectCollecteur={setSelectedCollecteur}
              loading={collecteursLoading}
            />
          </View>

          {selectedCollecteur && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                Collecteur sélectionné : {selectedCollecteur.prenom} {selectedCollecteur.nom}
              </Text>
            </View>
          )}
        </Card>

        {/* Statistiques */}
        {selectedCollecteur && (
          <View style={styles.statsRow}>
            <StatsCard
              title="Commissions"
              value={stats.totalCommissions.toString()}
              icon="list"
              color={colors.info}
              style={styles.statCard}
            />
            <StatsCard
              title="Sélectionnées"
              value={stats.selectedCount.toString()}
              icon="checkmark-circle"
              color={colors.success}
              style={styles.statCard}
            />
            <StatsCard
              title="Montant Total"
              value={formatters.formatMoney(stats.totalMontant)}
              icon="cash"
              color={colors.warning}
              style={styles.statCard}
            />
            <StatsCard
              title="Rubriques"
              value={stats.totalRubriques.toString()}
              icon="document-text"
              color={colors.primary}
              style={styles.statCard}
            />
          </View>
        )}

        {/* Commissions Non Rémunérées */}
        {selectedCollecteur && (
          <Card style={styles.commissionsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>
                2. Commissions Non Rémunérées ({commissionsNonRemunerees.length})
              </Text>
              <View style={styles.selectionActions}>
                <Button
                  title="Tout sélectionner"
                  onPress={selectAllCommissions}
                  variant="secondary"
                  size="small"
                  style={styles.selectionButton}
                />
                <Button
                  title="Tout désélectionner"
                  onPress={clearCommissionSelection}
                  variant="secondary"
                  size="small"
                  style={styles.selectionButton}
                />
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Chargement des commissions...</Text>
              </View>
            ) : commissionsNonRemunerees.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>
                  Aucune commission non rémunérée trouvée
                </Text>
                <Text style={styles.emptySubtext}>
                  Toutes les commissions de ce collecteur ont déjà été rémunérées
                </Text>
              </View>
            ) : (
              <DataTable
                data={prepareCommissionsTableData()}
                columns={commissionsColumns}
                onRowPress={(row) => {
                  console.log('🔗 Row pressed:', row);
                  console.log('🔗 Row ID:', row.id);
                  console.log('🔗 Selected commissions before:', selectedCommissions);
                  toggleCommissionSelection(row.id);
                }}
                highlightSelected={true}
                selectedRows={selectedCommissions}
                style={styles.dataTable}
              />
            )}
          </Card>
        )}

        {/* Rubriques Applicables */}
        {selectedCollecteur && rubriques.length > 0 && (
          <Card style={styles.rubriquesCard}>
            <Text style={styles.sectionTitle}>
              3. Rubriques de Rémunération ({rubriques.filter(r => r.active).length} actives)
            </Text>
            
            <View style={styles.rubriquesContainer}>
              {rubriques.filter(r => r.active).map(rubrique => (
                <View key={rubrique.id} style={styles.rubriqueItem}>
                  <View style={styles.rubriqueInfo}>
                    <Text style={styles.rubriqueName}>{rubrique.nom}</Text>
                    <Text style={styles.rubriqueType}>
                      {rubrique.type === 'CONSTANT' ? 'Montant Fixe' : 'Pourcentage'}
                    </Text>
                  </View>
                  <Text style={styles.rubriqueValue}>
                    {rubrique.type === 'CONSTANT' 
                      ? formatters.formatMoney(rubrique.valeur)
                      : `${rubrique.valeur}%`
                    }
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Actions de Rémunération */}
        {selectedCollecteur && (
          <Card style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>4. Lancement de la Rémunération</Text>
            
            {selectedCommissions.length > 0 ? (
              <>
                <View style={styles.calculationSummary}>
                  <Text style={styles.calculationTitle}>Résumé du calcul :</Text>
                  {(() => {
                    const calc = calculateTotalRemuneration();
                    return (
                      <View style={styles.calculationDetails}>
                        <View style={styles.calculationRow}>
                          <Text style={styles.calculationLabel}>Montant S (Commissions) :</Text>
                          <Text style={styles.calculationValue}>{formatters.formatMoney(calc.totalCommissions)}</Text>
                        </View>
                        <View style={styles.calculationRow}>
                          <Text style={styles.calculationLabel}>Total Rubriques :</Text>
                          <Text style={styles.calculationValue}>{formatters.formatMoney(calc.totalRubriques)}</Text>
                        </View>
                        <View style={[styles.calculationRow, styles.calculationTotal]}>
                          <Text style={styles.calculationLabelTotal}>TOTAL RÉMUNÉRATION :</Text>
                          <Text style={styles.calculationValueTotal}>{formatters.formatMoney(calc.montantFinalRemuneration)}</Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                <Button
                  title="🚀 Lancer la Rémunération"
                  onPress={() => {
                    console.log('🔥 Bouton Rémunération cliqué !');
                    handleProcessRemuneration();
                  }}
                  loading={loading}
                  style={[styles.remunerationButton, styles.remunerationButtonVisible]}
                  variant="filled"
                  fullWidth={true}
                />
              </>
            ) : (
              <View style={styles.noSelectionContainer}>
                <Icon name="info" size={24} color={colors.warning} />
                <Text style={styles.noSelectionText}>
                  Sélectionnez au moins une commission non rémunérée pour lancer la rémunération
                </Text>
                <Button
                  title="Rémunération (sélection requise)"
                  onPress={() => showAlert('Information', 'Veuillez d\'abord sélectionner des commissions à rémunérer', [{ text: 'OK' }])}
                  disabled={true}
                  style={[styles.remunerationButton, styles.remunerationButtonDisabled]}
                  variant="outlined"
                  fullWidth={true}
                />
              </View>
            )}
          </Card>
        )}

        {/* Historique des Rémunérations */}
        {selectedCollecteur && (
          <Card style={styles.historiqueCard}>
            <Text style={styles.sectionTitle}>
              Historique des Rémunérations ({historiqueRemunerations.length})
            </Text>

            {historiqueRemunerations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="history" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>
                  Aucun historique de rémunération
                </Text>
              </View>
            ) : (
              <DataTable
                data={prepareHistoriqueTableData()}
                columns={historiqueColumns}
                style={styles.dataTable}
              />
            )}
          </Card>
        )}

        {/* Message si aucun collecteur sélectionné */}
        {!selectedCollecteur && (
          <Card style={styles.placeholderCard}>
            <Icon name="person-pin" size={64} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>
              Sélectionnez un collecteur pour commencer le processus de rémunération
            </Text>
            <Text style={styles.placeholderSubtext}>
              Le processus se base uniquement sur les commissions calculées non rémunérées
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1,
    padding: Platform.OS === 'web' ? 20 : 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4
  },
  backButton: {
    padding: 8,
    marginRight: 12
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  versionBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  versionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  selectionCard: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8
  },
  summaryBox: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  statsRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: Platform.OS === 'web' ? 16 : 8
  },
  statCard: {
    flex: Platform.OS === 'web' ? 0.24 : 1
  },
  commissionsCard: {
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    marginBottom: 16
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic'
  },
  dataTable: {
    marginTop: 8
  },
  rubriquesCard: {
    marginBottom: 16
  },
  rubriquesContainer: {
    gap: 8
  },
  rubriqueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.success
  },
  rubriqueInfo: {
    flex: 1
  },
  rubriqueName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  rubriqueType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  rubriqueValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success
  },
  actionsCard: {
    marginBottom: 16
  },
  calculationSummary: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12
  },
  calculationDetails: {
    gap: 8
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  calculationTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8
  },
  calculationLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  calculationLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text
  },
  calculationValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary
  },
  remunerationButton: {
    marginTop: 20,
    marginBottom: 10
  },
  remunerationButtonVisible: {
    backgroundColor: '#28a745', // Vert vif
    borderColor: '#28a745',
    borderWidth: 2,
    shadowColor: '#28a745',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    minHeight: 50,
    // Force l'affichage
    display: 'flex',
    opacity: 1,
    visibility: 'visible'
  },
  remunerationButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  remunerationButtonDisabled: {
    backgroundColor: colors.lightGray,
    borderColor: colors.lightGray
  },
  noSelectionContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
    borderStyle: 'dashed'
  },
  noSelectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 20
  },
  historiqueCard: {
    marginBottom: 16
  },
  placeholderCard: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24
  },
  placeholderSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 20
  }
});