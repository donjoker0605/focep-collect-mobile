// src/components/ReportGenerator/ReportGenerator.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as MediaLibrary from 'expo-media-library';
import Card from '../Card/Card';
import Button from '../Button/Button';
import SelectInput from '../SelectInput/SelectInput';
import DatePicker from '../DatePicker/DatePicker';
import theme from '../../theme';

const REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  COLLECTE: 'collecte',
  COMMISSION: 'commission',
  CLIENT: 'client',
  CUSTOM: 'custom',
};

const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
};

const ReportGenerator = ({
  title = 'Générateur de rapports',
  availableReportTypes = Object.values(REPORT_TYPES),
  defaultType = REPORT_TYPES.DAILY,
  defaultFormat = EXPORT_FORMATS.PDF,
  defaultStartDate = new Date(),
  defaultEndDate = new Date(),
  onGenerateReport,
  onReportGenerated,
  allowDateRange = true,
  allowFormatSelection = true,
  showPreview = true,
  collecteurId,
  agenceId,
  clientId,
  customFilters,
  customOptions,
  style,
  loading = false,
}) => {
  // États
  const [reportType, setReportType] = useState(defaultType);
  const [exportFormat, setExportFormat] = useState(defaultFormat);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [isGenerating, setIsGenerating] = useState(loading);
  const [generatedReportUri, setGeneratedReportUri] = useState(null);
  const [reportPreviewHtml, setReportPreviewHtml] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [generatedFileName, setGeneratedFileName] = useState('');

  // Mise à jour de l'état de chargement depuis la prop
  useEffect(() => {
    setIsGenerating(loading);
  }, [loading]);

  // Réinitialiser l'URL du rapport généré lorsque les critères changent
  useEffect(() => {
    setGeneratedReportUri(null);
    setReportPreviewHtml('');
  }, [reportType, exportFormat, startDate, endDate, selectedFilters]);

  // Options pour le sélecteur de type de rapport
  const reportTypeOptions = availableReportTypes.map(type => {
    let label;
    switch (type) {
      case REPORT_TYPES.DAILY:
        label = 'Rapport journalier';
        break;
      case REPORT_TYPES.WEEKLY:
        label = 'Rapport hebdomadaire';
        break;
      case REPORT_TYPES.MONTHLY:
        label = 'Rapport mensuel';
        break;
      case REPORT_TYPES.COLLECTE:
        label = 'Rapport de collecte';
        break;
      case REPORT_TYPES.COMMISSION:
        label = 'Rapport de commission';
        break;
      case REPORT_TYPES.CLIENT:
        label = 'Rapport client';
        break;
      case REPORT_TYPES.CUSTOM:
        label = 'Rapport personnalisé';
        break;
      default:
        label = type;
    }
    return { value: type, label };
  });

  // Options pour le sélecteur de format d'exportation
  const formatOptions = [
    { value: EXPORT_FORMATS.PDF, label: 'PDF' },
    { value: EXPORT_FORMATS.EXCEL, label: 'Excel' },
    { value: EXPORT_FORMATS.CSV, label: 'CSV' },
  ];

  // Générer un nom de fichier pour le rapport
  const generateFileName = () => {
    const dateFormat = new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const currentDate = dateFormat.format(new Date()).replace(/\//g, '-');
    
    let prefix;
    switch (reportType) {
      case REPORT_TYPES.DAILY:
        prefix = 'rapport_journalier';
        break;
      case REPORT_TYPES.WEEKLY:
        prefix = 'rapport_hebdomadaire';
        break;
      case REPORT_TYPES.MONTHLY:
        prefix = 'rapport_mensuel';
        break;
      case REPORT_TYPES.COLLECTE:
        prefix = 'rapport_collecte';
        break;
      case REPORT_TYPES.COMMISSION:
        prefix = 'rapport_commission';
        break;
      case REPORT_TYPES.CLIENT:
        prefix = 'rapport_client';
        break;
      case REPORT_TYPES.CUSTOM:
        prefix = 'rapport_personnalise';
        break;
      default:
        prefix = 'rapport';
    }
    
    let extension;
    switch (exportFormat) {
      case EXPORT_FORMATS.PDF:
        extension = 'pdf';
        break;
      case EXPORT_FORMATS.EXCEL:
        extension = 'xlsx';
        break;
      case EXPORT_FORMATS.CSV:
        extension = 'csv';
        break;
      default:
        extension = 'pdf';
    }
    
    return `${prefix}_${currentDate}.${extension}`;
  };

  // Gérer la génération du rapport
  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setGeneratedReportUri(null);
      setReportPreviewHtml('');
      
      // Vérifier que la date de fin est postérieure à la date de début
      if (allowDateRange && endDate < startDate) {
        Alert.alert(
          'Erreur de date',
          'La date de fin doit être postérieure à la date de début.'
        );
        setIsGenerating(false);
        return;
      }
      
      // Préparer les paramètres du rapport
      const reportParams = {
        reportType,
        exportFormat,
        startDate,
        endDate,
        collecteurId,
        agenceId,
        clientId,
        ...selectedFilters,
        ...customOptions,
      };
      
      // Génération gérée par le composant parent
      if (onGenerateReport) {
        const result = await onGenerateReport(reportParams);
        
        if (result && result.uri) {
          setGeneratedReportUri(result.uri);
          setGeneratedFileName(result.fileName || generateFileName());
          
          if (result.previewHtml && showPreview) {
            setReportPreviewHtml(result.previewHtml);
          }
          
          if (onReportGenerated) {
            onReportGenerated(result);
          }
        }
        
        setIsGenerating(false);
        return;
      }
      
      // Génération simple pour la démo (à remplacer par l'API réelle)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Créer un fichier de démonstration
      const fileName = generateFileName();
      let fileUri;
      let previewContent = '';
      
      if (exportFormat === EXPORT_FORMATS.PDF) {
        // Générer un PDF de démo
        const htmlContent = `
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
              <style>
                body {
                  font-family: Helvetica, Arial, sans-serif;
                  padding: 20px;
                }
                h1 {
                  color: #0066cc;
                  text-align: center;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .date {
                  text-align: right;
                  margin-bottom: 20px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #f2f2f2;
                }
                .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${title} - ${reportTypeOptions.find(opt => opt.value === reportType)?.label}</h1>
                <p>FOCEP Microfinance</p>
              </div>
              
              <div class="date">
                <p>Date du rapport: ${new Date().toLocaleDateString('fr-FR')}</p>
                ${allowDateRange ? 
                  `<p>Période: ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}</p>` : 
                  ''}
              </div>
              
              <h2>Détails du rapport</h2>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
                <tr>
                  <td>01/04/2025</td>
                  <td>Épargne</td>
                  <td>25 000 FCFA</td>
                  <td>Complété</td>
                </tr>
                <tr>
                  <td>02/04/2025</td>
                  <td>Retrait</td>
                  <td>10 000 FCFA</td>
                  <td>Complété</td>
                </tr>
                <tr>
                  <td>03/04/2025</td>
                  <td>Épargne</td>
                  <td>15 000 FCFA</td>
                  <td>Complété</td>
                </tr>
                <tr>
                  <td>03/04/2025</td>
                  <td>Commission</td>
                  <td>1 200 FCFA</td>
                  <td>Complété</td>
                </tr>
              </table>
              
              <h2>Résumé</h2>
              <table>
                <tr>
                  <th>Total Épargne</th>
                  <th>Total Retrait</th>
                  <th>Total Commission</th>
                </tr>
                <tr>
                  <td>40 000 FCFA</td>
                  <td>10 000 FCFA</td>
                  <td>1 200 FCFA</td>
                </tr>
              </table>
              
              <div class="footer">
                <p>Rapport généré automatiquement - FOCEP Collect © ${new Date().getFullYear()}</p>
              </div>
            </body>
          </html>
        `;
        
        const pdfFile = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        
        fileUri = pdfFile.uri;
        previewContent = htmlContent;
      } else {
        // Créer un fichier CSV ou Excel de démo
        const demoContent = exportFormat === EXPORT_FORMATS.CSV
          ? 'Date,Type,Montant,Statut\n01/04/2025,Épargne,25000,Complété\n02/04/2025,Retrait,10000,Complété\n03/04/2025,Épargne,15000,Complété\n03/04/2025,Commission,1200,Complété'
          : 'Fichier Excel de démonstration - Remplacer par une vraie génération Excel';
        
        fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, demoContent);
        
        previewContent = `<pre>${demoContent}</pre>`;
      }
      
      setGeneratedReportUri(fileUri);
      setGeneratedFileName(fileName);
      
      if (showPreview) {
        setReportPreviewHtml(previewContent);
      }
      
      if (onReportGenerated) {
        onReportGenerated({
          uri: fileUri,
          fileName,
          format: exportFormat,
          previewHtml: previewContent,
        });
      }
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      setIsGenerating(false);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la génération du rapport. Veuillez réessayer.'
      );
    }
  };

  // Partager le rapport généré
  const handleShareReport = async () => {
    try {
      if (!generatedReportUri) {
        Alert.alert('Erreur', 'Aucun rapport n\'a été généré.');
        return;
      }
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(generatedReportUri, {
          mimeType: exportFormat === EXPORT_FORMATS.PDF ? 'application/pdf' : 
                    exportFormat === EXPORT_FORMATS.EXCEL ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                    'text/csv',
          dialogTitle: `Partager ${generatedFileName}`,
        });
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil.');
      }
    } catch (error) {
      console.error('Erreur lors du partage du rapport:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du partage du rapport.');
    }
  };

  // Télécharger le rapport
  const handleDownloadReport = async () => {
    try {
      if (!generatedReportUri) {
        Alert.alert('Erreur', 'Aucun rapport n\'a été généré.');
        return;
      }
      
      // Demander les permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin des permissions pour sauvegarder le rapport.');
        return;
      }
      
      // Enregistrer dans la galerie
      const asset = await MediaLibrary.createAssetAsync(generatedReportUri);
      const album = await MediaLibrary.getAlbumAsync('FOCEP Rapports');
      
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('FOCEP Rapports', asset, false);
      }
      
      Alert.alert(
        'Succès',
        `Le rapport a été téléchargé avec succès dans l'album "FOCEP Rapports".`
      );
    } catch (error) {
      console.error('Erreur lors du téléchargement du rapport:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du téléchargement du rapport.');
    }
  };

  // Pour l'impression directe
  const handlePrintReport = async () => {
    try {
      if (!generatedReportUri) {
        Alert.alert('Erreur', 'Aucun rapport n\'a été généré.');
        return;
      }
      
      if (exportFormat === EXPORT_FORMATS.PDF) {
        await Print.printAsync({
          uri: generatedReportUri,
        });
      } else {
        Alert.alert(
          'Impression non disponible',
          `L'impression directe n'est disponible que pour les rapports au format PDF.`
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression du rapport:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'impression du rapport.');
    }
  };

  // Rendu conditionnel pour la prévisualisation
  const renderPreview = () => {
    if (!showPreview || !generatedReportUri || !reportPreviewHtml) {
      return null;
    }
    
    // Utiliser un style différent selon le format
    const previewStyle = exportFormat === EXPORT_FORMATS.PDF
      ? { height: 300 }
      : { maxHeight: 200 };
    
    return (
      <Card style={styles.previewCard}>
        <Text style={styles.previewTitle}>Aperçu du rapport</Text>
        
        <View style={[styles.previewContainer, previewStyle]}>
          {Platform.OS === 'web' ? (
            <div
              style={{ width: '100%', height: '100%', overflow: 'auto' }}
              dangerouslySetInnerHTML={{ __html: reportPreviewHtml }}
            />
          ) : (
            <ScrollView contentContainerStyle={styles.previewScrollContent}>
              <Text style={styles.previewPlaceholder}>
                Aperçu disponible sur le web. Sur mobile, utilisez les boutons ci-dessous pour partager ou télécharger le rapport.
              </Text>
            </ScrollView>
          )}
        </View>
      </Card>
    );
  };

  // Rendu principal du composant
  return (
    <View style={[styles.container, style]}>
      <Card style={styles.formCard}>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.formSection}>
          <SelectInput
            label="Type de rapport"
            value={reportType}
            options={reportTypeOptions}
            onChange={setReportType}
            placeholder="Sélectionner un type de rapport"
          />
          
          {allowFormatSelection && (
            <SelectInput
              label="Format d'exportation"
              value={exportFormat}
              options={formatOptions}
              onChange={setExportFormat}
              placeholder="Sélectionner un format"
              style={styles.inputSpacing}
            />
          )}
          
          {allowDateRange && (
            <View style={styles.dateRangeContainer}>
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Date de début</Text>
                <DatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  style={styles.datePicker}
                />
              </View>
              
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Date de fin</Text>
                <DatePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  style={styles.datePicker}
                  minimumDate={startDate}
                />
              </View>
            </View>
          )}
          
          {/* Filtres personnalisés si fournis */}
          {customFilters && (
            <View style={styles.customFiltersContainer}>
              {customFilters.map((filter, index) => (
                <View key={index} style={styles.customFilterItem}>
                  {filter}
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          <Button
            title="Générer le rapport"
            onPress={handleGenerateReport}
            loading={isGenerating}
            disabled={isGenerating}
            fullWidth
          />
        </View>
      </Card>
      
      {/* Prévisualisation du rapport */}
      {renderPreview()}
      
      {/* Actions sur le rapport généré */}
      {generatedReportUri && (
        <Card style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Actions sur le rapport</Text>
          
          <View style={styles.reportActions}>
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={handleShareReport}
            >
              <Ionicons name="share-social-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.reportActionText}>Partager</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={handleDownloadReport}
            >
              <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.reportActionText}>Télécharger</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={handlePrintReport}
            >
              <Ionicons name="print-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.reportActionText}>Imprimer</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.fileName}>{generatedFileName}</Text>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  formCard: {
    padding: 16,
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 16,
  },
  inputSpacing: {
    marginTop: 16,
  },
  dateRangeContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerContainer: {
    flex: 1,
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  datePicker: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 8,
  },
  customFiltersContainer: {
    marginTop: 16,
  },
  customFilterItem: {
    marginBottom: 12,
  },
  actionsContainer: {
    marginTop: 8,
  },
  previewCard: {
    padding: 16,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewScrollContent: {
    padding: 16,
  },
  previewPlaceholder: {
    padding: 16,
    textAlign: 'center',
    color: theme.colors.textLight,
  },
  actionsCard: {
    padding: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  reportActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  reportActionText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.primary,
  },
  fileName: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 8,
  },
});

// Exporter les constantes pour utilisation externe
export { REPORT_TYPES, EXPORT_FORMATS };
export default ReportGenerator;