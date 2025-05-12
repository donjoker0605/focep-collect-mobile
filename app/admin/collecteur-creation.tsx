import { View, StyleSheet } from 'react-native';
import React from 'react';
import CollecteurCreationScreenAdapter from '../../src/screens/Admin/CollecteurCreationScreenAdapter';

export default function CollecteurCreationPage() {
  return (
    <View style={styles.container}>
      <CollecteurCreationScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});