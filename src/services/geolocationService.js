// src/services/geolocationService.js - VERSION CORRIGÉE ET SIMPLIFIÉE
import * as Location from 'expo-location';
import { Platform, Linking } from 'react-native';

class GeolocationService {
  constructor() {
    this.isLocationEnabled = false;
    this.hasPermission = false;
    this.lastKnownLocation = null;
  }

  /**
   * Initialisation du service avec vérification des permissions
   */
  async initialize() {
    console.log('🔧 Initialisation GeolocationService...');
    
    try {
      // Vérifier si les services de localisation sont activés
      this.isLocationEnabled = await Location.hasServicesEnabledAsync();
      
      // Vérifier les permissions
      const { status } = await Location.getForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      console.log('✅ GeolocationService initialisé:', {
        locationEnabled: this.isLocationEnabled,
        hasPermission: this.hasPermission
      });
      
      return {
        locationEnabled: this.isLocationEnabled,
        hasPermission: this.hasPermission
      };
    } catch (error) {
      console.error('❌ Erreur initialisation GeolocationService:', error);
      return {
        locationEnabled: false,
        hasPermission: false,
        error: error.message
      };
    }
  }

  /**
   * Demander les permissions de géolocalisation avec gestion robuste
   */
  async requestPermissions() {
    console.log('🔒 Demande permissions géolocalisation...');
    
    try {
      // Vérifier d'abord si les services sont activés
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw new Error('Les services de localisation sont désactivés. Veuillez les activer dans les paramètres.');
      }

      // Demander les permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      if (!this.hasPermission) {
        // Analyser le type de refus
        if (status === 'denied') {
          throw new Error('Permission refusée. Veuillez autoriser l\'accès à la localisation.');
        } else if (status === 'undetermined') {
          throw new Error('Permission indéterminée. Veuillez réessayer.');
        }
      }
      
