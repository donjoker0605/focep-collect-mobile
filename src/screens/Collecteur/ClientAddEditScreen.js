// ClientAddEditScreen.js - VERSION CORRIGÉE AVEC LOGIQUE GPS INTELLIGENTE

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Components
import Header from '../../components/Header/Header';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';

// Services
import theme from '../../theme';
import clientService from '../../services/clientService';
import geolocationService from '../../services/geolocationService';
import authService from '../../services/authService';

// Navigation
import { useCollecteurNavigation } from '../../navigation/CollecteurStack';

// ============================================
// SCHÉMAS DE VALIDATION
// ============================================

const clientSchema = yup.object().shape({
  nom: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .required('Le nom est requis'),
  prenom: yup
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .required('Le prénom est requis'),
  numeroCni: yup
    .string()
    .min(8, 'Le numéro CNI doit contenir au moins 8 caractères')
    .required('Le numéro CNI est requis'),
  telephone: yup
    .string()
    .matches(/^(\+237|237)?[ ]?[6-9][0-9]{8}$/, 'Numéro de téléphone invalide (format camerounais)')
    .required('Le numéro de téléphone est requis'),
  ville: yup
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .required('La ville est requise'),
  quartier: yup
    .string()
    .min(2, 'Le quartier doit contenir au moins 2 caractères')
    .required('Le quartier est requis'),
});

