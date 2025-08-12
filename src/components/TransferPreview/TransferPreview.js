// src/components/TransferPreview/TransferPreview.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';
import { Card, Button } from '../index';
import { transferService } from '../../services';
import * as HapticsCompat from '../../utils/haptics';

const TransferPreview = ({
  sourceCollecteur,
  destinationCollecteur,
  selectedClients,
  onConfirm,
  onCancel,
  visible = true
}) => {
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Validation automatique au montage du composant
  useEffect(() => {
    if (visible && sourceCollecteur && destinationCollecteur && selectedClients.length > 0) {
      validateTransfer();
    }
  }, [sourceCollecteur, destinationCollecteur, selectedClients, visible]);

  const validateTransfer = async () => {
    try {
      setLoading(true);
      
      const transferData = {
        sourceCollecteurId: sourceCollecteur.value,
        targetCollecteurId: destinationCollecteur.value,
        clientIds: selectedClients.map(c => c.id)
      };

      // Appel à l'endpoint de validation unifié (dry-run)
      const response = await transferService.validateTransfer(transferData);
      
      if (response.success) {
        setValidation(response.data);
        
        // Feedback haptique selon le résultat
        if (response.data.valid) {
          HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Success);
        } else {
          HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Warning);
        }
      } else {
        throw new Error(response.error || 'Erreur de validation');
      }
    } catch (error) {
      console.error('Erreur validation transfert:', error);
      setValidation({
        valid: false,
        errors: [error.message || 'Erreur lors de la validation'],
        warnings: [],
        summary: 'Validation échouée'
      });
      HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!validation?.valid) {
      Alert.alert(
        'Transfert non autorisé',
        'La validation a échoué. Veuillez vérifier les erreurs.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Si des avertissements critiques, demander confirmation
    if (validation.hasWarnings && validation.requiresApproval) {
      Alert.alert(
        'Confirmation requise',
        'Ce transfert présente des risques. Êtes-vous sûr de vouloir continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            style: 'destructive',
            onPress: () => onConfirm(true) // Force confirmation
          }
        ]
      );
    } else {
      onConfirm(false); // Transfert normal
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Aperçu du transfert</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Informations du transfert */}
          <Card style={styles.transferInfo}>
            <View style={styles.transferFlow}>
              {/* Collecteur source */}
              <View style={styles.collecteurCard}>
                <Text style={styles.collecteurLabel}>De</Text>
                <Text style={styles.collecteurName}>{sourceCollecteur?.label}</Text>
                <Text style={styles.clientCount}>
                  {selectedClients.length} client{selectedClients.length > 1 ? 's' : ''}
                </Text>
              </View>

              {/* Flèche */}
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={24} color={theme.colors.primary} />
              </View>

              {/* Collecteur destination */}
              <View style={styles.collecteurCard}>
                <Text style={styles.collecteurLabel}>Vers</Text>
                <Text style={styles.collecteurName}>{destinationCollecteur?.label}</Text>
              </View>
            </View>
          </Card>

          {/* État de la validation */}
          {loading ? (
            <Card style={styles.validationCard}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Validation en cours...</Text>
              </View>
            </Card>
          ) : validation ? (
            <Card style={[styles.validationCard, validation.valid ? styles.validCard : styles.invalidCard]}>
              <View style={styles.validationHeader}>
                <Ionicons 
                  name={validation.valid ? "checkmark-circle" : "alert-circle"} 
                  size={24} 
                  color={validation.valid ? theme.colors.success : theme.colors.error} 
                />
                <Text style={[styles.validationStatus, {
                  color: validation.valid ? theme.colors.success : theme.colors.error
                }]}>
                  {validation.valid ? 'Transfert autorisé' : 'Transfert rejeté'}
                </Text>
              </View>

              <Text style={styles.validationSummary}>{validation.summary}</Text>

              {/* Erreurs */}
              {validation.errors && validation.errors.length > 0 && (
                <View style={styles.messagesContainer}>
                  <Text style={styles.messagesTitle}>❌ Erreurs :</Text>
                  {validation.errors.map((error, index) => (
                    <Text key={index} style={styles.errorMessage}>• {error}</Text>
                  ))}
                </View>
              )}

              {/* Avertissements */}
              {validation.warnings && validation.warnings.length > 0 && (
                <View style={styles.messagesContainer}>
                  <Text style={styles.messagesTitle}>⚠️ Avertissements :</Text>
                  {validation.warnings.map((warning, index) => (
                    <Text key={index} style={styles.warningMessage}>• {warning}</Text>
                  ))}
                </View>
              )}

              {/* Détails étendus */}
              {validation.valid && (
                <TouchableOpacity 
                  style={styles.detailsToggle}
                  onPress={() => setShowDetails(!showDetails)}
                >
                  <Text style={styles.detailsToggleText}>
                    {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
                  </Text>
                  <Ionicons 
                    name={showDetails ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </Card>
          ) : null}

          {/* Détails étendus */}
          {showDetails && validation?.valid && (
            <Card style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Détails du transfert</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Clients valides :</Text>
                <Text style={styles.detailValue}>
                  {validation.validClientsCount || selectedClients.length} / {selectedClients.length}
                </Text>
              </View>

              {validation.totalBalance && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Montant total :</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(validation.totalBalance)} FCFA
                  </Text>
                </View>
              )}

              {validation.interAgenceTransfer && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type :</Text>
                  <Text style={[styles.detailValue, styles.interAgence]}>
                    Transfert inter-agences
                  </Text>
                </View>
              )}

              {validation.estimatedTransferFees && validation.estimatedTransferFees > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Frais estimés :</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(validation.estimatedTransferFees)} FCFA
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Liste des clients sélectionnés */}
          <Card style={styles.clientsCard}>
            <Text style={styles.clientsTitle}>
              Clients à transférer ({selectedClients.length})
            </Text>
            
            <View style={styles.clientsList}>
              {selectedClients.slice(0, 5).map((client, index) => (
                <View key={client.id} style={styles.clientItem}>
                  <Text style={styles.clientName}>
                    {client.prenom} {client.nom}
                  </Text>
                  <Text style={styles.clientNumber}>
                    {client.numeroCni || 'Sans CNI'}
                  </Text>
                </View>
              ))}
              
              {selectedClients.length > 5 && (
                <Text style={styles.moreClients}>
                  ... et {selectedClients.length - 5} autre{selectedClients.length - 5 > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </Card>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Annuler"
            onPress={onCancel}
            style={[styles.actionButton, styles.cancelButton]}
            textStyle={styles.cancelButtonText}
          />
          <Button
            title={validation?.requiresApproval ? "Forcer le transfert" : "Confirmer le transfert"}
            onPress={handleConfirm}
            disabled={!validation?.valid || loading}
            style={[styles.actionButton, styles.confirmButton]}
            loading={loading}
          />
        </View>
      </View>
    </View>
  );
};

// Utilitaires
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.3)',
  },
  scrollView: {
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray + '20',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  transferInfo: {
    margin: 16,
    padding: 16,
  },
  transferFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collecteurCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  collecteurLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  collecteurName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  clientCount: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  arrow: {
    marginHorizontal: 16,
    padding: 8,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 20,
  },
  validationCard: {
    margin: 16,
    padding: 16,
  },
  validCard: {
    borderColor: theme.colors.success,
    borderWidth: 1,
    backgroundColor: theme.colors.success + '05',
  },
  invalidCard: {
    borderColor: theme.colors.error,
    borderWidth: 1,
    backgroundColor: theme.colors.error + '05',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validationStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  validationSummary: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  messagesContainer: {
    marginTop: 12,
  },
  messagesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: theme.colors.error,
    marginBottom: 2,
    paddingLeft: 8,
  },
  warningMessage: {
    fontSize: 13,
    color: '#FF8C00',
    marginBottom: 2,
    paddingLeft: 8,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray + '20',
  },
  detailsToggleText: {
    color: theme.colors.primary,
    fontWeight: '500',
    marginRight: 8,
  },
  detailsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  interAgence: {
    color: '#FF8C00',
  },
  clientsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  clientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  clientsList: {
    // Pas de styles spéciaux
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray + '10',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  clientNumber: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  moreClients: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray + '20',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  cancelButtonText: {
    color: theme.colors.text,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
});

export default TransferPreview;