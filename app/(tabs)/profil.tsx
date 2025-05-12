import { View, StyleSheet } from 'react-native';
import React from 'react';
import ProfileScreenAdapter from '../../src/screens/Collecteur/ProfileScreenAdapter';

export default function ProfilTab() {
  return (
    <View style={styles.container}>
      <ProfileScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});