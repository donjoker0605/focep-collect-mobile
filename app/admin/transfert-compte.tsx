import { View, StyleSheet } from 'react-native';
import React from 'react';
import TransfertCompteScreenAdapter from '../../src/screens/Admin/TransfertCompteScreenAdapter';

export default function TransfertComptePage() {
  return (
    <View style={styles.container}>
      <TransfertCompteScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});