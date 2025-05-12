import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import theme from '../../theme';

// Validation schema pour le formulaire
const passwordSchema = yup.object().shape({
  password: yup
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial'
    )
    .required('Le mot de passe est requis'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre')
    .required('La confirmation du mot de passe est requise'),
});

const NewPasswordScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [secureTextEntry, setSecureTextEntry] = useState({
    password: true,
    confirmPassword: true,
  });
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const toggleSecureEntry = (field) => {
    setSecureTextEntry({
      ...secureTextEntry,
      [field]: !secureTextEntry[field],
    });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // Dans une implémentation réelle, vous feriez un appel à l'API ici
      console.log('Changing password for:', email, 'to:', data.password);
      
      // Simuler un délai de chargement (pour démonstration uniquement)
      setTimeout(() => {
        setLoading(false);
        // Afficher un message de succès et rediriger vers l'écran de connexion
        navigation.navigate('Login', { 
          passwordChanged: true,
          message: 'Votre mot de passe a été modifié avec succès. Veuillez vous connecter avec votre nouveau mot de passe.'
        });
      }, 1500);
    } catch (error) {
      setLoading(false);
      console.error('Password change failed:', error);
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
        <Text style={styles.headerTitle}>New Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
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
                <Text style={styles.inputLabel}>Confirm New Password</Text>
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

          <TouchableOpacity
            style={styles.changeButton}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.changeButtonText}>
              {loading ? 'Chargement...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.lightGray,
    height: 50,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  changeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewPasswordScreen;