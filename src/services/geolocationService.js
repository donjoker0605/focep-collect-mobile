// src/services/geolocationService.js
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

class GeolocationService {
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'L\'accès à la localisation est nécessaire pour enregistrer la position des clients.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir Paramètres', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur permission géolocalisation:', error);
      return false;
    }
  }

  async getCurrentPosition() {
    try {
      // Vérifier si les services de localisation sont activés
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        throw new Error('Les services de localisation sont désactivés');
      }
      
      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      };
    } catch (error) {
      console.error('Erreur obtention position:', error);
      throw new Error('Impossible d\'obtenir la position GPS');
    }
  }

  async reverseGeocode(latitude, longitude) {
    try {
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
      console.error('Erreur géocodage inverse:', error);
      return null;
    }
  }

  formatAddress(address) {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Formule de Haversine pour calculer la distance
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance; // Distance en km
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

export default new GeolocationService();