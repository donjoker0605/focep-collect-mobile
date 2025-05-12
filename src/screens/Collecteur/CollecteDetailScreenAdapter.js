// src/screens/Collecteur/CollecteDetailScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CollecteDetailScreen from './CollecteDetailScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

const CollecteDetailScreenAdapter = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'ClientDetail':
          router.push('/client-detail', { 
            client: newParams?.client ? JSON.stringify(newParams.client) : undefined 
          });
          break;
        case 'Collecte':
          router.push('/collecte', { 
            selectedTab: newParams?.selectedTab,
            preSelectedClient: newParams?.preSelectedClient ? JSON.stringify(newParams.preSelectedClient) : undefined 
          });
          break;
        case 'CollecteDetail':
          router.push('/collecte-detail', { 
            transaction: newParams?.transaction ? JSON.stringify(newParams.transaction) : undefined 
          });
          break;
        default:
          router.push('/' + route.toLowerCase(), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    transaction: params.transaction ? JSON.parse(params.transaction) : undefined
  };

  return (
    <View style={styles.container}>
      <CollecteDetailScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CollecteDetailScreenAdapter;