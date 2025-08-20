// src/screens/SuperAdmin/CollecteurCreationScreen.js
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
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Header from '../../components/Header/Header';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import superAdminService from '../../services/superAdminService';
import theme from '../../theme';

// Schéma de validation
const collecteurSchema = yup.object().shape({
  nom: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .required('Le nom est requis'),
  prenom: yup
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne doit pas dépasser 50 caractères')
    .required('Le prénom est requis'),
  numeroCni: yup
    .string()
    .min(8, 'Le numéro CNI doit contenir au moins 8 caractères')
    .max(20, 'Le numéro CNI ne doit pas dépasser 20 caractères')
    .required('Le numéro CNI est requis'),
  adresseMail: yup
    .string()
    .email('Format email invalide')
    .required('L\'email est requis'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[\s]?[679]\d{8}$/, 'Format de téléphone invalide (exemple: +237XXXXXXXXX)')
    .required('Le téléphone est requis'),
  agenceId: yup
    .number()
    .positive('Veuillez sélectionner une agence')
    .required('L\'agence est requise'),
  montantMaxRetrait: yup
    .number()
    .min(0, 'Le montant doit être positif')
    .max(10000000, 'Le montant ne doit pas dépasser 10 000 000')
    .required('Le montant maximum de retrait est requis'),
  ancienneteEnMois: yup
    .number()
    .min(0, 'L\'ancienneté doit être positive')
    .max(600, 'L\'ancienneté ne doit pas dépasser 600 mois')
    .required('L\'ancienneté est requise'),
});

