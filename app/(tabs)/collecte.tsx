// app/collecte.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import CollecteScreen from '../../src/screens/Collecteur/CollecteScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CollectePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'ClientDetail':
          router.push('/client-detail', newParams);
          break;
        case 'CollecteDetail':
          router.push('/collecte-detail', newParams);
          break;
        case 'Notifications':
          router.push('/notifications');
          break;
        default:
          router.push(route.toLowerCase(), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres pour les passer à l'écran
  const routeParams = {
    selectedTab: params.selectedTab || 'epargne',
    preSelectedClient: params.preSelectedClient ? JSON.parse(params.preSelectedClient) : undefined
  };

  return (
    <View style={styles.container}>
      <CollecteScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});