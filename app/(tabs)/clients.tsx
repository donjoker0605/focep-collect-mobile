import { View, StyleSheet } from 'react-native';
import React from 'react';
import ClientListScreenAdapter from '../../src/screens/Collecteur/ClientListScreenAdapter';

export default function ClientsTab() {
  return (
    <View style={styles.container}>
      <ClientListScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});