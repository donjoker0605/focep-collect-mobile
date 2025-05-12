// src/screens/Admin/TransfertCompteScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import TransfertCompteScreen from './TransfertCompteScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function TransfertCompteScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      router.push('/admin/' + route.toLowerCase().replace('screen', ''), newParams);
    },
    goBack: () => router.back()
  };

  // Créer un objet route avec les paramètres
  const route = {
    params: {
      sourceCollecteurId: params.sourceCollecteurId,
      selectedClientIds: params.selectedClientIds ? JSON.parse(params.selectedClientIds) : undefined
    }
  };

  return (
    <View style={styles.container}>
      <TransfertCompteScreen navigation={navigation} route={route} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});