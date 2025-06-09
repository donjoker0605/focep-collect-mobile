import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import theme from '../../theme';

// Validation schema pour le formulaire d'inscription
const registerSchema = yup.object().shape({
  fullName: yup
    .string()
    .required('Le nom complet est requis'),
  email: yup
    .string()
    .email('Veuillez entrer un email valide')
    .required('L\'email est requis'),
  phoneNumber: yup
    .string()
    .matches(/^\+?[0-9]{9,15}$/, 'Numéro de téléphone invalide')
    .required('Le numéro de téléphone est requis'),
  dateOfBirth: yup
    .string()
    .matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, 'Format de date invalide (JJ/MM/AAAA)')
    .required('La date de naissance est requise'),
  password: yup
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .required('Le mot de passe est requis'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre')
    .required('La confirmation du mot de passe est requise'),
});

const RegisterScreen = ({ navigation }) => {
  const [secureTextEntry, setSecureTextEntry] = useState({
    password: true,
    confirmPassword: true,
  });
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const toggleSecureEntry = (field) => {
    setSecureTextEntry({
      ...secureTextEntry,
      [field]: !secureTextEntry[field],
    });
  };

  const onSubmit = async (data) => {
    if (!termsAccepted) {
      alert('Veuillez accepter les conditions d\'utilisation et la politique de confidentialité');
      return;
    }

    try {
      setLoading(true);
      // Dans une implémentation réelle, vous feriez un appel à l'API ici
      console.log('Registration attempt with:', data);
      
      // Simuler un délai de chargement (pour démonstration uniquement)
      setTimeout(() => {
        setLoading(false);
        // Naviguer vers la vérification de l'email ou directement vers le login
        navigation.navigate('Login', { 
          registrationSuccess: true,
          message: 'Inscription réussie ! Veuillez vous connecter avec vos identifiants.'
        });
      }, 1500);
    } catch (error) {
      setLoading(false);
      console.error('Registration failed:', error);
      // Gérer l'erreur d'inscription ici
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#B0B0B0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  mode="outlined"
                  outlineColor={theme.colors.lightGray}
                  activeOutlineColor={theme.colors.primary}
                  error={!!errors.fullName}
                />
                {errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@example.com"
                  placeholderTextColor="#B0B0B0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="outlined"
                  outlineColor={theme.colors.lightGray}
                  activeOutlineColor={theme.colors.primary}
                  error={!!errors.email}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+ 123 456 789"
                  placeholderTextColor="#B0B0B0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  mode="outlined"
                  outlineColor={theme.colors.lightGray}
                  activeOutlineColor={theme.colors.primary}
                  error={!!errors.phoneNumber}
                />
                {errors.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date Of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD / MM / YYY"
                  placeholderTextColor="#B0B0B0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor={theme.colors.lightGray}
                  activeOutlineColor={theme.colors.primary}
                  error={!!errors.dateOfBirth}
                  right={<TextInput.Icon name="calendar" color={theme.colors.gray} />}
                />
                {errors.dateOfBirth && (
                  <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#B0B0B0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={secureTextEntry.password}
                  autoCapitalize="none"
                  mode="outlined"
                  outlineColor={theme.colors.lightGray}
                  activeOutlineColor={theme.colors.primary}
                  error={!!errors.password}
                  right={
                    <TextInput.Icon
                      name={secureTextEntry.password ? "eye-off" : "eye"}
                      onPress={() => toggleSecureEntry('password')}
                      color={theme.colors.gray}
                    />
                  }
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#B0B0B0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={secureTextEntry.confirmPassword}
                  autoCapitalize="none"
                  mode="outlined"
                  outlineColor={theme.colors.lightGray}
                  activeOutlineColor={theme.colors.primary}
                  error={!!errors.confirmPassword}
                  right={
                    <TextInput.Icon
                      name={secureTextEntry.confirmPassword ? "eye-off" : "eye"}
                      onPress={() => toggleSecureEntry('confirmPassword')}
                      color={theme.colors.gray}
                    />
                  }
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                )}
              </View>
            )}
          />

          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              {termsAccepted ? (
                <Ionicons name="checkbox" size={24} color={theme.colors.primary} />
              ) : (
                <Ionicons name="square-outline" size={24} color={theme.colors.gray} />
              )}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              By continuing, you agree to{' '}
              <Text style={styles.termsLink}>Terms of Use</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.signUpButtonText}>
              {loading ? 'Chargement...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default RegisterScreen;
