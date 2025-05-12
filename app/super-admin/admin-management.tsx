// app/super-admin/admin-management.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import AdminManagementScreenAdapter from '../../src/screens/SuperAdmin/AdminManagementScreenAdapter';

export default function AdminManagementPage() {
  return (
    <View style={styles.container}>
      <AdminManagementScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});