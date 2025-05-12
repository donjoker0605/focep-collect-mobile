import { View, StyleSheet } from 'react-native';
import React from 'react';
import CollecteurManagementScreenAdapter from '../../src/screens/Admin/CollecteurManagementScreenAdapter';

export default function CollecteurManagementPage() {
  return (
    <View style={styles.container}>
      <CollecteurManagementScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});