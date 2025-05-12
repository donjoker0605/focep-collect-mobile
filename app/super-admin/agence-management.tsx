// app/super-admin/agence-management.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import AgenceManagementScreenAdapter from '../../src/screens/SuperAdmin/AgenceManagementScreenAdapter';

export default function AgenceManagementPage() {
  return (
    <View style={styles.container}>
      <AgenceManagementScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});