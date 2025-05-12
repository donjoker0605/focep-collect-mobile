import { View, StyleSheet } from 'react-native';
import React from 'react';
import ParameterManagementScreenAdapter from '../../src/screens/Admin/ParameterManagementScreenAdapter';

export default function ParameterManagementPage() {
  return (
    <View style={styles.container}>
      <ParameterManagementScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});