// src/screens/Admin/CollecteurClientsScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CollecteurClientsScreen from './CollecteurClientsScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CollecteurClientsScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'ClientDetail':
          router.push('/client-detail', newParams);
          break;
        case 'TransfertCompte':
          router.push('/admin/transfert-compte', newParams);
          break;
        default:
          router.push('/admin/' + route.toLowerCase().replace('screen', ''), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    collecteurId: params.collecteurId,
  };

  return (
    <View style={styles.container}>
      <CollecteurClientsScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});