// src/screens/Collecteur/ClientDetailScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ClientDetailScreen from './ClientDetailScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ClientDetailScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'ClientAddEdit':
          router.push('/client-add-edit', { 
            ...newParams, 
            mode: 'edit',
            client: newParams.client ? JSON.stringify(newParams.client) : undefined
          });
          break;
        case 'ClientTransactions':
          router.push('/client-transactions', { ...newParams });
          break;
        case 'Collecte':
          router.push('/collecte', { 
            selectedTab: newParams.selectedTab,
            preSelectedClient: newParams.preSelectedClient ? JSON.stringify(newParams.preSelectedClient) : undefined
          });
          break;
        case 'CollecteDetail':
          router.push('/collecte-detail', { 
            transaction: newParams.transaction ? JSON.stringify(newParams.transaction) : undefined 
          });
          break;
        default:
          router.push(route.toLowerCase(), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    client: params.client ? JSON.parse(params.client) : undefined
  };

  return (
    <View style={styles.container}>
      <ClientDetailScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});