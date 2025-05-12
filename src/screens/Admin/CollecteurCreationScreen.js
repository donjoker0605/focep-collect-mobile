// src/screens/Admin/CollecteurCreationScreen.js
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
import { useAuth } from '../../hooks/useAuth';

// Schéma de validation
const collecteurSchema = yup.object().shape({
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
  numeroCni: yup
    .string()
    .required('Le numéro CNI est requis'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[ ]?[6-9][0-9]{8}$/, 'Numéro de téléphone invalide')
    .required('Le numéro de téléphone est requis'),
  montantMaxRetrait: yup
    .number()
    .typeError('Le montant doit être un nombre')
    .min(1000, 'Le montant minimal autorisé est de 1 000 FCFA')
    .max(500000, 'Le montant maximal autorisé est de 500 000 FCFA')
    .required('Le montant maximal de retrait est requis'),
  password: yup
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .required('Le mot de passe est requis'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre')
    .required('La confirmation du mot de passe est requise'),
});

const CollecteurCreationScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const isEditMode = route.params?.mode === 'edit';
  const collecteurToEdit = route.params?.collecteur;
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState({
    password: true,
    confirmPassword: true,
  });
  const [agence, setAgence] = useState(null);

  // Pour les super-admins, nous pouvons continuer à proposer une sélection d'agence
  // Pour les admins standard, l'agence est automatiquement celle de l'admin
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(collecteurSchema),
    defaultValues: isEditMode ? {
      nom: collecteurToEdit?.nom || '',
      prenom: collecteurToEdit?.prenom || '',
      adresseMail: collecteurToEdit?.adresseMail || '',
      numeroCni: collecteurToEdit?.numeroCni || '',
      telephone: collecteurToEdit?.telephone || '',
      montantMaxRetrait: collecteurToEdit?.montantMaxRetrait?.toString() || '',
      password: '',
      confirmPassword: '',
    } : {
      nom: '',
      prenom: '',
      adresseMail: '',
      telephone: '',
      numeroCni: '',
      montantMaxRetrait: '150000',
      password: '',
      confirmPassword: '',
    }
  });

  useEffect(() => {
    // En mode édition, utiliser l'agence du collecteur
    if (isEditMode && collecteurToEdit?.agence) {
      setAgence(collecteurToEdit.agence);
    } 
    // Pour un admin ordinaire, utiliser automatiquement son agence
    else if (!isSuperAdmin && user?.agence) {
      setAgence(user.agence);
    }
    // Si un agenceId est fourni en paramètre (depuis un détail d'agence par exemple)
    else if (route.params?.agenceId) {
      // Simuler la récupération des détails de l'agence
      // En production, ce serait un appel API
      setAgence({ 
        id: route.params.agenceId,
        nomAgence: 'Agence sélectionnée' // Ce serait remplacé par une vraie requête
      });
    }
  }, [isEditMode, collecteurToEdit, user, isSuperAdmin, route.params]);

  const toggleSecureEntry = (field) => {
    setSecureTextEntry({
      ...secureTextEntry,
      [field]: !secureTextEntry[field],
    });
  };

  const onSubmit = (data) => {
    // Si aucune agence n'est sélectionnée
    if (!agence) {
      Alert.alert("Erreur", "Aucune agence n'est sélectionnée pour ce collecteur.");
      return;
    }

    setLoading(true);
    
    // Ajouter l'ID de l'agence aux données à envoyer
    const submitData = {
      ...data,
      agenceId: agence.id
    };
    
    // Simuler un appel API
    setTimeout(() => {
      setLoading(false);
      
      if (isEditMode) {
        Alert.alert(
          "Succès",
          `Le collecteur ${data.prenom} ${data.nom} a été mis à jour avec succès.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "Succès",
          `Le collecteur ${data.prenom} ${data.nom} a été créé avec succès.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Modifier un collecteur" : "Créer un collecteur"}
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
              name="numeroCni"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Numéro CNI"
                  placeholder="Entrez le numéro CNI"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.numeroCni?.message}
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
            
            <Text style={styles.sectionTitle}>Paramètres du collecteur</Text>
            
            {/* Affichage de l'agence (non modifiable pour les admins standard) */}
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Agence</Text>
              {agence ? (
                <View style={styles.agenceDisplay}>
                  <Ionicons name="business-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.agenceText}>
                    {agence.nomAgence}
                  </Text>
                </View>
              ) : (
                <View style={styles.agenceWarning}>
                  <Ionicons name="warning-outline" size={20} color={theme.colors.warning} />
                  <Text style={styles.agenceWarningText}>
                    Aucune agence sélectionnée. Veuillez contacter un administrateur.
                  </Text>
                </View>
              )}
            </View>
            
            <Controller
              control={control}
              name="montantMaxRetrait"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Montant maximal de retrait (FCFA)"
                  placeholder="Entrez le montant"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  error={errors.montantMaxRetrait?.message}
                  style={styles.input}
                />
              )}
            />
            
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
              title={isEditMode ? "Mettre à jour" : "Créer le collecteur"}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitButton}
              disabled={!agence}
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
  agenceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
  },
  agenceText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 16,
  },
  agenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: 8,
    padding: 12,
  },
  agenceWarningText: {
    marginLeft: 8,
    color: theme.colors.textDark,
    fontSize: 14,
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

export default CollecteurCreationScreen;