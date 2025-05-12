// src/components/SyncStatusIndicator/SyncStatusIndicator.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as HapticsCompat from '../../utils/haptics';
import NetInfo from '@react-native-community/netinfo';

// Utils et theme
import theme from '../../theme';

// Constantes d'état de synchronisation
export const SYNC_STATUS = {
  SYNCED: 'synced',         // Tout est synchronisé
  PENDING: 'pending',       // Modifications locales en attente de synchronisation
  SYNCING: 'syncing',       // Synchronisation en cours
  ERROR: 'error',           // Erreur de synchronisation
  OFFLINE: 'offline'        // Mode hors ligne
};

const SyncStatusIndicator = ({ 
  style, 
  position = 'bottom-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  showLabel = true,
  size = 'medium',           // 'small', 'medium', 'large'
  syncStatus = SYNC_STATUS.SYNCED,
  isOnline = true,
  pendingCount = 0,
  onPress
}) => {
  // Animation pour l'icône de synchronisation
  const rotateAnim = new Animated.Value(0);
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Démarrer l'animation de rotation pour l'état "syncing"
  useEffect(() => {
    if (syncStatus === SYNC_STATUS.SYNCING) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [syncStatus]);
  
  // Gérer l'appui sur l'indicateur
  const handlePress = async () => {
    if (onPress) {
      onPress(syncStatus);
      
      // Feedback haptique
      await HapticsCompat.impactAsync(HapticsCompat.ImpactFeedbackStyle.Light);
    }
  };
  
  // Déterminer l'icône et la couleur en fonction du statut
  const getIconConfig = () => {
    if (!isOnline) {
      return {
        name: 'cloud-offline',
        color: theme.colors.warning,
        text: 'Hors ligne'
      };
    }
    
    switch (syncStatus) {
      case SYNC_STATUS.SYNCED:
        return {
          name: 'checkmark-circle',
          color: theme.colors.success,
          text: 'Synchronisé'
        };
      case SYNC_STATUS.PENDING:
        return {
          name: 'cloud-upload',
          color: theme.colors.info,
          text: `En attente (${pendingCount})`
        };
      case SYNC_STATUS.SYNCING:
        return {
          name: 'sync',
          color: theme.colors.primary,
          text: 'Synchronisation...'
        };
      case SYNC_STATUS.ERROR:
        return {
          name: 'alert-circle',
          color: theme.colors.error,
          text: 'Erreur de sync'
        };
      default:
        return {
          name: 'cloud',
          color: theme.colors.gray,
          text: 'Inconnu'
        };
    }
  };
  
  // Déterminer la taille en fonction du paramètre
  const getSize = () => {
    switch (size) {
      case 'small':
        return { icon: 16, indicator: 30, label: 10 };
      case 'large':
        return { icon: 24, indicator: 48, label: 14 };
      case 'medium':
      default:
        return { icon: 20, indicator: 40, label: 12 };
    }
  };
  
  // Obtenir la configuration
  const iconConfig = getIconConfig();
  const sizeConfig = getSize();
  
  // Déterminer le positionnement
  const positionStyle = {};
  if (position.includes('top')) {
    positionStyle.top = 16;
  } else {
    positionStyle.bottom = 16;
  }
  
  if (position.includes('left')) {
    positionStyle.left = 16;
  } else {
    positionStyle.right = 16;
  }
  
  // Rendu de l'indicateur
  return (
    <View style={[
      styles.container, 
      positionStyle,
      showLabel && styles.containerWithLabel,
      style
    ]}>
      <TouchableOpacity
        style={[
          styles.indicator,
          { 
            backgroundColor: `${iconConfig.color}20`,
            width: sizeConfig.indicator,
            height: sizeConfig.indicator,
            borderRadius: sizeConfig.indicator / 2
          }
        ]}
        onPress={handlePress}
      >
        <Animated.View style={syncStatus === SYNC_STATUS.SYNCING ? { transform: [{ rotate: rotation }] } : {}}>
          <Ionicons name={iconConfig.name} size={sizeConfig.icon} color={iconConfig.color} />
        </Animated.View>
      </TouchableOpacity>
      
      {showLabel && (
        <Text style={[
          styles.label,
          { fontSize: sizeConfig.label, color: iconConfig.color }
        ]}>
          {iconConfig.text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  containerWithLabel: {
    minWidth: 100,
  },
  indicator: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    marginTop: 4,
    fontWeight: '500',
  },
});

export default SyncStatusIndicator;