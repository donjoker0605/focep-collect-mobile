// components/PhoneVerificationModal/PhoneVerificationModal.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../../components';
import theme from '../../theme';

/**
 * Modal pour vérifier/ajouter le numéro de téléphone d'un client
 * avant de procéder à une transaction
 */
const PhoneVerificationModal = ({
  visible,
  client,
  onClose,
  onAddPhone,
  onContinueWithoutPhone,
  transactionType = 'épargne'
}) => {
  
  const handleAddPhone = () => {
    onClose();
    onAddPhone(client);
  };

  const handleContinue = () => {
    Alert.alert(
      'Confirmer',
      `Êtes-vous sûr de vouloir continuer cette ${transactionType} sans numéro de téléphone pour ${client?.displayName || client?.nom + ' ' + client?.prenom} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            onClose();
            onContinueWithoutPhone();
          }
        }
      ]
    );
  };

  if (!visible || !client) return null;

  const clientName = client.displayName || `${client.prenom || ''} ${client.nom || ''}`.trim();
  const accountNumber = client.numeroCompte || client.numerCompte || 'N/A';

  return (
    <Modal
      isVisible={visible}
      title="Numéro de téléphone manquant"
      onClose={onClose}
      showCloseButton={true}
      size="medium"
      scrollable={false}
    >
      <View style={styles.content}>
        {/* Icône d'avertissement */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name="call-outline" 
            size={48} 
            color={theme.colors.warning} 
          />
        </View>

        {/* Informations client */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {clientName}
          </Text>
          <Text style={styles.accountNumber}>
            Compte: {accountNumber}
          </Text>
        </View>
        
        {/* Message principal */}
        <Text style={styles.message}>
          Ce client n'a pas de numéro de téléphone renseigné. 
          Il est recommandé d'ajouter un numéro pour faciliter 
          les communications futures.
        </Text>

        {/* Avertissement */}
        <View style={styles.warningBox}>
          <Ionicons 
            name="warning" 
            size={20} 
            color={theme.colors.warning} 
          />
          <Text style={styles.warningText}>
            Sans numéro de téléphone, le client ne pourra pas 
            recevoir de notifications sur ses transactions.
          </Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={onClose}
          >
            <Text style={styles.secondaryButtonText}>
              Annuler
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.warningButton]}
            onPress={handleContinue}
          >
            <Text style={styles.warningButtonText}>
              Continuer sans téléphone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleAddPhone}
          >
            <Ionicons 
              name="add" 
              size={16} 
              color="white" 
              style={styles.buttonIcon}
            />
            <Text style={styles.primaryButtonText}>
              Ajouter téléphone
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  clientInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  accountNumber: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.warning}10`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning,
    marginLeft: 12,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.lightGray,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningButton: {
    backgroundColor: theme.colors.warning,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '500',
    fontSize: 16,
  },
  warningButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default PhoneVerificationModal;