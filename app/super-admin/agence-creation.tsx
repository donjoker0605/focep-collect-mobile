// app/super-admin/agence-creation.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import AgenceCreationScreenAdapter from '../../src/screens/SuperAdmin/AgenceCreationScreenAdapter';

export default function AgenceCreationPage() {
  return (
    <View style={styles.container}>
      <AgenceCreationScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
