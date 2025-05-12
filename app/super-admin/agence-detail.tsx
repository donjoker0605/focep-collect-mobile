// app/super-admin/agence-detail.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import AgenceDetailScreenAdapter from '../../src/screens/SuperAdmin/AgenceDetailScreenAdapter';

export default function AgenceDetailPage() {
  return (
    <View style={styles.container}>
      <AgenceDetailScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});