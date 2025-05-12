// src/screens/Admin/CollecteurDetailScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CollecteurDetailScreen from './CollecteurDetailScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CollecteurDetailScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'CollecteurEditScreen':
          router.push('/admin/collecteur-creation', { ...newParams, mode: 'edit' });
          break;
        case 'CollecteurClients':
          router.push('/admin/collecteur-clients', newParams);
          break;
        case 'CommissionParameters':
          router.push('/admin/commission-parameters', newParams);
          break;
        default:
          router.push('/admin/' + route.toLowerCase().replace('screen', ''), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    collecteur: params.collecteur ? JSON.parse(params.collecteur) : undefined
  };

  return (
    <View style={styles.container}>
      <CollecteurDetailScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});