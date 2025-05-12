// src/screens/Auth/LoginScreen.js (ou adapter selon votre structure)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { validationSchemas } from '../../utils/validators';
import { Button, Input, Card } from '../../components';
import { useRouter } from 'expo-router';
import theme from '../../theme';

const LoginScreen = () => {
  const { login, error } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('COLLECTEUR');

  const { control, handleSubmit, errors } = useForm(
    validationSchemas.login,
    {
      email: 'collecteur@focep.cm',  // Valeur par défaut pour faciliter les tests
      password: 'password123',  // Valeur par défaut pour faciliter les tests
    }
  );

  const handleLogin = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password, selectedRole);
      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Échec de la connexion');
      }
      // La redirection est gérée dans la fonction login du AuthContext
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour déterminer si un rôle est sélectionné
  const isRoleSelected = (role) => selectedRole === role;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FOCEP Collect</Text>
        <Text style={styles.subtitle}>Application de gestion de collecte journalière</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.loginTitle}>Connexion</Text>

        <Input
          label="Email"
          placeholder="Entrez votre email"
          control={control}
          name="email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email?.message}
          icon="mail-outline"
        />

        <Input
          label="Mot de passe"
          placeholder="Entrez votre mot de passe"
          control={control}
          name="password"
          secureTextEntry
          error={errors.password?.message}
          icon="lock-closed-outline"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Sélecteur de rôle pour le développement */}
        {__DEV__ && (
          <View style={styles.roleSelector}>
            <Text style={styles.roleSelectorTitle}>Mode développement: Sélectionner un rôle</Text>
            <View style={styles.roleBtnContainer}>
              <TouchableOpacity
                style={[styles.roleBtn, isRoleSelected('COLLECTEUR') && styles.roleSelectedBtn]}
                onPress={() => setSelectedRole('COLLECTEUR')}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={isRoleSelected('COLLECTEUR') ? theme.colors.white : theme.colors.primary}
                />
                <Text
                  style={[styles.roleBtnText, isRoleSelected('COLLECTEUR') && styles.roleSelectedText]}
                >
                  Collecteur
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.roleBtn, isRoleSelected('ADMIN') && styles.roleSelectedBtn]}
                onPress={() => setSelectedRole('ADMIN')}
              >
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={isRoleSelected('ADMIN') ? theme.colors.white : theme.colors.primary}
                />
                <Text
                  style={[styles.roleBtnText, isRoleSelected('ADMIN') && styles.roleSelectedText]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.roleBtn, isRoleSelected('SUPER_ADMIN') && styles.roleSelectedBtn]}
                onPress={() => setSelectedRole('SUPER_ADMIN')}
              >
                <Ionicons
                  name="shield-outline"
                  size={16}
                  color={isRoleSelected('SUPER_ADMIN') ? theme.colors.white : theme.colors.primary}
                />
                <Text
                  style={[styles.roleBtnText, isRoleSelected('SUPER_ADMIN') && styles.roleSelectedText]}
                >
                  Super Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Button
          title="Se connecter"
          onPress={handleSubmit(handleLogin)}
          loading={loading}
          style={styles.loginBtn}
        />

        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={() => router.push('/auth/forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Vous n'avez pas de compte ?</Text>
        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={styles.registerText}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.8,
  },
  card: {
    padding: 20,
    borderRadius: 10,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  // Styles du sélecteur de rôle
  roleSelector: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  roleSelectorTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: theme.colors.textLight,
    fontSize: 14,
  },
  roleBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginHorizontal: 4,
  },
  roleSelectedBtn: {
    backgroundColor: theme.colors.primary,
  },
  roleBtnText: {
    fontSize: 13,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  roleSelectedText: {
    color: theme.colors.white,
  },
  loginBtn: {
    marginTop: 10,
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    marginTop: 15,
    padding: 5,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: theme.colors.white,
    marginRight: 5,
  },
  registerText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});

export default LoginScreen;