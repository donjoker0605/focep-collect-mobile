// src/screens/SuperAdmin/AdminManagementScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdminManagementScreen from './AdminManagementScreen';
import { useRouter } from 'expo-router';

export default function AdminManagementScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'AdminCreationScreen':
          router.push('/super-admin/admin-creation');
          break;
        case 'AdminEditScreen':
          router.push('/super-admin/admin-creation', { ...params, mode: 'edit' });
          break;
        case 'AdminDetail':
          router.push('/super-admin/admin-detail', params);
          break;
        default:
          router.push('/super-admin/' + route.toLowerCase().replace('screen', ''), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <AdminManagementScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});