const CollecteurCreationScreen = ({ navigation, route }) => {
  const isEditMode = route.params?.mode === 'edit';
  const collecteurToEdit = route.params?.collecteur;
  const [loading, setLoading] = useState(false);
  const [agences, setAgences] = useState([]);
  const [loadingAgences, setLoadingAgences] = useState(true);
  const [admins, setAdmins] = useState([]);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(collecteurSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      numeroCni: '',
      adresseMail: '',
      telephone: '',
      agenceId: '',
      adminId: '',
      montantMaxRetrait: 50000,
      ancienneteEnMois: 0,
      active: true,
      ...( isEditMode && collecteurToEdit ? {
        nom: collecteurToEdit.nom || '',
        prenom: collecteurToEdit.prenom || '',
        numeroCni: collecteurToEdit.numeroCni || '',
        adresseMail: collecteurToEdit.adresseMail || '',
        telephone: collecteurToEdit.telephone || '',
        agenceId: collecteurToEdit.agenceId || '',
        adminId: collecteurToEdit.adminId || '',
        montantMaxRetrait: collecteurToEdit.montantMaxRetrait || 50000,
        ancienneteEnMois: collecteurToEdit.ancienneteEnMois || 0,
        active: collecteurToEdit.active !== false,
      } : {})
    }
  });

  const selectedAgenceId = watch('agenceId');

  useEffect(() => {
    loadAgences();
  }, []);

  useEffect(() => {
    if (selectedAgenceId) {
      loadAdminsByAgence(selectedAgenceId);
    }
  }, [selectedAgenceId]);

  const loadAgences = async () => {
    setLoadingAgences(true);
    try {
      const result = await superAdminService.getAllAgences();
      if (result.success) {
        setAgences(result.data || []);
      } else {
        console.error('Erreur chargement agences:', result.error);
        Alert.alert('Erreur', 'Impossible de charger les agences');
      }
    } catch (error) {
      console.error('Erreur loadAgences:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des agences');
    } finally {
      setLoadingAgences(false);
    }
  };

  const loadAdminsByAgence = async (agenceId) => {
    try {
      const result = await superAdminService.getAdminsByAgence(agenceId);
      if (result.success) {
        setAdmins(result.data || []);
      } else {
        console.error('Erreur chargement admins:', result.error);
        setAdmins([]);
      }
    } catch (error) {
      console.error('Erreur loadAdminsByAgence:', error);
      setAdmins([]);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const collecteurData = {
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        numeroCni: data.numeroCni.trim(),
        adresseMail: data.adresseMail.trim().toLowerCase(),
        telephone: data.telephone.trim(),
        agenceId: parseInt(data.agenceId),
        adminId: data.adminId ? parseInt(data.adminId) : null,
        montantMaxRetrait: parseFloat(data.montantMaxRetrait),
        ancienneteEnMois: parseInt(data.ancienneteEnMois),
        active: data.active,
        role: 'COLLECTEUR'
      };

      // Génération d'un mot de passe temporaire pour les nouveaux collecteurs
      if (!isEditMode) {
        collecteurData.password = generateTemporaryPassword();
      }

      let result;
      if (isEditMode) {
        result = await superAdminService.updateCollecteur(collecteurToEdit.id, collecteurData);
      } else {
        result = await superAdminService.createCollecteur(collecteurData);
      }

      if (result.success) {
        const message = isEditMode 
          ? `Le collecteur ${data.nom} ${data.prenom} a été mis à jour avec succès.`
          : `Le collecteur ${data.nom} ${data.prenom} a été créé avec succès.\n\nMot de passe temporaire: ${collecteurData.password}\n\nLe collecteur devra changer son mot de passe lors de sa première connexion.`;

        Alert.alert(
          "Succès",
          message,
          [{ 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }]
        );
      } else {
        Alert.alert(
          "Erreur",
          result.error || "Une erreur est survenue lors de la sauvegarde"
        );
      }
    } catch (error) {
      console.error('Erreur onSubmit:', error);
      Alert.alert(
        "Erreur",
        "Une erreur inattendue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getSelectedAgenceName = () => {
    const agence = agences.find(a => a.id && a.id.toString() === selectedAgenceId?.toString());
    return agence ? agence.nomAgence : 'Aucune agence sélectionnée';
  };

  if (loadingAgences) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={isEditMode ? "Modifier collecteur" : "Créer collecteur"}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Modifier collecteur" : "Créer collecteur"}
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>👤 Informations Personnelles</Text>
            
            <Controller
              control={control}
              name="nom"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom *"
                  placeholder="Nom de famille"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nom?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="prenom"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Prénom *"
                  placeholder="Prénom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.prenom?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="numeroCni"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Numéro CNI *"
                  placeholder="Ex: 123456789"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  onBlur={onBlur}
                  error={errors.numeroCni?.message}
                  style={styles.input}
                  maxLength={20}
                />
              )}
            />
            
            <Text style={styles.sectionTitle}>📞 Contact</Text>
            
            <Controller
              control={control}
              name="adresseMail"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email *"
                  placeholder="exemple@email.com"
                  value={value}
                  onChangeText={(text) => onChange(text.toLowerCase())}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.adresseMail?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="telephone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Téléphone *"
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

            <Text style={styles.sectionTitle}>🏢 Assignation</Text>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Agence d'assignation *</Text>
              <Controller
                control={control}
                name="agenceId"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={value}
                      onValueChange={(itemValue) => {
                        onChange(itemValue);
                        setValue('adminId', ''); // Reset admin selection
                      }}
                      style={styles.picker}
                    >
                      <Picker.Item label="Sélectionner une agence" value="" />
                      {agences.filter(agence => agence.id).map(agence => (
                        <Picker.Item
                          key={agence.id}
                          label={`${agence.nomAgence} (${agence.codeAgence || agence.ville})`}
                          value={agence.id.toString()}
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              />
              {errors.agenceId && (
                <Text style={styles.errorText}>{errors.agenceId.message}</Text>
              )}
            </View>

            {selectedAgenceId && (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Admin superviseur (optionnel)</Text>
                <Controller
                  control={control}
                  name="adminId"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={value}
                        onValueChange={onChange}
                        style={styles.picker}
                      >
                        <Picker.Item label="Aucun admin assigné" value="" />
                        {admins.filter(admin => admin.id).map(admin => (
                          <Picker.Item
                            key={admin.id}
                            label={`${admin.nom} ${admin.prenom}`}
                            value={admin.id.toString()}
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                />
              </View>
            )}

            <Text style={styles.sectionTitle}>💰 Paramètres Financiers</Text>

            <Controller
              control={control}
              name="montantMaxRetrait"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Montant maximum de retrait (FCFA) *"
                  placeholder="50000"
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  error={errors.montantMaxRetrait?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="ancienneteEnMois"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Ancienneté (en mois) *"
                  placeholder="0"
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseInt(text) || 0)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  error={errors.ancienneteEnMois?.message}
                  style={styles.input}
                />
              )}
            />

            <Text style={styles.sectionTitle}>⚙️ Configuration</Text>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Collecteur actif</Text>
              <Controller
                control={control}
                name="active"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                    thumbColor={value ? theme.colors.primary : theme.colors.gray}
                  />
                )}
              />
            </View>

            <Card style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.infoTitle}>Informations importantes</Text>
              </View>
              <Text style={styles.infoText}>
                • Agence sélectionnée: {getSelectedAgenceName()}
                {'\n'}• Le collecteur pourra se connecter à l'application mobile
                {'\n'}• Un mot de passe temporaire sera généré automatiquement
                {'\n'}• Le collecteur devra changer son mot de passe lors de sa première connexion
                {'\n'}• Tous les comptes financiers seront créés automatiquement
              </Text>
            </Card>
            
            <Button
              title={isEditMode ? "Mettre à jour le collecteur" : "Créer le collecteur"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textLight,
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
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  infoCard: {
    backgroundColor: theme.colors.infoLight,
    marginTop: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.info,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.info,
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 32,
  },
});

export default CollecteurCreationScreen;