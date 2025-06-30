// src/screens/Collecteur/ClientLocationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import theme from '../../theme';
import geolocationService from '../../services/geolocationService';
import clientService from '../../services/clientService';

const ClientLocationScreen = ({ navigation, route }) => {
  const { clientId, clientName, isCreation = false } = route.params;
  
  const [location, setLocation] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: 4.0511,
    longitude: 9.7679,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    // Charger la localisation existante si modification
    if (!isCreation && clientId) {
      loadExistingLocation();
    }
  }, [clientId, isCreation]);

  const loadExistingLocation = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClientLocation(clientId);
      
      if (response.success && response.data) {
        const { latitude, longitude, adresseComplete } = response.data;
        
        if (latitude && longitude) {
          setLocation({ latitude, longitude });
          setAddress(adresseComplete || '');
          setMapRegion({
            ...mapRegion,
            latitude,
            longitude
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement localisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const captureGPS = async () => {
    setLoading(true);
    try {
      // 1. Demander permissions
      const hasPermission = await geolocationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission requise', 
          'L\'accès à la localisation est nécessaire pour cette fonctionnalité',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Saisie manuelle', onPress: () => setManualMode(true) }
          ]
        );
        setLoading(false);
        return;
      }

      // 2. Obtenir position
      const position = await geolocationService.getCurrentPosition();
      setLocation({
        latitude: position.latitude,
        longitude: position.longitude
      });
      
      setMapRegion({
        ...mapRegion,
        latitude: position.latitude,
        longitude: position.longitude
      });

      // 3. Géocodage inverse
      const addressInfo = await geolocationService.reverseGeocode(
        position.latitude,
        position.longitude
      );
      
      if (addressInfo) {
        setAddress(addressInfo.formattedAddress);
      }

      Alert.alert(
        'Succès',
        'Position GPS capturée avec succès',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Erreur GPS',
        'Impossible de capturer la position. Voulez-vous saisir manuellement ?',
        [
          { text: 'Réessayer', onPress: captureGPS },
          { text: 'Saisie manuelle', onPress: () => setManualMode(true) }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLatitude);
    const lng = parseFloat(manualLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Erreur', 'Veuillez entrer des coordonnées valides');
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Erreur', 'La latitude doit être entre -90 et 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      Alert.alert('Erreur', 'La longitude doit être entre -180 et 180');
      return;
    }

    setLocation({ latitude: lat, longitude: lng });
    setMapRegion({
      ...mapRegion,
      latitude: lat,
      longitude: lng
    });
    setManualMode(false);
  };

  const saveLocation = async () => {
    if (!location) {
      Alert.alert('Erreur', 'Aucune localisation à enregistrer');
      return;
    }

    setSaving(true);
    try {
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        saisieManuelle: manualMode,
        adresseComplete: address
      };

      await clientService.updateClientLocation(clientId, locationData);

      Alert.alert(
        'Succès',
        'Localisation enregistrée avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible d\'enregistrer la localisation'
      );
    } finally {
      setSaving(false);
    }
  };

  const onMapPress = (event) => {
    if (manualMode) {
      const { coordinate } = event.nativeEvent;
      setLocation(coordinate);
      setManualLatitude(coordinate.latitude.toString());
      setManualLongitude(coordinate.longitude.toString());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={`Localisation ${clientName || 'Client'}`} 
        showBackButton 
      />

      <ScrollView style={styles.content}>
        {!manualMode ? (
          <>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Capture GPS automatique</Text>
              <Text style={styles.description}>
                Appuyez sur le bouton pour capturer automatiquement la position GPS actuelle du client
              </Text>
              
              <Button
                title={loading ? "Capture en cours..." : "Capturer GPS"}
                onPress={captureGPS}
                disabled={loading}
                style={styles.gpsButton}
                icon={
                  <Ionicons 
                    name="location" 
                    size={20} 
                    color={theme.colors.white} 
                  />
                }
              />

              {loading && (
                <ActivityIndicator 
                  style={styles.loader} 
                  size="large" 
                  color={theme.colors.primary} 
                />
              )}

              <TouchableOpacity
                onPress={() => setManualMode(true)}
                style={styles.manualLink}
              >
                <Text style={styles.manualLinkText}>
                  Saisir manuellement les coordonnées
                </Text>
              </TouchableOpacity>
            </Card>

            {location && (
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>Position capturée</Text>
                <View style={styles.coordinatesContainer}>
                  <View style={styles.coordinateRow}>
                    <Ionicons name="navigate" size={20} color={theme.colors.primary} />
                    <Text style={styles.coordinateLabel}>Latitude:</Text>
                    <Text style={styles.coordinateValue}>
                      {location.latitude.toFixed(6)}
                    </Text>
                  </View>
                  <View style={styles.coordinateRow}>
                    <Ionicons name="compass" size={20} color={theme.colors.primary} />
                    <Text style={styles.coordinateLabel}>Longitude:</Text>
                    <Text style={styles.coordinateValue}>
                      {location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>

                {address && (
                  <View style={styles.addressContainer}>
                    <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.addressText}>{address}</Text>
                  </View>
                )}
              </Card>
            )}
          </>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Saisie manuelle</Text>
            <Text style={styles.description}>
              Entrez les coordonnées GPS ou touchez la carte pour sélectionner une position
            </Text>

            <Input
              label="Latitude"
              value={manualLatitude}
              onChangeText={setManualLatitude}
              keyboardType="numeric"
              placeholder="Ex: 4.0511"
              style={styles.input}
            />

            <Input
              label="Longitude"
              value={manualLongitude}
              onChangeText={setManualLongitude}
              keyboardType="numeric"
              placeholder="Ex: 9.7679"
              style={styles.input}
            />

            <Input
              label="Adresse (optionnel)"
              value={address}
              onChangeText={setAddress}
              placeholder="Adresse complète"
              multiline
              numberOfLines={2}
              style={styles.input}
            />

            <View style={styles.manualButtons}>
              <Button
                title="Valider"
                onPress={handleManualSubmit}
                style={styles.manualButton}
              />
              <Button
                title="Annuler"
                onPress={() => setManualMode(false)}
                variant="outlined"
                style={styles.manualButton}
              />
            </View>
          </Card>
        )}

        {/* Carte */}
        {(location || manualMode) && (
          <Card style={[styles.card, styles.mapCard]}>
            <Text style={styles.cardTitle}>
              {manualMode ? 'Touchez pour sélectionner' : 'Aperçu de la position'}
            </Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onPress={onMapPress}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {location && (
                  <Marker
                    coordinate={location}
                    title={clientName || 'Client'}
                    description={address || 'Position du client'}
                  />
                )}
              </MapView>
            </View>
          </Card>
        )}

        {/* Bouton Enregistrer */}
        {location && !manualMode && (
          <View style={styles.saveButtonContainer}>
            <Button
              title={saving ? "Enregistrement..." : "Enregistrer la localisation"}
              onPress={saveLocation}
              disabled={saving}
              style={styles.saveButton}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  card: {
    margin: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  gpsButton: {
    marginVertical: 10,
  },
  loader: {
    marginVertical: 20,
  },
  manualLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  manualLinkText: {
    color: theme.colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  coordinatesContainer: {
    marginTop: 10,
  },
  coordinateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coordinateLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 10,
    width: 80,
  },
  coordinateValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  manualButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  manualButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  mapCard: {
    marginBottom: 80,
  },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  saveButtonContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  saveButton: {
    marginTop: 0,
  },
});

export default ClientLocationScreen;