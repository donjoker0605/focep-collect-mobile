// src/screens/Collecteur/ClientAddEditScreen.js - Version améliorée
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Header from '../../components/Header/Header';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// Schéma de validation pour le formulaire client
const createClientSchema = yup.object().shape({
  nom: yup
    .string()
    .required('Le nom est requis'),
  prenom: yup
    .string()
    .required('Le prénom est requis'),
  numeroCni: yup
    .string()
    .required('Le numéro CNI est requis'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[ ]?[6-9][0-9]{8}$/, 'Numéro de téléphone invalide')
    .required('Le numéro de téléphone est requis'),
  ville: yup
    .string()
    .required('La ville est requise'),
  quartier: yup
    .string()
    .required('Le quartier est requis'),
});

// Schéma de validation pour l'édition (nom et prénom non modifiables)
const editClientSchema = yup.object().shape({
  numeroCni: yup
    .string()
    .required('Le numéro CNI est requis'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[ ]?[6-9][0-9]{8}$/, 'Numéro de téléphone invalide')
    .required('Le numéro de téléphone est requis'),
  ville: yup
    .string()
    .required('La ville est requise'),
  quartier: yup
    .string()
    .required('Le quartier est requis'),
});

const ClientAddEditScreen = ({ navigation, route }) => {
  const { mode, client } = route.params || { mode: 'add' };
  const isEditMode = mode === 'edit';
  const [isLoading, setIsLoading] = useState(false);
  const [commissionType, setCommissionType] = useState('PERCENTAGE'); // FIXED, PERCENTAGE, TIER
  const [fixedAmount, setFixedAmount] = useState('1000'); // Montant fixe par défaut
  const [percentageValue, setPercentageValue] = useState('5'); // Pourcentage par défaut (5%)
  const [showCommissionSettings, setShowCommissionSettings] = useState(false);
  const { saveClient } = useOfflineSync();

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(isEditMode ? editClientSchema : createClientSchema),
    defaultValues: isEditMode && client
      ? {
          nom: client.nom,
          prenom: client.prenom,
          numeroCni: client.numeroCni,
          telephone: client.telephone,
          ville: client.ville || 'Douala',
          quartier: client.quartier || '',
        }
      : {
          nom: '',
          prenom: '',
          numeroCni: '',
          telephone: '',
          ville: 'Douala',
          quartier: '',
        }
  });

  // Charger les paramètres de commission si nous sommes en mode édition
  useEffect(() => {
    if (isEditMode && client) {
      // Si le client a des paramètres de commission personnalisés, les charger
      if (client.commissionParams) {
        setCommissionType(client.commissionParams.type || 'PERCENTAGE');
        if (client.commissionParams.type === 'FIXED') {
          setFixedAmount(client.commissionParams.value?.toString() || '1000');
        } else if (client.commissionParams.type === 'PERCENTAGE') {
          setPercentageValue(client.commissionParams.value?.toString() || '5');
        }
      }
    }
  }, [isEditMode, client]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Préparer les données du client
      const clientData = {
        ...data,
        // Ajouter les paramètres de commission si activés
        commissionParams: showCommissionSettings ? {
          type: commissionType,
          value: commissionType === 'FIXED' 
            ? parseFloat(fixedAmount) 
            : parseFloat(percentageValue),
        } : undefined
      };
      
      if (isEditMode && client) {
        // Mode édition: inclure l'ID du client existant et conserver les champs non modifiables
        clientData.id = client.id;
        clientData.nom = client.nom;
        clientData.prenom = client.prenom;
      }
      
      // Appeler la méthode du hook pour sauvegarder/mettre à jour le client
      const result = await saveClient(clientData, isEditMode);
      
      if (!result.success) {
        throw new Error(result.error || "Une erreur est survenue lors de l'enregistrement du client");
      }
      
      const savedClient = result.data;
      
      // Afficher le message de succès
      if (isEditMode) {
        Alert.alert(
          "Succès",
          `Les informations de ${savedClient.prenom} ${savedClient.nom} ont été mises à jour avec succès.`,
          [
            { 
              text: "OK", 
              onPress: () => {
                // Rediriger vers la page détail avec le client mis à jour
                navigation.navigate('ClientDetail', { client: savedClient });
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Succès",
          `Le client ${savedClient.prenom} ${savedClient.nom} a été créé avec succès.`,
          [
            { 
              text: "OK", 
              onPress: () => {
                navigation.navigate('Clients');
              }
            }
          ]
        );
      }
    } catch (error) {
      // Afficher l'erreur
      Alert.alert(
        "Erreur",
        error.message || "Une erreur est survenue lors de l'enregistrement du client",
        [{ text: "OK" }]
      );
      console.error('Erreur lors de la sauvegarde du client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectType = (type) => {
    setCommissionType(type);
  };

  const handleToggleCommissionSettings = () => {
    setShowCommissionSettings(!showCommissionSettings);
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0";
    return numValue.toLocaleString('fr-FR');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Modifier un client" : "Ajouter un client"}
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            {/* Champs d'identification (nom et prénom non modifiables en mode édition) */}
            <Text style={styles.sectionTitle}>Informations d'identification</Text>
            
            {isEditMode ? (
              // En mode édition, afficher nom et prénom en lecture seule
              <View style={styles.readOnlyFieldsContainer}>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Nom</Text>
                  <Text style={styles.readOnlyValue}>{client?.nom}</Text>
                </View>
                
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Prénom</Text>
                  <Text style={styles.readOnlyValue}>{client?.prenom}</Text>
                </View>
              </View>
            ) : (
              // En mode création, permettre la saisie du nom et prénom
              <>
                <Controller
                  control={control}
                  name="nom"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Nom"
                      placeholder="Entrez le nom"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.nom?.message}
                      style={styles.inputSpacing}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name="prenom"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Prénom"
                      placeholder="Entrez le prénom"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.prenom?.message}
                      style={styles.inputSpacing}
                    />
                  )}
                />
              </>
            )}
            
            <Controller
              control={control}
              name="numeroCni"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Numéro CNI"
                  placeholder="Entrez le numéro de CNI"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.numeroCni?.message}
                  style={styles.inputSpacing}
                />
              )}
            />
            
            <Text style={styles.sectionTitle}>Coordonnées</Text>
            
            <Controller
              control={control}
              name="telephone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Téléphone"
                  placeholder="+237 6XX XX XX XX"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  error={errors.telephone?.message}
                  style={styles.inputSpacing}
                />
              )}
            />
            
            <Controller
              control={control}
              name="ville"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Ville"
                  placeholder="Entrez la ville"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.ville?.message}
                  style={styles.inputSpacing}
                />
              )}
            />
            
            <Controller
              control={control}
              name="quartier"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Quartier"
                  placeholder="Entrez le quartier"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.quartier?.message}
                  style={styles.inputSpacing}
                />
              )}
            />
            
            {/* Paramètres de commission */}
            <Card style={styles.commissionCard}>
              <View style={styles.commissionHeader}>
                <Text style={styles.sectionTitle}>Paramètres de commission</Text>
                <TouchableOpacity 
                  style={styles.toggleButton}
                  onPress={handleToggleCommissionSettings}
                >
                  <Text style={styles.toggleButtonText}>
                    {showCommissionSettings ? "Masquer" : "Configurer"}
                  </Text>
                  <Ionicons 
                    name={showCommissionSettings ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
              
              {!showCommissionSettings ? (
                <Text style={styles.commissionDefault}>
                  Ce client utilisera les paramètres de commission par défaut du collecteur.
                </Text>
              ) : (
                <View style={styles.commissionSettings}>
                  <Text style={styles.commissionSubtitle}>Type de commission</Text>
                  
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        commissionType === 'FIXED' && styles.selectedType
                      ]}
                      onPress={() => handleSelectType('FIXED')}
                    >
                      <Ionicons
                        name="cash-outline"
                        size={24}
                        color={commissionType === 'FIXED' ? theme.colors.white : theme.colors.primary}
                      />
                      <Text style={[
                        styles.typeText,
                        commissionType === 'FIXED' && styles.selectedTypeText
                      ]}>
                        Montant fixe
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        commissionType === 'PERCENTAGE' && styles.selectedType
                      ]}
                      onPress={() => handleSelectType('PERCENTAGE')}
                    >
                      <Ionicons
                        name="trending-up-outline"
                        size={24}
                        color={commissionType === 'PERCENTAGE' ? theme.colors.white : theme.colors.primary}
                      />
                      <Text style={[
                        styles.typeText,
                        commissionType === 'PERCENTAGE' && styles.selectedTypeText
                      ]}>
                        Pourcentage
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {commissionType === 'FIXED' && (
                    <View style={styles.configSection}>
                      <Text style={styles.configTitle}>Montant fixe (FCFA)</Text>
                      <View style={styles.fixedInputContainer}>
                        <TextInput
                          style={styles.fixedInput}
                          value={fixedAmount}
                          onChangeText={setFixedAmount}
                          keyboardType="numeric"
                          placeholder="Ex: 1000"
                        />
                        <Text style={styles.currencyText}>FCFA</Text>
                      </View>
                      
                      <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>
                          Un montant fixe de <Text style={styles.highlightText}>{formatCurrency(fixedAmount)} FCFA</Text> sera prélevé comme commission sur chaque période de calcul.
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {commissionType === 'PERCENTAGE' && (
                    <View style={styles.configSection}>
                      <Text style={styles.configTitle}>Pourcentage</Text>
                      <View style={styles.fixedInputContainer}>
                        <TextInput
                          style={styles.fixedInput}
                          value={percentageValue}
                          onChangeText={setPercentageValue}
                          keyboardType="numeric"
                          placeholder="Ex: 5"
                        />
                        <Text style={styles.currencyText}>%</Text>
                      </View>
                      
                      <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>
                          Un pourcentage de <Text style={styles.highlightText}>{percentageValue}%</Text> sera appliqué au montant total collecté pour calculer la commission.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Card>
            
            <Button
              title={isEditMode ? "Mettre à jour" : "Ajouter le client"}
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
              fullWidth
            />
            
            <Button
              title="Annuler"
              onPress={() => navigation.goBack()}
              variant="outlined"
              style={styles.cancelButton}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  inputSpacing: {
    marginBottom: 16,
  },
  readOnlyFieldsContainer: {
    marginBottom: 16,
  },
  readOnlyField: {
    marginBottom: 12,
  },
  readOnlyLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
    padding: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
  },
  commissionCard: {
    marginVertical: 16,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleButtonText: {
    color: theme.colors.primary,
    marginRight: 4,
    fontWeight: '500',
  },
  commissionDefault: {
    color: theme.colors.textLight,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  commissionSettings: {
    marginTop: 8,
  },
  commissionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    marginRight: 8,
  },
  selectedType: {
    backgroundColor: theme.colors.primary,
  },
  typeText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  selectedTypeText: {
    color: theme.colors.white,
  },
  configSection: {
    marginTop: 8,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  fixedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fixedInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    fontSize: 16,
  },
  currencyText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    width: 50,
  },
  descriptionBox: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  highlightText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 24,
  }
});

export default ClientAddEditScreen;