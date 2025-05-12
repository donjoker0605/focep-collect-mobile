import { View, StyleSheet } from 'react-native';
import React from 'react';
import RegisterScreenAdapter from '../../src/screens/Auth/RegisterScreenAdapter';

export default function RegisterPage() {
  return (
    <View style={styles.container}>
      <RegisterScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});