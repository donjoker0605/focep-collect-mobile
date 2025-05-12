// src/screens/Common/NotificationsScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationsScreen from './NotificationsScreen';
import { useRouter } from 'expo-router';

export default function NotificationsScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'CollecteDetail':
          router.push('/collecte-detail', params);
          break;
        case 'CollecteurDetail':
          router.push('/admin/collecteur-detail', params);
          break;
        case 'CollecteurManagement':
          router.push('/admin/collecteur-management');
          break;
        case 'CommissionReport':
          router.push('/admin/commission-report');
          break;
        default:
          router.push('/' + route.toLowerCase(), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <NotificationsScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});