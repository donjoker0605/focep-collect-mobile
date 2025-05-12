import React from 'react';
import { View, StyleSheet } from 'react-native';
import CollecteurManagementScreen from './CollecteurManagementScreen';
import { useRouter } from 'expo-router';

export default function CollecteurManagementScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'CollecteurCreationScreen':
          router.push('/admin/collecteur-creation');
          break;
        case 'CollecteurEditScreen':
          router.push('/admin/collecteur-creation', { ...params, mode: 'edit' });
          break;
        case 'CollecteurDetail':
          router.push('/admin/collecteur-detail', params);
          break;
        default:
          router.push('/admin/' + route.toLowerCase().replace('screen', ''), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <CollecteurManagementScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});