// src/screens/Collecteur/ClientAddEditScreen.js - VERSION CORRIGÉE
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
  TextInput,
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

// Services et hooks
import theme from '../../theme';
import clientService from '../../services/clientService';
import geolocationService from '../../services/geolocationService';
import authService from '../../services/authService';

// Navigation
import { useCollecteurNavigation } from '../../navigation/CollecteurStack';

// ============================================
// SCHÉMAS DE VALIDATION
// ============================================

const createClientSchema = yup.object().shape({
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

const editClientSchema = yup.object().shape({
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

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const ClientAddEditScreen = ({ navigation, route }) => {
  const { mode, client } = route.params || { mode: 'add' };
  const isEditMode = mode === 'edit';
  const { goToClientList, goToClientDetail } = useCollecteurNavigation(navigation);
  
  // États
  const [isLoading, setIsLoading] = useState(false);
  const [commissionType, setCommissionType] = useState('PERCENTAGE');
  const [fixedAmount, setFixedAmount] = useState('1000');
  const [percentageValue, setPercentageValue] = useState('5');
  const [showCommissionSettings, setShowCommissionSettings] = useState(false);
  
  // 🔥 ÉTATS GÉOLOCALISATION SIMPLIFIÉS
  const [locationData, setLocationData] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle', 'capturing', 'captured', 'failed', 'skipped'
  const [geoError, setGeoError] = useState(null);

  // Configuration du formulaire
  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(isEditMode ? editClientSchema : createClientSchema),
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
  // EFFETS
  // ============================================
  
  useEffect(() => {
    if (isEditMode && client) {
      loadExistingLocation();
      loadCommissionSettings();
    }
  }, [isEditMode, client]);

  // ============================================
  // FONCTIONS DE GÉOLOCALISATION SIMPLIFIÉES
  // ============================================

  const loadExistingLocation = () => {
    if (client?.latitude && client?.longitude) {
      setLocationData({
        latitude: client.latitude,
        longitude: client.longitude,
        adresseComplete: client.adresseComplete,
        coordonneesSaisieManuelle: client.coordonneesSaisieManuelle,
      });
      setLocationStatus('captured');
    }
  };

	const captureLocation = async () => {
	  setLocationStatus('capturing');
	  setGeoError(null);

	  try {
		console.log('📍 Tentative de capture GPS réelle...');
		const position = await geolocationService.getRealPosition();

		if (position.mocked) {
		  Alert.alert(
			'GPS simulé détecté',
			'Votre appareil utilise une position simulée. Veuillez désactiver les applications de mock GPS.',
			[
			  { text: 'OK', onPress: () => setLocationStatus('failed') },
			  { text: 'Paramètres', onPress: () => Linking.openSettings() }
			]
		  );
		  return;
		}

		await saveLocationData(position);
		
	  } catch (error) {
		console.error('❌ Erreur capture GPS:', error);
		
		// Solution temporaire pour développement
		if (__DEV__) {
		  Alert.alert(
			'Mode développement actif',
			'En développement, utilisez-vous un émulateur ?',
			[
			  {
				text: 'Utiliser Yaoundé',
				onPress: () => saveLocationData({
				  latitude: 3.8480,
				  longitude: 11.5021,
				  accuracy: 50,
				  mocked: false
				})
			  },
			  {
				text: 'Saisie manuelle',
				onPress: openManualLocationDialog
			  }
			]
		  );
		} else {
		  setGeoError(error.message);
		  setLocationStatus('failed');
		}
	  }
	};

  const saveLocationData = async (position) => {
    try {
      // Géocodage inverse optionnel
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
        accuracy: position.accuracy
      };

      setLocationData(locationData);
      setLocationStatus('captured');
      
      Alert.alert(
        'Position capturée !',
        `Coordonnées obtenues avec une précision de ${Math.round(position.accuracy || 0)}m`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ Erreur sauvegarde position:', error);
      setGeoError(error.message);
      setLocationStatus('failed');
    }
  };

  const openManualLocationDialog = () => {
    // Pour l'instant, coordonnées par défaut pour Yaoundé
    Alert.prompt(
      'Latitude',
      'Entrez la latitude (ex: 3.848033)',
      (latitude) => {
        if (!latitude) return;
        
        Alert.prompt(
          'Longitude',
          'Entrez la longitude (ex: 11.502075)',
          (longitude) => {
            if (!longitude) return;
            
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            
            const validation = geolocationService.validateCoordinates(lat, lng);
            if (!validation.valid) {
              Alert.alert('Erreur', validation.error);
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
            setLocationStatus('captured');
          }
        );
      }
    );
  };

  const clearLocation = () => {
    Alert.alert(
      'Supprimer la localisation',
      'Voulez-vous supprimer la localisation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', onPress: () => {
          setLocationData(null);
          setLocationStatus('idle');
          setGeoError(null);
        }}
      ]
    );
  };

  // ============================================
  // SOUMISSION SIMPLIFIÉE
  // ============================================

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      console.log('💾 Soumission formulaire:', { mode: mode, data, locationData });
      
      // 🔥 INTÉGRATION DIRECTE DE LA GÉOLOCALISATION
      const clientData = {
        ...data,
        // Intégrer directement les coordonnées dans l'objet client
        latitude: locationData?.latitude || null,
        longitude: locationData?.longitude || null,
        coordonneesSaisieManuelle: locationData?.coordonneesSaisieManuelle || false,
        adresseComplete: locationData?.adresseComplete || null,
        // Commission
        commissionParams: showCommissionSettings ? {
          type: commissionType,
          value: commissionType === 'FIXED' 
            ? parseFloat(fixedAmount) 
            : parseFloat(percentageValue),
        } : undefined
      };
      
      if (isEditMode && client) {
        clientData.id = client.id;
        clientData.nom = client.nom; // Non modifiable en mode édition
        clientData.prenom = client.prenom; // Non modifiable en mode édition
      }
      
      console.log('📤 Données finales à envoyer:', clientData);
      
      // 🔥 SAUVEGARDE UNIFIÉE
      let result;
      if (isEditMode) {
        result = await clientService.updateClient(client.id, clientData);
      } else {
        result = await clientService.createClient(clientData);
      }
      
      if (!result.success) {
        throw new Error(result.error || "Une erreur est survenue lors de l'enregistrement");
      }
      
      const savedClient = result.data;
      console.log('✅ Client sauvegardé:', savedClient);
      
      // Messages de succès et navigation
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
      : '\n⚠️ Localisation non renseignée';
    
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
  // AUTRES FONCTIONS (INCHANGÉES)
  // ============================================

  const loadCommissionSettings = () => {
    if (client?.commissionParams) {
      setCommissionType(client.commissionParams.type || 'PERCENTAGE');
      if (client.commissionParams.type === 'FIXED') {
        setFixedAmount(client.commissionParams.value?.toString() || '1000');
      } else if (client.commissionParams.type === 'PERCENTAGE') {
        setPercentageValue(client.commissionParams.value?.toString() || '5');
      }
    }
  };

  const handleSelectType = (type) => {
    setCommissionType(type);
  };

  const handleToggleCommissionSettings = () => {
    setShowCommissionSettings(!showCommissionSettings);
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0";
    return numValue.toLocaleString('fr-FR');
  };

  // ============================================
  // RENDU GÉOLOCALISATION SIMPLIFIÉ
  // ============================================
  
  const renderLocationSection = () => (
    <Card style={styles.geoCard}>
      <View style={styles.geoHeader}>
        <Ionicons 
          name={locationData ? "location" : "location-outline"} 
          size={20} 
          color={locationData ? theme.colors.success : theme.colors.primary} 
        />
        <Text style={styles.geoTitle}>Localisation</Text>
        {locationData && (
          <TouchableOpacity onPress={clearLocation} style={styles.geoActionButton}>
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>
      
      {locationStatus === 'captured' && locationData ? (
        <View style={styles.locationCaptured}>
          <Text style={styles.coordinatesText}>
            📍 {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
          </Text>
          <Text style={styles.sourceText}>
            📡 {locationData.coordonneesSaisieManuelle ? 'Saisie manuelle' : 'GPS'}
          </Text>
          {locationData.accuracy && (
            <Text style={styles.accuracyText}>
              🎯 Précision: ±{Math.round(locationData.accuracy)}m
            </Text>
          )}
          {locationData.adresseComplete && (
            <Text style={styles.addressText}>
              🏠 {locationData.adresseComplete}
            </Text>
          )}
        </View>
      ) : locationStatus === 'capturing' ? (
        <View style={styles.locationCapturing}>
          <Text style={styles.geoSubtitle}>🛰️ Capture GPS en cours...</Text>
        </View>
      ) : locationStatus === 'failed' ? (
        <View style={styles.locationFailed}>
          <Text style={styles.errorText}>❌ {geoError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={captureLocation}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : locationStatus === 'skipped' ? (
        <View style={styles.locationSkipped}>
          <Text style={styles.geoSubtitle}>⏭️ Localisation ignorée</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setLocationStatus('idle')}>
            <Text style={styles.retryButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.locationPending}>
          <Text style={styles.geoSubtitle}>
            Enregistrez la position de ce client pour faciliter vos futures visites
          </Text>
          
          <View style={styles.geoActions}>
            <Button
              title="Capturer GPS"
              onPress={captureLocation}
              style={styles.quickGpsButton}
              icon="location"
              variant="outlined"
            />
            
            <Button
              title="Saisie manuelle"
              onPress={openManualLocationDialog}
              style={styles.manualGeoButton}
              icon="create-outline"
              variant="text"
            />
            
            <Button
              title="Ignorer"
              onPress={() => setLocationStatus('skipped')}
              style={styles.skipGeoButton}
              icon="arrow-forward-outline"
              variant="text"
            />
          </View>
        </View>
      )}
    </Card>
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
            
            {/* Section identification */}
            <Text style={styles.sectionTitle}>Informations d'identification</Text>
            
            {isEditMode ? (
              <View style={styles.readOnlyFieldsContainer}>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Nom</Text>
                  <Text style={styles.readOnlyValue}>{client?.nom}</Text>
                </View>
                
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Prénom</Text>
                  <Text style={styles.readOnlyValue}>{client?.prenom}</Text>
                </View>
              </View>
            ) : (
              <>
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
                    />
                  )}
                />
              </>
            )}
            
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
            
            {/* Section coordonnées */}
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
            
            {/* SECTION GÉOLOCALISATION SIMPLIFIÉE */}
            {renderLocationSection()}
            
            {/* Section paramètres de commission (code existant) */}
            <Card style={styles.commissionCard}>
              <View style={styles.commissionHeader}>
                <Text style={styles.sectionTitle}>Paramètres de commission</Text>
                <TouchableOpacity 
                  style={styles.toggleButton}
                  onPress={handleToggleCommissionSettings}
                >
                  <Text style={styles.toggleButtonText}>
                    {showCommissionSettings ? "Masquer" : "Configurer"}
                  </Text>
                  <Ionicons 
                    name={showCommissionSettings ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
              
              {!showCommissionSettings ? (
                <Text style={styles.commissionDefault}>
                  Ce client utilisera les paramètres de commission par défaut du collecteur.
                </Text>
              ) : (
                <View style={styles.commissionSettings}>
                  <Text style={styles.commissionSubtitle}>Type de commission</Text>
                  
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        commissionType === 'FIXED' && styles.selectedType
                      ]}
                      onPress={() => handleSelectType('FIXED')}
                    >
                      <Ionicons
                        name="cash-outline"
                        size={24}
                        color={commissionType === 'FIXED' ? theme.colors.white : theme.colors.primary}
                      />
                      <Text style={[
                        styles.typeText,
                        commissionType === 'FIXED' && styles.selectedTypeText
                      ]}>
                        Montant fixe
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        commissionType === 'PERCENTAGE' && styles.selectedType
                      ]}
                      onPress={() => handleSelectType('PERCENTAGE')}
                    >
                      <Ionicons
                        name="trending-up-outline"
                        size={24}
                        color={commissionType === 'PERCENTAGE' ? theme.colors.white : theme.colors.primary}
                      />
                      <Text style={[
                        styles.typeText,
                        commissionType === 'PERCENTAGE' && styles.selectedTypeText
                      ]}>
                        Pourcentage
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {commissionType === 'FIXED' && (
                    <View style={styles.configSection}>
                      <Text style={styles.configTitle}>Montant fixe (FCFA)</Text>
                      <View style={styles.fixedInputContainer}>
                        <TextInput
                          style={styles.fixedInput}
                          value={fixedAmount}
                          onChangeText={setFixedAmount}
                          keyboardType="numeric"
                          placeholder="Ex: 1000"
                        />
                        <Text style={styles.currencyText}>FCFA</Text>
                      </View>
                      
                      <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>
                          Un montant fixe de <Text style={styles.highlightText}>{formatCurrency(fixedAmount)} FCFA</Text> sera prélevé comme commission.
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {commissionType === 'PERCENTAGE' && (
                    <View style={styles.configSection}>
                      <Text style={styles.configTitle}>Pourcentage</Text>
                      <View style={styles.fixedInputContainer}>
                        <TextInput
                          style={styles.fixedInput}
                          value={percentageValue}
                          onChangeText={setPercentageValue}
                          keyboardType="numeric"
                          placeholder="Ex: 5"
                        />
                        <Text style={styles.currencyText}>%</Text>
                      </View>
                      
                      <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>
                          Un pourcentage de <Text style={styles.highlightText}>{percentageValue}%</Text> sera appliqué au montant collecté.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Card>
            
            {/* Boutons d'action */}
            <Button
              title={isEditMode ? "Mettre à jour" : "Ajouter le client"}
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
              fullWidth
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
// STYLES (PARTIELS - AJOUTER LES MANQUANTS)
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
  readOnlyFieldsContainer: {
    marginBottom: 16,
  },
  readOnlyField: {
    marginBottom: 12,
  },
  readOnlyLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
    padding: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
  },
  
  // Styles géolocalisation
  geoCard: {
    marginVertical: 16,
    backgroundColor: theme.colors.lightGray,
  },
  geoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  geoTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  geoActionButton: {
    padding: 8,
  },
  geoSubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 12,
  },
  locationCaptured: {
    backgroundColor: theme.colors.successLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  locationCapturing: {
    backgroundColor: theme.colors.warningLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    alignItems: 'center',
  },
  locationFailed: {
    backgroundColor: theme.colors.errorLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  locationSkipped: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.textLight,
    alignItems: 'center',
  },
  locationPending: {
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
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginBottom: 8,
  },
  geoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  quickGpsButton: {
    flex: 1,
    marginRight: 8,
  },
  manualGeoButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  skipGeoButton: {
    flex: 1,
    marginLeft: 8,
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Styles commission (à compléter selon vos besoins)
  commissionCard: {
    marginVertical: 16,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleButtonText: {
    color: theme.colors.primary,
    marginRight: 4,
    fontWeight: '500',
  },
  commissionDefault: {
    color: theme.colors.textLight,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 24,
  }
});

export default ClientAddEditScreen;