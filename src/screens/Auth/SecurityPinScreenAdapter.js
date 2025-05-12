import React from 'react';
import { View, StyleSheet } from 'react-native';
import SecurityPinScreen from './SecurityPinScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Ce composant adapte l'écran de code de sécurité pour fonctionner avec Expo Router
export default function SecurityPinScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      if (route === 'NewPassword') {
        router.push('/auth/new-password', { ...params, ...newParams });
      } else if (route === 'Register') {
        router.push('/auth/register');
      } else {
        router.push(route.toLowerCase(), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    email: params.email,
  };

  return (
    <View style={styles.container}>
      <SecurityPinScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});