// app/super-admin/admin-creation.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import AdminCreationScreenAdapter from '../../src/screens/SuperAdmin/AdminCreationScreenAdapter';

export default function AdminCreationPage() {
  return (
    <View style={styles.container}>
      <AdminCreationScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});