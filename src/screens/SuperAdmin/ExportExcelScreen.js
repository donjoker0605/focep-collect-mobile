// src/screens/SuperAdmin/ExportExcelScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import superAdminService from '../../services/superAdminService';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import theme from '../../theme';

const ExportExcelScreen = ({ navigation }) => {
  const { agences, loadAgences } = useSuperAdmin();
  
  const [isLoading, setIsLoading] = useState(false);
  const [exportType, setExportType] = useState('complete'); // complete, agence, summary
  const [selectedAgence, setSelectedAgence] = useState(null);
  const [includeInactifs, setIncludeInactifs] = useState(true);
  const [maxRecords, setMaxRecords] = useState('10000');
  
  // Gestion des dates
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);

  useEffect(() => {
    loadAgences();
  }, []);

  const handleExport = async () => {
    try {
      setIsLoading(true);

      let response;
      
      switch (exportType) {
        case 'complete':
          const filters = {
            agenceId: selectedAgence,
            dateDebut: dateDebut?.toISOString(),
            dateFin: dateFin?.toISOString(),
            includeInactifs,
            maxRecords: parseInt(maxRecords) || 10000
          };
          response = await superAdminService.exportExcelComplete(filters);
          break;
          
        case 'agence':
          if (!selectedAgence) {
            Alert.alert('Erreur', 'Veuillez sélectionner une agence');
            return;
          }
          response = await superAdminService.exportExcelAgence(selectedAgence);
          break;
          
        case 'summary':
          response = await superAdminService.exportExcelSummary();
          break;
          
        default:
          Alert.alert('Erreur', 'Type d\'export non valide');
          return;
      }

      if (response.success) {
        await downloadFile(response.data, response.fileName);
        Alert.alert('Succès', 'Export Excel terminé avec succès');
      } else {
        Alert.alert('Erreur', response.error);
      }
      
    } catch (error) {
      console.error('Erreur export:', error);
      Alert.alert('Erreur', 'Impossible de générer l\'export Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (blob, fileName) => {
    if (Platform.OS === 'web') {
      // Téléchargement sur navigateur web
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      // Sur mobile, utiliser le système de partage
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');
      
      try {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, blob, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Info', 'Fichier sauvegardé dans les documents');
        }
      } catch (error) {
        console.error('Erreur sauvegarde mobile:', error);
        Alert.alert('Erreur', 'Impossible de sauvegarder le fichier');
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Non définie';
    return date.toLocaleDateString('fr-FR');
  };

  const getEstimatedFileSize = () => {
    const records = parseInt(maxRecords) || 10000;
    if (exportType === 'summary') return '~500 KB';
    if (exportType === 'agence') return '~1-2 MB';
    if (records < 5000) return '~2-5 MB';
    return '~5-15 MB';
  };

  const getExportDescription = () => {
    switch (exportType) {
      case 'complete':
        return 'Export complet multi-onglets : Agences, Admins, Collecteurs, Clients, Transactions, Statistiques';
      case 'agence':
        return 'Export spécifique à une agence : Tous les utilisateurs et données de l\'agence sélectionnée';
      case 'summary':
        return 'Export résumé : Statistiques globales et données essentielles (format léger)';
      default:
        return '';
    }
  };

  if (!agences) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Export Excel" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des agences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Export Excel"
        onBack={() => navigation.goBack()}
        rightComponent={
          <Ionicons name="download" size={24} color={theme.colors.white} />
        }
      />
      
      <ScrollView style={styles.content}>
        {/* Type d'export */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Type d'Export</Text>
          
          <View style={styles.exportTypeContainer}>
            {[
              { key: 'complete', label: 'Export Complet', icon: 'document-text' },
              { key: 'agence', label: 'Par Agence', icon: 'business' },
              { key: 'summary', label: 'Résumé', icon: 'analytics' }
            ].map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.exportTypeCard,
                  exportType === type.key && styles.exportTypeCardActive
                ]}
                onPress={() => setExportType(type.key)}
              >
                <Ionicons 
                  name={type.icon} 
                  size={24} 
                  color={exportType === type.key ? theme.colors.white : theme.colors.primary} 
                />
                <Text style={[
                  styles.exportTypeLabel,
                  exportType === type.key && styles.exportTypeLabelActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.exportDescription}>
            {getExportDescription()}
          </Text>
        </Card>

        {/* Filtres */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Filtres</Text>
          
          {/* Sélection agence */}
          {(exportType === 'agence' || exportType === 'complete') && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>
                Agence {exportType === 'agence' ? '(obligatoire)' : '(optionnel)'}
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedAgence}
                  onValueChange={setSelectedAgence}
                  style={styles.picker}
                >
                  <Picker.Item 
                    label={exportType === 'agence' ? "Sélectionner une agence" : "Toutes les agences"} 
                    value={null} 
                  />
                  {agences.map((agence) => (
                    <Picker.Item
                      key={agence.id}
                      label={`${agence.nomAgence} (${agence.codeAgence})`}
                      value={agence.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Période */}
          {exportType === 'complete' && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Période (optionnel)</Text>
              
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDateDebutPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    Du: {formatDate(dateDebut)}
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDateFinPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    Au: {formatDate(dateFin)}
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Clear dates */}
              {(dateDebut || dateFin) && (
                <TouchableOpacity
                  style={styles.clearDatesButton}
                  onPress={() => {
                    setDateDebut(null);
                    setDateFin(null);
                  }}
                >
                  <Text style={styles.clearDatesText}>Effacer les dates</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Options */}
          {exportType === 'complete' && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Options</Text>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIncludeInactifs(!includeInactifs)}
              >
                <Ionicons
                  name={includeInactifs ? "checkbox" : "square-outline"}
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.checkboxLabel}>Inclure les utilisateurs inactifs</Text>
              </TouchableOpacity>
              
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Limite d'enregistrements:</Text>
                <Input
                  value={maxRecords}
                  onChangeText={setMaxRecords}
                  keyboardType="numeric"
                  placeholder="10000"
                  style={styles.maxRecordsInput}
                />
              </View>
            </View>
          )}
        </Card>

        {/* Informations */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Taille estimée</Text>
              <Text style={styles.infoValue}>{getEstimatedFileSize()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Format</Text>
              <Text style={styles.infoValue}>Excel (.xlsx)</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Onglets</Text>
              <Text style={styles.infoValue}>
                {exportType === 'summary' ? '2 onglets' : '6 onglets'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Compatible</Text>
              <Text style={styles.infoValue}>Core Banking</Text>
            </View>
          </View>
          
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              L'export peut prendre quelques minutes selon la quantité de données.
              Ne fermez pas l'application pendant la génération.
            </Text>
          </View>
        </Card>

        {/* Bouton d'export */}
        <Card style={styles.section}>
          <Button
            title={isLoading ? "Génération en cours..." : "Générer l'Export Excel"}
            onPress={handleExport}
            disabled={isLoading || (exportType === 'agence' && !selectedAgence)}
            icon="download"
            loading={isLoading}
          />
        </Card>
      </ScrollView>

      {/* Date Pickers */}
      {showDateDebutPicker && (
        <DateTimePicker
          value={dateDebut || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDateDebutPicker(false);
            if (selectedDate) {
              setDateDebut(selectedDate);
            }
          }}
        />
      )}

      {showDateFinPicker && (
        <DateTimePicker
          value={dateFin || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDateFinPicker(false);
            if (selectedDate) {
              setDateFin(selectedDate);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  exportTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exportTypeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  exportTypeCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  exportTypeLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  exportTypeLabelActive: {
    color: theme.colors.white,
  },
  exportDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
  },
  picker: {
    height: 50,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  dateButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  clearDatesButton: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 8,
  },
  clearDatesText: {
    fontSize: 14,
    color: theme.colors.error,
    textDecorationLine: 'underline',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  maxRecordsInput: {
    width: 100,
    marginLeft: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    width: '48%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: theme.colors.warning + '20',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    flex: 1,
  },
});

export default ExportExcelScreen;