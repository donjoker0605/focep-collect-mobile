// src/screens/Collecteur/ClientListScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ClientListScreen from './ClientListScreen';
import { useRouter } from 'expo-router';

export default function ClientListScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'ClientDetail':
          router.push('/client-detail', { client: JSON.stringify(params.client) });
          break;
        case 'ClientAddEdit':
          router.push('/client-add-edit', { 
            mode: params.mode, 
            client: params.client ? JSON.stringify(params.client) : undefined 
          });
          break;
        default:
          router.push(route.toLowerCase(), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <ClientListScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});