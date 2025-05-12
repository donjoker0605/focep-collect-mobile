// src/screens/SuperAdmin/AgenceCreationScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AgenceCreationScreen from './AgenceCreationScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AgenceCreationScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      router.push('/super-admin/' + route.toLowerCase().replace('screen', ''), newParams);
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    mode: params.mode || 'add',
    agence: params.agence ? JSON.parse(params.agence) : undefined
  };

  return (
    <View style={styles.container}>
      <AgenceCreationScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});