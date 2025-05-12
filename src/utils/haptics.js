// src/utils/haptics.js
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Vérifier si l'API Haptics est disponible
const isHapticsAvailable = Platform.OS !== 'web' && Haptics;

// Fonctions d'enveloppement qui vérifient la disponibilité
export const impactAsync = async (style = Haptics.ImpactFeedbackStyle.Medium) => {
  if (isHapticsAvailable) {
    return await Haptics.impactAsync(style);
  }
  // Pas d'action sur le web, juste retourner une promesse résolue
  return Promise.resolve();
};

export const notificationAsync = async (type = Haptics.NotificationFeedbackType.Success) => {
  if (isHapticsAvailable) {
    return await Haptics.notificationAsync(type);
  }
  // Pas d'action sur le web, juste retourner une promesse résolue
  return Promise.resolve();
};

export const selectionAsync = async () => {
  if (isHapticsAvailable) {
    return await Haptics.selectionAsync();
  }
  // Pas d'action sur le web, juste retourner une promesse résolue
  return Promise.resolve();
};

// Exporter les constantes également pour maintenir la compatibilité
export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle || {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy'
};

export const NotificationFeedbackType = Haptics.NotificationFeedbackType || {
  Success: 'success',
  Warning: 'warning',
  Error: 'error'
};