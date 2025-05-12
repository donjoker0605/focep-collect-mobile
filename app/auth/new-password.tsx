import { View, StyleSheet } from 'react-native';
import React from 'react';
import NewPasswordScreenAdapter from '../../src/screens/Auth/NewPasswordScreenAdapter';

export default function NewPasswordPage() {
  return (
    <View style={styles.container}>
      <NewPasswordScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});