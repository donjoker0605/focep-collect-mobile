// src/screens/Collecteur/CollecteScreen.js
import React, { useState, useEffect, useCallback } from 'react';
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

// Components
import { 
  Header, 
  Card, 
  Button, 
  EmptyState, 
  AmountInput,
  SelectInput,
  Input
} from '../../components';

// Hooks et services
import { useAuth } from '../../hooks/useAuth';
import { getClients } from '../../api/client';
import { saveTransaction, verifyBalance } from '../../api/transaction';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// Theme et utils
import theme from '../../theme';
import { formatCurrency } from '../../utils/formatters';

// Fonction utilitaire pour les haptics qui vérifie la plateforme
const triggerHaptic = (type) => {
    if (Platform.OS !== 'web') {
      // Uniquement exécuter sur les appareils natifs, pas sur le web
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
  
  // États
  const [activeTab, setActiveTab] = useState(selectedTab);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(preSelectedClient || null);
  const [clientInfo, setClientInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [balanceChecking, setBalanceChecking] = useState(false);
  const [error, setError] = useState(null);
  
  // Charger la liste des clients
  const loadClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      setError(null);
      
      const response = await getClients({ collecteurId: user.id });
      
      // Formater les options des clients pour le sélecteur
      const clientOptions = response.map(client => ({
        label: `${client.prenom} ${client.nom} (${client.numerCompte})`,
        value: client.id,
        data: client
      }));
      
      setClients(clientOptions);
      
      // Si un client est présélectionné, le trouver dans la liste
      if (preSelectedClient) {
        const foundClient = clientOptions.find(client => client.value === preSelectedClient.id);
        if (foundClient) {
          setSelectedClient(foundClient.value);
          setClientInfo(foundClient.data);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
      setError(err.message || 'Erreur lors du chargement des clients');
    } finally {
      setClientsLoading(false);
    }
  }, [user.id, preSelectedClient]);
  
  // Charger les clients au démarrage
  useEffect(() => {
    loadClients();
  }, [loadClients]);
  
  // Réinitialiser le formulaire
  const resetForm = () => {
    setAmount('');
    setDescription('');
    setError(null);
  };
  
  // Changement d'onglet
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      resetForm();
      
      // Vibration
      triggerHaptic('impact');
    }
  };
  
  // Sélection d'un client
  const handleClientChange = (clientId) => {
    setSelectedClient(clientId);
    
    // Récupérer les informations du client sélectionné
    const selectedClientInfo = clients.find(client => client.value === clientId)?.data;
    setClientInfo(selectedClientInfo);
  };
  
  // Vérifier le solde disponible pour le retrait
