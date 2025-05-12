import { View, StyleSheet } from 'react-native';
import React from 'react';
import DashboardScreenAdapter from '../../src/screens/Collecteur/DashboardScreenAdapter';

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <DashboardScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});