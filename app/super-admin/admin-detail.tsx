// app/super-admin/admin-detail.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import AdminDetailScreenAdapter from '../../src/screens/SuperAdmin/AdminDetailScreenAdapter';

export default function AdminDetailPage() {
  return (
    <View style={styles.container}>
      <AdminDetailScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});