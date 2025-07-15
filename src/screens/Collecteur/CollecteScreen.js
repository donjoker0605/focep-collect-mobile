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
  
  // ✅ NOUVEAUX ÉTATS pour les champs complémentaires
  const [clientName, setClientName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [clientFieldError, setClientFieldError] = useState(null);
  const [accountFieldError, setAccountFieldError] = useState(null);
  
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
      setFilteredClients(formattedClients);
      
    } catch (error) {
      console.error('Erreur détaillée:', error.response || error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de charger les clients'
      );
      setClients([]);
      setFilteredClients([]);
    } finally {
      setClientsLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  // ✅ NOUVELLE FONCTION - Recherche semi-automatique des clients
  const handleClientNameChange = (text) => {
    setClientName(text);
    setClientFieldError(null);
    
    if (text.length > 0) {
      // Filtrer les clients selon le nom/prénom
      const filtered = clients.filter(client => 
        client.label.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowClientSuggestions(true);
      
      // Si le texte correspond exactement à un client, le sélectionner automatiquement
      const exactMatch = clients.find(client => 
        client.label.toLowerCase() === text.toLowerCase()
      );
      
      if (exactMatch) {
        setSelectedClient(exactMatch.value);
        setClientInfo(exactMatch.data);
        setAccountNumber(exactMatch.data.numerCompte || '');
        setShowClientSuggestions(false);
      } else {
        // Réinitialiser si aucune correspondance exacte
        setSelectedClient(null);
        setClientInfo(null);
        if (!accountNumber) { // Ne pas effacer si l'utilisateur tape manuellement
          setAccountNumber('');
        }
      }
    } else {
      setFilteredClients(clients);
      setShowClientSuggestions(false);
      setSelectedClient(null);
      setClientInfo(null);
      setAccountNumber('');
    }
  };

  // ✅ NOUVELLE FONCTION - Gestion du numéro de compte
  const handleAccountNumberChange = (text) => {
    setAccountNumber(text);
    setAccountFieldError(null);
    
    if (text.length > 0) {
      // Chercher le client correspondant au numéro de compte
      const matchingClient = clients.find(client => 
        client.data.numerCompte === text
      );
      
      if (matchingClient) {
        setSelectedClient(matchingClient.value);
        setClientInfo(matchingClient.data);
        setClientName(matchingClient.label);
        setShowClientSuggestions(false);
      } else {
        // Réinitialiser si aucune correspondance
        if (!clientName) { // Ne pas effacer si l'utilisateur tape le nom
          setSelectedClient(null);
          setClientInfo(null);
          setClientName('');
        }
      }
    } else {
      if (!clientName) { // Ne réinitialiser que si le nom n'est pas renseigné
        setSelectedClient(null);
        setClientInfo(null);
        setClientName('');
      }
    }
  };

  // ✅ NOUVELLE FONCTION - Sélection depuis les suggestions
  const handleClientSuggestionSelect = (client) => {
    setClientName(client.label);
    setSelectedClient(client.value);
    setClientInfo(client.data);
    setAccountNumber(client.data.numerCompte || '');
    setShowClientSuggestions(false);
    setClientFieldError(null);
    setAccountFieldError(null);
  };

  // ✅ FONCTION MODIFIÉE - Validation des champs complémentaires
  const validateClientFields = () => {
    let isValid = true;
    
    if (!clientName.trim()) {
      setClientFieldError('Veuillez saisir le nom du client');
      isValid = false;
    }
    
    if (!accountNumber.trim()) {
      setAccountFieldError('Veuillez saisir le numéro de compte');
      isValid = false;
    }
    
    if (!selectedClient) {
      setClientFieldError('Client non trouvé. Vérifiez le nom ou le numéro de compte');
      isValid = false;
    }
    
    return isValid;
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setAmount('');
    setDescription('');
    setError(null);
    // ✅ AJOUT - Réinitialiser les nouveaux champs
    setClientName('');
    setAccountNumber('');
    setSelectedClient(null);
    setClientInfo(null);
    setShowClientSuggestions(false);
    setClientFieldError(null);
    setAccountFieldError(null);
  };

  // Changement d'onglet
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      resetForm();
      triggerHaptic('impact');
    }
  };

  // ✅ FONCTION MODIFIÉE - Sélection d'un client (gardée pour compatibilité avec le dropdown)
  const handleClientChange = (clientId) => {
    const selectedClientInfo = clients.find(client => client.value === clientId);
    if (selectedClientInfo) {
      setSelectedClient(clientId);
      setClientInfo(selectedClientInfo.data);
      setClientName(selectedClientInfo.label);
      setAccountNumber(selectedClientInfo.data.numerCompte || '');
      setClientFieldError(null);
      setAccountFieldError(null);
    }
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

  // ✅ FONCTION MODIFIÉE - Soumettre le formulaire avec validation des nouveaux champs
  const handleSubmit = async () => {
    try {
      // Validation des champs complémentaires
      if (!validateClientFields()) {
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
        `Êtes-vous sûr de vouloir effectuer cette opération de ${operationType} de ${formatCurrency(parseFloat(amount))} FCFA pour ${clientName} (${accountNumber}) ?`,
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

  // ✅ NOUVEAU COMPOSANT - Rendu des suggestions de clients
  const renderClientSuggestions = () => {
    if (!showClientSuggestions || filteredClients.length === 0) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        {filteredClients.slice(0, 5).map((client) => (
          <TouchableOpacity
            key={client.value}
            style={styles.suggestionItem}
            onPress={() => handleClientSuggestionSelect(client)}
          >
            <Text style={styles.suggestionText}>{client.label}</Text>
            <Text style={styles.suggestionAccount}>{client.data.numerCompte}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ✅ NOUVEAU COMPOSANT - Dropdown des clients intégré
  const renderClientDropdown = () => {
    if (!showClientSuggestions) return null;
    
    return (
      <View style={styles.dropdownContainer}>
        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
          {clients.map((client) => (
            <TouchableOpacity
              key={client.value}
              style={styles.dropdownItem}
              onPress={() => handleClientSuggestionSelect(client)}
            >
              <Text style={styles.dropdownText}>{client.label}</Text>
              <Text style={styles.dropdownAccount}>{client.data.numerCompte}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  // ✅ FONCTION MODIFIÉE - Rendu du formulaire avec les nouveaux champs
  const renderCollectForm = () => (
    <Card style={styles.formCard}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          {/* ✅ NOUVEAU CHAMP - Nom du client avec dropdown intégré */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Nom du client <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithDropdown}>
              <Input
                placeholder="Entrer le nom du client"
                value={clientName}
                onChangeText={handleClientNameChange}
                error={clientFieldError}
                disabled={loading}
                onFocus={() => {
                  if (clientName.length > 0) {
                    setShowClientSuggestions(true);
                  }
                }}
                style={styles.clientInput}
              />
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowClientSuggestions(!showClientSuggestions);
                  setFilteredClients(clients);
                }}
                disabled={loading}
              >
                <Ionicons 
                  name={showClientSuggestions ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.gray} 
                />
              </TouchableOpacity>
            </View>
            {clientName.length > 0 && renderClientSuggestions()}
            {clientName.length === 0 && renderClientDropdown()}
          </View>

          {/* ✅ NOUVEAU CHAMP - Numéro de compte */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Numéro de compte <Text style={styles.required}>*</Text>
            </Text>
            <Input
              placeholder="Entrer le numéro de compte"
              value={accountNumber}
              onChangeText={handleAccountNumberChange}
              error={accountFieldError}
              disabled={loading}
            />
          </View>
          
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
  // ✅ NOUVEAUX STYLES pour les champs complémentaires
  fieldContainer: {
    marginBottom: 16,
    position: 'relative',
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
  // ✅ STYLES pour le champ avec dropdown intégré
  inputWithDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  clientInput: {
    flex: 1,
    marginRight: 0,
  },
  dropdownButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
    zIndex: 1,
  },
  // ✅ STYLES pour les suggestions (recherche)
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    zIndex: 1000,
    ...theme.shadows.small,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  suggestionAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 8,
  },
  // ✅ STYLES pour le dropdown complet
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 250,
    zIndex: 1000,
    ...theme.shadows.medium,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    fontWeight: '500',
  },
  dropdownAccount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 8,
  },
  clientInfoContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: `${theme.colors.success}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.success}30`,
  },
  clientInfoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  clientInfoLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginRight: 8,
    minWidth: 100,
  },
  clientInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
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