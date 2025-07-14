// src/screens/Collecteur/ClientLocationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';

// Components
import Header from '../../components/Header/Header';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';

// Services
import geolocationService from '../../services/geolocationService';
import clientService from '../../services/clientService';
import theme from '../../theme';

const ClientLocationScreen = ({ navigation, route }) => {
  const { clientId, clientNom, isCreation = false, onLocationSaved } = route.params || {};
  
  // États
  const [currentLocation, setCurrentLocation] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [locationSource, setLocationSource] = useState(null);
  const [existingLocation, setExistingLocation] = useState(null);
  
  // Animation
  const [pulseAnim] = useState(new Animated.Value(1));

  // Formulaire pour saisie manuelle
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      latitude: '',
      longitude: '',
      adresseComplete: ''
    }
  });

  const watchedLatitude = watch('latitude');
  const watchedLongitude = watch('longitude');

  // ============================================
  // EFFETS
  // ============================================

  useEffect(() => {
    loadExistingLocation();
    startPulseAnimation();
  }, []);

  // Validation temps réel des coordonnées manuelles
  useEffect(() => {
    if (manualMode && watchedLatitude && watchedLongitude) {
      const lat = parseFloat(watchedLatitude);
      const lng = parseFloat(watchedLongitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const validation = geolocationService.validateCoordinates(lat, lng);
        if (validation.valid) {
          setCurrentLocation({
            latitude: lat,
            longitude: lng,
            accuracy: null,
            source: 'MANUAL'
          });
        }
      }
    }
  }, [watchedLatitude, watchedLongitude, manualMode]);

  // ============================================
  // FONCTIONS
  // ============================================

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadExistingLocation = async () => {
    if (!clientId) return;
    
    try {
      const response = await clientService.getClientLocation(clientId);
      if (response.success && response.data) {
        setExistingLocation(response.data);
        if (response.data.latitude && response.data.longitude) {
          setCurrentLocation({
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            source: response.data.coordonneesSaisieManuelle ? 'MANUAL' : 'GPS'
          });
          setAddress(response.data.adresseComplete || '');
          setManualMode(response.data.coordonneesSaisieManuelle || false);
        }
      }
    } catch (error) {
      console.warn('⚠️ Pas de localisation existante pour ce client');
    }
  };

  const captureGPS = async () => {
    setLoading(true);
    setLocationSource('GPS');
    
    try {
      // 1. Demander permissions
      const hasPermission = await geolocationService.requestPermissions();
      if (!hasPermission) {
        setManualMode(true);
        return;
      }

      // 2. Obtenir position avec fallback
      const position = await geolocationService.getCurrentPositionWithFallback();
      
      setCurrentLocation(position);
      setAccuracy(position.accuracy);
      setManualMode(false);

      // 3. Géocodage inverse pour obtenir l'adresse
      try {
        const addressInfo = await geolocationService.reverseGeocode(
          position.latitude,
          position.longitude
        );
        
        if (addressInfo && addressInfo.formattedAddress) {
          setAddress(addressInfo.formattedAddress);
        }
      } catch (geocodeError) {
        console.warn('⚠️ Géocodage inverse échoué:', geocodeError);
      }

      Alert.alert(
        'Position capturée !',
        `Localisation obtenue avec une précision de ${Math.round(position.accuracy || 0)}m`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ Erreur capture GPS:', error);
      
      Alert.alert(
        'Erreur GPS',
        error.message + '\n\nVoulez-vous saisir la position manuellement ?',
        [
          { text: 'Réessayer', onPress: captureGPS },
          { text: 'Saisie manuelle', onPress: () => setManualMode(true) }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (data) => {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    
    const validation = geolocationService.validateCoordinates(lat, lng);
    
    if (!validation.valid) {
      Alert.alert('Coordonnées invalides', validation.error);
      return;
    }
    
    if (validation.warning) {
      Alert.alert(
        'Attention',
        validation.warning + '\n\nVoulez-vous continuer ?',
        [
          { text: 'Modifier', style: 'cancel' },
          { text: 'Continuer', onPress: () => confirmManualLocation(lat, lng, data.adresseComplete) }
        ]
      );
    } else {
      confirmManualLocation(lat, lng, data.adresseComplete);
    }
  };

  const confirmManualLocation = (latitude, longitude, adresseComplete) => {
    setCurrentLocation({
      latitude,
      longitude,
      accuracy: null,
      source: 'MANUAL'
    });
    setAddress(adresseComplete || '');
    setLocationSource('MANUAL');
    
    Alert.alert(
      'Position enregistrée',
      'La position a été saisie manuellement',
      [{ text: 'OK' }]
    );
  };

  const saveLocation = async () => {
    if (!currentLocation) {
      Alert.alert('Erreur', 'Aucune position à enregistrer');
      return;
    }

    setLoading(true);
    
    try {
      const locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        saisieManuelle: manualMode || currentLocation.source === 'MANUAL',
        adresseComplete: address,
        accuracy: currentLocation.accuracy,
        source: currentLocation.source
      };

      await clientService.updateClientLocation(clientId, locationData);
      
      // Callback pour mise à jour de l'écran parent
      if (onLocationSaved) {
        onLocationSaved(locationData);
      }

      Alert.alert(
        'Succès', 
        'Localisation enregistrée avec succès', 
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('❌ Erreur sauvegarde localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la localisation');
    } finally {
      setLoading(false);
    }
  };

  const resetLocation = () => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous effacer la localisation actuelle ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', onPress: () => {
          setCurrentLocation(null);
          setAddress('');
          setAccuracy(null);
          setManualMode(false);
          setValue('latitude', '');
          setValue('longitude', '');
          setValue('adresseComplete', '');
        }}
      ]
    );
  };

  // ============================================
  // RENDU
  // ============================================

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Localisation Client"
        subtitle={clientNom}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          currentLocation ? (
            <TouchableOpacity onPress={resetLocation} style={styles.resetButton}>
              <Ionicons name="refresh" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          ) : null
        }
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* État actuel */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={currentLocation ? "location" : "location-outline"} 
              size={24} 
              color={currentLocation ? theme.colors.success : theme.colors.textLight} 
            />
            <Text style={styles.statusTitle}>
              {currentLocation ? 'Position capturée' : 'Aucune position'}
            </Text>
          </View>
          
          {currentLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.coordinatesText}>
                📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
              {accuracy && (
                <Text style={styles.accuracyText}>
                  🎯 Précision: ±{Math.round(accuracy)}m
                </Text>
              )}
              <Text style={styles.sourceText}>
                📡 Source: {currentLocation.source === 'GPS' ? 'GPS' : 'Saisie manuelle'}
              </Text>
              {address && (
                <Text style={styles.addressText}>
                  🏠 {address}
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* Boutons d'action principaux */}
        {!manualMode ? (
          <Card style={styles.actionCard}>
            <Text style={styles.sectionTitle}>Capturer la position GPS</Text>
            <Text style={styles.sectionSubtitle}>
              Utilisez le GPS de votre appareil pour une localisation précise
            </Text>
            
            <View style={styles.gpsButtonContainer}>
              <TouchableOpacity 
                style={styles.gpsButton}
                onPress={captureGPS}
                disabled={loading}
              >
                <Animated.View style={[styles.gpsIconContainer, { transform: [{ scale: pulseAnim }] }]}>
                  {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.white} />
                  ) : (
                    <MaterialIcons name="gps-fixed" size={40} color={theme.colors.white} />
                  )}
                </Animated.View>
                <Text style={styles.gpsButtonText}>
                  {loading ? 'Localisation...' : 'Capturer GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => setManualMode(true)}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.manualButtonText}>Saisie manuelle</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          /* Formulaire saisie manuelle */
          <Card style={styles.manualCard}>
            <View style={styles.manualHeader}>
              <Text style={styles.sectionTitle}>Saisie manuelle</Text>
              <TouchableOpacity 
                style={styles.backToGpsButton}
                onPress={() => setManualMode(false)}
              >
                <Ionicons name="location" size={16} color={theme.colors.primary} />
                <Text style={styles.backToGpsText}>Retour GPS</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.coordinatesRow}>
              <View style={styles.coordinateInput}>
                <Controller
                  control={control}
                  name="latitude"
                  rules={{
                    required: 'Latitude requise',
                    min: { value: -90, message: 'Min: -90' },
                    max: { value: 90, message: 'Max: 90' }
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <Text style={styles.inputLabel}>Latitude</Text>
                      <TextInput
                        style={[styles.input, errors.latitude && styles.inputError]}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Ex: 3.8480"
                        keyboardType="numeric"
                      />
                      {errors.latitude && (
                        <Text style={styles.errorText}>{errors.latitude.message}</Text>
                      )}
                    </View>
                  )}
                />
              </View>
              
              <View style={styles.coordinateInput}>
                <Controller
                  control={control}
                  name="longitude"
                  rules={{
                    required: 'Longitude requise',
                    min: { value: -180, message: 'Min: -180' },
                    max: { value: 180, message: 'Max: 180' }
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <Text style={styles.inputLabel}>Longitude</Text>
                      <TextInput
                        style={[styles.input, errors.longitude && styles.inputError]}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Ex: 11.5021"
                        keyboardType="numeric"
                      />
                      {errors.longitude && (
                        <Text style={styles.errorText}>{errors.longitude.message}</Text>
                      )}
                    </View>
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="adresseComplete"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.addressInputContainer}>
                  <Text style={styles.inputLabel}>Adresse (optionnel)</Text>
                  <TextInput
                    style={styles.addressInput}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ex: Rue de la Paix, Yaoundé"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              )}
            />

            <Button
              title="Valider la position"
              onPress={handleSubmit(handleManualSubmit)}
              style={styles.validateButton}
              disabled={!watchedLatitude || !watchedLongitude}
            />
          </Card>
        )}

        {/* Informations utiles */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Conseils</Text>
          <Text style={styles.infoText}>
            • Pour une meilleure précision GPS, sortez à l'extérieur{'\n'}
            • La localisation aide à retrouver vos clients{'\n'}
            • Vous pouvez modifier la position ultérieurement
          </Text>
        </Card>

        {/* Bouton de sauvegarde */}
        {currentLocation && (
          <Button
            title={existingLocation ? "Mettre à jour la localisation" : "Enregistrer la localisation"}
            onPress={saveLocation}
            loading={loading}
            style={styles.saveButton}
            icon="save-outline"
          />
        )}

        {/* Bouton ignorer (si création) */}
        {isCreation && (
          <Button
            title="Ignorer pour l'instant"
            onPress={() => navigation.goBack()}
            variant="outlined"
            style={styles.skipButton}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  resetButton: {
    padding: 8,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  locationInfo: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  coordinatesText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: theme.colors.text,
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    color: theme.colors.success,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  actionCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  gpsButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gpsButton: {
    alignItems: 'center',
  },
  gpsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  manualButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  manualCard: {
    marginBottom: 16,
  },
  manualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backToGpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backToGpsText: {
    marginLeft: 4,
    fontSize: 14,
    color: theme.colors.primary,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coordinateInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: theme.colors.white,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
  addressInputContainer: {
    marginBottom: 16,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: theme.colors.white,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  validateButton: {
    marginTop: 8,
  },
  infoCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.lightBlue,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  saveButton: {
    marginBottom: 12,
  },
  skipButton: {
    marginBottom: 24,
  },
});

export default ClientLocationScreen;