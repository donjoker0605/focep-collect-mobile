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
const agenceSchema = yup.object().shape({
  nomAgence: yup
    .string()
    .required('Le nom de l\'agence est requis'),
  adresse: yup
    .string()
    .required('L\'adresse est requise'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[ ]?[2-3][0-9]{8}$/, 'Numéro de téléphone invalide')
    .required('Le numéro de téléphone est requis'),
  email: yup
    .string()
    .email('Veuillez entrer un email valide')
    .required('L\'email est requis'),
});

const AgenceCreationScreen = ({ navigation, route }) => {
  const isEditMode = route.params?.mode === 'edit';
  const agenceToEdit = route.params?.agence;
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(agenceSchema),
    defaultValues: isEditMode ? {
      nomAgence: agenceToEdit?.nomAgence || '',
      adresse: agenceToEdit?.adresse || '',
      telephone: agenceToEdit?.telephone || '',
      email: agenceToEdit?.email || '',
    } : {
      nomAgence: '',
      adresse: '',
      telephone: '',
      email: '',
    }
  });

  useEffect(() => {
    if (isEditMode && agenceToEdit) {
      setValue('nomAgence', agenceToEdit.nomAgence);
      setValue('adresse', agenceToEdit.adresse);
      setValue('telephone', agenceToEdit.telephone);
      setValue('email', agenceToEdit.email);
    }
  }, [isEditMode, agenceToEdit, setValue]);

  const onSubmit = (data) => {
    setLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      setLoading(false);
      
      if (isEditMode) {
        Alert.alert(
          "Succès",
          `L'agence ${data.nomAgence} a été mise à jour avec succès.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "Succès",
          `L'agence ${data.nomAgence} a été créée avec succès.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }, 1500);
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
            <Text style={styles.sectionTitle}>Informations de l'agence</Text>
            
            <Controller
              control={control}
              name="nomAgence"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom de l'agence"
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
              name="adresse"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Adresse"
                  placeholder="Entrez l'adresse de l'agence"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.adresse?.message}
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
                  placeholder="+237 2XX XX XX XX"
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
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="exemple@agence.focep.cm"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                  style={styles.input}
                />
              )}
            />
            
            <Button
              title={isEditMode ? "Mettre à jour" : "Créer l'agence"}
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
  submitButton: {
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 12,
    marginBottom: 32,
  },
});

export default AgenceCreationScreen;