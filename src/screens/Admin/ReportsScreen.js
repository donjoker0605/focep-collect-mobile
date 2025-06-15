// src/screens/Admin/ReportsScreen.js - VERSION CORRIGÉE
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
import { collecteurService, adminService } from '../../services';

const ReportsScreen = ({ navigation }) => {
  // États pour les données
  const [collecteurs, setCollecteurs] = useState([]); // ✅ INITIALISATION CORRECTE
  const [recentReports, setRecentReports] = useState([]); // ✅ INITIALISATION CORRECTE
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour les paramètres de rapport
  const [selectedReportType, setSelectedReportType] = useState('collecteur');
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  // Types de rapports disponibles
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
      description: 'Rapport des commissions générées'
    },
    { 
      id: 'agence', 
      label: 'Rapport agence', 
      icon: 'business-outline',
      description: 'Rapport global de l\'agence'
    },
  ];

  // Périodes prédéfinies
  const periodOptions = [
    { id: 'current_month', label: 'Mois actuel' },
    { id: 'last_month', label: 'Mois dernier' },
    { id: 'last_3_months', label: '3 derniers mois' },
    { id: 'custom', label: 'Période personnalisée' },
  ];

  // Charger les données au démarrage
  useEffect(() => {
    loadInitialData();
  }, []);

  // Calculer les dates selon la période sélectionnée
  useEffect(() => {
    calculateDates();
  }, [selectedPeriod]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les collecteurs et les rapports récents en parallèle
      await Promise.all([
        loadCollecteurs(),
        loadRecentReports()
      ]);
    } catch (err) {
      console.error('Erreur lors du chargement initial:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadCollecteurs = async () => {
    try {
      const response = await collecteurService.getAllCollecteurs();
      
      if (response.success) {
        // ✅ VÉRIFICATION AVANT ASSIGNATION
        const collecteursData = Array.isArray(response.data) ? response.data : [];
        setCollecteurs(collecteursData);
      } else {
        console.warn('Erreur lors du chargement des collecteurs:', response.error);
        setCollecteurs([]); // ✅ FALLBACK SÉCURISÉ
      }
    } catch (err) {
      console.error('Erreur lors du chargement des collecteurs:', err);
      setCollecteurs([]); // ✅ FALLBACK SÉCURISÉ
    }
  };

  const loadRecentReports = async () => {
    try {
      setLoadingReports(true);
      
      // Simuler une requête pour les rapports récents
      // En attendant l'implémentation de l'API /reports
      setTimeout(() => {
        setRecentReports([
          {
            id: 1,
            type: 'collecteur',
            title: 'Rapport Collecteur - Jean Dupont',
            date: new Date().toISOString(),
            status: 'completed',
            downloadUrl: null
          },
          {
            id: 2,
            type: 'commission',
            title: 'Rapport Commissions - Février 2025',
            date: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed',
            downloadUrl: null
          }
        ]);
        setLoadingReports(false);
      }, 1000);
      
      // TODO: Remplacer par l'appel API réel quand /reports sera implémenté
      // const response = await adminService.getRecentReports();
      // if (response.success) {
      //   setRecentReports(Array.isArray(response.data) ? response.data : []);
      // }
    } catch (err) {
      console.error('Erreur lors du chargement des rapports récents:', err);
      setRecentReports([]); // ✅ FALLBACK SÉCURISÉ
      setLoadingReports(false);
    }
  };

  const calculateDates = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (selectedPeriod) {
      case 'current_month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'last_3_months':
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      case 'custom':
        // Ne pas modifier les dates pour la période personnalisée
        return;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }
    
    setDateDebut(format(startDate, 'yyyy-MM-dd'));
    setDateFin(format(endDate, 'yyyy-MM-dd'));
  };

  const handleGenerateReport = async () => {
    // Validation des paramètres
    if (!selectedReportType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de rapport');
      return;
    }
    
    if ((selectedReportType === 'collecteur' || selectedReportType === 'commission') && !selectedCollecteur) {
      Alert.alert('Erreur', 'Veuillez sélectionner un collecteur');
      return;
    }
    
    if (!dateDebut || !dateFin) {
      Alert.alert('Erreur', 'Veuillez définir la période du rapport');
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      const reportParams = {
        type: selectedReportType,
        collecteurId: selectedCollecteur,
        dateDebut,
        dateFin
      };
      
      // TODO: Remplacer par l'appel API réel
      // const response = await adminService.generateReport(reportParams);
      
      // Simulation de génération de rapport
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Succès', 
        'Le rapport a été généré avec succès',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Recharger les rapports récents
              loadRecentReports();
            }
          }
        ]
      );
      
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err);
      Alert.alert('Erreur', err.message || 'Erreur lors de la génération du rapport');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = (report) => {
    if (!report || !report.downloadUrl) {
      Alert.alert('Information', 'Le téléchargement de ce rapport n\'est pas encore disponible');
      return;
    }
    
    // TODO: Implémenter le téléchargement
    Alert.alert('Information', 'Téléchargement en cours de développement');
  };

  const handleDeleteReport = (reportId) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer ce rapport ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // ✅ VÉRIFICATION AVANT FILTER
            if (Array.isArray(recentReports)) {
              setRecentReports(prev => prev.filter(report => report.id !== reportId));
            }
          }
        }
      ]
    );
  };

  // ✅ OPTIONS SÉCURISÉES POUR LES SELECTEURS
  const collecteurOptions = Array.isArray(collecteurs) 
    ? collecteurs.map(collecteur => ({
        id: collecteur.id,
        label: `${collecteur.prenom || ''} ${collecteur.nom || ''}`.trim() || 'Nom inconnu'
      }))
    : [];

  const reportTypeOptions = reportTypes.map(type => ({
    id: type.id,
    label: type.label
  }));

  // ✅ RENDU SÉCURISÉ DES RAPPORTS RÉCENTS
  const renderReportItem = ({ item }) => {
    // ✅ VÉRIFICATION DE L'ITEM
    if (!item) return null;

    return (
      <Card style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>{item.title || 'Rapport sans titre'}</Text>
            <Text style={styles.reportDate}>
              {item.date ? format(new Date(item.date), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'Date inconnue'}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            item.status === 'completed' ? styles.completedBadge : styles.pendingBadge
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'completed' ? 'Terminé' : 'En cours'}
            </Text>
          </View>
        </View>
        
        <View style={styles.reportActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDownloadReport(item)}
            disabled={item.status !== 'completed'}
          >
            <Ionicons 
              name="download" 
              size={16} 
              color={item.status === 'completed' ? theme.colors.primary : theme.colors.gray} 
            />
            <Text style={[
              styles.actionButtonText,
              { color: item.status === 'completed' ? theme.colors.primary : theme.colors.gray }
            ]}>
              Télécharger
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteReport(item.id)}
          >
            <Ionicons name="trash" size={16} color={theme.colors.error} />
            <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
              Supprimer
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // ✅ RENDU CONDITIONNEL AVEC GESTION D'ERREUR
  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Rapports"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInitialData}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Rapports"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollContainer}>
        {/* Génération de rapport */}
        <Card style={styles.generateCard}>
          <Text style={styles.sectionTitle}>Générer un nouveau rapport</Text>
          
          <SelectInput
            label="Type de rapport"
            placeholder="Sélectionner un type"
            value={selectedReportType}
            options={reportTypeOptions}
            onChange={setSelectedReportType}
            required
          />
          
          <SelectInput
            label="Période"
            placeholder="Sélectionner une période"
            value={selectedPeriod}
            options={periodOptions}
            onChange={setSelectedPeriod}
            required
          />
          
          {selectedPeriod === 'custom' && (
            <View style={styles.customDateContainer}>
              <Text style={styles.customDateText}>
                Période personnalisée: {dateDebut ? format(new Date(dateDebut), 'dd/MM/yyyy') : ''} 
                au {dateFin ? format(new Date(dateFin), 'dd/MM/yyyy') : ''}
              </Text>
              {/* TODO: Ajouter les composants DatePicker */}
            </View>
          )}
          
          {selectedPeriod !== 'custom' && (
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                Période: {dateDebut ? format(new Date(dateDebut), 'dd/MM/yyyy') : ''} 
                au {dateFin ? format(new Date(dateFin), 'dd/MM/yyyy') : ''}
              </Text>
            </View>
          )}
          
          {(selectedReportType === 'collecteur' || selectedReportType === 'commission') && (
            <SelectInput
              label="Collecteur"
              placeholder="Sélectionner un collecteur"
              value={selectedCollecteur}
              options={collecteurOptions}
              onChange={setSelectedCollecteur}
              disabled={loading}
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
            disabled={generating || loading}
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
          ) : Array.isArray(recentReports) && recentReports.length > 0 ? (
            <FlatList
              data={recentReports}
              renderItem={renderReportItem}
              keyExtractor={item => item?.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text" size={48} color={theme.colors.gray} />
              <Text style={styles.emptyText}>Aucun rapport généré</Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  generateCard: {
    margin: 16,
    marginBottom: 8,
  },
  recentReportsCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  customDateContainer: {
    marginVertical: 8,
  },
  customDateText: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  dateDisplay: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  generateButton: {
    marginTop: 16,
  },
  recentReportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportCard: {
    padding: 16,
    marginVertical: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  reportActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: theme.colors.lightGray,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginVertical: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
});

export default ReportsScreen;