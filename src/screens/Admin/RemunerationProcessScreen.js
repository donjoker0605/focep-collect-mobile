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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import DateSelector from '../../components/DateSelector/DateSelector';
import CollecteurSelector from '../../components/CollecteurSelector/CollecteurSelector';
import StatsCard from '../../components/StatsCard/StatsCard';
import DataTable from '../../components/DataTable/DataTable';

import { useCommissionV2 } from '../../hooks/useCommissionV2';
import { useCollecteurs } from '../../hooks/useCollecteurs';
import colors from '../../theme/colors';
import { formatters } from '../../utils/formatters';

/**
 * Écran de processus de rémunération avec vérifications et historique
 */
export default function RemunerationProcessScreen({ navigation }) {
  // États de base
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(1); // 1: Sélection, 2: Vérification, 3: Traitement
  
  // États des données
  const [commissionData, setCommissionData] = useState(null);
  const [rubriqueData, setRubriqueData] = useState([]);
  const [remunerationHistorique, setRemunerationHistorique] = useState([]);
  const [periodeConflictuelle, setPeriodeConflictuelle] = useState(null);
  
  // États UI
  const [loadingCommission, setLoadingCommission] = useState(false);
  const [loadingRubriques, setLoadingRubriques] = useState(false);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  const {
    loading,
    error,
    calculateCommissions,
    loadRubriques,
    processusComplet,
    formatPeriode,
    clearError
  } = useCommissionV2();

  const { collecteurs, loading: collecteursLoading } = useCollecteurs();

  // Helper pour formater les dates
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Chargement des données quand un collecteur est sélectionné
  useEffect(() => {
    if (selectedCollecteur) {
      loadCollecteurData();
    } else {
      resetData();
    }
  }, [selectedCollecteur, dateDebut, dateFin]);

  const resetData = () => {
    setCommissionData(null);
    setRubriqueData([]);
    setRemunerationHistorique([]);
    setPeriodeConflictuelle(null);
    setCurrentStep(1);
  };

  const loadCollecteurData = async () => {
    if (!selectedCollecteur) return;

    try {
      // 1. Charger l'historique des rémunérations
      await loadRemunerationHistorique();
      
      // 2. Vérifier les conflits de période
      checkPeriodeConflict();
      
      // 3. Charger les rubriques applicables
      await loadRubriquesApplicables();
      
    } catch (error) {
      console.error('Erreur chargement données collecteur:', error);
    }
  };

  const loadRemunerationHistorique = async () => {
    setLoadingHistorique(true);
    try {
      // TODO: Appel API pour récupérer l'historique des rémunérations
      // Pour l'instant, données simulées
      const historique = [
        {
          id: 1,
          periode: '2024-06-01 → 2024-06-30',
          dateRemuneration: '2024-07-01T10:00:00',
          montantS: 125000,
          totalRubriques: 45000,
          montantEMF: 80000,
          status: 'COMPLETED'
        },
        {
          id: 2,
          periode: '2024-05-01 → 2024-05-31',
          dateRemuneration: '2024-06-01T14:30:00',
          montantS: 98000,
          totalRubriques: 32000,
          montantEMF: 66000,
          status: 'COMPLETED'
        }
      ];
      
      setRemunerationHistorique(historique);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoadingHistorique(false);
    }
  };

  const checkPeriodeConflict = () => {
    const periodeActuelle = formatPeriode(dateDebut, dateFin);
    const conflit = remunerationHistorique.find(rem => 
      rem.periode === periodeActuelle
    );
    
    setPeriodeConflictuelle(conflit);
  };

  const loadRubriquesApplicables = async () => {
    setLoadingRubriques(true);
    try {
      const result = await loadRubriques(selectedCollecteur.id);
      if (result && result.success) {
        setRubriqueData(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement rubriques:', error);
    } finally {
      setLoadingRubriques(false);
    }
  };

  const handleVerifierCommissions = async () => {
    if (!selectedCollecteur) return;
    
    setLoadingCommission(true);
    setCurrentStep(2);
    
    try {
      const result = await calculateCommissions(
        selectedCollecteur.id,
        formatDateForAPI(dateDebut),
        formatDateForAPI(dateFin)
      );
      
      if (result.success) {
        setCommissionData(result);
        Alert.alert(
          'Commissions Calculées',
          `Montant S: ${formatters.formatMoney(result.montantSCollecteur || 0)}`,
          [{ text: 'Continuer' }]
        );
      } else {
        setCurrentStep(1);
        Alert.alert('Erreur', result.error || 'Erreur calcul commission');
      }
    } catch (error) {
      setCurrentStep(1);
      Alert.alert('Erreur', 'Impossible de calculer les commissions');
    } finally {
      setLoadingCommission(false);
    }
  };

  const handleLancerRemuneration = async () => {
    if (periodeConflictuelle) {
      Alert.alert(
        'Période Déjà Rémunérée',
        `Ce collecteur a déjà été rémunéré pour la période ${periodeConflictuelle.periode} le ${formatters.formatDateTime(periodeConflictuelle.dateRemuneration)}.\n\nMontant précédent: ${formatters.formatMoney(periodeConflictuelle.montantEMF)}`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Continuer Quand Même',
            style: 'destructive',
            onPress: () => executeRemuneration()
          }
        ]
      );
      return;
    }
    
    executeRemuneration();
  };

  const executeRemuneration = async () => {
    Alert.alert(
      'Confirmer la Rémunération',
      `Lancer la rémunération pour ${selectedCollecteur.nomComplet} ?\n\nCommission S: ${formatters.formatMoney(commissionData?.montantSCollecteur || 0)}\nRubriques: ${rubriqueData.length} actives`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setCurrentStep(3);
            try {
              const result = await processusComplet(
                selectedCollecteur.id,
                formatDateForAPI(dateDebut),
                formatDateForAPI(dateFin)
              );
              
              if (result.success) {
                Alert.alert(
                  'Rémunération Terminée',
                  'Le processus de rémunération a été exécuté avec succès.',
                  [
                    {
                      text: 'Voir les Résultats',
                      onPress: () => navigation.navigate('CommissionProcessusCompletScreen', {
                        collecteur: selectedCollecteur,
                        result
                      })
                    }
                  ]
                );
                // Recharger l'historique
                await loadRemunerationHistorique();
              } else {
                setCurrentStep(2);
                Alert.alert('Erreur', result.error || 'Erreur lors de la rémunération');
              }
            } catch (error) {
              setCurrentStep(2);
              Alert.alert('Erreur', 'Impossible de traiter la rémunération');
            }
          }
        }
      ]
    );
  };

  const prepareHistoriqueTableData = () => {
    return remunerationHistorique.map((rem, index) => ({
      id: rem.id || index,
      periode: rem.periode,
      date: formatters.formatDate(rem.dateRemuneration),
      montantS: formatters.formatMoney(rem.montantS || 0),
      rubriques: formatters.formatMoney(rem.totalRubriques || 0),
      emf: formatters.formatMoney(rem.montantEMF || 0),
      status: rem.status === 'COMPLETED' ? '✅ Terminé' : '⏳ En cours'
    }));
  };

  const historiqueColumns = [
    { field: 'periode', title: 'Période', flex: 1.5 },
    { field: 'date', title: 'Date', flex: 1 },
    { field: 'montantS', title: 'Commission S', flex: 1 },
    { field: 'emf', title: 'EMF Payé', flex: 1 },
    { field: 'status', title: 'Statut', flex: 0.8 }
  ];

  const prepareRubriqueTableData = () => {
    return rubriqueData.filter(r => r.active).map(rubrique => ({
      id: rubrique.id,
      nom: rubrique.nom,
      type: rubrique.type === 'CONSTANT' ? 'Fixe' : 'Pourcentage',
      valeur: rubrique.type === 'CONSTANT' 
        ? formatters.formatMoney(rubrique.valeur) 
        : `${rubrique.valeur}%`,
      dateApplication: formatters.formatDate(rubrique.dateApplication)
    }));
  };

  const rubriqueColumns = [
    { field: 'nom', title: 'Rubrique', flex: 1.5 },
    { field: 'type', title: 'Type', flex: 0.8 },
    { field: 'valeur', title: 'Valeur', flex: 1 },
    { field: 'dateApplication', title: 'Depuis le', flex: 1 }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Processus Rémunération</Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Étape {currentStep}/3</Text>
          </View>
        </View>

        {/* Sélection Collecteur et Période */}
        <Card style={styles.selectionCard}>
          <Text style={styles.sectionTitle}>1. Sélection Collecteur & Période</Text>
          
          {/* Collecteur */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Collecteur</Text>
            <CollecteurSelector
              collecteurs={collecteurs}
              selectedCollecteur={selectedCollecteur}
              onSelectCollecteur={setSelectedCollecteur}
              loading={collecteursLoading}
            />
          </View>

          {/* Période */}
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.label}>Date début</Text>
              <DateSelector
                date={dateDebut}
                onDateChange={setDateDebut}
                maximumDate={new Date()}
              />
            </View>
            <View style={styles.dateInput}>
              <Text style={styles.label}>Date fin</Text>
              <DateSelector
                date={dateFin}
                onDateChange={setDateFin}
                maximumDate={new Date()}
              />
            </View>
          </View>

          {selectedCollecteur && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                Collecteur: {selectedCollecteur.nomComplet}
                {'\n'}Période: {formatPeriode(dateDebut, dateFin)}
              </Text>
            </View>
          )}
        </Card>

        {/* Alerte Conflit de Période */}
        {periodeConflictuelle && (
          <Card style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Icon name="warning" size={24} color={colors.warning} />
              <Text style={styles.warningTitle}>Période Déjà Rémunérée</Text>
            </View>
            <Text style={styles.warningText}>
              Ce collecteur a déjà été rémunéré pour cette période le {formatters.formatDateTime(periodeConflictuelle.dateRemuneration)}.
              {'\n'}Montant précédent: {formatters.formatMoney(periodeConflictuelle.montantEMF)}
            </Text>
          </Card>
        )}

        {/* Historique des Rémunérations */}
        {selectedCollecteur && remunerationHistorique.length > 0 && (
          <Card style={styles.historiqueCard}>
            <Text style={styles.sectionTitle}>Historique des Rémunérations</Text>
            {loadingHistorique ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <DataTable
                data={prepareHistoriqueTableData()}
                columns={historiqueColumns}
                style={styles.dataTable}
                emptyTitle="Aucune rémunération"
                emptyMessage="Aucune rémunération précédente trouvée."
              />
            )}
          </Card>
        )}

        {/* Vérification Commission */}
        {selectedCollecteur && currentStep >= 1 && (
          <Card style={styles.verificationCard}>
            <Text style={styles.sectionTitle}>2. Vérification Commission</Text>
            
            {!commissionData ? (
              <Button
                title="Calculer les Commissions"
                onPress={handleVerifierCommissions}
                loading={loadingCommission}
                style={styles.actionButton}
                icon="calculate"
              />
            ) : (
              <View style={styles.commissionSummary}>
                <View style={styles.summaryRow}>
                  <StatsCard
                    title="Commission S"
                    value={formatters.formatMoney(commissionData.montantSCollecteur || 0)}
                    icon="cash"
                    color={colors.success}
                    style={styles.statCard}
                  />
                  <StatsCard
                    title="TVA"
                    value={formatters.formatMoney(commissionData.totalTVA || 0)}
                    icon="receipt"
                    color={colors.warning}
                    style={styles.statCard}
                  />
                </View>
                <Text style={styles.infoText}>
                  {commissionData.commissionsClients?.length || 0} clients traités
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Rubriques Applicables */}
        {selectedCollecteur && rubriqueData.length > 0 && (
          <Card style={styles.rubriqueCard}>
            <View style={styles.rubriqueHeader}>
              <Text style={styles.sectionTitle}>Rubriques Applicables</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('RubriqueRemunerationScreen')}
                style={styles.manageButton}
              >
                <Icon name="settings" size={20} color={colors.primary} />
                <Text style={styles.manageText}>Gérer</Text>
              </TouchableOpacity>
            </View>
            
            {loadingRubriques ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <DataTable
                data={prepareRubriqueTableData()}
                columns={rubriqueColumns}
                style={styles.dataTable}
                emptyTitle="Aucune rubrique"
                emptyMessage="Aucune rubrique active configurée pour ce collecteur."
              />
            )}
          </Card>
        )}

        {/* Actions Finales */}
        {selectedCollecteur && commissionData && currentStep >= 2 && (
          <Card style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>3. Lancement Rémunération</Text>
            
            <View style={styles.finalSummary}>
              <Text style={styles.finalText}>
                Prêt à rémunérer {selectedCollecteur.nomComplet} pour la période {formatPeriode(dateDebut, dateFin)}
              </Text>
              <Text style={styles.finalDetails}>
                • Commission S: {formatters.formatMoney(commissionData.montantSCollecteur || 0)}
                {'\n'}• Rubriques actives: {rubriqueData.filter(r => r.active).length}
                {'\n'}• TVA: {formatters.formatMoney(commissionData.totalTVA || 0)}
              </Text>
            </View>

            <Button
              title="Lancer la Rémunération"
              onPress={handleLancerRemuneration}
              loading={currentStep === 3}
              style={[
                styles.actionButton,
                periodeConflictuelle && styles.warningButton
              ]}
              icon="play-arrow"
              variant="primary"
            />
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
    padding: 16
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
  stepIndicator: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  stepText: {
    color: colors.primary,
    fontSize: 12,
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  dateInput: {
    flex: 0.48
  },
  summaryBox: {
    backgroundColor: colors.info + '20',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.info
  },
  summaryText: {
    color: colors.info,
    fontSize: 14,
    lineHeight: 18
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: colors.warning + '10',
    borderWidth: 1,
    borderColor: colors.warning + '30'
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.warning,
    marginLeft: 8
  },
  warningText: {
    color: colors.warning,
    fontSize: 14,
    lineHeight: 18
  },
  historiqueCard: {
    marginBottom: 16
  },
  verificationCard: {
    marginBottom: 16
  },
  commissionSummary: {
    marginTop: 8
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  statCard: {
    flex: 0.48
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  rubriqueCard: {
    marginBottom: 16
  },
  rubriqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 8
  },
  manageText: {
    marginLeft: 4,
    color: colors.primary,
    fontWeight: '500'
  },
  actionsCard: {
    marginBottom: 16
  },
  finalSummary: {
    backgroundColor: colors.success + '10',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  finalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 8
  },
  finalDetails: {
    fontSize: 14,
    color: colors.success,
    lineHeight: 18
  },
  actionButton: {
    marginTop: 8
  },
  warningButton: {
    backgroundColor: colors.warning
  },
  dataTable: {
    marginTop: 8
  }
});