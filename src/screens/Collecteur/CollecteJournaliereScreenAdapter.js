// src/screens/Collecteur/CollecteJournaliereScreenAdapter.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CollecteJournaliereScreen from './CollecteJournaliereScreen';
import { useRouter } from 'expo-router';

export default function CollecteJournaliereScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      switch(route) {
        case 'Notifications':
          router.push('/notifications');
          break;
        case 'CollecteDetail':
          router.push('/collecte-detail', { 
            transaction: JSON.stringify(params.transaction) 
          });
          break;
        default:
          router.push(route.toLowerCase(), params);
      }
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <CollecteJournaliereScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});