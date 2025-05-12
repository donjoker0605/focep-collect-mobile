// src/screens/SuperAdmin/AdminCreationScreen.js
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Header from '../../components/Header/Header';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import theme from '../../theme';

// Schéma de validation
const adminSchema = yup.object().shape({
  nom: yup
    .string()
    .required('Le nom est requis'),
  prenom: yup
    .string()
    .required('Le prénom est requis'),
  adresseMail: yup
    .string()
    .email('Veuillez entrer un email valide')
    .required('L\'email est requis'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[ ]?[6-9][0-9]{8}$/, 'Numéro de téléphone invalide')
    .required('Le numéro de téléphone est requis'),
  agenceId: yup
    .number()
    .required('L\'agence est requise'),
  password: yup
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .required('Le mot de passe est requis'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre')
    .required('La confirmation du mot de passe est requise'),
});

// Données fictives pour la démo
const agences = [
  { id: 1, nomAgence: 'Agence Centrale' },
  { id: 2, nomAgence: 'Agence Nord' },
  { id: 3, nomAgence: 'Agence Sud' },
  { id: 4, nomAgence: 'Agence Est' },
];

const AdminCreationScreen = ({ navigation, route }) => {
  const isEditMode = route.params?.mode === 'edit';
  const adminToEdit = route.params?.admin;
  const [loading, setLoading] = useState(false);
  const [selectedAgence, setSelectedAgence] = useState(null);
  const [showAgenceDropdown, setShowAgenceDropdown] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState({
    password: true,
    confirmPassword: true,
  });

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(adminSchema),
    defaultValues: isEditMode ? {
      nom: adminToEdit?.nom || '',
      prenom: adminToEdit?.prenom || '',
      adresseMail: adminToEdit?.adresseMail || '',
      telephone: adminToEdit?.telephone || '',
      agenceId: adminToEdit?.agence?.id || '',
      password: '',
      confirmPassword: '',
    } : {
      nom: '',
      prenom: '',
      adresseMail: '',
      telephone: '',
      agenceId: '',
      password: '',
      confirmPassword: '',
    }
  });

  useEffect(() => {
    if (isEditMode && adminToEdit) {
      setSelectedAgence(adminToEdit.agence);
      setValue('agenceId', adminToEdit.agence.id);
    }
  }, [isEditMode, adminToEdit, setValue]);

  const toggleSecureEntry = (field) => {
    setSecureTextEntry({
      ...secureTextEntry,
      [field]: !secureTextEntry[field],
    });
  };

  const onSubmit = (data) => {
    setLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      setLoading(false);
      
      if (isEditMode) {
        Alert.alert(
          "Succès",
          `L'administrateur ${data.prenom} ${data.nom} a été mis à jour avec succès.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "Succès",
          `L'administrateur ${data.prenom} ${data.nom} a été créé avec succès.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }, 1500);
  };

  const handleSelectAgence = (agence) => {
    setSelectedAgence(agence);
    setValue('agenceId', agence.id);
    setShowAgenceDropdown(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Modifier un administrateur" : "Créer un administrateur"}
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
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
                  style={styles.input}
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
                  style={styles.input}
                />
              )}
            />
            
            <Controller
              control={control}
              name="adresseMail"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Adresse e-mail"
                  placeholder="exemple@email.com"
                  value={value}
                  onChangeText={onChange}
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
            
            <Text style={styles.sectionTitle}>Affectation</Text>
            
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Agence</Text>
              <TouchableOpacity
                style={[
                  styles.agenceSelector,
                  errors.agenceId && styles.inputError
                ]}
                onPress={() => setShowAgenceDropdown(!showAgenceDropdown)}
              >
                <Text style={selectedAgence ? styles.agenceText : styles.agencePlaceholder}>
                  {selectedAgence ? selectedAgence.nomAgence : "Sélectionnez une agence"}
                </Text>
                <Ionicons 
                  name={showAgenceDropdown ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={theme.colors.gray} 
                />
              </TouchableOpacity>
              {errors.agenceId && (
                <Text style={styles.errorText}>{errors.agenceId.message}</Text>
              )}
              
              {showAgenceDropdown && (
                <View style={styles.dropdown}>
                  {agences.map(agence => (
                    <TouchableOpacity
                      key={agence.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectAgence(agence)}
                    >
                      <Text style={styles.dropdownItemText}>{agence.nomAgence}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {!isEditMode && (
              <>
                <Text style={styles.sectionTitle}>Identifiants de connexion</Text>
                
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Mot de passe"
                      placeholder="Entrez le mot de passe"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={secureTextEntry.password}
                      error={errors.password?.message}
                      style={styles.input}
                      rightIcon={secureTextEntry.password ? "eye-off" : "eye"}
                      onRightIconPress={() => toggleSecureEntry('password')}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Confirmer le mot de passe"
                      placeholder="Confirmez le mot de passe"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={secureTextEntry.confirmPassword}
                      error={errors.confirmPassword?.message}
                      style={styles.input}
                      rightIcon={secureTextEntry.confirmPassword ? "eye-off" : "eye"}
                      onRightIconPress={() => toggleSecureEntry('confirmPassword')}
                    />
                  )}
                />
              </>
            )}
            
            <Button
              title={isEditMode ? "Mettre à jour" : "Créer l'administrateur"}
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
    marginTop: 20,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  agenceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.lightGray,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
  },
  agencePlaceholder: {
    color: theme.colors.gray,
  },
  agenceText: {
    color: theme.colors.text,
  },
  dropdown: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginTop: 8,
    ...theme.shadows.small,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  dropdownItemText: {
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 12,
    marginBottom: 32,
  },
});

export default AdminCreationScreen;