const checkBalance = async () => {
    if (!selectedClient || !amount || parseFloat(amount) <= 0) return false;
    
    try {
      setBalanceChecking(true);
      setError(null);
      
      // Note: cette fonction pourrait aussi être implémentée dans useOfflineSync
      // mais comme elle est uniquement pour la vérification, on peut continuer à utiliser l'API directe
      const response = await verifyBalance({
        clientId: selectedClient,
        montant: parseFloat(amount)
      });
      
      if (!response.sufficient) {
        setError(`Solde insuffisant. Solde disponible: ${formatCurrency(response.soldeDisponible)} FCFA`);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la vérification du solde:', err);
      setError(err.message || 'Erreur lors de la vérification du solde');
      return false;
    } finally {
      setBalanceChecking(false);
    }
  };
  
  // Soumettre le formulaire
  const handleSubmit = async () => {
    try {
      // Valider les champs requis
      if (!selectedClient) {
        setError('Veuillez sélectionner un client');
        return;
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        setError('Veuillez saisir un montant valide');
        return;
      }
      
      // Pour les retraits, vérifier le solde disponible
      if (activeTab === 'retrait') {
        const balanceOk = await checkBalance();
        if (!balanceOk) return;
      }
      
      // Confirmer l'opération
      const operationType = activeTab === 'epargne' ? 'épargne' : 'retrait';
      
      Alert.alert(
        'Confirmation',
        `Êtes-vous sûr de vouloir effectuer cette opération de ${operationType} de ${formatCurrency(parseFloat(amount))} FCFA ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Confirmer',
            onPress: () => processTransaction()
          }
        ]
      );
    } catch (err) {
      console.error('Erreur lors de la soumission du formulaire:', err);
      setError(err.message || 'Erreur lors de la soumission du formulaire');
    }
  };
  
  // Traiter la transaction
const processTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const transaction = {
        clientId: selectedClient,
        collecteurId: user.id,
        montant: parseFloat(amount),
        type: activeTab === 'epargne' ? 'EPARGNE' : 'RETRAIT',
        description: description || undefined
      };
      
      // Utilisation de la méthode du hook useOfflineSync
      const result = await saveTransaction(transaction);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'enregistrement de la transaction');
      }
      
      const response = result.data;
      
      // Réinitialiser le formulaire
      resetForm();
      
      // Afficher un message de succès
      const operationType = activeTab === 'epargne' ? 'épargne' : 'retrait';
      Alert.alert(
        'Succès',
        `L'opération de ${operationType} a été effectuée avec succès.`,
        [
          {
            text: 'Voir le détail',
            onPress: () => navigation.navigate('CollecteDetail', { transaction: response })
          },
          {
            text: 'OK'
          }
        ]
      );
      
      // Vibration de succès sécurisée pour le web
      triggerHaptic('success');
    } catch (err) {
      console.error('Erreur lors du traitement de la transaction:', err);
      setError(err.message || 'Erreur lors du traitement de la transaction');
      
      // Vibration d'erreur sécurisée pour le web
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Rendu des onglets
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
  
  // Rendu du formulaire de collecte
  const renderCollectForm = () => (
    <Card style={styles.formCard}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <SelectInput
            label="Client"
            placeholder="Sélectionner un client"
            value={selectedClient}
            options={clients}
            onChange={handleClientChange}
            error={clientsLoading ? null : clients.length === 0 ? 'Aucun client disponible' : null}
            searchable={true}
            searchPlaceholder="Rechercher un client..."
            required={true}
            disabled={loading}
          />
          
          {clientInfo && (
            <View style={styles.clientInfoContainer}>
              <Text style={styles.clientInfoLabel}>N° de compte:</Text>
              <Text style={styles.clientInfoValue}>{clientInfo.numerCompte}</Text>
            </View>
          )}
          
          <AmountInput
            label={activeTab === 'epargne' ? "Montant à épargner" : "Montant à retirer"}
            value={amount}
            onChangeText={setAmount}
            error={error}
            required={true}
            disabled={loading}
            suffix="FCFA"
          />
          
          <Input
            label="Description (optionnel)"
            placeholder="Ajouter une description..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            disabled={loading}
          />
          
          <Button
            title={activeTab === 'epargne' ? "Enregistrer l'épargne" : "Effectuer le retrait"}
            onPress={handleSubmit}
            loading={loading || balanceChecking}
            disabled={loading || balanceChecking || !selectedClient || !amount}
            style={styles.submitButton}
          />
        </View>
      </TouchableWithoutFeedback>
    </Card>
  );
  
  // Rendu de l'écran
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
        
        {clientsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des clients...</Text>
          </View>
        ) : clients.length === 0 ? (
          <EmptyState
            type="no-results"
            title="Aucun client disponible"
            message="Vous n'avez aucun client rattaché à votre compte. Contactez votre administrateur pour plus d'informations."
            icon="people"
            actionButton={true}
            actionButtonTitle="Rafraîchir"
            onActionButtonPress={loadClients}
          />
        ) : (
          renderCollectForm()
        )}
      </ScrollView>
    </View>
  );
};

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
  clientInfoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 10,
    backgroundColor: `${theme.colors.info}10`,
    borderRadius: 8,
  },
  clientInfoLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginRight: 8,
  },
  clientInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  submitButton: {
    marginTop: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textLight,
  },
});

export default CollecteScreen;