      console.log('✅ Permissions obtenues:', this.hasPermission);
      return this.hasPermission;
      
    } catch (error) {
      console.error('❌ Erreur permissions:', error);
      throw error;
    }
  }

  /**
   * Obtenir la position actuelle avec fallback et retry
   */
  async getCurrentPosition(options = {}) {
    console.log('📍 Capture position GPS...');
    
    const defaultOptions = {
      accuracy: Location.Accuracy.High,
      timeout: 15000,
      maximumAge: 30000,
      ...options
    };

    try {
      // Vérifier les prérequis
      if (!this.hasPermission) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          throw new Error('Permissions géolocalisation requises');
        }
      }

      // Tentative de capture
      const location = await Location.getCurrentPositionAsync(defaultOptions);

      const result = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        source: 'GPS'
      };

      this.lastKnownLocation = result;
      
      console.log('✅ Position obtenue:', {
        lat: result.latitude.toFixed(6),
        lng: result.longitude.toFixed(6),
        accuracy: Math.round(result.accuracy || 0) + 'm'
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur capture GPS:', error);
      throw this.createLocationError(error);
    }
  }

  /**
   * Obtenir position avec fallback progressif
   */
  async getCurrentPositionWithFallback() {
    console.log('📍 Capture GPS avec fallback...');
    
    const attempts = [
      { accuracy: Location.Accuracy.High, timeout: 15000 },
      { accuracy: Location.Accuracy.Balanced, timeout: 10000 },
      { accuracy: Location.Accuracy.Low, timeout: 8000 }
    ];

    for (let i = 0; i < attempts.length; i++) {
      try {
        console.log(`🔄 Tentative ${i + 1}/${attempts.length}...`);
        return await this.getCurrentPosition(attempts[i]);
      } catch (error) {
        console.warn(`⚠️ Tentative ${i + 1} échouée:`, error.message);
        
        if (i === attempts.length - 1) {
          throw error; // Dernière tentative échouée
        }
        
        // Attendre avant la prochaine tentative
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * 🔥 NOUVEAU : Validation des coordonnées GPS pour le Cameroun
   */
  validateCoordinates(latitude, longitude) {
    if (latitude == null || longitude == null) {
      return { valid: false, error: 'Coordonnées nulles' };
    }
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { valid: false, error: 'Coordonnées doivent être des nombres' };
    }
    
    if (latitude < -90 || latitude > 90) {
      return { valid: false, error: 'Latitude invalide (doit être entre -90 et 90)' };
    }
    
    if (longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Longitude invalide (doit être entre -180 et 180)' };
    }
    
    // Validation spécifique au Cameroun
    const CAMEROON_BOUNDS = {
      minLat: 1.5, maxLat: 13.0,
      minLng: 8.0, maxLng: 16.5
    };
    
    let warning = null;
    if (latitude < CAMEROON_BOUNDS.minLat || latitude > CAMEROON_BOUNDS.maxLat ||
        longitude < CAMEROON_BOUNDS.minLng || longitude > CAMEROON_BOUNDS.maxLng) {
      warning = 'Ces coordonnées semblent être en dehors du Cameroun. Voulez-vous continuer ?';
    }
    
    // Vérifier les coordonnées nulles exactes (0,0) - Golfe de Guinée
    if (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) {
      return { valid: false, error: 'Coordonnées (0,0) non autorisées' };
    }
    
    // Coordonnées de l'émulateur Android (Mountain View, CA)
    if (Math.abs(latitude - 37.4219983) < 0.001 && Math.abs(longitude - (-122.084))) {
      warning = 'Coordonnées de l\'émulateur détectées (Mountain View, CA). Ceci est normal en développement.';
    }
    
    return { valid: true, warning };
  }

  /**
   * Géocodage inverse avec gestion d'erreurs
   */
  async reverseGeocode(latitude, longitude) {
    console.log('🏠 Géocodage inverse...');
    
    try {
      const validation = this.validateCoordinates(latitude, longitude);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      const addresses = await Location.reverseGeocodeAsync({ 
        latitude, 
        longitude 
      });
      
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        return {
          street: address.street,
          city: address.city,
          region: address.region,
          country: address.country,
          postalCode: address.postalCode,
          formattedAddress: this.formatAddress(address)
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Erreur géocodage inverse:', error);
      return null; // Non bloquant
    }
  }

  /**
   * Calculer la distance entre deux points (Haversine)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
  }

  /**
   * Formatage d'adresse
   */
  formatAddress(address) {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  }

  /**
   * Ouvrir les paramètres de localisation
   */
  async openLocationSettings() {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('❌ Erreur ouverture paramètres:', error);
    }
  }

  /**
   * Créer une erreur de localisation avec message explicite
   */
  createLocationError(error) {
    let message = 'Erreur de géolocalisation';
    let actionable = false;
    
    if (error.message) {
      if (error.message.includes('timeout')) {
        message = 'Délai d\'attente dépassé. Assurez-vous d\'être à l\'extérieur avec une bonne réception GPS.';
      } else if (error.message.includes('permission') || error.message.includes('denied')) {
        message = 'Permission de localisation refusée. Veuillez l\'autoriser dans les paramètres.';
        actionable = true;
      } else if (error.message.includes('disabled') || error.message.includes('services')) {
        message = 'Services de localisation désactivés. Veuillez les activer dans les paramètres.';
        actionable = true;
      } else if (error.message.includes('unavailable') || error.message.includes('network')) {
        message = 'GPS indisponible. Vérifiez votre connexion et réessayez.';
      } else {
        message = error.message;
      }
    }
    
    return {
      ...error,
      message,
      actionable,
      canRetry: !actionable
    };
  }

  /**
   * Obtenir le statut complet du service
   */
  async getStatus() {
    return {
      isLocationEnabled: await Location.hasServicesEnabledAsync(),
      hasPermission: this.hasPermission,
      lastKnownLocation: this.lastKnownLocation
    };
  }

  /**
   * Conversion degrés vers radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Nettoyer les ressources
   */
  cleanup() {
    this.lastKnownLocation = null;
    console.log('🧹 GeolocationService nettoyé');
  }
}

export default new GeolocationService();