// États de géolocalisation
const GPS_STATES = {
  IDLE: 'idle',
  REQUESTING_PERMISSION: 'requesting_permission',
  CAPTURING: 'capturing',
  CAPTURED: 'captured',
  FAILED: 'failed',
  MANUAL_INPUT: 'manual_input',
  MANUAL_COMPLETED: 'manual_completed'
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const ClientAddEditScreen = ({ navigation, route }) => {
  const { mode, client } = route.params || { mode: 'add' };
  const isEditMode = mode === 'edit';
  const { goToClientList, goToClientDetail } = useCollecteurNavigation(navigation);
  
  // États
  const [isLoading, setIsLoading] = useState(false);
  const [gpsState, setGpsState] = useState(GPS_STATES.IDLE);
  const [locationData, setLocationData] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsAttempts, setGpsAttempts] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

  // Configuration du formulaire
  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(clientSchema),
    defaultValues: isEditMode && client
      ? {
          nom: client.nom,
          prenom: client.prenom,
          numeroCni: client.numeroCni,
          telephone: client.telephone,
          ville: client.ville || '',
          quartier: client.quartier || '',
        }
      : {
          nom: '',
          prenom: '',
          numeroCni: '',
          telephone: '',
          ville: '',
          quartier: '',
        }
  });

  // ============================================
  // EFFETS D'INITIALISATION
  // ============================================
  
  useEffect(() => {
    loadUserInfo();
    if (isEditMode && client) {
      loadExistingLocation();
    } else {
      // 🔥 Pour un nouveau client, démarrer automatiquement la capture GPS
      startAutomaticGPSCapture();
    }
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUserInfo(user);
      console.log('✅ Informations utilisateur chargées:', user);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
    }
  };

  const loadExistingLocation = () => {
    if (client?.latitude && client?.longitude) {
      setLocationData({
        latitude: client.latitude,
        longitude: client.longitude,
        adresseComplete: client.adresseComplete,
        coordonneesSaisieManuelle: client.coordonneesSaisieManuelle,
        accuracy: null
      });
      setGpsState(GPS_STATES.CAPTURED);
    }
  };

  // ============================================
  // 🔥 LOGIQUE GPS INTELLIGENTE ET OBLIGATOIRE
  // ============================================

  const startAutomaticGPSCapture = async () => {
    console.log('🚀 Démarrage automatique de la capture GPS');
    setGpsState(GPS_STATES.REQUESTING_PERMISSION);
    setGpsError(null);

    try {
      // 1. Vérifier et demander les permissions
      const hasPermission = await geolocationService.requestPermissions();
      if (!hasPermission) {
        handleGPSPermissionDenied();
        return;
      }

      // 2. Tenter la capture GPS
      await attemptGPSCapture();
      
    } catch (error) {
      handleGPSError(error);
    }
  };

  const attemptGPSCapture = async () => {
    setGpsState(GPS_STATES.CAPTURING);
    setGpsAttempts(prev => prev + 1);

    try {
      console.log(`📍 Tentative GPS #${gpsAttempts + 1}`);
      
      const position = await geolocationService.getRealPosition();

      // 🔥 DÉTECTION ET GESTION DES COORDONNÉES SIMULÉES
      if (position.mocked) {
        handleMockedLocation(position);
        return;
      }

      // 🔥 DÉTECTION COORDONNÉES ÉMULATEUR
      if (isEmulatorCoordinates(position.latitude, position.longitude)) {
        handleEmulatorCoordinates(position);
        return;
      }

      // 🔥 VALIDATION CAMEROUN
      if (!isInCameroonBounds(position.latitude, position.longitude)) {
        handleOutOfBoundsCoordinates(position);
        return;
      }

      // ✅ COORDONNÉES VALIDES
      await processValidGPSLocation(position);

    } catch (error) {
      console.error(`❌ Erreur GPS tentative #${gpsAttempts + 1}:`, error);
      
      if (gpsAttempts < 2) {
        // Réessayer automatiquement
        setTimeout(() => attemptGPSCapture(), 2000);
      } else {
        // Après 3 tentatives, proposer la saisie manuelle
        offerManualInput(error);
      }
    }
  };

  const handleMockedLocation = (position) => {
    Alert.alert(
      'Position simulée détectée',
      'Votre appareil utilise une position simulée. Pour créer un client, vous devez utiliser votre position réelle.',
      [
        { text: 'Paramètres GPS', onPress: () => geolocationService.openSettings() },
        { text: 'Réessayer', onPress: () => attemptGPSCapture() },
        { text: 'Saisie manuelle', onPress: () => startManualInput() }
      ]
    );
  };

  const handleEmulatorCoordinates = (position) => {
    console.warn('🚨 Coordonnées émulateur détectées:', position);
    
    if (__DEV__) {
      Alert.alert(
        'Émulateur détecté',
        'Vous utilisez un émulateur. Pour tester, vous pouvez utiliser des coordonnées du Cameroun.',
        [
          {
            text: 'Utiliser Yaoundé',
            onPress: () => processValidGPSLocation({
              latitude: 3.8480,
              longitude: 11.5021,
              accuracy: 10,
              mocked: false,
              isDefault: true
            })
          },
          {
            text: 'Utiliser Douala', 
            onPress: () => processValidGPSLocation({
              latitude: 4.0483,
              longitude: 9.7043,
              accuracy: 10,
              mocked: false,
              isDefault: true
            })
          },
          { text: 'Saisie manuelle', onPress: () => startManualInput() }
        ]
      );
    } else {
      Alert.alert(
        'Position invalide',
        'Position d\'émulateur détectée. Utilisez un appareil physique ou saisissez des coordonnées manuellement.',
        [
          { text: 'Réessayer', onPress: () => attemptGPSCapture() },
          { text: 'Saisie manuelle', onPress: () => startManualInput() }
        ]
      );
    }
  };

  const handleOutOfBoundsCoordinates = (position) => {
    Alert.alert(
      'Position hors Cameroun',
      `Position détectée: ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}\n\nCette position semble être en dehors du Cameroun. Voulez-vous continuer ?`,
      [
        { text: 'Réessayer GPS', onPress: () => attemptGPSCapture() },
        { text: 'Accepter quand même', onPress: () => processValidGPSLocation(position) },
        { text: 'Saisie manuelle', onPress: () => startManualInput() }
      ]
    );
  };

  const handleGPSPermissionDenied = () => {
    Alert.alert(
      'Permission GPS requise',
      'Pour créer un client, nous devons connaître sa localisation. Autorisez l\'accès à la géolocalisation ou saisissez les coordonnées manuellement.',
      [
        { text: 'Paramètres', onPress: () => geolocationService.openSettings() },
        { text: 'Saisie manuelle', onPress: () => startManualInput() }
      ]
    );
  };

  const handleGPSError = (error) => {
    setGpsError(error.message);
    
    const errorActions = [
      { text: 'Réessayer', onPress: () => attemptGPSCapture() },
      { text: 'Saisie manuelle', onPress: () => startManualInput() }
    ];

    if (error.actionable) {
      errorActions.unshift({ text: 'Paramètres', onPress: () => geolocationService.openSettings() });
    }

    Alert.alert('Erreur GPS', error.message, errorActions);
  };

  const offerManualInput = (lastError) => {
    Alert.alert(
      'GPS indisponible',
      `Impossible d'obtenir votre position GPS après ${gpsAttempts} tentatives.\n\nErreur: ${lastError.message}\n\nVoulez-vous saisir les coordonnées manuellement ?`,
      [
        { text: 'Réessayer GPS', onPress: () => startAutomaticGPSCapture() },
        { text: 'Saisie manuelle', onPress: () => startManualInput() }
      ]
    );
  };

  const processValidGPSLocation = async (position) => {
    try {
      // Tentative de géocodage inverse pour obtenir l'adresse
      let address = '';
      try {
        const addressInfo = await geolocationService.reverseGeocode(
          position.latitude,
          position.longitude
        );
        address = addressInfo?.formattedAddress || '';
      } catch (geocodeError) {
        console.warn('⚠️ Géocodage inverse échoué:', geocodeError);
      }

      const locationData = {
        latitude: position.latitude,
        longitude: position.longitude,
        adresseComplete: address,
        coordonneesSaisieManuelle: false,
        accuracy: position.accuracy,
        isDefault: position.isDefault || false
      };

      setLocationData(locationData);
      setGpsState(GPS_STATES.CAPTURED);

      const message = position.isDefault 
        ? 'Position par défaut utilisée'
        : `Position capturée avec une précision de ${Math.round(position.accuracy || 0)}m`;

      Alert.alert('✅ Position obtenue !', message, [{ text: 'OK' }]);

    } catch (error) {
      console.error('❌ Erreur sauvegarde position:', error);
      setGpsError(error.message);
      setGpsState(GPS_STATES.FAILED);
    }
  };

  const startManualInput = () => {
    setGpsState(GPS_STATES.MANUAL_INPUT);
    setGpsError(null);
  };

  const handleManualCoordinates = (latitude, longitude) => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Erreur', 'Coordonnées invalides');
      return;
    }

    if (!isValidCoordinates(lat, lng)) {
      Alert.alert('Erreur', 'Coordonnées hors limites (-90 à 90 pour latitude, -180 à 180 pour longitude)');
      return;
    }

    const manualLocation = {
      latitude: lat,
      longitude: lng,
      adresseComplete: '',
      coordonneesSaisieManuelle: true,
      accuracy: null
    };

    setLocationData(manualLocation);
    setGpsState(GPS_STATES.MANUAL_COMPLETED);

    Alert.alert('✅ Coordonnées enregistrées', 'Localisation manuelle enregistrée', [{ text: 'OK' }]);
  };

  // ============================================
  // 🔥 SOUMISSION AVEC IDS AUTOMATIQUES
  // ============================================

  const onSubmit = async (data) => {
    // 🔥 VÉRIFICATION OBLIGATOIRE DE LA LOCALISATION
    if (!locationData) {
      Alert.alert(
        'Localisation requise',
        'Vous devez fournir une localisation pour créer ce client. Capturez votre position GPS ou saisissez les coordonnées manuellement.',
        [{ text: 'OK', onPress: () => startAutomaticGPSCapture() }]
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log('💾 Soumission formulaire:', { data, locationData, userInfo });

      // 🔥 CONSTRUCTION DES DONNÉES AVEC IDS AUTOMATIQUES
      const clientData = {
        ...data,
        // ✅ COORDONNÉES OBLIGATOIRES
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        coordonneesSaisieManuelle: locationData.coordonneesSaisieManuelle,
        adresseComplete: locationData.adresseComplete,
        
        // 🔥 IDS AUTOMATIQUES (ne pas laisser le choix au frontend)
        // Ces champs seront de toute façon écrasés par le backend pour sécurité
        collecteurId: userInfo?.id,
        agenceId: userInfo?.agenceId
      };

      console.log('📤 Données finales à envoyer:', clientData);

      // Sauvegarde
      let result;
      if (isEditMode) {
        // Pour les modifications, utiliser le DTO spécialisé
        const updateData = {
          telephone: data.telephone,
          numeroCni: data.numeroCni,
          ville: data.ville,
          quartier: data.quartier,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          coordonneesSaisieManuelle: locationData.coordonneesSaisieManuelle,
          adresseComplete: locationData.adresseComplete
        };
        result = await clientService.updateClient(client.id, updateData);
      } else {
        result = await clientService.createClient(clientData);
      }

      if (!result.success) {
        throw new Error(result.error || "Une erreur est survenue lors de l'enregistrement");
      }

      const savedClient = result.data;
      console.log('✅ Client sauvegardé:', savedClient);

      showSuccessMessage(savedClient);

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);

      Alert.alert(
        "Erreur",
        `Impossible d'enregistrer le client: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessMessage = (savedClient) => {
    const locationMessage = locationData 
      ? '\n📍 Localisation enregistrée' 
      : '';

    if (isEditMode) {
      Alert.alert(
        "Succès",
        `Les informations de ${savedClient.prenom} ${savedClient.nom} ont été mises à jour avec succès.${locationMessage}`,
        [{ text: "OK", onPress: () => goToClientDetail(savedClient) }]
      );
    } else {
      Alert.alert(
        "Succès",
        `Le client ${savedClient.prenom} ${savedClient.nom} a été créé avec succès.${locationMessage}`,
        [
          { text: "Voir les clients", onPress: () => goToClientList() },
          { text: "Voir détails", onPress: () => goToClientDetail(savedClient) }
        ]
      );
    }
  };

  // ============================================
  // UTILITAIRES
  // ============================================

  const isEmulatorCoordinates = (lat, lng) => {
    return Math.abs(lat - 37.4219983) < 0.001 && Math.abs(lng - (-122.084)) < 0.001;
  };

  const isInCameroonBounds = (lat, lng) => {
    return lat >= 1.0 && lat <= 13.5 && lng >= 8.0 && lng <= 16.5;
  };

  const isValidCoordinates = (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  // ============================================
  // RENDU GÉOLOCALISATION
  // ============================================

  const renderLocationSection = () => {
    return (
      <Card style={styles.geoCard}>
        <View style={styles.geoHeader}>
          <Ionicons 
            name={getLocationIcon()} 
            size={20} 
            color={getLocationColor()} 
          />
          <Text style={styles.geoTitle}>Localisation GPS</Text>
          <Text style={[styles.geoStatus, { color: getLocationColor() }]}>
            {getLocationStatusText()}
          </Text>
        </View>

        {renderLocationContent()}
      </Card>
    );
  };

  const getLocationIcon = () => {
    switch (gpsState) {
      case GPS_STATES.CAPTURED:
      case GPS_STATES.MANUAL_COMPLETED:
        return "location";
      case GPS_STATES.CAPTURING:
      case GPS_STATES.REQUESTING_PERMISSION:
        return "radio-outline";
      case GPS_STATES.FAILED:
        return "location-outline";
      default:
        return "location-outline";
    }
  };

  const getLocationColor = () => {
    switch (gpsState) {
      case GPS_STATES.CAPTURED:
      case GPS_STATES.MANUAL_COMPLETED:
        return theme.colors.success;
      case GPS_STATES.CAPTURING:
      case GPS_STATES.REQUESTING_PERMISSION:
        return theme.colors.warning;
      case GPS_STATES.FAILED:
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getLocationStatusText = () => {
    switch (gpsState) {
      case GPS_STATES.CAPTURED:
        return "Capturée";
      case GPS_STATES.MANUAL_COMPLETED:
        return "Manuelle";
      case GPS_STATES.CAPTURING:
        return "Capture...";
      case GPS_STATES.REQUESTING_PERMISSION:
        return "Permission...";
      case GPS_STATES.FAILED:
        return "Échec";
      case GPS_STATES.MANUAL_INPUT:
        return "Saisie manuelle";
      default:
        return "Requise";
    }
  };

  const renderLocationContent = () => {
    switch (gpsState) {
      case GPS_STATES.CAPTURED:
      case GPS_STATES.MANUAL_COMPLETED:
        return renderLocationSuccess();
      
      case GPS_STATES.CAPTURING:
      case GPS_STATES.REQUESTING_PERMISSION:
        return renderLocationLoading();
      
      case GPS_STATES.FAILED:
        return renderLocationError();
      
      case GPS_STATES.MANUAL_INPUT:
        return renderManualInput();
      
      default:
        return renderLocationStart();
    }
  };

  const renderLocationSuccess = () => (
    <View style={styles.locationSuccess}>
      <Text style={styles.coordinatesText}>
        📍 {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
      </Text>
      {locationData.accuracy && (
        <Text style={styles.accuracyText}>
          🎯 Précision: ±{Math.round(locationData.accuracy)}m
        </Text>
      )}
      <Text style={styles.sourceText}>
        📡 {locationData.coordonneesSaisieManuelle ? 'Saisie manuelle' : 'GPS'}
      </Text>
      {locationData.adresseComplete && (
        <Text style={styles.addressText}>
          🏠 {locationData.adresseComplete}
        </Text>
      )}
      
      <Button
        title="Recapturer"
        onPress={startAutomaticGPSCapture}
        style={styles.recaptureButton}
        variant="outlined"
        size="small"
      />
    </View>
  );

  const renderLocationLoading = () => (
    <View style={styles.locationLoading}>
      <Text style={styles.loadingText}>
        {gpsState === GPS_STATES.REQUESTING_PERMISSION 
          ? '🔐 Demande d\'autorisation...' 
          : '🛰️ Capture GPS en cours...'}
      </Text>
      <Text style={styles.loadingSubtext}>
        Tentative {gpsAttempts + 1}/3
      </Text>
    </View>
  );

  const renderLocationError = () => (
    <View style={styles.locationError}>
      <Text style={styles.errorText}>❌ {gpsError}</Text>
      <View style={styles.errorActions}>
        <Button
          title="Réessayer GPS"
          onPress={startAutomaticGPSCapture}
          style={styles.retryButton}
          variant="outlined"
          size="small"
        />
        <Button
          title="Saisie manuelle"
          onPress={startManualInput}
          style={styles.manualButton}
          variant="text"
          size="small"
        />
      </View>
    </View>
  );

  const renderManualInput = () => (
    <View style={styles.manualInput}>
      <Text style={styles.manualTitle}>Saisie manuelle des coordonnées</Text>
      
      <Input
        label="Latitude"
        placeholder="Ex: 3.8480 (Yaoundé)"
        keyboardType="numeric"
        onChangeText={(value) => setValue('manualLatitude', value)}
        style={styles.coordinateInput}
      />
      
      <Input
        label="Longitude"
        placeholder="Ex: 11.5021 (Yaoundé)"
        keyboardType="numeric"
        onChangeText={(value) => setValue('manualLongitude', value)}
        style={styles.coordinateInput}
      />
      
      <View style={styles.manualActions}>
        <Button
          title="Valider"
          onPress={() => {
            const lat = control._formValues.manualLatitude;
            const lng = control._formValues.manualLongitude;
            handleManualCoordinates(lat, lng);
          }}
          style={styles.validateButton}
        />
        <Button
          title="Retour GPS"
          onPress={startAutomaticGPSCapture}
          variant="outlined"
          style={styles.backToGpsButton}
        />
      </View>
    </View>
  );

  const renderLocationStart = () => (
    <View style={styles.locationStart}>
      <Text style={styles.startText}>
        📍 La localisation de ce client est requise
      </Text>
      <Button
        title="Capturer ma position"
        onPress={startAutomaticGPSCapture}
        style={styles.startButton}
        icon="location"
      />
    </View>
  );

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Modifier un client" : "Ajouter un client"}
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            
            {/* Informations de base */}
            <Text style={styles.sectionTitle}>Informations d'identification</Text>
            
            <Controller
              control={control}
              name="nom"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom"
                  placeholder="Entrez le nom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nom?.message}
                  style={styles.inputSpacing}
                  editable={!isEditMode} // Non modifiable en mode édition
                />
              )}
            />
            
            <Controller
              control={control}
              name="prenom"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Prénom"
                  placeholder="Entrez le prénom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.prenom?.message}
                  style={styles.inputSpacing}
                  editable={!isEditMode} // Non modifiable en mode édition
                />
              )}
            />
            
            <Controller
              control={control}
              name="numeroCni"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Numéro CNI"
                  placeholder="Entrez le numéro de CNI"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.numeroCni?.message}
                  style={styles.inputSpacing}
                />
              )}
            />
            
            {/* Coordonnées */}
            <Text style={styles.sectionTitle}>Coordonnées</Text>
            
            <Controller
              control={control}
              name="telephone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Téléphone"
                  placeholder="+237 6XX XX XX XX"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  error={errors.telephone?.message}
                  style={styles.inputSpacing}
                />
              )}
            />
            
            <Controller
              control={control}
              name="ville"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Ville"
                  placeholder="Entrez la ville"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.ville?.message}
                  style={styles.inputSpacing}
                />
              )}
            />
            
            <Controller
              control={control}
              name="quartier"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Quartier"
                  placeholder="Entrez le quartier"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.quartier?.message}
                  style={styles.inputSpacing}
                />
              )}
            />
            
            {/* 🔥 SECTION GÉOLOCALISATION OBLIGATOIRE */}
            {renderLocationSection()}
            
            {/* Boutons d'action */}
            <Button
              title={isEditMode ? "Mettre à jour" : "Créer le client"}
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
              fullWidth
              disabled={!locationData} // Désactivé tant qu'il n'y a pas de localisation
            />
            
            <Button
              title="Annuler"
              onPress={() => navigation.goBack()}
              variant="outlined"
              style={styles.cancelButton}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  inputSpacing: {
    marginBottom: 16,
  },
  
  // Styles géolocalisation
  geoCard: {
    marginVertical: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.lightGray,
  },
  geoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  geoTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  geoStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  
  locationSuccess: {
    backgroundColor: theme.colors.successLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  locationLoading: {
    backgroundColor: theme.colors.warningLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    alignItems: 'center',
  },
  locationError: {
    backgroundColor: theme.colors.errorLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  locationStart: {
    padding: 12,
    alignItems: 'center',
  },
  manualInput: {
    padding: 12,
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
    marginBottom: 8,
  },
  
  loadingText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginBottom: 8,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  startText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  manualTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
  coordinateInput: {
    marginBottom: 8,
  },
  manualActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  
  // Boutons
  recaptureButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  retryButton: {
    flex: 1,
    marginRight: 8,
  },
  manualButton: {
    flex: 1,
    marginLeft: 8,
  },
  validateButton: {
    flex: 1,
    marginRight: 8,
  },
  backToGpsButton: {
    flex: 1,
    marginLeft: 8,
  },
  startButton: {
    paddingHorizontal: 24,
  },
  
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 24,
  }
});

export default ClientAddEditScreen;