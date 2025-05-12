// app/super-admin/index.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import UserManagementScreenAdapter from '../../src/screens/SuperAdmin/UserManagementScreenAdapter';

export default function SuperAdminDashboardPage() {
  return (
    <View style={styles.container}>
      <UserManagementScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});