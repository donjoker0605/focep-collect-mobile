// src/screens/Admin/CommissionReportScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Share
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

// Components
import { Header, SelectInput } from '../../components';
import CommissionVisualization from '../../components/Commission/CommissionVisualization';

// Services API
import { 
  calculateCommissions, 
  getCommissionReport,
  exportCommissionReport
} from '../../api/commission';

// Theme
import theme from '../../theme';

const CommissionReportScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  
  // Récupérer le collecteurId à partir des paramètres de navigation
  const { collecteurId, collecteurName } = route.params || {};
  
  // États
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [commissionData, setCommissionData] = useState(null);
  
  // État pour la période
  const currentDate = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({
    debut: format(startOfMonth(subMonths(currentDate, 1)), 'yyyy-MM-dd'),
    fin: format(endOfMonth(subMonths(currentDate, 1)), 'yyyy-MM-dd'),
    label: 'Mois précédent'
  });
  
  // Options pour la période
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
  
  // Fonction pour charger les données du rapport
  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCommissionReport({
        collecteurId,
        dateDebut: selectedPeriod.debut,
        dateFin: selectedPeriod.fin
      });
      
      setCommissionData(response);
    } catch (err) {
      console.error('Erreur lors du chargement du rapport:', err);
      setError(err.message || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les données du rapport lors du changement de période
  useEffect(() => {
    if (collecteurId) {
      loadReport();
    }
  }, [collecteurId, selectedPeriod]);
  
  // Fonction pour calculer les commissions
  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);
      
      // Confirmer l'action
      Alert.alert(
        'Confirmation',
        `Êtes-vous sûr de vouloir calculer les commissions pour la période du ${format(new Date(selectedPeriod.debut), 'dd/MM/yyyy')} au ${format(new Date(selectedPeriod.fin), 'dd/MM/yyyy')} ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {
              setCalculating(false);
            }
          },
          {
            text: 'Calculer',
            onPress: async () => {
              try {
                await calculateCommissions({
                  collecteurId,
                  dateDebut: selectedPeriod.debut,
                  dateFin: selectedPeriod.fin
                });
                
                // Recharger le rapport après le calcul
                await loadReport();
                
                Alert.alert(
                  'Succès',
                  'Les commissions ont été calculées avec succès.',
                  [{ text: 'OK' }]
                );
              } catch (err) {
                console.error('Erreur lors du calcul des commissions:', err);
                setError(err.message || 'Erreur lors du calcul des commissions');
                
                Alert.alert(
                  'Erreur',
                  'Une erreur est survenue lors du calcul des commissions.',
                  [{ text: 'OK' }]
                );
              } finally {
                setCalculating(false);
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('Erreur lors du calcul des commissions:', err);
      setError(err.message || 'Erreur lors du calcul des commissions');
      setCalculating(false);
    }
  };
  
  // Fonction pour exporter le rapport en Excel
  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Exporter le rapport
      const blob = await exportCommissionReport({
        collecteurId,
        dateDebut: selectedPeriod.debut,
        dateFin: selectedPeriod.fin
      });
      
      // Convertir le blob en fichier
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        // Nom du fichier
        const fileName = `commission_${collecteurId}_${selectedPeriod.debut}_${selectedPeriod.fin}.xlsx`;
        
        // Chemin du fichier temporaire
        const fileUri = FileSystem.documentDirectory + fileName;
        
        try {
          // Écrire le fichier
          await FileSystem.writeAsStringAsync(
            fileUri,
            base64data.split(',')[1],
            { encoding: FileSystem.EncodingType.Base64 }
          );
          
          // Partager le fichier
          if (Platform.OS === 'ios') {
            await Sharing.shareAsync(fileUri);
          } else {
            const UTI = 'org.openxmlformats.spreadsheetml.sheet';
            const shareResult = await Share.share({
              url: fileUri,
              title: 'Rapport de commission',
              message: 'Voici le rapport de commission'
            });
            
            if (shareResult.action === Share.sharedAction) {
              console.log('Partagé avec succès');
            }
          }
        } catch (err) {
          console.error('Erreur lors du partage du fichier:', err);
          Alert.alert(
            'Erreur',
            'Une erreur est survenue lors du partage du fichier.'
          );
        }
      };
    } catch (err) {
      console.error('Erreur lors de l\'exportation du rapport:', err);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'exportation du rapport.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour imprimer le rapport
  const handlePrint = () => {
    Alert.alert(
      'Information',
      'La fonctionnalité d\'impression n\'est pas encore disponible. Veuillez utiliser la fonction d\'exportation pour obtenir un fichier Excel.',
      [{ text: 'OK' }]
    );
  };
  
  // Fonction pour changer de période
  const handlePeriodChange = (value) => {
    const selectedOption = periodOptions.find(option => option.value === value);
    
    if (selectedOption) {
      setSelectedPeriod({
        debut: selectedOption.debut,
        fin: selectedOption.fin,
        label: selectedOption.label
      });
    }
  };
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title={`Commissions ${collecteurName || ''}`}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity 
            style={styles.calculateButton}
            onPress={handleCalculate}
            disabled={calculating || loading}
          >
            <Ionicons name="calculator" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        <View style={styles.periodContainer}>
          <Text style={styles.periodTitle}>Sélectionner une période</Text>
          <SelectInput
            value={selectedPeriod.value || periodOptions[1].value}
            options={periodOptions.map(option => ({
              label: option.label,
              value: option.value
            }))}
            onChange={handlePeriodChange}
            placeholder="Choisir une période"
          />
        </View>
        
        <CommissionVisualization
          data={commissionData}
          loading={loading || calculating}
          error={error}
          onRetry={loadReport}
          periode={{
            debut: selectedPeriod.debut,
            fin: selectedPeriod.fin
          }}
          onPrint={handlePrint}
          onExport={handleExport}
          style={styles.visualization}
        />
      </View>
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
    padding: 20,
  },
  calculateButton: {
    padding: 8,
  },
  periodContainer: {
    marginBottom: 20,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  visualization: {
    flex: 1,
  },
});

export default CommissionReportScreen;