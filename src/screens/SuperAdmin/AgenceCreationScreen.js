// src/screens/SuperAdmin/AgenceCreationScreen.js
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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Header from '../../components/Header/Header';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import superAdminService from '../../services/superAdminService';
import theme from '../../theme';

// Schéma de validation
const agenceSchema = yup.object().shape({
  nomAgence: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères')
    .required('Le nom de l\'agence est requis'),
  adresse: yup
    .string()
    .max(255, 'L\'adresse ne doit pas dépasser 255 caractères'),
  ville: yup
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(50, 'La ville ne doit pas dépasser 50 caractères')
    .required('La ville est requise'),
  quartier: yup
    .string()
    .min(2, 'Le quartier doit contenir au moins 2 caractères')
    .max(50, 'Le quartier ne doit pas dépasser 50 caractères')
    .required('Le quartier est requis'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[\s]?[679]\d{8}$/, 'Format de téléphone invalide (exemple: +237XXXXXXXXX)'),
  responsable: yup
    .string()
    .max(100, 'Le nom du responsable ne doit pas dépasser 100 caractères'),
  codeAgence: yup
    .string()
    .matches(/^[A-Z0-9]{3,10}$/, 'Le code agence doit contenir uniquement des lettres majuscules et des chiffres (3-10 caractères)')
    .max(10, 'Le code agence ne doit pas dépasser 10 caractères'),
});

