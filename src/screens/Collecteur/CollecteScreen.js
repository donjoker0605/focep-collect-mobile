// screens/Collecteur/CollecteScreen.js - VERSION AVEC IMPORTS CORRIGÉS

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// 🔥 CORRECTION : Suppression des composants inexistants
import { 
  Button, 
  Input
} from '../../components';
import ClientInput from '../../components/ClientInput/ClientInput';
import { AuthContext } from '../../context/AuthContext';
import theme from '../../theme';

// Services
import transactionService from '../../services/transactionService';
import clientService from '../../services/clientService';

const CollecteScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  
  // États principaux
  const [operationType, setOperationType] = useState('epargne');
  const [selectedClient, setSelectedClient] = useState(null);
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour la modal de vérification téléphone
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [validationData, setValidationData] = useState(null);
  
  // États pour la validation
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Validation des données avant soumission
  const validateForm = () => {
    if (!selectedClient) {
      setError('Veuillez sélectionner un client');
      return false;
    }
    
    if (!montant || parseFloat(montant) <= 0) {
      setError('Veuillez saisir un montant valide');
      return false;
    }
    
    if (parseFloat(montant) > 1000000) {
      setError('Le montant ne peut pas dépasser 1 000 000 FCFA');
      return false;
    }
    
    return true;
  };

  // Validation de l'opération
  const handleValidateOperation = async () => {
    if (!validateForm()) return;
    
    // Vérifier si collecteur inactif peut faire un retrait
    if (operationType === 'retrait' && user && user.actif === false) {
      setValidationError('Collecteur inactif : seules les opérations d\'épargne sont autorisées');
      return;
    }
    
    // 🔥 NOUVEAU : Vérifier si le client est activé pour les retraits
    if (operationType === 'retrait' && selectedClient && selectedClient.valide === false) {
      setValidationError(
        `Le client "${selectedClient.displayName}" n'est pas activé. ` +
        'Les retraits ne sont autorisés que pour les clients activés. ' +
        'Contactez votre administrateur pour activer ce client.'
      );
      return;
    }
    
    try {
      setValidationLoading(true);
      setValidationError(null);
      
      const montantFloat = parseFloat(montant);
      
      // Appel à la validation via le service corrigé
      const validationResult = operationType === 'epargne' 
        ? await transactionService.validateEpargne(
            selectedClient.id, 
            user.id, 
            montantFloat,
            description
          )
        : await transactionService.validateRetrait(
            selectedClient.id, 
            user.id, 
            montantFloat,
            description
          );
      
      if (validationResult.success && validationResult.data) {
        const validation = validationResult.data;
        
        // Vérifier si client a un téléphone
        if (!validation.hasValidPhone) {
          setValidationData(validation);
          setShowPhoneModal(true);
          return;
        }
        
        // Vérifier si peut procéder (pour les retraits)
        if (!validation.canProceed) {
          setValidationError(validation.errorMessage || validation.soldeCollecteurMessage);
          return;
        }
        
        // Validation réussie, demander confirmation
        showConfirmationAlert();
      } else {
        setValidationError('Erreur lors de la validation');
      }
    } catch (err) {
      console.error('Erreur validation:', err);
      setValidationError(err.message || 'Erreur lors de la validation');
    } finally {
      setValidationLoading(false);
    }
  };

  // Confirmation avant opération
  const showConfirmationAlert = () => {
    const operationText = operationType === 'epargne' ? 'Épargne' : 'Retrait';
    const montantFormat = parseFloat(montant).toLocaleString('fr-FR') + ' FCFA';
    const dateFormatted = new Date().toLocaleDateString('fr-FR');
    const timeFormatted = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const transactionDetails = [
      `📋 Opération: ${operationText}`,
      `💰 Montant: ${montantFormat}`,
      `👤 Client: ${selectedClient.displayName}`,
      `💳 Compte: ${selectedClient.numeroCompte}`,
      `📅 Date: ${dateFormatted} à ${timeFormatted}`,
      description ? `📝 Description: ${description}` : '',
    ].filter(detail => detail).join('\n');
    
    Alert.alert(
      `Confirmer ${operationText}`,
      `${transactionDetails}\n\nVoulez-vous continuer ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: handleSubmitOperation,
          style: 'default',
        },
      ]
    );
  };

  // Soumission de l'opération
  const handleSubmitOperation = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const operationData = {
        clientId: selectedClient.id,
        collecteurId: user.id,
        montant: parseFloat(montant),
        description: description || `${operationType} pour ${selectedClient.displayName}`
      };
      
      // Utilisation du bon service
      const result = operationType === 'epargne' 
        ? await transactionService.effectuerEpargne(operationData)
        : await transactionService.effectuerRetrait(operationData);
      
      if (result.success) {
        // Reset du formulaire
        setSelectedClient(null);
        setMontant('');
        setDescription('');
        setError(null);
        
        Alert.alert(
          'Succès',
          `${operationType === 'epargne' ? 'Épargne' : 'Retrait'} effectué avec succès !`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Rediriger vers le journal d'opération
                navigation.navigate('Journal');
              }
            }
          ]
        );
      } else {
        setError(result.message || 'Erreur lors de l\'opération');
      }
    } catch (err) {
      console.error('Erreur soumission:', err);
      setError(err.message || 'Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la sélection client
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setError(null);
    setValidationError(null);
    console.log('✅ Client sélectionné:', client);
  };

  // Gestion erreur client
  const handleClientError = (errorMessage) => {
    setError(errorMessage);
  };

  // Gestion modal téléphone
  const handlePhoneModalContinue = () => {
    setShowPhoneModal(false);
    handleSubmitOperation();
  };

  const handlePhoneModalEdit = () => {
    setShowPhoneModal(false);
    if (selectedClient) {
      navigation.navigate('Clients', {
        screen: 'ClientAddEdit',
        params: { mode: 'edit', client: selectedClient }
      });
    }
  };

  // Modal de vérification téléphone
  const renderPhoneModal = () => {
    if (!validationData) return null;
    
    return (
      <Modal
        visible={showPhoneModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="call-outline" size={24} color={theme.colors.warning} />
              <Text style={styles.modalTitle}>Téléphone manquant</Text>
            </View>
            
            <Text style={styles.modalText}>
              Le client <Text style={styles.modalClientName}>{validationData.clientName}</Text> 
              {' '}n'a pas de numéro de téléphone renseigné.
            </Text>
            
            <Text style={styles.modalSubText}>
              Voulez-vous continuer l'opération ou ajouter le numéro de téléphone ?
            </Text>
            
            <View style={styles.modalActions}>
              <Button
                title="Ajouter téléphone"
                onPress={handlePhoneModalEdit}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Continuer"
                onPress={handlePhoneModalContinue}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Collecte</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Sélection type d'opération */}
        <View style={styles.operationTypeContainer}>
          <Text style={styles.sectionTitle}>Type d'opération</Text>
          <View style={styles.operationButtons}>
            <TouchableOpacity
              style={[
                styles.operationButton,
                operationType === 'epargne' && styles.operationButtonActive
              ]}
              onPress={() => setOperationType('epargne')}
            >
              <Ionicons
                name="wallet"
                size={20}
                color={operationType === 'epargne' ? theme.colors.white : theme.colors.text}
              />
              <Text style={[
                styles.operationButtonText,
                operationType === 'epargne' && styles.operationButtonTextActive
              ]}>
                Épargne
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.operationButton,
                operationType === 'retrait' && styles.operationButtonActive
              ]}
              onPress={() => setOperationType('retrait')}
            >
              <Ionicons
                name="card"
                size={20}
                color={operationType === 'retrait' ? theme.colors.white : theme.colors.text}
              />
              <Text style={[
                styles.operationButtonText,
                operationType === 'retrait' && styles.operationButtonTextActive
              ]}>
                Retrait
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {/* Utilisation du composant ClientInput */}
          <ClientInput
            collecteurId={user.id}
            selectedClient={selectedClient}
            onClientSelect={handleClientSelect}
            onError={handleClientError}
            disabled={loading || validationLoading}
          />

          {/* Montant */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Montant <Text style={styles.required}>*</Text>
            </Text>
            <Input
              placeholder="Montant à épargner/retirer"
              value={montant}
              onChangeText={setMontant}
              keyboardType="numeric"
              disabled={loading || validationLoading}
              rightIcon={
                <Text style={styles.currency}>FCFA</Text>
              }
            />
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Description (optionnel)</Text>
            <Input
              placeholder="Description de l'opération"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              disabled={loading || validationLoading}
            />
          </View>

          {/* Erreurs */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {validationError && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={20} color={theme.colors.warning} />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}

          {/* Bouton validation */}
          <Button
            title={validationLoading ? 'Validation...' : `Valider ${operationType}`}
            onPress={handleValidateOperation}
            disabled={loading || validationLoading || !selectedClient || !montant}
            loading={validationLoading}
            style={styles.submitButton}
          />
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>💡 Rappel</Text>
          <Text style={styles.infoText}>
            {operationType === 'epargne' 
              ? 'Vérifiez bien le montant avant de valider l\'épargne.'
              : 'Assurez-vous d\'avoir suffisamment d\'espèces avant de valider le retrait.'
            }
          </Text>
        </View>
      </ScrollView>

      {/* Modal téléphone */}
      {renderPhoneModal()}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {operationType === 'epargne' ? 'Enregistrement épargne...' : 'Traitement retrait...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 🔥 NOUVEAU : Style pour SafeAreaView
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  operationTypeContainer: {
    padding: 16,
    backgroundColor: theme.colors.white,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  operationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  operationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  operationButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  operationButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  operationButtonTextActive: {
    color: theme.colors.white,
  },
  form: {
    padding: 16,
    backgroundColor: theme.colors.white,
    marginBottom: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  required: {
    color: theme.colors.error,
  },
  currency: {
    fontSize: 16,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}10`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.error,
    flex: 1,
  },
  submitButton: {
    marginTop: 16,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: theme.colors.white,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  // Styles modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...theme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 12,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  modalClientName: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  modalSubText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.white,
    textAlign: 'center',
  },
});

export default CollecteScreen;