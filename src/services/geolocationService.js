// src/services/geolocationService.js - VERSION COMPLÈTE CORRIGÉE
import * as Location from 'expo-location';
import { Platform, Linking, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

class GeolocationService {
  constructor() {
    this.isLocationEnabled = false;
    this.hasPermission = false;
    this.lastKnownLocation = null;
    this.geocodingCache = new Map();
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

      // 3. Charger le cache de géocodage
      await this.loadGeocodeCache();

      return true;
    } catch (error) {
      console.error('Erreur initialisation:', error);
      throw error;
    }
  }
  
  /**
   * NOUVEAU : Géocodage inverse avec cache et fallback
   * Utilise l'API backend pour sécuriser les clés API
   */
  async reverseGeocode(latitude, longitude) {
    try {
      console.log('📍 Géocodage inverse pour:', latitude, longitude);
      
      // 1. Vérifier le cache local
      const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      if (this.geocodingCache.has(cacheKey)) {
        console.log('✅ Adresse trouvée dans le cache');
        return this.geocodingCache.get(cacheKey);
      }

      // 2. Essayer l'API Expo Location (gratuit mais limité)
      try {
        const addresses = await Location.reverseGeocodeAsync({ 
          latitude, 
          longitude 
        });
        
        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          const formattedAddress = this.formatAddress(address);
          
          // Mettre en cache
          this.geocodingCache.set(cacheKey, formattedAddress);
          await this.saveGeocodeCache();
          
          return formattedAddress;
        }
      } catch (expoError) {
        console.warn('⚠️ Expo geocoding échoué:', expoError);
      }

      // 3. Fallback vers l'API backend
      try {
        const response = await axios.post(`${API_BASE_URL}/api/geocoding/reverse`, {
          latitude,
          longitude
        });
        
        if (response.data && response.data.address) {
          const result = {
            formattedAddress: response.data.address,
            city: response.data.city,
            region: response.data.region,
            country: response.data.country
          };
          
          // Mettre en cache
          this.geocodingCache.set(cacheKey, result);
          await this.saveGeocodeCache();
          
          return result;
        }
      } catch (backendError) {
        console.error('❌ Backend geocoding échoué:', backendError);
      }

      // 4. Fallback final : génération d'adresse approximative
      return this.generateApproximateAddress(latitude, longitude);
      
    } catch (error) {
      console.error('❌ Erreur géocodage inverse:', error);
      return this.generateApproximateAddress(latitude, longitude);
    }
  }

  /**
   * Formater l'adresse depuis les données Expo
   */
  formatAddress(address) {
    const parts = [];
    
    if (address.name) parts.push(address.name);
    if (address.street) parts.push(address.street);
    if (address.district) parts.push(address.district);
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    if (address.country) parts.push(address.country);
    
    const formattedAddress = parts.filter(Boolean).join(', ');
    
    return {
      formattedAddress: formattedAddress || 'Adresse inconnue',
      city: address.city || address.subregion || 'Ville inconnue',
      region: address.region || '',
      country: address.country || 'Cameroun'
    };
  }

  /**
   * Générer une adresse approximative basée sur les coordonnées
   */
  generateApproximateAddress(latitude, longitude) {
    // Déterminer la région approximative du Cameroun
    let region = 'Cameroun';
    let city = 'Localisation approximative';
    
    // Régions approximatives du Cameroun
    if (latitude >= 9.0 && latitude <= 13.0 && longitude >= 13.0 && longitude <= 16.0) {
      region = 'Extrême-Nord';
    } else if (latitude >= 7.0 && latitude <= 9.0 && longitude >= 13.0 && longitude <= 15.0) {
      region = 'Nord';
    } else if (latitude >= 5.0 && latitude <= 7.0 && longitude >= 13.0 && longitude <= 15.0) {
      region = 'Adamaoua';
    } else if (latitude >= 3.5 && latitude <= 5.0 && longitude >= 11.0 && longitude <= 13.0) {
      region = 'Centre';
      if (Math.abs(latitude - 3.848) < 0.2 && Math.abs(longitude - 11.502) < 0.2) {
        city = 'Yaoundé';
      }
    } else if (latitude >= 3.5 && latitude <= 4.5 && longitude >= 9.0 && longitude <= 10.0) {
      region = 'Littoral';
      if (Math.abs(latitude - 4.0483) < 0.1 && Math.abs(longitude - 9.7043) < 0.1) {
        city = 'Douala';
      }
    }
    
    return {
      formattedAddress: `${city}, ${region}`,
      city: city,
      region: region,
      country: 'Cameroun',
      isApproximate: true
    };
  }

  /**
   * Gestion du cache de géocodage
   */
  async loadGeocodeCache() {
    try {
      const cacheData = await AsyncStorage.getItem('geocode_cache');
      if (cacheData) {
        const cache = JSON.parse(cacheData);
        this.geocodingCache = new Map(Object.entries(cache));
      }
    } catch (error) {
      console.warn('Impossible de charger le cache de géocodage');
    }
  }

  async saveGeocodeCache() {
    try {
      // Limiter la taille du cache à 100 entrées
      if (this.geocodingCache.size > 100) {
        const entries = Array.from(this.geocodingCache.entries());
        this.geocodingCache = new Map(entries.slice(-100));
      }
      
      const cacheObj = Object.fromEntries(this.geocodingCache);
      await AsyncStorage.setItem('geocode_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Impossible de sauvegarder le cache de géocodage');
    }
  }

  /**
   * Obtenir la position avec gestion intelligente des erreurs
   */
  async getRealPosition() {
    try {
      await this.initialize();

      // Configuration adaptée au contexte
      const isDev = __DEV__;
      const config = {
        accuracy: isDev ? Location.Accuracy.High : Location.Accuracy.BestForNavigation,
        timeout: isDev ? 10000 : 20000,
        distanceInterval: 0,
        mayShowUserSettingsDialog: true,
      };

      const location = await Location.getCurrentPositionAsync(config);

      // En développement, accepter les positions simulées
      if (isDev && location.mocked) {
        console.warn('⚠️ Position simulée détectée (mode développement)');
      } else if (!isDev && location.mocked) {
        throw new Error('Position simulée détectée - Activez le GPS physique');
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        mocked: location.mocked || false,
        timestamp: location.timestamp
      };
    } catch (error) {
      console.error('Erreur capture position:', error);
      throw error;
    }
  }
  
  /**
   * Stratégie de fallback améliorée
   */
  async getCurrentPositionWithFallback() {
    try {
      // 1. Essayer d'obtenir une vraie position
      return await this.getRealPosition();
    } catch (error) {
      console.warn('Échec position réelle, tentative fallback...');

      // 2. Fallback: dernière position connue
      try {
        const lastPosition = await Location.getLastKnownPositionAsync();
        if (lastPosition && lastPosition.timestamp) {
          const age = Date.now() - lastPosition.timestamp;
          const maxAge = 5 * 60 * 1000; // 5 minutes
          
          if (age < maxAge) {
            return {
              latitude: lastPosition.coords.latitude,
              longitude: lastPosition.coords.longitude,
              accuracy: lastPosition.coords.accuracy,
              isFallback: true,
              age: Math.round(age / 1000) // âge en secondes
            };
          }
        }
      } catch (lastPosError) {
        console.warn('Pas de dernière position disponible');
      }

      // 3. En développement seulement: position par défaut
      if (__DEV__) {
        Alert.alert(
          'Position GPS indisponible',
          'Utiliser la position par défaut (Yaoundé) ?',
          [
            { text: 'Non', style: 'cancel' },
            { 
              text: 'Oui', 
              onPress: () => {
                return {
                  latitude: 3.8480,
                  longitude: 11.5021,
                  accuracy: 1000,
                  isFallback: true,
                  isDefault: true
                };
              }
            }
          ]
        );
      }

      throw new Error('Impossible d\'obtenir une position');
    }
  }

  /**
   * Validation des coordonnées avec tolérance
   */
  validateCoordinates(latitude, longitude) {
    // 1. Vérification de base
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { valid: false, error: 'Coordonnées invalides' };
    }

    // 2. Plages valides globales
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Coordonnées hors limites' };
    }

    // 3. En développement, accepter toutes les coordonnées valides
    if (__DEV__) {
      return { valid: true, warning: null };
    }

    // 4. En production, vérifier les coordonnées du Cameroun avec tolérance
    const cameroonBounds = {
      minLat: 1.0,
      maxLat: 13.5,
      minLng: 8.0,
      maxLng: 16.5
    };

    const isInCameroon = (
      latitude >= cameroonBounds.minLat && 
      latitude <= cameroonBounds.maxLat &&
      longitude >= cameroonBounds.minLng && 
      longitude <= cameroonBounds.maxLng
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

  /**
   * Méthodes utilitaires
   */
  async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentPosition() {
    return this.getRealPosition();
  }

  async getPositionWithFallback() {
    return this.getCurrentPositionWithFallback();
  }

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
}

// Export en tant que singleton
export default new GeolocationService();