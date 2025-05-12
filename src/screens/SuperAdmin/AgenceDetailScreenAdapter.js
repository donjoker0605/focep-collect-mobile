// src/screens/SuperAdmin/AgenceDetailScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AgenceDetailScreen from './AgenceDetailScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AgenceDetailScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'AgenceEditScreen':
          router.push('/super-admin/agence-creation', { 
            ...newParams, 
            mode: 'edit',
            agence: newParams.agence ? JSON.stringify(newParams.agence) : undefined
          });
          break;
        case 'AdminCreationScreen':
          router.push('/super-admin/admin-creation', newParams);
          break;
        case 'AdminDetail':
          router.push('/super-admin/admin-detail', newParams);
          break;
        case 'CollecteurCreationScreen':
          router.push('/admin/collecteur-creation', newParams);
          break;
        case 'CollecteurDetail':
          router.push('/admin/collecteur-detail', newParams);
          break;
        default:
          router.push('/super-admin/' + route.toLowerCase().replace('screen', ''), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    agence: params.agence ? JSON.parse(params.agence) : undefined
  };

  return (
    <View style={styles.container}>
      <AgenceDetailScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});