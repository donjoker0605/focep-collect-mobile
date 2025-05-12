import React from 'react';
import { View, StyleSheet } from 'react-native';
import NewPasswordScreen from './NewPasswordScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Ce composant adapte l'écran de nouveau mot de passe pour fonctionner avec Expo Router
export default function NewPasswordScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      if (route === 'Login') {
        router.push('/auth', { passwordChanged: true, ...newParams });
      } else {
        router.push(route.toLowerCase(), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    email: params.email,
    code: params.code
  };

  return (
    <View style={styles.container}>
      <NewPasswordScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});