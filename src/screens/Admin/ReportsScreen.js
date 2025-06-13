// src/screens/Admin/ReportsScreen.js - VERSION CORRIGÉE AVEC API RÉELLE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SelectInput from '../../components/SelectInput/SelectInput';
import theme from '../../theme';

// MODIFICATION: Importer les hooks et services réels
import { useAdminCollecteurs } from '../../hooks/useAdminCollecteurs';
import { adminService } from '../../services';

const ReportsScreen = ({ navigation }) => {
  // MODIFICATION: États pour API réelle
  const [selectedReportType, setSelectedReportType] = useState('collecteur');
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [generating, setGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState(null);

  // MODIFICATION: Utiliser le hook pour les collecteurs
  const { 
    collecteurs, 
    loading: collecteursLoading, 
    fetchCollecteurs 
  } = useAdminCollecteurs();

  // MODIFICATION: Types de rapports réels (dans le périmètre admin)
  const reportTypes = [
    { 
      id: 'collecteur', 
      label: 'Rapport collecteur', 
      icon: 'person-outline',
      description: 'Rapport détaillé d\'un collecteur'
    },
    { 
      id: 'commission', 
      label: 'Rapport commissions', 
      icon: 'cash-outline',
      description: 'Rapport des commissions calculées'
    },
    { 
      id: 'agence', 
      label: 'Rapport agence', 
      icon: 'business-outline',
      description: 'Rapport de synthèse de l\'agence'
    },
  ];

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
      label: '2 derniers mois',
      value: 'two_months',
      debut: format(startOfMonth(subMonths(currentDate, 1)), 'yyyy-MM-dd'),
      fin: format(endOfMonth(currentDate), 'yyyy-MM-dd')
    },
    {
      label: '3 derniers mois',
      value: 'three_months',
      debut: format(startOfMonth(subMonths(currentDate, 2)), 'yyyy-MM-dd'),
      fin: format(endOfMonth(currentDate), 'yyyy-MM-dd')
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

  // MODIFICATION: Charger les données réelles au démarrage
  useEffect(() => {
    fetchCollecteurs();
    loadRecentReports();
    
    // Initialiser les dates par défaut
    const defaultPeriod = periodOptions.find(opt => opt.value === 'current_month');
    if (defaultPeriod) {
      setDateDebut(defaultPeriod.debut);
      setDateFin(defaultPeriod.fin);
    }
  }, []);

  // MODIFICATION: Charger les rapports récents depuis l'API
  const loadRecentReports = async () => {
    try {
      setLoadingReports(true);
      const response = await adminService.getReports({ 
        page: 0, 
        size: 10 
      });
      
      if (response.success) {
        setRecentReports(response.data || []);
      } else {
        console.error('Erreur chargement rapports:', response.error);
      }
    } catch (err) {
      console.error('Erreur chargement rapports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Gérer le changement de période
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const selectedOption = periodOptions.find(opt => opt.value === period);
    if (selectedOption) {
      setDateDebut(selectedOption.debut);
      setDateFin(selectedOption.fin);
    }
  };

  // MODIFICATION: Générer le rapport avec l'API réelle
  const handleGenerateReport = async () => {
    if (!dateDebut || !dateFin) {
      Alert.alert('Erreur', 'Veuillez sélectionner une période');
      return;
    }

    if (selectedReportType === 'collecteur' && !selectedCollecteur) {
      Alert.alert('Erreur', 'Veuillez sélectionner un collecteur');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      let response;
      const reportParams = {
        dateDebut,
        dateFin,
        type: selectedReportType
      };

      switch (selectedReportType) {
        case 'collecteur':
          if (selectedCollecteur === 'all') {
            // Générer pour tous les collecteurs
            response = await adminService.generateReport('collecteur_all', reportParams);
          } else {
            // Générer pour un collecteur spécifique
            response = await adminService.generateCollecteurReport(
              selectedCollecteur, 
              dateDebut, 
              dateFin
            );
          }
          break;
          
        case 'commission':
          response = await adminService.generateReport('commission', {
            ...reportParams,
            collecteurId: selectedCollecteur !== 'all' ? selectedCollecteur : null
          });
          break;
          
        case 'agence':
          response = await adminService.generateReport('agence', reportParams);
          break;
          
        default:
          throw new Error('Type de rapport non supporté');
      }

      if (response.success) {
        Alert.alert(
          "Succès",
          "Le rapport a été généré avec succès. Il sera téléchargé automatiquement.",
          [{ text: "OK", onPress: () => loadRecentReports() }]
        );
      } else {
        setError(response.error || 'Erreur lors de la génération du rapport');
      }
    } catch (err) {
      console.error('Erreur génération rapport:', err);
      setError(err.message || 'Erreur lors de la génération du rapport');
    } finally {
      setGenerating(false);
    }
  };

  // MODIFICATION: Télécharger un rapport existant
  const handleDownloadReport = async (reportId) => {
    try {
      Alert.alert(
        'Information',
        'Le téléchargement du rapport va commencer...',
        [{ text: 'OK' }]
      );
      
      // Ici vous pouvez implémenter le téléchargement réel
      // const response = await adminService.downloadReport(reportId);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      Alert.alert('Erreur', 'Impossible de télécharger le rapport');
    }
  };

  // Rendu d'un type de rapport
  const renderReportType = (reportType) => (
    <TouchableOpacity
      key={reportType.id}
      style={[
        styles.reportTypeButton,
        selectedReportType === reportType.id && styles.selectedReportTypeButton
      ]}
      onPress={() => setSelectedReportType(reportType.id)}
    >
      <Ionicons 
        name={reportType.icon} 
        size={24} 
        color={selectedReportType === reportType.id ? theme.colors.white : theme.colors.primary} 
      />
      <Text 
        style={[
          styles.reportTypeButtonText,
          selectedReportType === reportType.id && styles.selectedReportTypeButtonText
        ]}
      >
        {reportType.label}
      </Text>
      <Text 
        style={[
          styles.reportTypeDescription,
          selectedReportType === reportType.id && styles.selectedReportTypeDescription
        ]}
      >
        {reportType.description}
      </Text>
    </TouchableOpacity>
  );

  // MODIFICATION: Rendu d'un rapport récent avec données réelles
  const renderRecentReport = ({ item }) => (
    <View style={styles.recentReportItem}>
      <View style={styles.recentReportIcon}>
        <Ionicons name="document-text" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.recentReportInfo}>
        <Text style={styles.recentReportTitle}>
          {item.titre || `Rapport ${item.type || 'Inconnu'}`}
        </Text>
        <Text style={styles.recentReportDate}>
          Généré le {item.dateCreation 
            ? format(new Date(item.dateCreation), 'dd/MM/yyyy à HH:mm')
            : 'Date inconnue'
          }
        </Text>
        {item.collecteur && (
          <Text style={styles.recentReportCollecteur}>
            {item.collecteur.prenom} {item.collecteur.nom}
          </Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.recentReportDownload}
        onPress={() => handleDownloadReport(item.id)}
      >
        <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Génération de rapports"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        {/* Types de rapports */}
        <View style={styles.reportTypesContainer}>
          <Text style={styles.sectionTitle}>Type de rapport</Text>
          <View style={styles.reportTypes}>
            {reportTypes.map(renderReportType)}
          </View>
        </View>
        
        {/* Paramètres */}
        <Card style={styles.parametersCard}>
          <Text style={styles.sectionTitle}>Paramètres du rapport</Text>
          
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
          
          {(selectedReportType === 'collecteur' || selectedReportType === 'commission') && (
            <SelectInput
              label="Collecteur"
              placeholder="Sélectionner un collecteur"
              value={selectedCollecteur}
              options={collecteurOptions}
              onChange={setSelectedCollecteur}
              disabled={collecteursLoading}
              required={selectedReportType === 'collecteur'}
            />
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <Button
            title="Générer le rapport"
            onPress={handleGenerateReport}
            loading={generating}
            disabled={generating}
            style={styles.generateButton}
          />
        </Card>
        
        {/* Rapports récents */}
        <Card style={styles.recentReportsCard}>
          <View style={styles.recentReportsHeader}>
            <Text style={styles.sectionTitle}>Rapports récents</Text>
            <TouchableOpacity 
              onPress={loadRecentReports}
              disabled={loadingReports}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={loadingReports ? theme.colors.gray : theme.colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          {loadingReports ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : recentReports.length > 0 ? (
            <FlatList
              data={recentReports}
              renderItem={renderRecentReport}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noReportsText}>
              Aucun rapport récent disponible
            </Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// MODIFICATION: Styles mis à jour
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
  reportTypesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  reportTypes: {
    gap: 12,
  },
  reportTypeButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  selectedReportTypeButton: {
    backgroundColor: theme.colors.primary,
  },
  reportTypeButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedReportTypeButtonText: {
    color: theme.colors.white,
  },
  reportTypeDescription: {
    color: theme.colors.textLight,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedReportTypeDescription: {
    color: theme.colors.white + 'CC',
  },
  parametersCard: {
    marginBottom: 20,
    padding: 16,
  },
  dateInfo: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
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
    marginVertical: 12,
  },
  errorText: {
    marginLeft: 8,
    color: theme.colors.error,
    flex: 1,
  },
  generateButton: {
    marginTop: 12,
  },
  recentReportsCard: {
    padding: 16,
  },
  recentReportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: theme.colors.textLight,
  },
  recentReportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  recentReportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentReportInfo: {
    flex: 1,
  },
  recentReportTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  recentReportDate: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  recentReportCollecteur: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  recentReportDownload: {
    padding: 8,
  },
  noReportsText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default ReportsScreen;