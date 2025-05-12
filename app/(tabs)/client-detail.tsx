import { View, StyleSheet } from 'react-native';
import React from 'react';
import ClientDetailScreenAdapter from '../../src/screens/Collecteur/ClientDetailScreenAdapter';
import { useLocalSearchParams } from 'expo-router';

export default function ClientDetailPage() {
  const params = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <ClientDetailScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});