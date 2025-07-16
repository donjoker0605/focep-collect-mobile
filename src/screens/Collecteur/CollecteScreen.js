// screens/Collecteur/CollecteScreen.js - VERSION FINALE PRODUCTION

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Services optimisés
import transactionService from '../../services/transactionService';

// Components
import { 
  Header, 
  Card, 
  Button, 
  AmountInput,
  Input
} from '../../components';

// Nouveau composant optimisé
import ClientInput from '../../components/ClientInput/ClientInput';
import PhoneVerificationModal from '../../components/PhoneVerificationModal';

// Hooks
import { useAuth } from '../../hooks/useAuth';

// Theme et utils
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';

// Fonction utilitaire pour les haptics
const triggerHaptic = (type) => {
  if (Platform.OS !== 'web') {
    if (type === 'impact') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }
};

const CollecteScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // Récupérer les paramètres de route
  const { selectedTab = 'epargne', preSelectedClient } = route.params || {};
  
  // ========================================
  // 🔄 ÉTATS PRINCIPAUX
  // ========================================
  
  const [activeTab, setActiveTab] = useState(selectedTab);
  const [selectedClient, setSelectedClient] = useState(preSelectedClient || null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ========================================
  // 📞 ÉTATS VÉRIFICATION TÉLÉPHONE
  // ========================================
  
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  // ========================================
  // 📝 GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      resetForm();
      triggerHaptic('impact');
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setError(null);
    setValidationResult(null);
    setShowPhoneModal(false);
    setPendingTransaction(null);
    // Note: selectedClient est géré par ClientInput
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setError(null);
    console.log('✅ Client sélectionné:', client);
  };

  const handleClientInputError = (error) => {
    setError(error);
    setSelectedClient(null);
  };

  // ========================================
  // 🔐 VALIDATION COMPLÈTE AVANT TRANSACTION
  // ========================================

  const validateAndProceedTransaction = async () => {
    try {
      if (!selectedClient) {
        setError('Veuillez sélectionner un client');
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        setError('Veuillez saisir un montant valide');
        return;
      }

      setLoading(true);
      setError(null);

      const transactionData = {
        clientId: selectedClient.id,
        collecteurId: user.id,
        montant: parseFloat(amount),
        description: description.trim()
      };

      // ✅ VALIDATION BACK-END COMPLÈTE
      let validation;
      if (activeTab === 'epargne') {
        validation = await transactionService.validateEpargne(
          selectedClient.id, user.id, parseFloat(amount), description
        );
      } else {
        validation = await transactionService.validateRetrait(
          selectedClient.id, user.id, parseFloat(amount), description
        );
      }

      setValidationResult(validation.data);

      if (!validation.data.canProceed) {
        setError(validation.data.errorMessage);
        triggerHaptic('error');
        return;
      }

      // ✅ VÉRIFICATION TÉLÉPHONE
      if (!validation.data.hasValidPhone) {
        // Montrer modal de vérification téléphone
        setPendingTransaction(transactionData);
        setShowPhoneModal(true);
        return;
      }

      // ✅ PROCÉDER DIRECTEMENT SI TOUT EST OK
      await executeTransaction(transactionData);

    } catch (err) {
      console.error('Erreur validation transaction:', err);
      setError(err.message || 'Erreur lors de la validation');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // 💰 EXÉCUTION TRANSACTION
  // ========================================

  const executeTransaction = async (transactionData) => {
    try {
      setLoading(true);
      setError(null);

      const operationType = activeTab === 'epargne' ? 'épargne' : 'retrait';

      // Confirmation utilisateur
      const confirmed = await new Promise(resolve => {
        Alert.alert(
          'Confirmation',
          `Êtes-vous sûr de vouloir effectuer cette ${operationType} de ${formatCurrency(transactionData.montant)} FCFA pour ${selectedClient.displayName} ?\n\nCompte: ${selectedClient.numeroCompte}`,
          [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Confirmer', onPress: () => resolve(true) }
          ]
        );
      });

      if (!confirmed) {
        setLoading(false);
        return;
      }

      // Exécuter la transaction
      let result;
      if (activeTab === 'epargne') {
        result = await transactionService.enregistrerEpargne(transactionData);
      } else {
        result = await transactionService.effectuerRetrait(transactionData);
      }

      // Succès
      triggerHaptic('success');
      resetForm();
      
      Alert.alert(
        'Succès ! 🎉',
        `${operationType} de ${formatCurrency(transactionData.montant)} FCFA effectuée avec succès pour ${selectedClient.displayName}`,
        [
          { 
            text: 'Voir Journal', 
            onPress: () => navigation.navigate('Journal'),
            style: 'default'
          },
          { 
            text: 'Nouvelle transaction', 
            onPress: () => {},
            style: 'cancel'
          }
        ]
      );

    } catch (err) {
      console.error('Erreur exécution transaction:', err);
      setError(err.message || 'Erreur lors de l\'exécution de la transaction');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // 📞 GESTIONNAIRES MODAL TÉLÉPHONE
  // ========================================

  const handleAddPhone = (client) => {
    // Naviguer vers l'édition du client
    navigation.navigate('EditClient', { clientId: client.id });
  };

  const handleContinueWithoutPhone = async () => {
    if (pendingTransaction) {
      await executeTransaction(pendingTransaction);
      setPendingTransaction(null);
    }
    setShowPhoneModal(false);
  };

  // ========================================
  // 🎨 COMPOSANTS DE RENDU
  // ========================================

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'epargne' && styles.activeTab
        ]}
        onPress={() => handleTabChange('epargne')}
      >
        <Ionicons 
          name="arrow-down-circle" 
          size={20} 
          color={activeTab === 'epargne' ? theme.colors.primary : theme.colors.gray} 
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'epargne' && styles.activeTabText
          ]}
        >
          Épargne
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'retrait' && styles.activeTab
        ]}
        onPress={() => handleTabChange('retrait')}
      >
        <Ionicons 
          name="arrow-up-circle" 
          size={20} 
          color={activeTab === 'retrait' ? theme.colors.primary : theme.colors.gray} 
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'retrait' && styles.activeTabText
          ]}
        >
          Retrait
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderValidationSummary = () => {
    if (!validationResult || !selectedClient) return null;

    return (
      <View style={styles.validationContainer}>
        <View style={styles.validationHeader}>
          <Ionicons 
            name={validationResult.canProceed ? "checkmark-circle" : "alert-circle"} 
            size={20} 
            color={validationResult.canProceed ? theme.colors.success : theme.colors.error} 
          />
          <Text style={styles.validationTitle}>
            État de la validation
          </Text>
        </View>
        
        {validationResult.canProceed && (
          <Text style={styles.validationSuccess}>
            ✅ Transaction autorisée
          </Text>
        )}
        
        {!validationResult.hasValidPhone && (
          <Text style={styles.validationWarning}>
            ⚠️ Client sans numéro de téléphone
          </Text>
        )}
        
        {validationResult.soldeCollecteurMessage && (
          <Text style={styles.validationError}>
            ❌ {validationResult.soldeCollecteurMessage}
          </Text>
        )}
      </View>
    );
  };

  const renderForm = () => (
    <Card style={styles.formCard}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          {/* Composant client optimisé */}
          <ClientInput
            collecteurId={user.id}
            selectedClient={selectedClient}
            onClientSelect={handleClientSelect}
            onError={handleClientInputError}
            disabled={loading}
          />

          {/* Résumé de validation */}
          {renderValidationSummary()}
          
          {/* Montant */}
          <AmountInput
            label={activeTab === 'epargne' ? "Montant à épargner" : "Montant à retirer"}
            value={amount}
            onChangeText={setAmount}
            error={error}
            required={true}
            disabled={loading}
            suffix="FCFA"
          />
          
          {/* Description */}
          <Input
            label="Description (optionnel)"
            placeholder="Ajouter une description..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            disabled={loading}
          />
          
          {/* Bouton de soumission */}
          <Button
            title={loading ? "Traitement..." : 
              activeTab === 'epargne' ? "Enregistrer l'épargne" : "Effectuer le retrait"}
            onPress={validateAndProceedTransaction}
            loading={loading}
            disabled={loading || !selectedClient || !amount}
            style={styles.submitButton}
            icon={activeTab === 'epargne' ? "arrow-down-circle" : "arrow-up-circle"}
          />
        </View>
      </TouchableWithoutFeedback>
    </Card>
  );
  
  // ========================================
  // 🎨 RENDU PRINCIPAL
  // ========================================
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title={activeTab === 'epargne' ? "Collecte d'épargne" : "Retrait d'épargne"}
        rightComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderTabs()}
        {renderForm()}
      </ScrollView>

      {/* Modal vérification téléphone */}
      <PhoneVerificationModal
        visible={showPhoneModal}
        client={selectedClient}
        transactionType={activeTab}
        onClose={() => {
          setShowPhoneModal(false);
          setPendingTransaction(null);
        }}
        onAddPhone={handleAddPhone}
        onContinueWithoutPhone={handleContinueWithoutPhone}
      />
    </View>
  );
};

// ========================================
// 🎨 STYLES
// ========================================

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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  notificationButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    ...theme.shadows.small,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.gray,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  formCard: {
    padding: 20,
  },
  validationContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginLeft: 8,
  },
  validationSuccess: {
    fontSize: 14,
    color: theme.colors.success,
    marginBottom: 4,
  },
  validationWarning: {
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: 4,
  },
  validationError: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 4,
  },
  submitButton: {
    marginTop: 20,
  },
});

export default CollecteScreen;