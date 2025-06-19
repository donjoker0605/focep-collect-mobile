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

// ✅ IMPORTS CORRIGÉS - Plus de duplication
import { 
  transactionService,
  clientService 
} from '../../services'; // Import depuis l'index

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

// Hooks
import { useAuth } from '../../hooks/useAuth';
import { useOfflineSync } from '../../hooks/useOfflineSync';

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
	const loadClients = useCallback(async (showRefreshing = false) => {
	  try {
		if (showRefreshing) setRefreshing(true);
		else setClientsLoading(true);
		
		const response = await clientService.getClientsByCollecteur(user.id);
		console.log('API full response:', response);
		
		if (!response || !response.data) {
		  throw new Error('Réponse API invalide');
		}
		
		// Formatage des données selon la structure réçue
		const clientsArray = Array.isArray(response.data) 
		  ? response.data 
		  : Object.values(response.data);
		
		const formattedClients = clientsArray.map(client => ({
		  value: client.id || client._id,
		  label: `${client.nom || ''} ${client.prenom || ''}`.trim(),
		  data: client
		}));
		
		setClients(formattedClients);
		
	  } catch (error) {
		console.error('Erreur détaillée:', error.response || error);
		Alert.alert(
		  'Erreur',
		  error.message || 'Impossible de charger les clients'
		);
		setClients([]);
	  } finally {
		setClientsLoading(false);
		setRefreshing(false);
	  }
	}, [user.id]);

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
      triggerHaptic('impact');
    }
  };

  // Sélection d'un client
  const handleClientChange = (clientId) => {
    setSelectedClient(clientId);
    const selectedClientInfo = clients.find(client => client.value === clientId)?.data;
    setClientInfo(selectedClientInfo);
  };

  // Vérifier le solde pour retrait
  const checkBalance = async () => {
    if (!selectedClient || !amount || parseFloat(amount) <= 0) return false;
    
    try {
      setBalanceChecking(true);
      setError(null);
      
      // ✅ UTILISATION DU SERVICE SPÉCIALISÉ
      const response = await transactionService.verifyBalance({
        clientId: selectedClient,
        montant: parseFloat(amount)
      });
      
      if (!response.data.sufficient) {
        setError(`Solde insuffisant. Solde disponible: ${formatCurrency(response.data.soldeDisponible)} FCFA`);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la vérification du solde:', err);
      setError(err.error || 'Erreur lors de la vérification du solde');
      return false;
    } finally {
      setBalanceChecking(false);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    try {
      if (!selectedClient) {
        setError('Veuillez sélectionner un client');
        return;
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        setError('Veuillez saisir un montant valide');
        return;
      }
      
      if (activeTab === 'retrait') {
        const balanceOk = await checkBalance();
        if (!balanceOk) return;
      }
      
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
      
      const transactionData = {
        clientId: selectedClient,
        collecteurId: user.id,
        montant: parseFloat(amount),
      };
      
      let result;
      if (activeTab === 'epargne') {
        // ✅ UTILISATION DU SERVICE SPÉCIALISÉ
        result = await transactionService.enregistrerEpargne(transactionData);
      } else {
        result = await transactionService.effectuerRetrait(transactionData);
      }
      
      resetForm();
      
      Alert.alert(
        'Succès',
        result.message || `${activeTab === 'epargne' ? 'Épargne' : 'Retrait'} effectué avec succès`,
        [
          { text: 'OK', onPress: () => navigation.navigate('Journal') }
        ]
      );
      
    } catch (err) {
      console.error('Erreur transaction:', err);
      setError(err.error || err.message);
    } finally {
      setLoading(false);
    }
  };

	const [refreshing, setRefreshing] = useState(false);
	
  // Charger les clients au démarrage
	useEffect(() => {
	  const fetchClients = async () => {
		await loadClients();
	  };
	  fetchClients();
	}, [loadClients]);  
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