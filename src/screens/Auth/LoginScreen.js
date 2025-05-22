// src/screens/Auth/LoginScreen.js - VERSION FINALE SANS PRÉ-REMPLISSAGE
import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { API_CONFIG } from '../../config/apiConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(''); // Champ vide pour saisie manuelle
  const [password, setPassword] = useState(''); // Champ vide pour saisie manuelle
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    console.log('🔄 LoginScreen: Tentative de connexion avec:', email);

    try {
      // CORRECTION : Passer email et password comme paramètres séparés
      const result = await login(email, password);
      
      console.log('📊 Résultat de la connexion:', result);
      
      if (result.success) {
        console.log('✅ Connexion réussie! L\'AuthContext gère la redirection.');
        // La redirection est gérée par AuthContext
      } else {
        console.error('❌ Échec de la connexion:', result.error);
        Alert.alert('Erreur', result.error || 'Identifiants invalides');
      }
    } catch (error) {
      console.error('💥 Exception pendant la connexion:', error);
      Alert.alert('Erreur', 'Erreur de connexion');
    } finally {
      setLoading(false);
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
        placeholder="Entrez votre email"
      />
      
      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
        placeholder="Entrez votre mot de passe"
      />
      
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Se connecter
      </Button>
      
      <Button
        mode="text"
        onPress={() => navigation?.navigate?.('ForgotPassword')}
        disabled={loading}
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 8,
  },
  debugInfo: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 10,
    color: '#999',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 4,
    borderRadius: 4,
  }
});