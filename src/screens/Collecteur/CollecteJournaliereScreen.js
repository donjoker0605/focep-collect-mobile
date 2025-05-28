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

export const CollecteJournaliereScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [operation, setOperation] = useState('epargne'); // 'epargne' ou 'retrait'
  const [montant, setMontant] = useState('');
  const [journalActif, setJournalActif] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [recentOperations, setRecentOperations] = useState([]);

  // Charger les données au montage
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
  setIsLoading(true);
  try {
    await fetchClients(user.id);
    
    await loadOperationsDuJour();
  } catch (error) {
    Alert.alert('Erreur', 'Impossible de charger les données');
  } finally {
    setIsLoading(false);
  }
};

const loadOperationsDuJour = async () => {
  try {
    const operations = await MouvementService.getOperationsDuJour(user.id);
    setRecentOperations(operations.slice(-5));
  } catch (error) {
    console.error('Error loading operations du jour:', error);
    setRecentOperations([]); // Pas d'erreur si aucune opération
  }
};

  const loadRecentOperations = async (journalId) => {
    try {
      const operations = await MouvementService.getMouvementsByJournal(journalId);
      setRecentOperations(operations.slice(-5)); // Les 5 dernières opérations
    } catch (error) {
      console.error('Error loading recent operations:', error);
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
      title={`${operation.type} - ${operation.montant} FCFA`}
      description={`${operation.client.nom} ${operation.client.prenom} - ${new Date(operation.dateOperation).toLocaleTimeString()}`}
      left={(props) => (
        <List.Icon 
          {...props} 
          icon={operation.type === 'EPARGNE' ? 'cash-plus' : 'cash-minus'}
          color={operation.type === 'EPARGNE' ? theme.colors.primary : theme.colors.error}
        />
      )}
    />
  );

  if (isLoading && !journalActif) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!journalActif) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noJournalContainer}>
          <Text style={styles.noJournalText}>Aucun journal actif</Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
          >
            Retour
          </Button>
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
            <Title>Collecte Journalière</Title>
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
    marginBottom: 20,
    color: theme.colors.onSurface,
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