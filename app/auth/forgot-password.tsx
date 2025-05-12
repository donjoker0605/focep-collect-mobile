import { View, StyleSheet } from 'react-native';
import React from 'react';
import ForgotPasswordScreenAdapter from '../../src/screens/Auth/ForgotPasswordScreenAdapter';

export default function ForgotPasswordPage() {
  return (
    <View style={styles.container}>
      <ForgotPasswordScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});