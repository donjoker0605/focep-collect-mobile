// app/admin/collecteur-clients.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import CollecteurClientsScreenAdapter from '../../src/screens/Admin/CollecteurClientsScreenAdapter';
import { useLocalSearchParams } from 'expo-router';

export default function CollecteurClientsPage() {
  const params = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <CollecteurClientsScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});