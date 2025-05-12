// src/screens/SuperAdmin/AdminDetailScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdminDetailScreen from './AdminDetailScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AdminDetailScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      switch(route) {
        case 'AdminEditScreen':
          router.push('/super-admin/admin-creation', { 
            ...newParams, 
            mode: 'edit',
            admin: newParams.admin ? JSON.stringify(newParams.admin) : undefined
          });
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
    admin: params.admin ? JSON.parse(params.admin) : undefined
  };

  return (
    <View style={styles.container}>
      <AdminDetailScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
