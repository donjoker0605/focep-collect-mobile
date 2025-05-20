// src/components/SyncIndicator.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SYNC_STATUS } from '../services/syncService';
import useSyncStatus from '../hooks/useSyncStatus';
import theme from '../theme';

export default function SyncIndicator() {
  const { status, pendingCount, isOnline, syncNow } = useSyncStatus();
  
  // Si nous sommes en ligne sans opérations en attente, ne rien afficher
  if (isOnline && pendingCount === 0 && status !== SYNC_STATUS.SYNCING) {
    return null;
  }
  
  // Obtenir l'icône et la couleur selon l'état
  const getIconAndColor = () => {
    if (!isOnline) {
      return {
        icon: 'cloud-offline-outline',
        color: theme.colors.warning,
      };
    }
    
    switch (status) {
      case SYNC_STATUS.SYNCING:
        return {
          icon: 'sync-outline',
          color: theme.colors.info,
        };
      case SYNC_STATUS.ERROR:
        return {
          icon: 'warning-outline',
          color: theme.colors.error,
        };
      default:
        return {
          icon: 'cloud-upload-outline',
          color: pendingCount > 0 ? theme.colors.warning : theme.colors.success,
        };
    }
  };
  
  const { icon, color } = getIconAndColor();
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: color }]}
      onPress={isOnline && status !== SYNC_STATUS.SYNCING ? syncNow : null}
    >
      <Ionicons name={icon} size={20} color="white" />
      {pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}
      <Text style={styles.text}>
        {status === SYNC_STATUS.SYNCING
          ? 'Synchronisation...'
          : !isOnline
            ? 'Hors ligne'
            : pendingCount > 0
              ? `${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente`
              : 'Synchronisé'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});