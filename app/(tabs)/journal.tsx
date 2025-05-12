import { View, StyleSheet } from 'react-native';
import React from 'react';
import JournalScreenAdapter from '../../src/screens/Collecteur/JournalScreenAdapter';

export default function JournalTab() {
  return (
    <View style={styles.container}>
      <JournalScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});