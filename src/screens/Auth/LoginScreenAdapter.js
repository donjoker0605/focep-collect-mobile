// src/screens/Auth/LoginScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from './LoginScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Ce composant adapte l'écran de connexion pour fonctionner avec Expo Router
export default function LoginScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    replace: (route, newParams) => {
      if (route === 'AppNavigator') {
        router.replace('/');
      } else {
        router.replace(route.toLowerCase(), newParams);
      }
    },
    navigate: (route, newParams) => {
      if (route === 'ForgotPassword') {
        router.push('/auth/forgot-password');
      } else if (route === 'Register') {
        router.push('/auth/register');
      } else {
        router.push(route.toLowerCase(), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Créer un objet route avec les paramètres pour le passer au composant
  const route = { 
    params: { 
      message: params.message,
      passwordChanged: params.passwordChanged === 'true',
      registrationSuccess: params.registrationSuccess === 'true'
    } 
  };

  return (
    <View style={styles.container}>
      <LoginScreen navigation={navigation} route={route} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});