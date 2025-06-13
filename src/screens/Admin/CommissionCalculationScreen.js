// src/screens/Admin/CommissionCalculationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SelectInput from '../../components/SelectInput/SelectInput';
import theme from '../../theme';

// Hooks et services
import { useAdminCollecteurs } from '../../hooks/useAdminCollecteurs';
import { useAdminCommissions } from '../../hooks/useAdminCommissions';

const CommissionCalculationScreen = ({ navigation }) => {
  // États
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Hooks
  const { 
    collecteurs, 
    loading: collecteursLoading, 
    fetchCollecteurs 
  } = useAdminCollecteurs();

  const { 
    processCommissions, 
    processing, 
    simulationResult,
    error: commissionError 
  } = useAdminCommissions();

  // Charger les collecteurs
  useEffect(() => {
    fetchCollecteurs();
  }, []);

  // Options des périodes
  const currentDate = new Date();
  const periodOptions = [
    {
      label: 'Mois en cours',
      value: 'current_month',
      debut: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
      fin: format(endOfMonth(currentDate), 'yyyy-MM-dd')
    },
    {
      label: 'Mois précédent',
      value: 'previous_month',
      debut: format(startOfMonth(subMonths(currentDate, 1)), 'yyyy-MM-dd'),
      fin: format(endOfMonth(subMonths(currentDate, 1)), 'yyyy-MM-dd')
    },
    {
      label: 'Il y a 2 mois',
      value: 'two_months_ago',
      debut: format(startOfMonth(subMonths(currentDate, 2)), 'yyyy-MM-dd'),
      fin: format(endOfMonth(subMonths(currentDate, 2)), 'yyyy-MM-dd')
    },
    {
      label: 'Il y a 3 mois',
      value: 'three_months_ago',
      debut: format(startOfMonth(subMonths(currentDate, 3)), 'yyyy-MM-dd'),
      fin: format(endOfMonth(subMonths(currentDate, 3)), 'yyyy-MM-dd')
    }
  ];

  // Options des collecteurs
  const collecteurOptions = [
    { label: 'Tous les collecteurs', value: 'all' },
    ...collecteurs.map(collecteur => ({
      label: `${collecteur.prenom} ${collecteur.nom}`,
      value: collecteur.id,
      data: collecteur
    }))
  ];

  // Gérer le changement de période
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const selectedOption = periodOptions.find(opt => opt.value === period);
    if (selectedOption) {
      setDateDebut(selectedOption.debut);
      setDateFin(selectedOption.fin);
    }
    setResults(null);
    setError(null);
  };

  // Initialiser les dates
  useEffect(() => {
    const defaultPeriod = periodOptions.find(opt => opt.value === 'current_month');
    if (defaultPeriod) {
      setDateDebut(defaultPeriod.debut);
      setDateFin(defaultPeriod.fin);
    }
  }, []);

  // Calculer les commissions
  const handleCalculateCommissions = () => {
    if (!selectedCollecteur || !dateDebut || !dateFin) {
      setError('Veuillez sélectionner un collecteur et une période');
      return;
    }

    const periodLabel = periodOptions.find(opt => opt.value === selectedPeriod)?.label;
    const collecteurLabel = selectedCollecteur === 'all' 
      ? 'tous les collecteurs' 
      : collecteurOptions.find(opt => opt.value === selectedCollecteur)?.label;

    Alert.alert(
      'Confirmation',
      `Calculer les commissions pour ${collecteurLabel} sur la période "${periodLabel}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Calculer', onPress: executeCalculation }
      ]
    );
  };

  // Exécuter le calcul
  const executeCalculation = async () => {
    try {
      setError(null);
      setResults(null);

      let calculationResults;

      if (selectedCollecteur === 'all') {
        // Calculer pour tous les collecteurs
        calculationResults = [];
        for (const collecteur of collecteurs) {
          const result = await processCommissions(
            collecteur.id, 
            dateDebut, 
            dateFin, 
            false // pas de force recalcul par défaut
          );
          
          if (result.success) {
            calculationResults.push({
              collecteur: collecteur,
              ...result.data
            });
          }
        }
      } else {
        // Calculer pour un collecteur spécifique
        const result = await processCommissions(
          selectedCollecteur, 
          dateDebut, 
          dateFin, 
          false
        );
        
        if (result.success) {
          const collecteurData = collecteurOptions.find(opt => opt.value === selectedCollecteur)?.data;
          calculationResults = [{
            collecteur: collecteurData,
            ...result.data
          }];
        }
      }

      setResults(calculationResults);
      
      Alert.alert(
        'Succès',
        'Le calcul des commissions a été effectué avec succès.',
        [{ text: 'OK' }]
      );

    } catch (err) {
      console.error('Erreur calcul commissions:', err);
      setError(err.message || 'Erreur lors du calcul des commissions');
    }
  };

  // Formater la devise
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  };

  // Rendu d'un résultat de commission
  const renderCommissionResult = (result, index) => (
    <Card key={index} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.collecteurName}>
          {result.collecteur ? `${result.collecteur.prenom} ${result.collecteur.nom}` : 'Collecteur inconnu'}
        </Text>
        <View style={[
          styles.statusBadge,
          result.success ? styles.successBadge : styles.errorBadge
        ]}>
          <Text style={styles.statusText}>
            {result.success ? 'Calculé' : 'Erreur'}
          </Text>
        </View>
      </View>

      {result.success && result.totalCommission !== undefined && (
        <View style={styles.resultDetails}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Commission totale:</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(result.totalCommission)}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Nombre de transactions:</Text>
            <Text style={styles.resultValue}>
              {result.nombreTransactions || 0}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Montant traité:</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(result.montantTraite || 0)}
            </Text>
          </View>

          {result.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>{result.message}</Text>
            </View>
          )}
        </View>
      )}

      {!result.success && result.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          <Text style={styles.errorText}>{result.error}</Text>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Calcul des commissions"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Formulaire de paramètres */}
        <Card style={styles.parametersCard}>
          <Text style={styles.cardTitle}>Paramètres de calcul</Text>

          <SelectInput
            label="Collecteur"
            placeholder="Sélectionner un collecteur"
            value={selectedCollecteur}
            options={collecteurOptions}
            onChange={setSelectedCollecteur}
            disabled={collecteursLoading}
            required
          />

          <SelectInput
            label="Période"
            placeholder="Sélectionner une période"
            value={selectedPeriod}
            options={periodOptions}
            onChange={handlePeriodChange}
            required
          />

          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>
              Du {dateDebut ? format(new Date(dateDebut), 'dd/MM/yyyy') : ''} 
              au {dateFin ? format(new Date(dateFin), 'dd/MM/yyyy') : ''}
            </Text>
          </View>

          {(error || commissionError) && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{error || commissionError}</Text>
            </View>
          )}

          <Button
            title="Calculer les commissions"
            onPress={handleCalculateCommissions}
            loading={processing}
            disabled={processing || !selectedCollecteur || !dateDebut || !dateFin}
            style={styles.calculateButton}
          />
        </Card>

        {/* Résultats */}
        {processing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Calcul des commissions en cours...</Text>
          </View>
        )}

        {results && results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Résultats du calcul</Text>
            {results.map((result, index) => renderCommissionResult(result, index))}
            
            {/* Résumé global si plusieurs collecteurs */}
            {results.length > 1 && (
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Résumé global</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total des commissions:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(
                      results.reduce((sum, result) => sum + (result.totalCommission || 0), 0)
                    )}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Collecteurs traités:</Text>
                  <Text style={styles.summaryValue}>
                    {results.filter(r => r.success).length} / {results.length}
                  </Text>
                </View>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    padding: 16,
  },
  parametersCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  dateInfo: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}15`,
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  errorText: {
    marginLeft: 8,
    color: theme.colors.error,
    flex: 1,
  },
  calculateButton: {
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  resultCard: {
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  errorBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  resultDetails: {
    marginTop: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  messageContainer: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  summaryCard: {
    padding: 16,
    marginTop: 16,
    backgroundColor: theme.colors.primary + '10',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});

export default CommissionCalculationScreen;