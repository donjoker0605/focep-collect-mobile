// src/screens/SuperAdmin/UserManagementScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import UserManagementScreen from './UserManagementScreen';
import { useRouter } from 'expo-router';

export default function UserManagementScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'AgenceManagement':
          router.push('/super-admin/agence-management');
          break;
        case 'AdminManagement':
          router.push('/super-admin/admin-management');
          break;
        case 'CollecteurManagementScreen':
          router.push('/admin/collecteur-management');
          break;
        case 'ParameterManagementScreen':
          router.push('/admin/parameter-management');
          break;
        case 'TransfertCompteScreen':
          router.push('/admin/transfert-compte');
          break;
        case 'ReportsScreen':
          router.push('/admin/reports');
          break;
        default:
          router.push('/super-admin/' + route.toLowerCase().replace('screen', ''), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <UserManagementScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});