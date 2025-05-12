// app/client-add-edit.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import ClientAddEditScreen from '../../src/screens/Collecteur/ClientAddEditScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ClientAddEditPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'ClientDetail':
          router.push('/client-detail', newParams);
          break;
        case 'Clients':
          router.push('/clients');
          break;
        default:
          router.push(route.toLowerCase(), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres pour les passer à l'écran
  const routeParams = {
    mode: params.mode || 'add',
    client: params.client ? JSON.parse(params.client) : undefined
  };

  return (
    <View style={styles.container}>
      <ClientAddEditScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});