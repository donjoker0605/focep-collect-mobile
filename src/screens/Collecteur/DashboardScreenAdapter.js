import React from 'react';
import { View, StyleSheet } from 'react-native';
import DashboardScreen from './DashboardScreen';
import { useRouter } from 'expo-router';

export default function DashboardScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'Notifications':
          router.push('/notifications');
          break;
        case 'CollecteDetail':
          router.push('/collecte-detail', params);
          break;
        case 'Collecte':
          router.push('/collecte', params);
          break;
        case 'Journal':
          router.push('/journal');
          break;
        default:
          router.push(route.toLowerCase(), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <DashboardScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});