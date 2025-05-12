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
const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .email('Veuillez entrer un email valide')
    .required('L\'email est requis'),
});

const ForgotPasswordScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // Dans une implémentation réelle, vous feriez un appel à l'API ici
      console.log('Reset password requested for:', data.email);
      
      // Simuler un délai de chargement (pour démonstration uniquement)
      setTimeout(() => {
        setLoading(false);
        // Naviguer vers l'écran de vérification de code
        navigation.navigate('SecurityPin', { email: data.email });
      }, 1500);
    } catch (error) {
      setLoading(false);
      console.error('Password reset request failed:', error);
      // Gérer l'erreur ici
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
        <Text style={styles.headerTitle}>Mot de passe oublié</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Réinitialisation du mot de passe</Text>
          <Text style={styles.description}>
            Veuillez contacter votre administrateur pour réinitialiser votre mot de passe.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Adresse e-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="exemple@exemple.com"
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

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Chargement...' : 'Soumettre la demande'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToLoginText}>Retour à la connexion</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 24,
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
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: theme.colors.lightGray,
  },
  backToLoginText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;