// src/screens/Admin/CommissionProcessusCompletScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
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
 * Écran de processus complet : Commission + Rémunération
 * Interface unifiée pour le traitement complet selon la spéc FOCEP
 */
export default function CommissionProcessusCompletScreen({ navigation }) {
  // État local
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(1); // 1: Config, 2: Commission, 3: Rémunération
  const [showResults, setShowResults] = useState(false);

  // Hooks
  const {
    loading,
    error,
    commissionData,
    remunerationData,
    processusComplet,
    generateCommissionReport,
    generateRemunerationReport,
    getCommissionStats,
    formatPeriode,
    clearError,
    reset
  } = useCommissionV2();

  const { collecteurs, loading: collecteursLoading } = useCollecteurs();

  // Helper pour convertir Date en string API
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error]);

  /**
   * Lance le processus complet (commission + rémunération)
   */
  const handleStartProcessus = async () => {
    if (!selectedCollecteur) {
      Alert.alert('Erreur', 'Veuillez sélectionner un collecteur');
      return;
    }

    Alert.alert(
      'Confirmer le processus complet',
      `Lancer le calcul de commission et la rémunération pour ${selectedCollecteur.nom} ${selectedCollecteur.prenom} sur la période du ${formatPeriode(dateDebut, dateFin)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Lancer',
          style: 'default',
          onPress: async () => {
            setCurrentStep(2);
            const result = await processusComplet(
              selectedCollecteur.id, 
              formatDateForAPI(dateDebut), 
              formatDateForAPI(dateFin)
            );

            if (result.success) {
              setCurrentStep(3);
              setShowResults(true);
              Alert.alert('Succès', 'Processus complet terminé avec succès');
            } else {
              setCurrentStep(1);
              Alert.alert('Erreur', result.error || 'Échec du processus complet');
            }
          }
        }
      ]
    );
  };

  /**
   * Génère le rapport Excel complet
   */
  const handleGenerateReport = async (type = 'commission') => {
    if (!selectedCollecteur) return;

    const generateFunction = type === 'commission' 
      ? generateCommissionReport 
      : generateRemunerationReport;

    const result = await generateFunction(
      selectedCollecteur.id, 
      formatDateForAPI(dateDebut), 
      formatDateForAPI(dateFin)
    );

    if (result.success) {
      Alert.alert(
        'Rapport généré', 
        `Rapport ${type} généré avec succès`,
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Remet à zéro le processus
   */
  const handleReset = () => {
    Alert.alert(
      'Réinitialiser',
      'Êtes-vous sûr de vouloir recommencer le processus ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          onPress: () => {
            reset();
            setCurrentStep(1);
            setShowResults(false);
          }
        }
      ]
    );
  };

  const stats = getCommissionStats();

  // Configuration du tableau des clients
  const prepareTableData = () => {
    if (!commissionData || !commissionData.clients) {
      return [];
    }

    return commissionData.clients.map(client => ({
      nom: client.nom,
      epargne: formatters.formatMoney(client.montantEpargne),
      commission: formatters.formatMoney(client.commission),
      tva: formatters.formatMoney(client.tva),
      nouveauSolde: formatters.formatMoney(client.nouveauSolde),
    }));
  };

  const tableColumns = [
    { key: 'nom', title: 'Client', width: '25%' },
    { key: 'epargne', title: 'Épargne', width: '20%' },
    { key: 'commission', title: 'Commission', width: '20%' },
    { key: 'tva', title: 'TVA', width: '15%' },
    { key: 'nouveauSolde', title: 'Solde', width: '20%' },
  ];

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, currentStep >= 1 && styles.stepActive]}>
        <Text style={[styles.stepText, currentStep >= 1 && styles.stepTextActive]}>1</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
      <View style={[styles.step, currentStep >= 2 && styles.stepActive]}>
        <Text style={[styles.stepText, currentStep >= 2 && styles.stepTextActive]}>2</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
      <View style={[styles.step, currentStep >= 3 && styles.stepActive]}>
        <Text style={[styles.stepText, currentStep >= 3 && styles.stepTextActive]}>3</Text>
      </View>
    </View>
  );

  const renderStepLabels = () => (
    <View style={styles.stepLabels}>
      <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>Configuration</Text>
      <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>Commission</Text>
      <Text style={[styles.stepLabel, currentStep >= 3 && styles.stepLabelActive]}>Rémunération</Text>
    </View>
  );

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
          <Text style={styles.title}>Processus Complet</Text>
          {showResults && (
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Icon name="refresh" size={24} color={colors.warning} />
            </TouchableOpacity>
          )}
        </View>

        {/* Indicateur d'étapes */}
        <Card style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progression</Text>
          {renderStepIndicator()}
          {renderStepLabels()}
        </Card>

        {/* Configuration (Étape 1) */}
        {currentStep === 1 && (
          <Card style={styles.configCard}>
            <Text style={styles.sectionTitle}>Configuration du Processus</Text>
            
            {/* Sélection collecteur */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Collecteur</Text>
              <CollecteurSelector
                collecteurs={collecteurs}
                selectedCollecteur={selectedCollecteur}
                onSelectCollecteur={setSelectedCollecteur}
                loading={collecteursLoading}
              />
            </View>

            {/* Sélection période */}
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
                <Icon name="info" size={20} color={colors.info} />
                <Text style={styles.summaryText}>
                  Traitement complet pour {selectedCollecteur.nom} {selectedCollecteur.prenom}
                  {'\n'}Période : {formatPeriode(dateDebut, dateFin)}
                </Text>
              </View>
            )}

            <Button
              title="Lancer le Processus Complet"
              onPress={handleStartProcessus}
              loading={loading}
              disabled={!selectedCollecteur}
              style={styles.primaryButton}
              icon="play-arrow"
            />
          </Card>
        )}

        {/* Résultats Commission (Étape 2) */}
        {currentStep >= 2 && commissionData && (
          <Card style={styles.resultsCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Résultats Commission</Text>
              <TouchableOpacity
                style={styles.excelButton}
                onPress={() => handleGenerateReport('commission')}
              >
                <Icon name="file-download" size={20} color={colors.primary} />
                <Text style={styles.excelText}>Excel</Text>
              </TouchableOpacity>
            </View>

            {/* Statistiques commission */}
            {stats && (
              <View style={styles.statsRow}>
                <StatsCard
                  title="Clients"
                  value={stats.totalClients?.toString() || '0'}
                  icon="people"
                  color={colors.info}
                  style={styles.statCard}
                />
                <StatsCard
                  title="Commission S"
                  value={formatters.formatMoney(stats.totalCommissions || 0)}
                  icon="cash"
                  color={colors.success}
                  style={styles.statCard}
                />
                <StatsCard
                  title="TVA"
                  value={formatters.formatMoney(stats.totalTaxes || 0)}
                  icon="receipt"
                  color={colors.warning}
                  style={styles.statCard}
                />
              </View>
            )}

            <DataTable
              data={prepareTableData()}
              columns={tableColumns}
              style={styles.dataTable}
            />
          </Card>
        )}

        {/* Résultats Rémunération (Étape 3) */}
        {currentStep >= 3 && remunerationData && (
          <Card style={styles.resultsCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Résultats Rémunération</Text>
              <TouchableOpacity
                style={styles.excelButton}
                onPress={() => handleGenerateReport('remuneration')}
              >
                <Icon name="file-download" size={20} color={colors.primary} />
                <Text style={styles.excelText}>Excel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.remunerationSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>S Initial</Text>
                <Text style={styles.summaryValue}>
                  {formatters.formatMoney(remunerationData.montantSInitial || 0)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Vi (Rubriques)</Text>
                <Text style={styles.summaryValue}>
                  {formatters.formatMoney(remunerationData.totalRubriquesVi || 0)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Surplus EMF</Text>
                <Text style={styles.summaryValue}>
                  {formatters.formatMoney(remunerationData.montantEMF || 0)}
                </Text>
              </View>
            </View>

            <View style={styles.processCompleteBox}>
              <Icon name="checkmark-circle-outline" size={32} color={colors.success} />
              <Text style={styles.processCompleteText}>
                Processus complet terminé avec succès !
              </Text>
              <Text style={styles.processCompleteDetails}>
                {remunerationData.nombreMovements || 0} mouvements comptables effectués
              </Text>
            </View>
          </Card>
        )}

        {/* Actions finales */}
        {showResults && (
          <Card style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              <Button
                title="Nouveau Processus"
                onPress={handleReset}
                variant="secondary"
                style={styles.actionButton}
                icon="refresh"
              />
              <Button
                title="Rapport Complet"
                onPress={() => handleGenerateReport('remuneration')}
                style={styles.actionButton}
                icon="description"
              />
            </View>
          </Card>
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {currentStep === 2 ? 'Calcul des commissions...' : 'Traitement de la rémunération...'}
            </Text>
          </View>
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
  resetButton: {
    padding: 8
  },
  progressCard: {
    marginBottom: 16,
    padding: 20,
    alignItems: 'center'
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepActive: {
    backgroundColor: colors.primary
  },
  stepText: {
    color: colors.textSecondary,
    fontWeight: 'bold'
  },
  stepTextActive: {
    color: 'white'
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8
  },
  stepLineActive: {
    backgroundColor: colors.primary
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  stepLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    flex: 1
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '500'
  },
  configCard: {
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  summaryText: {
    marginLeft: 12,
    color: colors.info,
    flex: 1,
    lineHeight: 20
  },
  primaryButton: {
    backgroundColor: colors.primary,
    marginTop: 8
  },
  resultsCard: {
    marginBottom: 16
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  excelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8
  },
  excelText: {
    marginLeft: 4,
    color: colors.primary,
    fontWeight: '500'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statCard: {
    flex: 0.32
  },
  dataTable: {
    marginTop: 12
  },
  remunerationSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text
  },
  processCompleteBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.success + '10',
    borderRadius: 8
  },
  processCompleteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 8,
    textAlign: 'center'
  },
  processCompleteDetails: {
    fontSize: 14,
    color: colors.success,
    marginTop: 4,
    textAlign: 'center'
  },
  actionsCard: {
    marginBottom: 16
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionButton: {
    flex: 0.48
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 12,
    color: 'white',
    fontSize: 16
  }
});