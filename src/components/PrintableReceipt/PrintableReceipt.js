// src/components/PrintableReceipt/PrintableReceipt.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import theme from '../../theme';

// Logo en base64 (à remplacer par votre logo réel encodé en base64)
const defaultLogo = 'data:image/png;base64,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';

const PrintableReceipt = ({
  transaction,
  logo = defaultLogo,
  companyName = 'FOCEP Microfinance',
  companyAddress = 'Douala, Cameroun',
  companyPhone = '+237 123 456 789',
  companyEmail = 'contact@focep.cm',
  companyWebsite = 'www.focep.cm',
  style,
  showActions = true,
  onPrint,
  onShare,
  onDownload,
  printButtonText = 'Imprimer',
  shareButtonText = 'Partager',
  downloadButtonText = 'Télécharger',
  receiptTitle = 'Reçu de transaction',
  receiptFooter = 'Merci de votre confiance',
  taxRate = 19.25, // Taux TVA
  showCommission = true,
  actionPosition = 'bottom', // top, bottom
  printing = false,
  sharing = false,
  downloading = false,
  autoGenerateFilename = true,
  filenamePrefix = 'recu_',
  imageQuality = 0.8,
}) => {
  const viewShotRef = useRef(null);
  const [imageURI, setImageURI] = useState(null);
  const [isPrinting, setIsPrinting] = useState(printing);
  const [isSharing, setIsSharing] = useState(sharing);
  const [isDownloading, setIsDownloading] = useState(downloading);
  
  // Fonction pour formater la date
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd MMMM yyyy à HH:mm', { locale: fr });
  };
  
  // Fonction pour formater le montant avec séparateur de milliers
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0';
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  
  // Générer un nom de fichier pour le reçu
  const generateFilename = () => {
    if (!transaction) return `${filenamePrefix}${Date.now()}`;
    
    const date = new Date();
    const dateStr = format(date, 'yyyyMMdd_HHmmss');
    const type = transaction.type || 'transaction';
    const clientName = transaction.clientInfo ? 
      `${transaction.clientInfo.prenom}_${transaction.clientInfo.nom}` : 
      'client';
    
    return `${filenamePrefix}${type}_${clientName}_${dateStr}`;
  };
  
  // Capturer l'image du reçu
  const captureReceipt = async () => {
    if (!viewShotRef.current) return null;
    
    try {
      const uri = await viewShotRef.current.capture();
      setImageURI(uri);
      return uri;
    } catch (error) {
      console.error('Erreur lors de la capture du reçu:', error);
      return null;
    }
  };
  
  // Générer le HTML pour l'impression
  const generateHtml = (imageUri) => {
    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: Helvetica, Arial, sans-serif;
              padding: 20px;
              text-align: center;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img src="${imageUri}" />
        </body>
      </html>
    `;
  };
  
  // Imprimer le reçu
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      
      if (onPrint) {
        await onPrint();
        setIsPrinting(false);
        return;
      }
      
      const uri = await captureReceipt();
      if (!uri) {
        setIsPrinting(false);
        return;
      }
      
      const html = generateHtml(uri);
      await Print.printAsync({
        html,
      });
      
      setIsPrinting(false);
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      setIsPrinting(false);
    }
  };
  
  // Partager le reçu
  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      if (onShare) {
        await onShare();
        setIsSharing(false);
        return;
      }
      
      const uri = await captureReceipt();
      if (!uri) {
        setIsSharing(false);
        return;
      }
      
      // Partager l'image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        alert('Le partage n\'est pas disponible sur cet appareil');
      }
      
      setIsSharing(false);
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      setIsSharing(false);
    }
  };
  
  // Télécharger le reçu comme image
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      if (onDownload) {
        await onDownload();
        setIsDownloading(false);
        return;
      }
      
      // Vérifier les permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Désolé, nous avons besoin des permissions pour télécharger les images');
        setIsDownloading(false);
        return;
      }
      
      const uri = await captureReceipt();
      if (!uri) {
        setIsDownloading(false);
        return;
      }
      
      // Sauvegarder dans la galerie
      const filename = autoGenerateFilename ? generateFilename() : filenamePrefix;
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('FOCEP Reçus', asset, false);
      
      alert('Reçu sauvegardé dans la galerie');
      setIsDownloading(false);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setIsDownloading(false);
    }
  };
  
  // Calculer le montant de la commission
  const calculateCommission = () => {
    if (!transaction || !transaction.montant || !showCommission) return 0;
    
    // Pour cet exemple, on considère que la commission est de 2% du montant
    // Dans une implémentation réelle, vous utiliseriez le taux de commission effectif
    return transaction.montant * 0.02;
  };
  
  // Calculer la TVA sur la commission
  const calculateTax = () => {
    const commission = calculateCommission();
    return commission * (taxRate / 100);
  };
  
  // Rendu des boutons d'action
  const renderActions = () => {
    if (!showActions) return null;
    
    return (
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={handlePrint}
          disabled={isPrinting || isSharing || isDownloading}
        >
          {isPrinting ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <>
              <Ionicons name="print-outline" size={16} color={theme.colors.white} />
              <Text style={styles.actionButtonText}>{printButtonText}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
          disabled={isPrinting || isSharing || isDownloading}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <>
              <Ionicons name="share-social-outline" size={16} color={theme.colors.white} />
              <Text style={styles.actionButtonText}>{shareButtonText}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={handleDownload}
          disabled={isPrinting || isSharing || isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <>
              <Ionicons name="download-outline" size={16} color={theme.colors.white} />
              <Text style={styles.actionButtonText}>{downloadButtonText}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  // Vérifier si les données de transaction sont présentes
  if (!transaction) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>Aucune donnée de transaction disponible.</Text>
      </View>
    );
  }
  
  // Variables pour les montants
  const amount = transaction.montant || 0;
  const commission = calculateCommission();
  const tax = calculateTax();
  const total = amount - (transaction.isIncome ? 0 : commission);
  
  return (
    <View style={[styles.container, style]}>
      {actionPosition === 'top' && renderActions()}
      
      <ScrollView style={styles.scrollView}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'jpg', quality: imageQuality }}
          style={styles.receipt}
        >
          {/* En-tête du reçu */}
          <View style={styles.header}>
            <Image source={{ uri: logo }} style={styles.logo} />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.companyDetail}>{companyAddress}</Text>
              <Text style={styles.companyDetail}>{companyPhone}</Text>
              <Text style={styles.companyDetail}>{companyEmail}</Text>
              <Text style={styles.companyDetail}>{companyWebsite}</Text>
            </View>
          </View>
          
          {/* Titre du reçu */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{receiptTitle}</Text>
            <Text style={styles.receiptNumber}>N° {transaction.reference || `REF-${Date.now()}`}</Text>
            <Text style={styles.receiptDate}>
              Date: {formatDate(transaction.date || new Date())}
            </Text>
          </View>
          
          {/* Informations client */}
          {transaction.clientInfo && (
            <View style={styles.clientSection}>
              <Text style={styles.sectionTitle}>Informations client</Text>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {transaction.clientInfo.prenom} {transaction.clientInfo.nom}
                </Text>
                <Text style={styles.clientDetail}>
                  Compte: {transaction.clientInfo.numeroCompte || 'N/A'}
                </Text>
                <Text style={styles.clientDetail}>
                  Tél: {transaction.clientInfo.telephone || 'N/A'}
                </Text>
              </View>
            </View>
          )}
          
          {/* Détails de la transaction */}
          <View style={styles.transactionSection}>
            <Text style={styles.sectionTitle}>Détails de la transaction</Text>
            <View style={styles.transactionDetails}>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Type:</Text>
                <Text style={styles.transactionValue}>
                  {transaction.type || (transaction.isIncome ? 'Épargne' : 'Retrait')}
                </Text>
              </View>
              
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Statut:</Text>
                <Text style={[
                  styles.transactionValue,
                  transaction.status === 'completed' && styles.statusCompleted,
                  transaction.status === 'pending' && styles.statusPending,
                  transaction.status === 'failed' && styles.statusFailed,
                ]}>
                  {transaction.status === 'completed' ? 'Complété' :
                   transaction.status === 'pending' ? 'En attente' :
                   transaction.status === 'failed' ? 'Échoué' : 'Complété'}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Montant:</Text>
                <Text style={styles.transactionValue}>
                  {formatAmount(amount)} FCFA
                </Text>
              </View>
              
              {showCommission && (
                <>
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>Commission:</Text>
                    <Text style={styles.transactionValue}>
                      {formatAmount(commission)} FCFA
                    </Text>
                  </View>
                  
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>TVA ({taxRate}%):</Text>
                    <Text style={styles.transactionValue}>
                      {formatAmount(tax)} FCFA
                    </Text>
                  </View>
                </>
              )}
              
              <View style={styles.divider} />
              
              <View style={styles.transactionRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  {formatAmount(total)} FCFA
                </Text>
              </View>
            </View>
          </View>
          
          {/* Notes ou détails supplémentaires */}
          {transaction.details && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{transaction.details}</Text>
            </View>
          )}
          
          {/* Signature du collecteur */}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>Signature du collecteur:</Text>
            <View style={styles.signatureLine} />
          </View>
          
          {/* Pied de page */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{receiptFooter}</Text>
            <Text style={styles.footerCopyright}>
              © {new Date().getFullYear()} {companyName}
            </Text>
          </View>
        </ViewShot>
      </ScrollView>
      
      {actionPosition === 'bottom' && renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  receipt: {
    padding: 20,
    backgroundColor: theme.colors.white,
  },
  
  // En-tête
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginRight: 16,
  },
  companyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  
  // Titre
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  receiptDate: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  
  // Section client
  clientSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 4,
  },
  clientInfo: {
    marginTop: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  
  // Section transaction
  transactionSection: {
    marginBottom: 20,
  },
  transactionDetails: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusCompleted: {
    color: theme.colors.success,
  },
  statusPending: {
    color: theme.colors.warning,
  },
  statusFailed: {
    color: theme.colors.error,
  },
  
  // Notes
  notesSection: {
    marginBottom: 20,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  
  // Signature
  signatureSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  signatureLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  signatureLine: {
    height: 1,
    backgroundColor: theme.colors.text,
    width: '50%',
    marginTop: 16,
  },
  
  // Pied de page
  footer: {
    marginTop: 30,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  
  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  printButton: {
    backgroundColor: theme.colors.primary,
  },
  shareButton: {
    backgroundColor: theme.colors.info,
  },
  downloadButton: {
    backgroundColor: theme.colors.success,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.white,
    marginLeft: 4,
  },
});

export default PrintableReceipt;