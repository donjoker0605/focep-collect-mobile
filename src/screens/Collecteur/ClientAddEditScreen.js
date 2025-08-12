// ClientAddEditScreen.js
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
  Switch,
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
import { adminCollecteurService } from '../../services';
import geolocationService from '../../services/geolocationService';
import authService from '../../services/authService';

// Navigation
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';

// SCHÉMAS DE VALIDATION
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

// Types de commission
const COMMISSION_TYPES = [
  { label: 'Hériter de l\'agence', value: 'INHERIT' },
  { label: 'Montant fixe', value: 'FIXED' },
  { label: 'Pourcentage', value: 'PERCENTAGE' },
  { label: 'Par paliers', value: 'TIER' },
];

// COMPOSANT PRINCIPAL
const ClientAddEditScreen = ({ navigation, route }) => {
  const { mode, client, adminEdit, adminCreate } = route.params || { mode: 'add' };
  const isEditMode = mode === 'edit';
  const isAdminMode = adminEdit || adminCreate;
  const { user } = useAuth();
  
  // 🚨 RÈGLES DE PERMISSIONS STRICTES
  const isCollecteur = user?.role === 'ROLE_COLLECTEUR';
  const canEdit = !isCollecteur || !isEditMode; // Collecteurs peuvent créer, mais pas modifier
  const canEditPersonalInfo = false; // Nom/prénom JAMAIS éditables
  
  // États
  const [isLoading, setIsLoading] = useState(false);
  const [gpsState, setGpsState] = useState(GPS_STATES.IDLE);
  const [locationData, setLocationData] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsAttempts, setGpsAttempts] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

  // États pour commission et activation - Les collecteurs créent des clients inactifs par défaut
  const [isClientActive, setIsClientActive] = useState(isCollecteur ? false : true);
  const [commissionConfig, setCommissionConfig] = useState({
    type: 'INHERIT',
    valeur: 0,
    paliersCommission: []
  });

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

  // EFFETS D'INITIALISATION
  useEffect(() => {
    loadUserInfo();
    if (isEditMode && client) {
      loadExistingLocation();
      setIsClientActive(client.valide || true);
      loadExistingCommission();
      // 🔥 NOUVEAU : Recharger les données complètes du client avec commission
      loadCompleteClientData();
    } else {
      startAutomaticGPSCapture();
    }
  }, []);

  // 🔥 NOUVELLE MÉTHODE : Charger les données complètes du client avec commission
  const loadCompleteClientData = async () => {
    if (!client?.id) return;
    
    try {
      console.log('🔄 Rechargement données complètes client:', client.id);
      const response = await clientService.getClientWithTransactions(client.id);
      
      if (response.success && response.data) {
        console.log('✅ Données client complètes rechargées:', response.data);
        
        // Recharger les paramètres de commission avec les nouvelles données
        if (response.data.commissionParameter) {
          const newConfig = {
            type: response.data.commissionParameter.type,
            valeur: response.data.commissionParameter.valeur || 0,
            paliersCommission: response.data.commissionParameter.paliersCommission || []
          };
          console.log('💰 Configuration commission rechargée:', newConfig);
          setCommissionConfig(newConfig);
        }
      }
    } catch (error) {
      console.error('❌ Erreur rechargement données client:', error);
    }
  };

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

  const loadExistingCommission = () => {
    console.log('🔍 loadExistingCommission appelée avec client:', {
      hasClient: !!client,
      hasCommissionParameter: !!client?.commissionParameter,
      commissionParameter: client?.commissionParameter,
      clientKeys: client ? Object.keys(client) : 'N/A'
    });
    
    if (client?.commissionParameter) {
      const newConfig = {
        type: client.commissionParameter.type,
        valeur: client.commissionParameter.valeur || 0,
        paliersCommission: client.commissionParameter.paliersCommission || []
      };
      console.log('✅ Configuration commission chargée:', newConfig);
      setCommissionConfig(newConfig);
    } else {
      console.log('⚠️ Aucun paramètre de commission trouvé dans les données client');
    }
  };

  // LOGIQUE GPS INTELLIGENTE
  const startAutomaticGPSCapture = async () => {
    console.log('🚀 Démarrage automatique de la capture GPS');
    setGpsState(GPS_STATES.REQUESTING_PERMISSION);
    setGpsError(null);

    try {
      const hasPermission = await geolocationService.requestPermissions();
      if (!hasPermission) {
        handleGPSPermissionDenied();
        return;
      }
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

      if (position.mocked) {
        handleMockedLocation(position);
        return;
      }

      if (isEmulatorCoordinates(position.latitude, position.longitude)) {
        handleEmulatorCoordinates(position);
        return;
      }

      if (!isInCameroonBounds(position.latitude, position.longitude)) {
        handleOutOfBoundsCoordinates(position);
        return;
      }

      await processValidGPSLocation(position);

    } catch (error) {
      console.error(`❌ Erreur GPS tentative #${gpsAttempts + 1}:`, error);
      
      if (gpsAttempts < 2) {
        setTimeout(() => attemptGPSCapture(), 2000);
      } else {
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
      console.log('🎯 Position GPS capturée:', position);
      
      let address = '';
      try {
        const addressInfo = await geolocationService.reverseGeocode(
          position.latitude,
          position.longitude
        );
        console.log('🏠 Adresse géocodée:', addressInfo);
        address = addressInfo?.formattedAddress || '';
      } catch (geocodeError) {
        console.warn('⚠️ Géocodage inverse échoué:', geocodeError);
        // Continuer quand même avec une adresse générique
        address = `Coordonnées: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
      }

      const locationData = {
        latitude: position.latitude,
        longitude: position.longitude,
        adresseComplete: address,
        coordonneesSaisieManuelle: false,
        accuracy: position.accuracy,
        isDefault: position.isDefault || false
      };

      console.log('✅ LocationData créé et sauvegardé:', locationData);
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
  
  // MÉTHODES COMMISSION
  const updateCommissionType = (type) => {
    setCommissionConfig(prev => ({
      ...prev,
      type,
      valeur: type === 'INHERIT' ? 0 : prev.valeur,
      paliersCommission: type === 'TIER' ? (prev.paliersCommission.length > 0 ? prev.paliersCommission : [
        { montantMin: 0, montantMax: 1000, taux: 5 },
        { montantMin: 1001, montantMax: 5000, taux: 4 },
        { montantMin: 5001, montantMax: null, taux: 3 }
      ]) : []
    }));
  };

  const updateCommissionValue = (valeur) => {
    setCommissionConfig(prev => ({
      ...prev,
      valeur: parseFloat(valeur) || 0
    }));
  };

  const addCommissionTier = () => {
    const lastTier = commissionConfig.paliersCommission[commissionConfig.paliersCommission.length - 1];
    const newMin = lastTier?.montantMax ? lastTier.montantMax + 1 : 5001;
    
    setCommissionConfig(prev => ({
      ...prev,
      paliersCommission: [...prev.paliersCommission, { montantMin: newMin, montantMax: null, taux: 3 }]
    }));
  };

  const updateCommissionTier = (index, field, value) => {
    setCommissionConfig(prev => ({
      ...prev,
      paliersCommission: prev.paliersCommission.map((tier, i) => 
        i === index 
          ? { ...tier, [field]: field === 'taux' ? parseFloat(value) || 0 : (value === '' ? null : parseInt(value)) }
          : tier
      )
    }));
  };

  const removeCommissionTier = (index) => {
    if (commissionConfig.paliersCommission.length <= 1) {
      Alert.alert("Erreur", "Vous devez avoir au moins un palier");
      return;
    }
    
    setCommissionConfig(prev => ({
      ...prev,
      paliersCommission: prev.paliersCommission.filter((_, i) => i !== index)
    }));
  };

  // SOUMISSION AVEC IDS AUTOMATIQUES
  const onSubmit = async (data) => {
    console.log('🎯 onSubmit déclenché avec:', { data, locationData, isLoading });
    
    if (!locationData) {
      console.log('❌ Pas de locationData - blocage soumission');
      Alert.alert(
        'Localisation requise',
        'Vous devez fournir une localisation pour créer ce client.',
        [{ text: 'OK', onPress: () => startAutomaticGPSCapture() }]
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log('💾 Soumission formulaire avec commission:', { 
        data, 
        locationData, 
        userInfo, 
        commissionConfig,
        isClientActive 
      });

      const clientData = {
        ...data,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        coordonneesSaisieManuelle: locationData.coordonneesSaisieManuelle,
        adresseComplete: locationData.adresseComplete,
        valide: isClientActive,
        collecteurId: userInfo?.id,
        agenceId: userInfo?.agenceId,

        commissionParameter: commissionConfig.type !== 'INHERIT' ? {
          type: commissionConfig.type,
          valeur: commissionConfig.valeur,
          paliersCommission: commissionConfig.type === 'TIER' ? commissionConfig.paliersCommission : null,
          active: true,
          validFrom: new Date().toISOString().split('T')[0]
        } : null
      };

      console.log('📤 Données finales à envoyer:', clientData);

      let result;
      if (isEditMode) {
        const updateData = {
          telephone: data.telephone,
          numeroCni: data.numeroCni,
          ville: data.ville,
          quartier: data.quartier,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          coordonneesSaisieManuelle: locationData.coordonneesSaisieManuelle,
          adresseComplete: locationData.adresseComplete,
          valide: isClientActive,
          commissionParameter: clientData.commissionParameter
        };

        console.log('💰 COMMISSION DEBUG:', {
          commissionConfig,
          commissionParameter: clientData.commissionParameter,
          includeInUpdate: !!clientData.commissionParameter
        });
        
        // 🔥 Détecter si c'est un admin en utilisant le hook useAuth
        const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
        
        console.log('🔍 Utilisateur actuel:', { role: user?.role, isAdmin, userId: user?.id, email: user?.email });
        
        if (isAdmin) {
          console.log('🔥 Admin détecté - utilisation du service client avec autorisation admin');
          result = await clientService.updateClient(client.id, updateData);
        } else {
          console.log('👤 Collecteur - utilisation du service client standard');
          result = await clientService.updateClient(client.id, updateData);
        }
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
    const statusMessage = savedClient.valide ? 'Client actif' : 'Client inactif';
    const commissionMessage = commissionConfig.type !== 'INHERIT' 
      ? `\n💰 Commission ${commissionConfig.type === 'FIXED' ? 'fixe' : commissionConfig.type === 'PERCENTAGE' ? 'en pourcentage' : 'par paliers'} configurée` 
      : '\n💰 Commission héritée de l\'agence';
    const locationMessage = locationData ? '\n📍 Localisation enregistrée' : '';

    if (isEditMode) {
      Alert.alert(
        "Succès",
        `${savedClient.prenom} ${savedClient.nom} mis à jour avec succès.\n${statusMessage}${commissionMessage}${locationMessage}`,
        [{ text: "OK", onPress: () => goToClientDetail(savedClient) }]
      );
    } else {
      Alert.alert(
        "Succès",
        `Client ${savedClient.prenom} ${savedClient.nom} créé avec succès.\n${statusMessage}${commissionMessage}${locationMessage}`,
        [
          { text: "Voir les clients", onPress: () => goToClientList() },
          { text: "Voir détails", onPress: () => goToClientDetail(savedClient) }
        ]
      );
    }
  };

  // UTILITAIRES
  const isEmulatorCoordinates = (lat, lng) => {
    return Math.abs(lat - 37.4219983) < 0.001 && Math.abs(lng - (-122.084)) < 0.001;
  };

  const isInCameroonBounds = (lat, lng) => {
    return lat >= 1.0 && lat <= 13.5 && lng >= 8.0 && lng <= 16.5;
  };

  const isValidCoordinates = (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  // RENDU GÉOLOCALISATION
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
  
  // RENDU COMMISSION
  const renderCommissionSection = () => {
    return (
      <Card style={styles.commissionCard}>
        <View style={styles.commissionHeader}>
          <Ionicons name="wallet" size={20} color={theme.colors.primary} />
          <Text style={styles.commissionTitle}>Paramètres de Commission</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Type de commission</Text>
          <View style={styles.commissionTypeContainer}>
            {COMMISSION_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.commissionTypeButton,
                  commissionConfig.type === type.value && styles.commissionTypeButtonActive
                ]}
                onPress={() => updateCommissionType(type.value)}
              >
                <Text style={[
                  styles.commissionTypeText,
                  commissionConfig.type === type.value && styles.commissionTypeTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {commissionConfig.type === 'FIXED' && (
          <Input
            label="Montant fixe (FCFA)"
            value={commissionConfig.valeur?.toString() || '0'}
            onChangeText={updateCommissionValue}
            keyboardType="numeric"
            placeholder="Ex: 500"
            style={styles.inputSpacing}
          />
        )}

        {commissionConfig.type === 'PERCENTAGE' && (
          <Input
            label="Pourcentage (%)"
            value={commissionConfig.valeur?.toString() || '0'}
            onChangeText={updateCommissionValue}
            keyboardType="numeric"
            placeholder="Ex: 2.5"
            style={styles.inputSpacing}
          />
        )}

        {commissionConfig.type === 'TIER' && (
          <View style={styles.tiersContainer}>
            <Text style={styles.tiersTitle}>Paliers de Commission</Text>
            {commissionConfig.paliersCommission.map((tier, index) => (
              <Card key={index} style={styles.tierCard}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierLabel}>Palier {index + 1}</Text>
                  {commissionConfig.paliersCommission.length > 1 && (
                    <TouchableOpacity onPress={() => removeCommissionTier(index)}>
                      <Ionicons name="trash" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.tierRow}>
                  <View style={styles.tierFieldHalf}>
                    <Input
                      label="Min (FCFA)"
                      value={tier.montantMin?.toString() || ''}
                      onChangeText={(text) => updateCommissionTier(index, 'montantMin', text)}
                      keyboardType="numeric"
                      editable={index === 0 ? false : true}
                    />
                  </View>
                  
                  <View style={styles.tierFieldHalf}>
                    <Input
                      label="Max (FCFA)"
                      value={tier.montantMax?.toString() || ''}
                      onChangeText={(text) => updateCommissionTier(index, 'montantMax', text)}
                      keyboardType="numeric"
                      placeholder="Illimité"
                    />
                  </View>
                  
                  <View style={styles.tierFieldHalf}>
                    <Input
                      label="Taux (%)"
                      value={tier.taux?.toString() || ''}
                      onChangeText={(text) => updateCommissionTier(index, 'taux', text)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </Card>
            ))}
            
            <TouchableOpacity
              style={styles.addTierButton}
              onPress={addCommissionTier}
            >
              <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.addTierText}>Ajouter un palier</Text>
            </TouchableOpacity>
          </View>
        )}

        {commissionConfig.type === 'INHERIT' && (
          <View style={styles.inheritInfo}>
            <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            <Text style={styles.inheritText}>
              Le client héritera des paramètres de commission configurés au niveau de l'agence.
            </Text>
          </View>
        )}
      </Card>
    );
  };

  // RENDU ACTIVATION CLIENT
  const renderActivationSection = () => {
    return (
      <Card style={styles.activationCard}>
        <View style={styles.activationHeader}>
          <Ionicons 
            name={isClientActive ? "checkmark-circle" : "pause-circle"} 
            size={20} 
            color={isClientActive ? theme.colors.success : theme.colors.warning} 
          />
          <Text style={styles.activationTitle}>Statut du Client</Text>
        </View>
        
        <View style={styles.activationRow}>
          <View style={styles.activationInfo}>
            <Text style={styles.activationLabel}>
              {isClientActive ? "Client actif" : "Client inactif"}
            </Text>
            <Text style={styles.activationDescription}>
              {isClientActive 
                ? "Le client pourra effectuer des opérations immédiatement"
                : "Le client devra être activé avant de pouvoir effectuer des opérations"
              }
            </Text>
          </View>
          
          <Switch
            value={isClientActive}
            onValueChange={isCollecteur ? undefined : setIsClientActive}
            disabled={isCollecteur}
            trackColor={{ false: theme.colors.lightGray, true: theme.colors.successLight }}
            thumbColor={isClientActive ? theme.colors.success : theme.colors.gray}
          />
        </View>
      </Card>
    );
  };

  // 🚨 VÉRIFICATION DE PERMISSIONS STRICTES
  if (isCollecteur && isEditMode) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Accès refusé"
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.errorContainer, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="lock-closed" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { fontSize: 18, marginTop: 16, textAlign: 'center' }]}>
            Accès interdit
          </Text>
          <Text style={[styles.errorSubText, { marginTop: 8, textAlign: 'center', color: theme.colors.textSecondary }]}>
            Seuls les administrateurs peuvent modifier les clients
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // RENDU PRINCIPAL
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
                  editable={canEditPersonalInfo}
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
                  editable={canEditPersonalInfo}
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
                  editable={canEdit}
                />
              )}
            />
            
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
                  editable={canEdit}
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
                  editable={canEdit}
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
                  editable={canEdit}
                />
              )}
            />
            
            {renderActivationSection()}
            
            {renderCommissionSection()}
            
            {renderLocationSection()}
            
            <Button
              title={isEditMode ? "Mettre à jour" : "Créer le client"}
              onPress={() => {
                console.log('🖱️ Bouton cliqué !', { isLoading, canEdit, errors });
                if (!canEdit) {
                  console.log('❌ canEdit = false - édition bloquée');
                  return;
                }
                
                // Debug React Hook Form
                console.log('📝 État du formulaire:', {
                  errors,
                  hasErrors: Object.keys(errors).length > 0,
                  locationData: !!locationData,
                  userInfo: !!userInfo
                });
                
                handleSubmit(
                  (data) => {
                    console.log('✅ Validation réussie, appel onSubmit:', data);
                    onSubmit(data);
                  },
                  (validationErrors) => {
                    console.log('❌ Erreurs de validation:', validationErrors);
                  }
                )();
              }}
              loading={isLoading}
              style={styles.submitButton}
              fullWidth
              disabled={!locationData}
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

// STYLES
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
  
  // Styles Commission
  commissionCard: {
    marginVertical: 16,
    backgroundColor: theme.colors.white,
  },
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commissionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  commissionTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commissionTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    backgroundColor: theme.colors.white,
  },
  commissionTypeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  commissionTypeText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  commissionTypeTextActive: {
    color: theme.colors.white,
  },
  
  // Styles Tiers
  tiersContainer: {
    marginTop: 16,
  },
  tiersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  tierCard: {
    marginBottom: 12,
    backgroundColor: theme.colors.background,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierFieldHalf: {
    flex: 1,
  },
  addTierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addTierText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  // Styles Héritage
  inheritInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: theme.colors.infoLight,
    borderRadius: 8,
    marginTop: 8,
  },
  inheritText: {
    marginLeft: 8,
    fontSize: 12,
    color: theme.colors.info,
    flex: 1,
  },
  
  // Styles Activation
  activationCard: {
    marginVertical: 16,
    backgroundColor: theme.colors.white,
  },
  activationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activationTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  activationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activationInfo: {
    flex: 1,
    marginRight: 16,
  },
  activationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  activationDescription: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  
  // Styles Géolocalisation
  geoCard: {
    marginVertical: 16,
    backgroundColor: theme.colors.white,
  },
  geoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  locationSuccess: {
    alignItems: 'flex-start',
  },
  coordinatesText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 12,
  },
  recaptureButton: {
    alignSelf: 'flex-start',
  },
  locationLoading: {
    alignItems: 'center',
    paddingVertical: 20,
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
  locationError: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
  },
  manualButton: {
    flex: 1,
  },
  manualInput: {
    paddingVertical: 16,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  coordinateInput: {
    marginBottom: 12,
  },
  manualActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  validateButton: {
    flex: 1,
  },
  backToGpsButton: {
    flex: 1,
  },
  locationStart: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  startText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  startButton: {
    alignSelf: 'center',
  },
  
  // Boutons
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 24,
  }
});

export default ClientAddEditScreen;