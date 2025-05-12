import { View, StyleSheet } from 'react-native';
import React from 'react';
import SecurityPinScreenAdapter from '../../src/screens/Auth/SecurityPinScreenAdapter';

export default function SecurityPinPage() {
  return (
    <View style={styles.container}>
      <SecurityPinScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});