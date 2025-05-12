import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdminDashboardScreen from './AdminDashboardScreen';
import { useRouter } from 'expo-router';

export default function AdminDashboardScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
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
        case 'Notifications':
          router.push('/notifications');
          break;
        default:
          router.push('/admin/' + route.toLowerCase().replace('screen', ''), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <AdminDashboardScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});