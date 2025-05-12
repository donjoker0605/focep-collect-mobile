import { View, StyleSheet } from 'react-native';
import React from 'react';
import ReportsScreenAdapter from '../../src/screens/Admin/ReportsScreenAdapter';

export default function ReportsPage() {
  return (
    <View style={styles.container}>
      <ReportsScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});