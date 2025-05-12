import { View, StyleSheet } from 'react-native';
import React from 'react';
import AdminDashboardScreenAdapter from '../../src/screens/Admin/AdminDashboardScreenAdapter';

export default function AdminDashboardPage() {
  return (
    <View style={styles.container}>
      <AdminDashboardScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});