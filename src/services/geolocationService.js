// src/services/geolocationService.js - VERSION CORRIGÉE
import * as Location from 'expo-location';
import { Platform, Linking, Alert } from 'react-native';

class GeolocationService {
  constructor() {
    this.isLocationEnabled = false;
    this.hasPermission = false;
    this.lastKnownLocation = null;
  }

  /**
   * Initialisation robuste avec vérification des services et permissions
   */
  async initialize() {
    try {
      // 1. Vérifier si les services sont activés
      this.isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!this.isLocationEnabled) {
        throw new Error('Les services de localisation sont désactivés');
      }

      // 2. Demander les permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';

      if (!this.hasPermission) {
        throw new Error('Permission de localisation refusée');
      }

      return true;
    } catch (error) {
      console.error('Erreur initialisation:', error);
      throw error;
    }
  }
  
  async getRealPosition() {
    try {
      await this.initialize();

      // Configuration pour forcer une vraie position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 20000,
        distanceInterval: 0, // Désactive le cache
        mayShowUserSettingsDialog: true, // Force le dialogue système
      });

      // Vérification spéciale pour les émulateurs
      if (__DEV__ && Platform.OS === 'android') {
        if (location.mocked) {
          throw new Error('Position simulée détectée - Activez le GPS physique');
        }
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        mocked: location.mocked || false
      };
    } catch (error) {
      console.error('Erreur capture position:', error);
      throw error;
    }
  }
  
  async getCurrentPositionWithFallback() {
    try {
      // 1. Essayer d'obtenir une vraie position
      return await this.getRealPosition();
    } catch (error) {
      console.warn('Échec position réelle, tentative fallback...');

      // 2. Fallback: dernière position connue
      const lastPosition = await Location.getLastKnownPositionAsync();
      if (lastPosition) {
        return {
          latitude: lastPosition.coords.latitude,
          longitude: lastPosition.coords.longitude,
          accuracy: lastPosition.coords.accuracy,
          isFallback: true
        };
      }

      // 3. Fallback final: coordonnées par défaut (Yaoundé)
      return {
        latitude: 3.8480,
        longitude: 11.5021,
        accuracy: 1000,
        isFallback: true,
        isDefault: true
      };
    }
  }

  /**
   * Obtenir la position actuelle avec haute précision
   */
  async getCurrentPosition() {
    try {
      // Vérification préalable
      if (!this.hasPermission) {
        await this.initialize();
      }

      // Configuration pour maximiser la précision
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 20000,
        distanceInterval: 10, // Minimum de 10m entre les updates
      });

      // Validation des coordonnées
      const validation = this.validateCoordinates(
        location.coords.latitude, 
        location.coords.longitude
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Sauvegarde de la position
      const position = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        mocked: location.mocked || false // Détection des faux GPS
      };

      this.lastKnownLocation = position;
      return position;

    } catch (error) {
      console.error('Erreur capture position:', error);
      throw this.handleLocationError(error);
    }
  }

  /**
   * Stratégie de fallback pour obtenir une position
   */
  async getPositionWithFallback() {
    try {
      // 1. Essai avec haute précision
      return await this.getCurrentPosition();
    } catch (error) {
      console.warn('Fallback niveau 1:', error.message);
      
      try {
        // 2. Essai avec précision réduite
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000
        });
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          isFallback: true
        };
      } catch (fallbackError) {
        console.warn('Fallback niveau 2:', fallbackError.message);
        
        // 3. Utiliser la dernière position connue
        if (this.lastKnownLocation) {
          return {
            ...this.lastKnownLocation,
            isFallback: true,
            warning: 'Position potentiellement obsolète'
          };
        }

        throw new Error('Impossible d\'obtenir une position');
      }
    }
  }

  /**
   * Obtenir la dernière position connue
   */
  async getLastKnownPosition() {
    try {
      const location = await Location.getLastKnownPositionAsync();
      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp
        };
      }
      return null;
    } catch (error) {
      console.warn('Erreur dernière position:', error);
      return null;
    }
  }

  /**
   * Validation renforcée des coordonnées
   */
  validateCoordinates(latitude, longitude) {
    // 1. Vérification de base
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { valid: false, error: 'Coordonnées invalides' };
    }

    // 2. Plages valides
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Coordonnées hors limites' };
    }

    // 3. Détection des valeurs simulées (0,0 ou coordonnées de test)
    const isSimulated = (
      (latitude === 0 && longitude === 0) || // Point nul
      (latitude === 37.4219983 && longitude === -122.084) || // Googleplex
      (latitude === 48.8588443 && longitude === 2.2943506) // Tour Eiffel
    );

    if (isSimulated) {
      return { 
        valid: false, 
        error: 'Coordonnées simulées détectées' 
      };
    }

    // 4. Validation pour le Cameroun
    const isInCameroon = (
      latitude >= 1.0 && latitude <= 13.0 &&
      longitude >= 8.0 && longitude <= 16.5
    );

    return {
      valid: true,
      warning: !isInCameroon ? 'Localisation hors Cameroun' : null
    };
  }

  /**
   * Gestion des erreurs avec messages clairs
   */
  handleLocationError(error) {
    let message = error.message;
    let actionable = false;

    if (error.code === 'ERR_LOCATION_SERVICES_DISABLED') {
      message = 'Activez les services de localisation';
      actionable = true;
    } else if (error.code === 'ERR_LOCATION_PERMISSION_DENIED') {
      message = 'Autorisez l\'accès à la localisation';
      actionable = true;
    } else if (error.message.includes('timeout')) {
      message = 'Signal GPS faible - déplacez-vous à l\'extérieur';
    }

    return {
      ...error,
      message,
      actionable,
      canRetry: !actionable
    };
  }

  /**
   * Ouvrir les paramètres système
   */
  async openSettings() {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  }
}

// Export en tant que singleton
export default new GeolocationService();