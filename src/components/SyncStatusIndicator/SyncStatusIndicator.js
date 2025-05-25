// src/components/SyncStatusIndicator/SyncStatusIndicator.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SYNC_STATUS } from '../../hooks/useOfflineSync';
import theme from '../../theme';

const SyncStatusIndicator = ({ 
  position = 'bottom-right', 
  syncStatus, 
  isOnline, 
  pendingCount, 
  onPress 
}) => {
  
  const getStatusIcon = () => {
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING:
        return 'sync';
      case SYNC_STATUS.SUCCESS:
        return 'checkmark-circle';
      case SYNC_STATUS.ERROR:
        return 'alert-circle';
      case SYNC_STATUS.OFFLINE:
        return 'cloud-offline';
      default:
        return 'cloud-outline';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING:
        return theme.colors.primary;
      case SYNC_STATUS.SUCCESS:
        return theme.colors.success;
      case SYNC_STATUS.ERROR:
        return theme.colors.error;
      case SYNC_STATUS.OFFLINE:
        return theme.colors.gray;
      default:
        return theme.colors.textLight;
    }
  };

  const positionStyle = position === 'bottom-left' 
    ? { bottom: 20, left: 20 }
    : { bottom: 20, right: 20 };

  return (
    <TouchableOpacity
      style={[styles.container, positionStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]}>
        <Ionicons 
          name={getStatusIcon()} 
          size={20} 
          color={theme.colors.white} 
        />
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  indicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SyncStatusIndicator;