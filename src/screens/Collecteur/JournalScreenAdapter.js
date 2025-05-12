import React from 'react';
import { View, StyleSheet } from 'react-native';
import JournalScreen from './JournalScreen';
import { useRouter } from 'expo-router';

export default function JournalScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'CollecteDetail':
          router.push('/collecte-detail', params);
          break;
        case 'Collecte':
          router.push('/collecte', params);
          break;
        default:
          router.push(route.toLowerCase(), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <JournalScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});