const AgenceCreationScreen = ({ navigation, route }) => {
  const isEditMode = route.params?.mode === 'edit';
  const agenceToEdit = route.params?.agence;
  const [loading, setLoading] = useState(false);
  const [commissionParams, setCommissionParams] = useState([]);
  const [showCommissionForm, setShowCommissionForm] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(agenceSchema),
    defaultValues: isEditMode ? {
      nomAgence: agenceToEdit?.nomAgence || '',
      codeAgence: agenceToEdit?.codeAgence || '',
      adresse: agenceToEdit?.adresse || '',
      ville: agenceToEdit?.ville || '',
      quartier: agenceToEdit?.quartier || '',
      telephone: agenceToEdit?.telephone || '',
      responsable: agenceToEdit?.responsable || '',
    } : {
      nomAgence: '',
      codeAgence: '',
      adresse: '',
      ville: '',
      quartier: '',
      telephone: '',
      responsable: '',
    }
  });

  useEffect(() => {
    if (isEditMode && agenceToEdit) {
      setValue('nomAgence', agenceToEdit.nomAgence);
      setValue('codeAgence', agenceToEdit.codeAgence);
      setValue('adresse', agenceToEdit.adresse);
      setValue('ville', agenceToEdit.ville);
      setValue('quartier', agenceToEdit.quartier);
      setValue('telephone', agenceToEdit.telephone);
      setValue('responsable', agenceToEdit.responsable);
      
      // Charger les paramètres de commission existants
      if (agenceToEdit.parametresCommission) {
        setCommissionParams(agenceToEdit.parametresCommission);
      }
    }
  }, [isEditMode, agenceToEdit, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      // Préparer les données de l'agence
      const agenceData = {
        ...data,
        active: true,
        parametresCommission: commissionParams
      };

      let result;
      if (isEditMode) {
        result = await superAdminService.updateAgence(agenceToEdit.id, agenceData);
      } else {
        result = await superAdminService.createAgence(agenceData);
      }

      if (result.success) {
        Alert.alert(
          "Succès",
          isEditMode 
            ? `L'agence ${data.nomAgence} a été mise à jour avec succès.`
            : `L'agence ${data.nomAgence} a été créée avec succès. Tous les comptes ont été créés automatiquement.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "Erreur",
          result.error || "Une erreur est survenue lors de l'opération.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      Alert.alert(
        "Erreur",
        "Une erreur inattendue est survenue. Veuillez réessayer.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const addCommissionParam = () => {
    const newParam = {
      id: Date.now(), // Temporary ID
      typeOperation: '',
      typeCommission: 'POURCENTAGE',
      valeur: 0,
      valeurMax: null,
      paliers: []
    };
    setCommissionParams([...commissionParams, newParam]);
    setShowCommissionForm(true);
  };

  const removeCommissionParam = (paramId) => {
    setCommissionParams(commissionParams.filter(param => param.id !== paramId));
  };

  const updateCommissionParam = (paramId, updates) => {
    setCommissionParams(commissionParams.map(param => 
      param.id === paramId ? { ...param, ...updates } : param
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Modifier une agence" : "Créer une agence"}
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>📋 Informations de base</Text>
            
            <Controller
              control={control}
              name="nomAgence"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom de l'agence *"
                  placeholder="Entrez le nom de l'agence"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nomAgence?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="codeAgence"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Code agence (optionnel)"
                  placeholder="Ex: FCEP001, DOUALA01"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  onBlur={onBlur}
                  error={errors.codeAgence?.message}
                  style={styles.input}
                  maxLength={10}
                />
              )}
            />
            
            <Text style={styles.sectionTitle}>📍 Localisation</Text>
            
            <Controller
              control={control}
              name="ville"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Ville *"
                  placeholder="Ex: Douala, Yaoundé, Bafoussam"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.ville?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="quartier"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Quartier *"
                  placeholder="Ex: Akwa, Bonanjo, Makepe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.quartier?.message}
                  style={styles.input}
                />
              )}
            />
            
            <Controller
              control={control}
              name="adresse"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Adresse complète"
                  placeholder="Adresse détaillée de l'agence"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.adresse?.message}
                  style={styles.input}
                  multiline={true}
                  numberOfLines={2}
                />
              )}
            />

            <Text style={styles.sectionTitle}>📞 Contact</Text>
            
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
                  style={styles.input}
                />
              )}
            />
            
            <Controller
              control={control}
              name="responsable"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom du responsable"
                  placeholder="Nom du responsable de l'agence"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.responsable?.message}
                  style={styles.input}
                />
              )}
            />

            <Text style={styles.sectionTitle}>💰 Paramètres de commission</Text>
            
            <View style={styles.commissionSection}>
              <Text style={styles.commissionDescription}>
                Les paramètres de commission définissent comment calculer les commissions des collecteurs pour cette agence.
              </Text>
              
              {commissionParams.length > 0 && (
                <View style={styles.commissionList}>
                  {commissionParams.map((param, index) => (
                    <View key={param.id} style={styles.commissionItem}>
                      <View style={styles.commissionInfo}>
                        <Text style={styles.commissionType}>
                          {param.typeOperation || 'Type non défini'}
                        </Text>
                        <Text style={styles.commissionValue}>
                          {param.typeCommission === 'POURCENTAGE' ? `${param.valeur}%` : `${param.valeur} FCFA`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeCommissionParam(param.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              <Button
                title="+ Ajouter un paramètre"
                onPress={addCommissionParam}
                variant="outlined"
                style={styles.addCommissionButton}
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                🏦 Lors de la création, tous les comptes nécessaires seront automatiquement créés :
                {'\n'}• Compte Agence (principal)
                {'\n'}• Compte Produit Collecte  
                {'\n'}• Compte Charge Collecte
                {'\n'}• Compte Passage Commission
                {'\n'}• Compte Passage Taxe (TVA 19,25%)
              </Text>
            </View>
            
            <Button
              title={isEditMode ? "Mettre à jour l'agence" : "Créer l'agence"}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitButton}
            />
            
            <Button
              title="Annuler"
              onPress={() => navigation.goBack()}
              variant="outlined"
              style={styles.cancelButton}
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
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  commissionSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  commissionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  commissionList: {
    marginBottom: 16,
  },
  commissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  commissionInfo: {
    flex: 1,
  },
  commissionType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  commissionValue: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    marginLeft: 12,
  },
  addCommissionButton: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.info + '15',
    borderRadius: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 12,
    marginBottom: 32,
  },
});

export default AgenceCreationScreen;