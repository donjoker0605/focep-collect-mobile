// app/collecte-detail.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CollecteDetailScreenAdapter from '../src/screens/Collecteur/CollecteDetailScreenAdapter';

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