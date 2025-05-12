// app/client-detail.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ClientDetailScreenAdapter from '../src/screens/Collecteur/ClientDetailScreenAdapter';

export default function ClientDetailPage() {
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