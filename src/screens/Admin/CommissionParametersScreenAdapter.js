// src/screens/Admin/CommissionParametersScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CommissionParametersScreen from './CommissionParametersScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

const CommissionParametersScreenAdapter = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'CommissionTiersScreen':
          router.push('/admin/commission-tiers', newParams);
          break;
        default:
          router.push('/admin/' + route.toLowerCase().replace('screen', ''), newParams);
      }
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres pour les passer à l'écran
  const routeParams = {
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    updatedTiers: params.updatedTiers ? JSON.parse(params.updatedTiers) : undefined
  };

  return (
    <View style={styles.container}>
      <CommissionParametersScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CommissionParametersScreenAdapter;