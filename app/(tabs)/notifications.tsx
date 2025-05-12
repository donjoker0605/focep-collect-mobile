// app/notifications.tsx
import { View, StyleSheet } from 'react-native';
import React from 'react';
import NotificationsScreenAdapter from '../../src/screens/Comon/NotificationsScreenAdapter';

export default function NotificationsPage() {
  return (
    <View style={styles.container}>
      <NotificationsScreenAdapter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});