import React from 'react';
import { View, StyleSheet } from 'react-native';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { useRouter } from 'expo-router';

// Ce composant adapte l'écran de récupération de mot de passe pour fonctionner avec Expo Router
export default function ForgotPasswordScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      if (route === 'SecurityPin') {
        router.push('/auth/security-pin', params);
      } else if (route === 'Register') {
        router.push('/auth/register');
      } else {
        router.push(route.toLowerCase(), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <ForgotPasswordScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});