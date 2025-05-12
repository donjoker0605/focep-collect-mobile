// app/(tabs)/collecte-detail.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import CollecteDetailScreenAdapter from '../../src/screens/Collecteur/CollecteDetailScreenAdapter';

export default function CollecteDetailPage() {
  return (
    <View style={styles.container}>
      <CollecteDetailScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});