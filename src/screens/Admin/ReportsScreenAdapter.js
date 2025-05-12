import React from 'react';
import { View, StyleSheet } from 'react-native';
import ReportsScreen from './ReportsScreen';
import { useRouter } from 'expo-router';

export default function ReportsScreenAdapter() {
  const router = useRouter();
  
  // Fonction d'adaptation pour la navigation
  const navigation = {
    navigate: (route, params) => {
      router.push('/admin/' + route.toLowerCase().replace('screen', ''), params);
    },
    goBack: () => router.back()
  };

  return (
    <View style={styles.container}>
      <ReportsScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});