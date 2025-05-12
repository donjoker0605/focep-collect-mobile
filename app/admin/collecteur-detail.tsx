// app/admin/collecteur-detail.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import CollecteurDetailScreenAdapter from '../../src/screens/Admin/CollecteurDetailScreenAdapter';
import { useLocalSearchParams } from 'expo-router';

export default function CollecteurDetailPage() {
  const params = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <CollecteurDetailScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});