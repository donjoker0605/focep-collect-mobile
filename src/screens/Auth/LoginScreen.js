// src/screens/Auth/LoginScreen.js - VERSION DÉFINITIVEMENT CORRIGÉE
import React, { useState } from 'react';
import { View, Alert, StyleSheet, Image } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // ✅ FONCTION DE VALIDATION D'EMAIL
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ FONCTION HANDLELOGIN COMPLÈTEMENT RÉÉCRITE
  const handleLogin = async () => {
    // Validation des champs
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Validation du format email
    if (!isValidEmail(email)) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide');
      return;
    }

    setLoading(true);
    console.log('🔄 LoginScreen: Tentative de connexion avec:', email.trim());

    try {
      // ✅ CORRECTION CRITIQUE: Passer email et password comme chaînes simples
      const result = await login(email.trim(), password.trim());
      
      console.log('📊 Résultat de la connexion:', result);
      
      if (result.success) {
        console.log('✅ Connexion réussie! Redirection automatique par AuthContext');
        // Pas besoin de navigation manuelle, AppNavigator gère la redirection
      } else {
        console.error('❌ Échec de la connexion:', result.error);
        Alert.alert('Erreur de connexion', result.error || 'Identifiants invalides');
      }
    } catch (error) {
      console.error('💥 Exception pendant la connexion:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ LOGO AJOUTÉ */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <Text variant="headlineLarge" style={styles.title}>
        FOCEP Collecte
      </Text>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail} // ✅ Directement setEmail, pas de transformation
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="admin.yaounde@collectfocep.com"
        disabled={loading}
      />
      
      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword} // ✅ Directement setPassword
        mode="outlined"
        secureTextEntry
        style={styles.input}
        placeholder="Entrez votre mot de passe"
        disabled={loading}
      />
      
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading || !email || !password}
        style={styles.button}
      >
        Se connecter
      </Button>
      
      <Button
        mode="text"
        onPress={() => navigation?.navigate?.('ForgotPassword')}
        disabled={loading}
        style={styles.forgotButton}
      >
        Mot de passe oublié ?
      </Button>

      {/* ✅ BOUTON DE TEST POUR DÉBOGAGE (À RETIRER EN PRODUCTION) */}
      {__DEV__ && (
        <Button
          mode="outlined"
          onPress={() => {
            setEmail('admin.yaounde@collectfocep.com');
            setPassword('AdminAgence123!');
          }}
          style={[styles.button, { marginTop: 10, backgroundColor: '#f0f0f0' }]}
        >
          Remplir champs test
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
  forgotButton: {
    marginTop: 10,
  },
});