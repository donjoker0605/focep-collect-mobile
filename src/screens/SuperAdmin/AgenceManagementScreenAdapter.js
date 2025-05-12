// src/screens/SuperAdmin/AgenceManagementScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AgenceManagementScreen from './AgenceManagementScreen';
import { useRouter } from 'expo-router';

export default function AgenceManagementScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'AgenceCreationScreen':
          router.push('/super-admin/agence-creation');
          break;
        case 'AgenceEditScreen':
          router.push('/super-admin/agence-creation', { ...params, mode: 'edit' });
          break;
        case 'AgenceDetail':
          router.push('/super-admin/agence-detail', params);
          break;
        default:
          router.push('/super-admin/' + route.toLowerCase().replace('screen', ''), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <AgenceManagementScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});