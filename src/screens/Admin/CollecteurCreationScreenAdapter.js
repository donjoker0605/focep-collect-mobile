import React from 'react';
import { View, StyleSheet } from 'react-native';
import CollecteurCreationScreen from './CollecteurCreationScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CollecteurCreationScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      router.push('/admin/' + route.toLowerCase().replace('screen', ''), newParams);
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    mode: params.mode || 'add',
    collecteur: params.collecteur ? JSON.parse(params.collecteur) : undefined
  };

  return (
    <View style={styles.container}>
      <CollecteurCreationScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});