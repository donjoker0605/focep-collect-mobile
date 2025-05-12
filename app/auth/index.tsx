import { View, StyleSheet } from 'react-native';
import React from 'react';
import LoginScreenAdapter from '../../src/screens/Auth/LoginScreenAdapter';

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <LoginScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});