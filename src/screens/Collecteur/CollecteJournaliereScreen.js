import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  RadioButton,
  List,
  Surface,
  Chip,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useClientStore } from '../../store/clientStore';
import MouvementService from '../../services/mouvementService';
import JournalService from '../../services/journalService';
import { theme } from '../../theme/theme';

export const CollecteJournaliereScreen = ({ navigation, route }) => { 
  const { user } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [operation, setOperation] = useState(
    route?.params?.initialOperation || 'epargne'
  );
  const [montant, setMontant] = useState('');
  const [journalActif, setJournalActif] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ CORRECTION: Commencer en mode loading
  const [errors, setErrors] = useState({});
  const [recentOperations, setRecentOperations] = useState([]);

  // ✅ CORRECTION CRITIQUE: Appeler loadInitialData au montage
  useEffect(() => {
    console.log('🎯 CollecteJournaliere initialisée avec:', {
      initialOperation: route?.params?.initialOperation,
      currentOperation: operation
    });
    
    // ✅ APPEL MANQUANT
    loadInitialData();
  }, []);

  // ✅ CORRECTION: Fonction de chargement améliorée
  const loadInitialData = async () => {
    console.log('🔄 Début chargement données initiales');
    setIsLoading(true);
    
    try {
      // 1. Charger les clients
      await fetchClients(user.id);
      console.log('✅ Clients chargés');
      
      // 2. ✅ NOUVEAU: Charger/créer le journal actif
      await loadJournalDuJour();
      console.log('✅ Journal chargé');
      
      // 3. Charger les opérations du jour
      await loadOperationsDuJour();
      console.log('✅ Opérations chargées');
      
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
      console.log('🔄 Fin chargement données initiales');
    }
  };

  // ✅ NOUVELLE FONCTION: Charger ou créer le journal du jour
  const loadJournalDuJour = async () => {
    try {
      console.log('📅 Chargement journal du jour pour collecteur:', user.id);
      
      // ✅ Utiliser getOrCreateJournalDuJour au lieu de getJournalActif
      const journal = await JournalService.getOrCreateJournalDuJour(user.id);
      
      if (journal) {
        setJournalActif(journal);
        console.log('✅ Journal actif défini:', journal.id);
      } else {
        console.warn('⚠️ Aucun journal retourné');
        // ✅ Créer un journal si aucun n'existe
        await createNewJournal();
      }
    } catch (error) {
      console.error('❌ Erreur chargement journal:', error);
      // ✅ Essayer de créer un nouveau journal en cas d'erreur
      await createNewJournal();
    }
  };

  // ✅ NOUVELLE FONCTION: Créer un nouveau journal
  const createNewJournal = async () => {
    try {
      console.log('🆕 Création nouveau journal');
      const today = new Date().toISOString().split('T')[0];
      
      const newJournal = await JournalService.createJournal({
        dateDebut: today,
        dateFin: today,
        collecteurId: user.id,
      });
      
      if (newJournal) {
        setJournalActif(newJournal);
        console.log('✅ Nouveau journal créé:', newJournal.id);
      }
    } catch (error) {
      console.error('❌ Erreur création journal:', error);
      Alert.alert('Erreur', 'Impossible de créer un journal. Contactez l\'administrateur.');
    }
  };

  const loadOperationsDuJour = async () => {
    try {
      const operations = await MouvementService.getOperationsDuJour(user.id);
      setRecentOperations(operations?.slice(-5) || []); // ✅ Protection contre undefined
    } catch (error) {
      console.error('Error loading operations du jour:', error);
      setRecentOperations([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedClient) {
      newErrors.client = 'Veuillez sélectionner un client';
    }

    if (!montant || isNaN(montant) || parseFloat(montant) <= 0) {
      newErrors.montant = 'Veuillez saisir un montant valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOperation = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const operationData = {
        clientId: selectedClient.id,
        collecteurId: user.id,
        montant: parseFloat(montant),
      };

      let result;
      if (operation === 'epargne') {
        result = await MouvementService.enregistrerEpargne(operationData);
        Alert.alert('Succès', `Épargne de ${montant} FCFA enregistrée pour ${selectedClient.nom} ${selectedClient.prenom}`);
      } else {
        result = await MouvementService.effectuerRetrait(operationData);
        Alert.alert('Succès', `Retrait de ${montant} FCFA effectué pour ${selectedClient.nom} ${selectedClient.prenom}`);
      }

      // Réinitialiser le formulaire
      setMontant('');
      setSelectedClient(null);
      
      // Recharger les opérations
      await loadOperationsDuJour();
    } catch (error) {
      Alert.alert('Erreur', `Impossible d'effectuer l'opération: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderClientItem = (client) => (
    <List.Item
      key={client.id}
      title={`${client.nom} ${client.prenom}`}
      description={`CNI: ${client.numeroCni} | Tel: ${client.telephone}`}
      left={(props) => <List.Icon {...props} icon="account" />}
      onPress={() => {
        setSelectedClient(client);
        setErrors({ ...errors, client: null });
      }}
      style={selectedClient?.id === client.id ? styles.selectedClient : null}
    />
  );

  const renderRecentOperation = (operation, index) => (
    <List.Item
      key={index}
      title={`${operation.sens || operation.type} - ${operation.montant} FCFA`}
      description={`${operation.libelle || 'Transaction'} - ${new Date(operation.dateOperation).toLocaleTimeString()}`}
      left={(props) => (
        <List.Icon 
          {...props} 
          icon={(operation.sens === 'epargne' || operation.type === 'EPARGNE') ? 'cash-plus' : 'cash-minus'}
          color={(operation.sens === 'epargne' || operation.type === 'EPARGNE') ? theme.colors.primary : theme.colors.error}
        />
      )}
    />
  );

  // ✅ AMÉLIORATION: État de chargement plus informatif
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {!journalActif ? 'Préparation du journal...' : 'Chargement...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ AMÉLIORATION: Écran sans journal avec option de création
  if (!journalActif) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noJournalContainer}>
          <Text style={styles.noJournalText}>Aucun journal actif</Text>
          <Text style={styles.noJournalSubtext}>
            Un journal est nécessaire pour effectuer des opérations
          </Text>
          <View style={styles.noJournalActions}>
            <Button
              mode="contained"
              onPress={createNewJournal}
              style={styles.createJournalButton}
            >
              Créer un journal
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              Retour
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          {/* En-tête journal */}
          <Surface style={styles.header}>
            <Title>
              {operation === 'epargne' ? 'Nouvelle Épargne' : 'Nouveau Retrait'}
            </Title>
            <Text style={styles.journalInfo}>
              Journal #{journalActif.id} - {new Date(journalActif.dateDebut).toLocaleDateString()}
            </Text>
          </Surface>

          {/* Type d'opération */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Type d'opération</Title>
              <RadioButton.Group onValueChange={setOperation} value={operation}>
                <View style={styles.radioContainer}>
                  <View style={styles.radioItem}>
                    <RadioButton value="epargne" />
                    <Text>Épargne</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="retrait" />
                    <Text>Retrait</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Sélection client */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Sélectionner un client</Title>
              {errors.client && (
                <HelperText type="error">{errors.client}</HelperText>
              )}
              {selectedClient ? (
                <Chip
                  mode="outlined"
                  onClose={() => setSelectedClient(null)}
                  style={styles.selectedChip}
                >
                  {selectedClient.nom} {selectedClient.prenom}
                </Chip>
              ) : (
                <ScrollView style={styles.clientsList} nestedScrollEnabled>
                  {clients.map(renderClientItem)}
                </ScrollView>
              )}
            </Card.Content>
          </Card>

          {/* Montant */}
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                mode="outlined"
                label="Montant (FCFA)"
                value={montant}
                onChangeText={(text) => {
                  setMontant(text);
                  if (errors.montant) {
                    setErrors({ ...errors, montant: null });
                  }
                }}
                keyboardType="numeric"
                error={!!errors.montant}
                style={styles.montantInput}
              />
              {errors.montant && (
                <HelperText type="error">{errors.montant}</HelperText>
              )}
            </Card.Content>
          </Card>

          {/* Bouton d'action */}
          <Button
            mode="contained"
            onPress={handleOperation}
            disabled={isLoading}
            loading={isLoading}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
          >
            {operation === 'epargne' ? 'Enregistrer Épargne' : 'Effectuer Retrait'}
          </Button>

          {/* Opérations récentes */}
          {recentOperations.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Title>Opérations récentes</Title>
                {recentOperations.map(renderRecentOperation)}
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurface,
  },
  noJournalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noJournalText: {
    fontSize: 18,
    marginBottom: 8,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  // ✅ NOUVEAUX STYLES
  noJournalSubtext: {
    fontSize: 14,
    marginBottom: 20,
    color: theme.colors.onSurface,
    opacity: 0.7,
    textAlign: 'center',
  },
  noJournalActions: {
    width: '100%',
    gap: 12,
  },
  createJournalButton: {
    marginBottom: 8,
  },
  backButton: {
    marginTop: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  journalInfo: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: 4,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  radioContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  selectedChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clientsList: {
    maxHeight: 200,
    marginTop: 8,
  },
  selectedClient: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  montantInput: {
    marginTop: 8,
  },
  actionButton: {
    margin: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});