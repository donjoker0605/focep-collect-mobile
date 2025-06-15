// src/screens/Admin/CommissionParametersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SelectInput from '../../components/SelectInput/SelectInput';
import Input from '../../components/Input/Input';
import theme from '../../theme';
import { commissionService, collecteurService, clientService } from '../../services';

const CommissionParametersScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entityType, setEntityType] = useState('agence'); // agence, collecteur, client
  const [selectedCollecteur, setSelectedCollecteur] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [collecteurs, setCollecteurs] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Paramètres de commission
  const [commissionParams, setCommissionParams] = useState({
    tauxCommission: '',
    montantMinimum: '',
    montantMaximum: '',
    typeCalcul: 'pourcentage', // pourcentage ou fixe
    periodicite: 'mensuelle', // mensuelle, hebdomadaire, journaliere
    conditions: []
  });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Charger les paramètres quand l'entité change
  useEffect(() => {
    if (entityType === 'agence' || 
        (entityType === 'collecteur' && selectedCollecteur) ||
        (entityType === 'client' && selectedClient)) {
      loadCommissionParams();
    }
  }, [entityType, selectedCollecteur, selectedClient]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Charger les collecteurs
      const collecteursResponse = await collecteurService.getAllCollecteurs();
      if (collecteursResponse.success) {
        setCollecteurs(collecteursResponse.data || []);
      }
      
      // Charger les paramètres de l'agence par défaut
      await loadCommissionParams();
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadCommissionParams = async () => {
    try {
      let response;
      
      switch (entityType) {
        case 'agence':
          response = await commissionService.getAgenceCommissionParams();
          break;
        case 'collecteur':
          if (selectedCollecteur) {
            response = await commissionService.getCollecteurCommissionParams(selectedCollecteur);
          }
          break;
        case 'client':
          if (selectedClient) {
            response = await commissionService.getClientCommissionParams(selectedClient);
          }
          break;
      }
      
      if (response?.success && response.data) {
        setCommissionParams({
          tauxCommission: response.data.tauxCommission?.toString() || '',
          montantMinimum: response.data.montantMinimum?.toString() || '',
          montantMaximum: response.data.montantMaximum?.toString() || '',
          typeCalcul: response.data.typeCalcul || 'pourcentage',
          periodicite: response.data.periodicite || 'mensuelle',
          conditions: response.data.conditions || []
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const loadClientsForCollecteur = async (collecteurId) => {
    try {
      const response = await clientService.getClientsByCollecteur(collecteurId);
      if (response.success) {
        setClients(response.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const handleEntityTypeChange = (type) => {
    setEntityType(type);
    setSelectedCollecteur(null);
    setSelectedClient(null);
    setClients([]);
  };

  const handleCollecteurChange = (collecteurId) => {
    setSelectedCollecteur(collecteurId);
    setSelectedClient(null);
    if (collecteurId && entityType === 'client') {
      loadClientsForCollecteur(collecteurId);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!commissionParams.tauxCommission || parseFloat(commissionParams.tauxCommission) <= 0) {
      Alert.alert('Erreur', 'Le taux de commission doit être supérieur à 0');
      return;
    }

    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir enregistrer ces paramètres pour ${
        entityType === 'agence' ? "l'agence" :
        entityType === 'collecteur' ? 'le collecteur sélectionné' :
        'le client sélectionné'
      } ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: executeSave }
      ]
    );
  };

  const executeSave = async () => {
    try {
      setSaving(true);
      
      const params = {
        tauxCommission: parseFloat(commissionParams.tauxCommission),
        montantMinimum: commissionParams.montantMinimum ? parseFloat(commissionParams.montantMinimum) : null,
        montantMaximum: commissionParams.montantMaximum ? parseFloat(commissionParams.montantMaximum) : null,
        typeCalcul: commissionParams.typeCalcul,
        periodicite: commissionParams.periodicite,
        conditions: commissionParams.conditions
      };

      let response;
      
      switch (entityType) {
        case 'agence':
          response = await commissionService.updateAgenceCommissionParams(params);
          break;
        case 'collecteur':
          response = await commissionService.updateCollecteurCommissionParams(selectedCollecteur, params);
          break;
        case 'client':
          response = await commissionService.updateClientCommissionParams(selectedClient, params);
          break;
      }

      if (response.success) {
        Alert.alert('Succès', 'Paramètres enregistrés avec succès');
      } else {
        Alert.alert('Erreur', response.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les paramètres');
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => {
    Alert.prompt(
      'Nouvelle condition',
      'Entrez la condition (ex: montant > 100000)',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter',
          onPress: (text) => {
            if (text && text.trim()) {
              setCommissionParams(prev => ({
                ...prev,
                conditions: [...prev.conditions, text.trim()]
              }));
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const removeCondition = (index) => {
    setCommissionParams(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Paramètres de commission"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Paramètres de commission"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélection du niveau */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Niveau de paramétrage</Text>
          <Text style={styles.infoText}>
            Hiérarchie: Client > Collecteur > Agence
          </Text>
          
          <View style={styles.entityTypeContainer}>
            {['agence', 'collecteur', 'client'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.entityTypeButton,
                  entityType === type && styles.activeEntityType
                ]}
                onPress={() => handleEntityTypeChange(type)}
              >
                <Text style={[
                  styles.entityTypeText,
                  entityType === type && styles.activeEntityTypeText
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sélection collecteur */}
          {(entityType === 'collecteur' || entityType === 'client') && (
            <View style={styles.selectContainer}>
              <Text style={styles.label}>Sélectionner un collecteur</Text>
              <SelectInput
                value={selectedCollecteur}
                options={collecteurs.map(c => ({
                  label: `${c.prenom} ${c.nom}`,
                  value: c.id
                }))}
                onChange={handleCollecteurChange}
                placeholder="Choisir un collecteur"
              />
            </View>
          )}

          {/* Sélection client */}
          {entityType === 'client' && selectedCollecteur && (
            <View style={styles.selectContainer}>
              <Text style={styles.label}>Sélectionner un client</Text>
              <SelectInput
                value={selectedClient}
                options={clients.map(c => ({
                  label: `${c.prenom} ${c.nom}`,
                  value: c.id
                }))}
                onChange={setSelectedClient}
                placeholder="Choisir un client"
                disabled={!selectedCollecteur}
              />
            </View>
          )}
        </Card>

        {/* Paramètres de commission */}
        {((entityType === 'agence') || 
          (entityType === 'collecteur' && selectedCollecteur) ||
          (entityType === 'client' && selectedClient)) && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Paramètres de commission</Text>
            
            {/* Type de calcul */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type de calcul</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setCommissionParams(prev => ({ ...prev, typeCalcul: 'pourcentage' }))}
                >
                  <View style={[styles.radio, commissionParams.typeCalcul === 'pourcentage' && styles.radioActive]}>
                    {commissionParams.typeCalcul === 'pourcentage' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioText}>Pourcentage</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setCommissionParams(prev => ({ ...prev, typeCalcul: 'fixe' }))}
                >
                  <View style={[styles.radio, commissionParams.typeCalcul === 'fixe' && styles.radioActive]}>
                    {commissionParams.typeCalcul === 'fixe' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioText}>Montant fixe</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Taux ou montant */}
            <Input
              label={commissionParams.typeCalcul === 'pourcentage' ? "Taux de commission (%)" : "Montant fixe (FCFA)"}
              value={commissionParams.tauxCommission}
              onChangeText={(text) => setCommissionParams(prev => ({ ...prev, tauxCommission: text }))}
              keyboardType="numeric"
              placeholder={commissionParams.typeCalcul === 'pourcentage' ? "Ex: 2.5" : "Ex: 5000"}
            />

            {/* Montants min/max */}
            {commissionParams.typeCalcul === 'pourcentage' && (
              <>
                <Input
                  label="Montant minimum épargne (FCFA)"
                  value={commissionParams.montantMinimum}
                  onChangeText={(text) => setCommissionParams(prev => ({ ...prev, montantMinimum: text }))}
                  keyboardType="numeric"
                  placeholder="Ex: 10000"
                />
                
                <Input
                  label="Montant maximum épargne (FCFA)"
                  value={commissionParams.montantMaximum}
                  onChangeText={(text) => setCommissionParams(prev => ({ ...prev, montantMaximum: text }))}
                  keyboardType="numeric"
                  placeholder="Ex: 1000000"
                />
              </>
            )}

            {/* Périodicité */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Périodicité de calcul</Text>
              <SelectInput
                value={commissionParams.periodicite}
                options={[
                  { label: 'Journalière', value: 'journaliere' },
                  { label: 'Hebdomadaire', value: 'hebdomadaire' },
                  { label: 'Mensuelle', value: 'mensuelle' }
                ]}
                onChange={(value) => setCommissionParams(prev => ({ ...prev, periodicite: value }))}
              />
            </View>

            {/* Conditions spéciales */}
            <View style={styles.conditionsContainer}>
              <View style={styles.conditionsHeader}>
                <Text style={styles.label}>Conditions spéciales</Text>
                <TouchableOpacity onPress={addCondition}>
                  <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              
              {commissionParams.conditions.map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <Text style={styles.conditionText}>{condition}</Text>
                  <TouchableOpacity onPress={() => removeCondition(index)}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {commissionParams.conditions.length === 0 && (
                <Text style={styles.noConditionsText}>Aucune condition spéciale</Text>
              )}
            </View>
          </Card>
        )}

        {/* Bouton enregistrer */}
        {((entityType === 'agence') || 
          (entityType === 'collecteur' && selectedCollecteur) ||
          (entityType === 'client' && selectedClient)) && (
          <Button
            title="Enregistrer les paramètres"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  card: {
    marginBottom: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  entityTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  entityTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeEntityType: {
    backgroundColor: theme.colors.primary,
  },
  entityTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  activeEntityTypeText: {
    color: theme.colors.white,
  },
  selectContainer: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  radioText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  conditionsContainer: {
    marginTop: 16,
  },
  conditionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  conditionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    marginRight: 8,
  },
  noConditionsText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  saveButton: {
    marginBottom: 20,
  },
});

export default CommissionParametersScreen;