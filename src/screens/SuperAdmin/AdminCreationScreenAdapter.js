// src/screens/SuperAdmin/AdminCreationScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdminCreationScreen from './AdminCreationScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AdminCreationScreenAdapter() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, newParams) => {
      router.push('/super-admin/' + route.toLowerCase().replace('screen', ''), newParams);
    },
    goBack: () => router.back()
  };

  // Convertir les paramètres de route pour les passer à l'écran
  const routeParams = {
    mode: params.mode || 'add',
    admin: params.admin ? JSON.parse(params.admin) : undefined,
    agenceId: params.agenceId,
  };

  return (
    <View style={styles.container}>
      <AdminCreationScreen navigation={navigation} route={{ params: routeParams }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});