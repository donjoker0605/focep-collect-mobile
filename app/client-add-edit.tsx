// app/client-add-edit.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ClientAddEditScreen from '../src/screens/Collecteur/ClientAddEditScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ClientAddEditPage() {
  const params = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <ClientAddEditScreen route={{ params }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});