// components/PhoneVerificationModal/PhoneVerificationModal.js - VERSION CORRIGÉE

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ CORRECTION : Imports locaux
import Button from '../Button/Button';
import theme from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Modal de vérification téléphone pour les transactions
 * Averti l'utilisateur quand un client n'a pas de téléphone renseigné
 */
const PhoneVerificationModal = ({
  visible,
  client,
  transactionType = 'epargne',
  onClose,
  onAddPhone,
  onContinueWithoutPhone,
}) => {
  const insets = useSafeAreaInsets();

  if (!client) return null;

  const handleAddPhone = () => {
    onClose();
    onAddPhone(client);
  };

  const handleContinueWithoutPhone = () => {
    onContinueWithoutPhone();
    onClose();
  };

  const renderContent = () => (
    <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Icon warning */}
      <View style={styles.iconContainer}>
        <View style={styles.warningIcon}>
          <Ionicons name="call-outline" size={40} color={theme.colors.warning} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        Numéro de téléphone manquant
      </Text>

      {/* Client info */}
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>
          {client.displayName || `${client.prenom} ${client.nom}`}
        </Text>
        <Text style={styles.clientAccount}>
          Compte: {client.numeroCompte}
        </Text>
      </View>

      {/* Warning message */}
      <Text style={styles.warningText}>
        Ce client n'a pas de numéro de téléphone renseigné. Il est recommandé d'avoir un contact téléphonique pour les transactions d'{transactionType}.
      </Text>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title="Ajouter un téléphone"
          onPress={handleAddPhone}
          style={styles.primaryButton}
          icon="call"
        />
        
        <Button
          title="Continuer sans téléphone"
          onPress={handleContinueWithoutPhone}
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
          variant="outline"
        />
      </View>

      {/* Info footer */}
      <View style={styles.infoFooter}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.textLight} />
        <Text style={styles.infoText}>
          Le téléphone permet de contacter le client en cas de problème avec la transaction.
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            {renderContent()}
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 30,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.text,
    marginBottom: 16,
  },
  clientInfo: {
    padding: 16,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  warningText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: theme.colors.text,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: `${theme.colors.info}10`,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textLight,
    flex: 1,
    lineHeight: 16,
  },
});

export default PhoneVerificationModal;