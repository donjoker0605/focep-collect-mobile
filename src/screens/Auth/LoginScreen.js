// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      
      if (result.success) {
        // Redirection selon le rôle de l'utilisateur
        navigateBasedOnRole(result.user);
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const navigateBasedOnRole = (userData) => {
    switch (userData.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        navigation.replace('AdminTabs');
        break;
      case 'COLLECTEUR':
        navigation.replace('CollecteurTabs');
        break;
      default:
        Alert.alert('Erreur', 'Rôle non reconnu');
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
});