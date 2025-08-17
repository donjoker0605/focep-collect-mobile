// src/screens/Admin/CommissionCalculationV2Screen.js
import React, { useState, useEffect, useCallback } from 'react';
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
import Modal from '../../components/Modal/Modal';
import HistoriqueCommissions from '../../components/HistoriqueCommissions/HistoriqueCommissions';

import { useCommissionV2 } from '../../hooks/useCommissionV2';
import { useCollecteurs } from '../../hooks/useCollecteurs';
import colors from '../../theme/colors';
import { formatters } from '../../utils/formatters';
import { testCommissionV2Integration } from '../../utils/testCommissionV2';
import V2IntegrationTest from '../../components/V2IntegrationTest/V2IntegrationTest';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

/**
 * Écran de calcul de commission selon la nouvelle spécification FOCEP
 * - Hiérarchie client → collecteur → agence
 * - Types : fixe, pourcentage, paliers
 * - TVA 19,25% automatique
 * - Rapport Excel réel
 */
export default function CommissionCalculationV2Screen({ navigation }) {
  // État local
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [showResults, setShowResults] = useState(false);
  const [showProcessusComplet, setShowProcessusComplet] = useState(false);

  // Hooks
  const {
    loading,
    error,
    commissionData,
    remunerationData,
    calculateCommissions,
    processusComplet,
    generateCommissionReport,
    generateRemunerationReport,
    getCommissionStats,
    formatPeriode,
    clearError
  } = useCommissionV2();

  const { collecteurs, loading: collecteursLoading } = useCollecteurs();

  // 🔥 NOUVEAU: Hook pour rechargement automatique après calcul
  const triggerAutoRefresh = useAutoRefresh(() => {
    // Le rechargement sera géré par l'historique qui s'affiche automatiquement
    console.log('🔄 Rechargement après calcul de commission');
  });

  // 🔥 NOUVEAU: Validation période déjà calculée
  const [historique, setHistorique] = useState([]);
  const [periodeDejaCalculee, setPeriodeDejaCalculee] = useState(false);

  // Fonction helper pour convertir Date en string pour l'API
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // 🔥 NOUVEAU: Helper pour alertes cross-platform
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

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error]);

  // 🔥 FONCTION: Vérifier si deux périodes se chevauchent
  const periodesSeChevauchet = useCallback((debut1, fin1, debut2, fin2) => {
    const d1 = new Date(debut1);
    const f1 = new Date(fin1);
    const d2 = new Date(debut2);
    const f2 = new Date(fin2);
    
    // Une période chevauche avec une autre si :
    // - La date de début est avant ou égale à la date de fin de l'autre ET
    // - La date de fin est après ou égale à la date de début de l'autre
    return d1 <= f2 && f1 >= d2;
  }, []);

  // 🔥 NOUVEAU: Vérifier si la période sélectionnée chevauche avec des périodes déjà calculées
  const verifierPeriodeCalculee = useCallback(() => {
    console.log('🔍 Vérification période avec détection de chevauchement:', {
      selectedCollecteur: selectedCollecteur?.id,
      historiqueLength: historique.length,
      dateDebut: formatDateForAPI(dateDebut),
      dateFin: formatDateForAPI(dateFin)
    });

    if (!selectedCollecteur || !historique.length) {
      console.log('❌ Pas de collecteur ou historique vide');
      setPeriodeDejaCalculee(false);
      return;
    }

    const debutStr = formatDateForAPI(dateDebut);
    const finStr = formatDateForAPI(dateFin);

    console.log('🔍 Recherche dans historique:', historique.map(h => ({
      id: h.id,
      dateDebut: h.dateDebut,
      dateFin: h.dateFin,
      statut: h.statut
    })));

    console.log('🔍 Recherche pour période:', { debutStr, finStr });

    // 🔥 NOUVEAU: Chercher toute période calculée qui chevauche avec la période sélectionnée
    const periodeChevauche = historique.find(h => {
      if (h.statut !== 'CALCULE') {
        return false; // Ignorer les périodes non calculées
      }

      const chevauche = periodesSeChevauchet(debutStr, finStr, h.dateDebut, h.dateFin);
      
      console.log('🔍 Test chevauchement:', {
        periode_selectionnee: { debut: debutStr, fin: finStr },
        periode_historique: { debut: h.dateDebut, fin: h.dateFin, statut: h.statut },
        chevauche: chevauche
      });
      
      return chevauche;
    });

    console.log('🔍 Période qui chevauche trouvée:', periodeChevauche);
    setPeriodeDejaCalculee(!!periodeChevauche);
  }, [selectedCollecteur, historique, dateDebut, dateFin, periodesSeChevauchet]);

  useEffect(() => {
    verifierPeriodeCalculee();
  }, [verifierPeriodeCalculee]);

  /**
   * Lance le calcul de commission uniquement
   */
  const handleCalculateCommissions = async () => {
    console.log('🔥 Bouton Calculer Commission cliqué !');
    console.log('📊 État actuel:', {
      selectedCollecteur: selectedCollecteur?.id,
      periodeDejaCalculee,
      loading,
      dateDebut: formatDateForAPI(dateDebut),
      dateFin: formatDateForAPI(dateFin)
    });

    if (!selectedCollecteur) {
      console.log('❌ Pas de collecteur sélectionné');
      showAlert('Erreur', 'Veuillez sélectionner un collecteur', [{ text: 'OK' }]);
      return;
    }

    // 🔥 NOUVEAU: Vérification période qui chevauche
    if (periodeDejaCalculee) {
      console.log('❌ Période qui chevauche avec une période déjà calculée');
      showAlert(
        'Période en conflit',
        `La période sélectionnée (${formatPeriode(dateDebut, dateFin)}) chevauche avec une période déjà calculée pour ce collecteur.\n\nVeuillez choisir une période qui ne chevauche pas avec les calculs existants ou consulter l'historique des calculs.`,
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('✅ Validation OK, affichage confirmation...');

    // 🔥 CONFIRMATION OBLIGATOIRE avant calcul
    showAlert(
      'Confirmer le calcul',
      `Voulez-vous vraiment calculer les commissions pour ${selectedCollecteur.nom} ?\n\nPériode : ${formatPeriode(dateDebut, dateFin)}`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Calculer',
          style: 'default',
          onPress: async () => {
            console.log('🚀 Début calcul commission...');
            const result = await calculateCommissions(
              selectedCollecteur.id, 
              formatDateForAPI(dateDebut), 
              formatDateForAPI(dateFin)
            );

            console.log('📊 Résultat calcul:', result);

            if (result.success) {
              setShowResults(true);
              
              // 🔥 NOUVEAU: Déclencher le rechargement automatique de l'historique
              console.log('🔄 Déclenchement du rechargement de l\'historique après calcul');
              triggerAutoRefresh();
              
              // 🔥 NOUVEAU: Forcer la re-vérification de la période après rechargement
              setTimeout(() => {
                verifierPeriodeCalculee();
              }, 1000);
              
              showAlert('Succès', result.message || 'Commission calculée avec succès', [
                {
                  text: 'Voir les résultats',
                  onPress: () => {
                    navigation.navigate('CommissionResultsScreen', {
                      commissionResult: result,
                      collecteur: selectedCollecteur
                    });
                  }
                },
                {
                  text: 'OK'
                }
              ]);
            } else {
              showAlert('Erreur', result.error || 'Erreur lors du calcul', [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  /**
   * Lance le processus complet (commission + rémunération)
   */
  const handleProcessusComplet = async () => {
    if (!selectedCollecteur) {
      Alert.alert('Erreur', 'Veuillez sélectionner un collecteur');
      return;
    }

    // 🔥 CONFIRMATION OBLIGATOIRE avant processus complet
    Alert.alert(
      'Confirmer le processus complet',
      `Voulez-vous vraiment lancer le processus complet (Commission + Rémunération) pour ${selectedCollecteur.nom} ?\n\nPériode : ${formatPeriode(dateDebut, dateFin)}\n\n⚠️ Cette action est irréversible !`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Lancer',
          style: 'destructive',
          onPress: async () => {
            const result = await processusComplet(
              selectedCollecteur.id, 
              formatDateForAPI(dateDebut), 
              formatDateForAPI(dateFin)
            );

            if (result.success) {
              setShowResults(true);
              setShowProcessusComplet(true);
              Alert.alert('Succès', 'Processus complet terminé avec succès');
            }
          }
        }
      ]
    );
  };

  /**
   * Génère et télécharge le rapport Excel
   */
  const handleGenerateExcelReport = async (type = 'commission') => {
    if (!selectedCollecteur) {
      Alert.alert('Erreur', 'Veuillez sélectionner un collecteur');
      return;
    }

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
        `${result.fileName} (${formatters.formatFileSize(result.size)})`,
        [
          { text: 'OK' }
        ]
      );
    }
  };

  /**
   * Lance les tests d'intégration (mode développement)
   */
  const handleRunTests = async () => {
    if (__DEV__) {
      try {
        const collecteurIdForTest = selectedCollecteur?.id;
        await testCommissionV2Integration(collecteurIdForTest);
      } catch (error) {
        Alert.alert('Erreur de test', error.message);
      }
    }
  };

  /**
   * Prépare les données pour l'affichage du tableau
   */
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
      type: client.typeParametre
    }));
  };

  const tableColumns = [
    { key: 'nom', title: 'Client', width: '25%' },
    { key: 'epargne', title: 'Épargne', width: '18%' },
    { key: 'commission', title: 'Commission', width: '18%' },
    { key: 'tva', title: 'TVA 19,25%', width: '15%' },
    { key: 'nouveauSolde', title: 'Nouveau Solde', width: '18%' },
    { key: 'type', title: 'Type', width: '6%' }
  ];

  const stats = getCommissionStats();

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
          <Text style={styles.title}>Commission FOCEP v2</Text>
          <View style={styles.headerRight}>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>NOUVEAU</Text>
            </View>
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.testButton}
                onPress={handleRunTests}
              >
                <Icon name="bug-report" size={20} color={colors.warning} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Configuration */}
        <Card style={styles.configCard}>
          <Text style={styles.sectionTitle}>Configuration du Calcul</Text>
          
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
            <View style={styles.periodeInfo}>
              <Text style={styles.periodeText}>
                Période : {formatPeriode(dateDebut, dateFin)}
              </Text>
              {periodeDejaCalculee && (
                <View style={styles.warningPeriode}>
                  <Icon name="warning" size={16} color={colors.warning} />
                  <Text style={styles.warningText}>
                    Cette période chevauche avec une période déjà calculée
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* 🔥 NOUVEAU: Historique des commissions du collecteur sélectionné */}
        {selectedCollecteur && (
          <HistoriqueCommissions
            collecteurId={selectedCollecteur.id}
            collecteurNom={`${selectedCollecteur.prenom} ${selectedCollecteur.nom}`}
            onHistoriqueLoaded={setHistorique}
          />
        )}

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <Button
            title="Calculer les Commissions"
            onPress={() => {
              console.log('🔥 BUTTON PRESSED - onPress called directly');
              handleCalculateCommissions();
            }}
            loading={loading}
            disabled={!selectedCollecteur || periodeDejaCalculee}
            style={[
              styles.actionButton, 
              styles.primaryButton,
              periodeDejaCalculee && styles.disabledButton
            ]}
            icon="calculate"
            variant="primary"
          />
          
          {/* 🔥 DEBUG: Informations état bouton */}
          <View style={{ padding: 8, backgroundColor: '#f0f0f0', marginTop: 8 }}>
            <Text style={{ fontSize: 12 }}>
              DEBUG Bouton: selectedCollecteur={selectedCollecteur?.id}, 
              periodeDejaCalculee={periodeDejaCalculee.toString()}, 
              loading={loading.toString()}, 
              disabled={(!selectedCollecteur || periodeDejaCalculee).toString()}
            </Text>
          </View>
          
          {periodeDejaCalculee && (
            <View style={styles.disabledInfo}>
              <Icon name="info" size={16} color={colors.textSecondary} />
              <Text style={styles.disabledText}>
                Impossible de calculer - période en conflit avec l'historique
              </Text>
            </View>
          )}
        </Card>

        {/* Statistiques */}
        {stats && (
          <View style={styles.statsRow}>
            <StatsCard
              title="Clients"
              value={stats.totalClients?.toString() || '0'}
              icon="people"
              color={colors.info}
            />
            <StatsCard
              title="Commission"
              value={formatters.formatMoney(stats.totalCommissions || 0)}
              icon="cash"
              color={colors.success}
            />
            <StatsCard
              title="TVA"
              value={formatters.formatMoney(stats.totalTaxes || 0)}
              icon="receipt"
              color={colors.warning}
            />
          </View>
        )}

        {/* Résultats Commission */}
        {showResults && commissionData && (
          <Card style={styles.resultsCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Résultats Commission</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => navigation.navigate('CommissionResultsScreen', {
                    commissionResult: commissionData,
                    collecteur: selectedCollecteur
                  })}
                >
                  <Icon name="visibility" size={20} color={colors.success} />
                  <Text style={styles.viewText}>Détails</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.excelButton}
                  onPress={() => handleGenerateExcelReport('commission')}
                >
                  <Icon name="file-download" size={20} color={colors.primary} />
                  <Text style={styles.excelText}>Excel</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Commission (S)</Text>
                <Text style={styles.summaryValue}>
                  {formatters.formatMoney(commissionData.totalCommissions)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>TVA (19,25%)</Text>
                <Text style={styles.summaryValue}>
                  {formatters.formatMoney(commissionData.totalTVA)}
                </Text>
              </View>
            </View>

            <DataTable
              data={prepareTableData()}
              columns={tableColumns}
              style={styles.dataTable}
            />
          </Card>
        )}

        {/* Résultats Rémunération */}
        {showProcessusComplet && remunerationData && (
          <Card style={styles.resultsCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Résultats Rémunération</Text>
              <TouchableOpacity
                style={styles.excelButton}
                onPress={() => handleGenerateExcelReport('remuneration')}
              >
                <Icon name="file-download" size={20} color={colors.primary} />
                <Text style={styles.excelText}>Excel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>S Initial</Text>
                <Text style={styles.summaryValue}>
                  {formatters.formatMoney(remunerationData.montantSInitial)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Vi (Rubriques)</Text>
                <Text style={styles.summaryValue}>
                  {formatters.formatMoney(remunerationData.totalRubriquesVi)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Surplus EMF</Text>
                <Text style={styles.summaryValue}>
                  {formatters.formatMoney(remunerationData.montantEMF)}
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Icon name="info" size={20} color={colors.info} />
              <Text style={styles.infoText}>
                Rémunération traitée avec {remunerationData.nombreMovements} mouvements comptables
              </Text>
            </View>
          </Card>
        )}

        {/* Tests d'intégration V2 (mode développement) */}
        {__DEV__ && (
          <V2IntegrationTest 
            collecteurId={selectedCollecteur?.id}
          />
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Traitement en cours...</Text>
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
    padding: Platform.OS === 'web' ? 20 : 16,
    // Responsive padding pour web
    ...(Platform.OS === 'web' && {
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%'
    })
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
    alignItems: 'center',
    gap: 8
  },
  versionBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  versionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  testButton: {
    padding: 8,
    backgroundColor: colors.warning + '20',
    borderRadius: 8
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
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: Platform.OS === 'web' ? 16 : 8
  },
  dateInput: {
    flex: Platform.OS === 'web' ? 0.48 : 1
  },
  periodeInfo: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  periodeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  actionsCard: {
    marginBottom: 16
  },
  actionButton: {
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: colors.primary
  },
  statsRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: Platform.OS === 'web' ? 16 : 8
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.success + '20',
    borderRadius: 8
  },
  viewText: {
    marginLeft: 4,
    color: colors.success,
    fontWeight: '500'
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
  summaryRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: Platform.OS === 'web' ? 16 : 8
  },
  summaryItem: {
    alignItems: 'center'
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
  dataTable: {
    marginTop: 12
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  infoText: {
    marginLeft: 8,
    color: colors.info,
    flex: 1
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
  },
  // 🔥 NOUVEAUX STYLES pour validation période
  warningPeriode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.warning + '10',
    borderRadius: 6
  },
  warningText: {
    marginLeft: 6,
    color: colors.warning,
    fontSize: 12,
    fontWeight: '500'
  },
  disabledButton: {
    opacity: 0.6
  },
  disabledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.textSecondary + '10',
    borderRadius: 6
  },
  disabledText: {
    marginLeft: 6,
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic'
  }
});