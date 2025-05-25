// src/components/OfflineIndicator/OfflineIndicator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import theme from '../../theme';

const OfflineIndicator = () => {
  const { isOnline, pendingCount } = useOfflineSync();

  // Ne pas afficher si en ligne et aucune opération en attente
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, !isOnline && styles.offline]}>
      <Ionicons 
        name={isOnline ? "cloud-upload-outline" : "cloud-offline-outline"} 
        size={16} 
        color={theme.colors.white} 
      />
      <Text style={styles.text}>
        {!isOnline 
          ? 'Mode hors ligne' 
          : `${pendingCount} opération(s) en attente`
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  offline: {
    backgroundColor: theme.colors.error,
  },
  text: {
    color: theme.colors.white,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default OfflineIndicator;