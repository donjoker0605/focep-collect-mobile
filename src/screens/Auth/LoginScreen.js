// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { API_CONFIG } from '../../config/apiConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    console.log(`Tentative de connexion avec: ${email}`);
    console.log(`URL d'authentification: ${API_CONFIG.baseURL}/auth/login`);

    try {
      // Envoyer les identifiants pour se connecter
      const result = await login({ email, password });
      
      console.log('Résultat de la connexion:', result);
      
      if (result.success) {
        console.log('Connexion réussie! Redirection en cours...');
        navigateBasedOnRole(result.user);
      } else {
        console.error('Échec de la connexion:', result.error);
        Alert.alert('Erreur', result.error || 'Identifiants invalides');
      }
    } catch (error) {
      console.error('Exception pendant la connexion:', error);
      Alert.alert('Erreur', 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const navigateBasedOnRole = (userData) => {
    if (!userData || !userData.role) {
      Alert.alert('Erreur', 'Données utilisateur invalides');
      return;
    }

    switch (userData.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        navigation.replace('AdminTabs');
        break;
      case 'COLLECTEUR':
        navigation.replace('CollecteurTabs');
        break;
      default:
        Alert.alert('Erreur', `Rôle non reconnu: ${userData.role}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        FOCEP Collecte
      </Text>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />
      
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
      >
        Se connecter
      </Button>
      
      <Button
        mode="text"
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        Mot de passe oublié ?
      </Button>
      
      <Text style={styles.debugInfo}>
        API: {API_CONFIG.baseURL}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
  },
  debugInfo: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 10,
    color: '#999',
  }
});