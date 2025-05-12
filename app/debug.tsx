// app/debug.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ApiDiagnosticTool from '../src/components/ApiDiagnosticTool';

export default function DebugScreen() {
  return (
    <ScrollView style={styles.container}>
      <ApiDiagnosticTool />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});