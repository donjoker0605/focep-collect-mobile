// app/admin/commission-parameters.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CommissionParametersScreenAdapter from '../../src/screens/Admin/CommissionParametersScreenAdapter';

export default function CommissionParametersPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <CommissionParametersScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});