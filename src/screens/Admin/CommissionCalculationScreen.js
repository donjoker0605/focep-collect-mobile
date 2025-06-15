// src/screens/Admin/CommissionCalculationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SelectInput from '../../components/SelectInput/SelectInput';
import DatePickerInput from '../../components/DatePickerInput/DatePickerInput';
import theme from '../../theme';
import { commissionService, collecteurService } from '../../services';

const CommissionCalculationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  // États
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [collecteurs, setCollecteurs] = useState([]);
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [dateDebut, setDateDebut] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [commissionResults, setCommissionResults] = useState(null);
  const [error, setError] = useState(null);

  // Options de période
  const periodOptions = [
    { id: 'current_month', label: 'Mois en cours' },
    { id: 'last_month', label: 'Mois dernier' },
    { id: 'custom', label: 'Période personnalisée' },
  ];

  // Charger les collecteurs au démarrage
  useEffect(() => {
    loadCollecteurs();
  }, []);

  // Mettre à jour les dates selon la période sélectionnée
  useEffect(() => {
    updateDatesForPeriod();
  }, [selectedPeriod]);

  const loadCollecteurs = async () => {
    try {
      setLoading(true);
      const response = await collecteurService.getAllCollecteurs();
      
      if (response.success) {
        const collecteursData = Array.isArray(response.data) ? response.data : [];
        // Filtrer uniquement les collecteurs actifs
        const activeCollecteurs = collecteursData.filter(c => c && c.active);
        setCollecteurs(activeCollecteurs);
      } else {
        setError('Erreur lors du chargement des collecteurs');
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Impossible de charger les collecteurs');
    } finally {
      setLoading(false);
    }
  };

  const updateDatesForPeriod = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'current_month':
        setDateDebut(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateFin(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        setDateDebut(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setDateFin(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      // 'custom' ne modifie pas les dates
    }
  };

  const handleCalculate = async () => {
    // Validation
    if (!dateDebut || !dateFin) {
      Alert.alert('Erreur', 'Veuillez sélectionner une période');
      return;
    }

    if (new Date(dateDebut) > new Date(dateFin)) {
      Alert.alert('Erreur', 'La date de début doit être antérieure à la date de fin');
      return;
    }

    Alert.alert(
      'Calculer les commissions',
      `Calculer les commissions ${
        selectedCollecteur ? 'du collecteur sélectionné' : 'de tous les collecteurs'
      } pour la période du ${format(new Date(dateDebut), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(dateFin), 'dd/MM/yyyy', { locale: fr })} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Calculer', onPress: executeCalculation }
      ]
    );
  };

  const executeCalculation = async () => {
    try {
      setCalculating(true);
      setError(null);
      setCommissionResults(null);

      let response;
      
      if (selectedCollecteur) {
        // Calculer pour un collecteur spécifique
        response = await commissionService.calculateCollecteurCommissions(
          selectedCollecteur,
          dateDebut,
          dateFin
        );
      } else {
        // Calculer pour toute l'agence
        response = await commissionService.calculateAgenceCommissions(
          dateDebut,
          dateFin
        );
      }

      if (response.success) {
        setCommissionResults(response.data);
        Alert.alert(
          'Succès',
          'Les commissions ont été calculées avec succès',
          [
            {
              text: 'Voir les détails',
              onPress: () => {
                // Navigation vers les détails si nécessaire
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        setError(response.error || 'Erreur lors du calcul');
      }
    } catch (err) {
      console.error('Erreur lors du calcul:', err);
      setError(err.message || 'Erreur lors du calcul des commissions');
    } finally {
      setCalculating(false);
    }
  };

  const renderCommissionItem = ({ item }) => {
    if (!item) return null;

    return (
      <View style={styles.commissionItem}>
        <View style={styles.commissionInfo}>
          <Text style={styles.collecteurName}>
            {item.collecteurNom || 'Collecteur inconnu'}
          </Text>
          <Text style={styles.clientCount}>
            {item.nombreClients || 0} clients traités
          </Text>
        </View>
        <View style={styles.commissionAmount}>
          <Text style={styles.amountLabel}>Commission</Text>
          <Text style={styles.amountValue}>
            {new Intl.NumberFormat('fr-FR').format(item.montantCommission || 0)} FCFA
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Calcul des commissions"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Calcul des commissions"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélection des paramètres */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Paramètres de calcul</Text>
          
          {/* Sélection du collecteur */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Collecteur (optionnel)</Text>
            <SelectInput
              value={selectedCollecteur}
              options={[
                { label: 'Tous les collecteurs', value: null },
                ...collecteurs.map(c => ({
                  label: `${c.prenom} ${c.nom}`,
                  value: c.id
                }))
              ]}
              onChange={setSelectedCollecteur}
              placeholder="Sélectionner un collecteur"
            />
            <Text style={styles.helperText}>
              Laissez vide pour calculer les commissions de toute l'agence
            </Text>
          </View>

          {/* Sélection de la période */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Période</Text>
            <View style={styles.periodButtons}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.periodButton,
                    selectedPeriod === option.id && styles.activePeriodButton
                  ]}
                  onPress={() => setSelectedPeriod(option.id)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === option.id && styles.activePeriodButtonText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dates personnalisées */}
          {selectedPeriod === 'custom' && (
            <>
              <DatePickerInput
                label="Date de début"
                value={dateDebut}
                onChange={setDateDebut}
                maximumDate={new Date()}
              />
              
              <DatePickerInput
                label="Date de fin"
                value={dateFin}
                onChange={setDateFin}
                minimumDate={dateDebut ? new Date(dateDebut) : undefined}
                maximumDate={new Date()}
              />
            </>
          )}

          {/* Affichage de la période sélectionnée */}
          <View style={styles.periodSummary}>
            <Text style={styles.periodSummaryLabel}>Période sélectionnée :</Text>
            <Text style={styles.periodSummaryText}>
              Du {format(new Date(dateDebut), 'dd MMMM yyyy', { locale: fr })} au {format(new Date(dateFin), 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
        </Card>

        {/* Informations importantes */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>Comment fonctionne le calcul ?</Text>
          </View>
          <Text style={styles.infoText}>
            Le calcul des commissions utilise la hiérarchie suivante :
          </Text>
          <View style={styles.hierarchyList}>
            <Text style={styles.hierarchyItem}>1. Paramètres du client (priorité haute)</Text>
            <Text style={styles.hierarchyItem}>2. Paramètres du collecteur</Text>
            <Text style={styles.hierarchyItem}>3. Paramètres de l'agence (par défaut)</Text>
          </View>
          <Text style={styles.infoText}>
            Les commissions sont calculées sur le montant total épargné par chaque client durant la période sélectionnée.
          </Text>
        </Card>

        {/* Résultats des commissions */}
        {commissionResults && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Résultats du calcul</Text>
            
            {/* Résumé */}
            <View style={styles.resultSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total commissions</Text>
                <Text style={styles.summaryValue}>
                  {new Intl.NumberFormat('fr-FR').format(commissionResults.totalCommissions || 0)} FCFA
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Collecteurs traités</Text>
                <Text style={styles.summaryValue}>
                  {commissionResults.nombreCollecteurs || 0}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Clients traités</Text>
                <Text style={styles.summaryValue}>
                  {commissionResults.nombreClientsTotal || 0}
                </Text>
              </View>
            </View>

            {/* Détails par collecteur */}
            {commissionResults.details && commissionResults.details.length > 0 && (
              <>
                <Text style={styles.detailsTitle}>Détails par collecteur</Text>
                <FlatList
                  data={commissionResults.details}
                  renderItem={renderCommissionItem}
                  keyExtractor={(item) => item.collecteurId?.toString() || Math.random().toString()}
                  scrollEnabled={false}
                />
              </>
            )}

            {/* Actions */}
            <View style={styles.resultActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  // Exporter ou enregistrer les résultats
                  Alert.alert('Information', 'Fonctionnalité d\'export en développement');
                }}
              >
                <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Exporter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  // Valider et enregistrer les commissions
                  Alert.alert('Information', 'Validation des commissions en développement');
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
                <Text style={[styles.actionButtonText, { color: theme.colors.success }]}>
                  Valider
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Erreur */}
        {error && (
          <Card style={[styles.card, styles.errorCard]}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </Card>
        )}

        {/* Bouton de calcul */}
        <Button
          title="Calculer les commissions"
          onPress={handleCalculate}
          loading={calculating}
          style={styles.calculateButton}
          disabled={!dateDebut || !dateFin}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  activePeriodButton: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: theme.colors.white,
  },
  periodSummary: {
    backgroundColor: theme.colors.lightGray,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  periodSummaryLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  periodSummaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  hierarchyList: {
    marginVertical: 8,
    paddingLeft: 16,
  },
  hierarchyItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  resultSummary: {
    backgroundColor: theme.colors.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
  commissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  commissionInfo: {
    flex: 1,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  clientCount: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  commissionAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginLeft: 8,
    flex: 1,
  },
  calculateButton: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
});

export default CommissionCalculationScreen;