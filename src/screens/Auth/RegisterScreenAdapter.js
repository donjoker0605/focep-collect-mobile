import React from 'react';
import { View, StyleSheet } from 'react-native';
import RegisterScreen from './RegisterScreen';
import { useRouter } from 'expo-router';

// Ce composant adapte l'écran d'inscription pour fonctionner avec Expo Router
export default function RegisterScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      if (route === 'Login') {
        router.push('/auth');
      } else {
        router.push(route.toLowerCase(), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <RegisterScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});