// src/screens/Collecteur/ClientAddEditScreen.js - AVEC GÉOLOCALISATION INTÉGRÉE
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
import { useOfflineSync } from '../../hooks/useOfflineSync';
import clientService from '../../services/clientService';
import geolocationService from '../../services/geolocationService';
import authService from '../../services/authService';

// Navigation
import { navigateToClientList, navigateToClientDetail } from '../../navigation/CollecteurStack';

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
  
  // États
  const [isLoading, setIsLoading] = useState(false);
  const [commissionType, setCommissionType] = useState('PERCENTAGE');
  const [fixedAmount, setFixedAmount] = useState('1000');
  const [percentageValue, setPercentageValue] = useState('5');
  const [showCommissionSettings, setShowCommissionSettings] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(null);
  
  // 🔥 NOUVEAUX ÉTATS GÉOLOCALISATION
  const [locationData, setLocationData] = useState(null);
  const [locationStep, setLocationStep] = useState('pending'); // 'pending', 'captured', 'skipped'
  const [geoloading, setGeoLoading] = useState(false);
  
  // Hook pour synchronisation offline
  const { saveClient } = useOfflineSync();

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
    initializeScreen();
  }, []);

  useEffect(() => {
    if (isEditMode && client) {
      loadExistingLocation();
      
      // Charger paramètres commission
      if (client.commissionParams) {
        setCommissionType(client.commissionParams.type || 'PERCENTAGE');
        if (client.commissionParams.type === 'FIXED') {
          setFixedAmount(client.commissionParams.value?.toString() || '1000');
        } else if (client.commissionParams.type === 'PERCENTAGE') {
          setPercentageValue(client.commissionParams.value?.toString() || '5');
        }
      }
    }
  }, [isEditMode, client]);

  // ============================================
  // FONCTIONS GÉOLOCALISATION
  // ============================================

  const initializeScreen = async () => {
    console.log('🚀 Initialisation écran ClientAddEdit...');
    
    // Test des services (fonction existante)
    const testResult = await testServicesConnection();
    setServiceStatus(testResult);
    
    if (!testResult.success) {
      Alert.alert(
        'Attention',
        `Problème détecté: ${testResult.error}. Vous pouvez continuer en mode hors ligne.`,
        [{ text: 'OK' }]
      );
    }
  };

  const loadExistingLocation = async () => {
    if (!client?.id) return;
    
    try {
      const response = await clientService.getClientLocation(client.id);
      if (response.success && response.data) {
        const location = response.data;
        if (location.latitude && location.longitude) {
          setLocationData({
            latitude: location.latitude,
            longitude: location.longitude,
            adresseComplete: location.adresseComplete,
            coordonneesSaisieManuelle: location.coordonneesSaisieManuelle,
            source: location.coordonneesSaisieManuelle ? 'MANUAL' : 'GPS'
          });
          setLocationStep('captured');
        }
      }
    } catch (error) {
      console.warn('⚠️ Pas de localisation existante pour ce client');
    }
  };

  const captureQuickGPS = async () => {
    setGeoLoading(true);
    
    try {
      // Demander permissions
      const hasPermission = await geolocationService.requestPermissions();
      if (!hasPermission) {
        openFullLocationScreen();
        return;
      }

      // Obtenir position rapidement
      const position = await geolocationService.getCurrentPosition({ 
        timeout: 8000,
        accuracy: Location.Accuracy.Balanced 
      });
      
      // Géocodage inverse optionnel
      let address = '';
      try {
        const addressInfo = await geolocationService.reverseGeocode(
          position.latitude,
          position.longitude
        );
        address = addressInfo?.formattedAddress || '';
      } catch (geocodeError) {
        console.warn('⚠️ Géocodage inverse échoué');
      }

      setLocationData({
        ...position,
        adresseComplete: address,
        coordonneesSaisieManuelle: false
      });
      setLocationStep('captured');
      
      Alert.alert(
        'Position capturée !',
        `Localisation obtenue avec une précision de ${Math.round(position.accuracy || 0)}m`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ Erreur capture GPS rapide:', error);
      
      Alert.alert(
        'GPS indisponible',
        'Impossible de capturer la position automatiquement.\n\nVoulez-vous ouvrir l\'écran de géolocalisation complet ?',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Ouvrir', onPress: openFullLocationScreen }
        ]
      );
    } finally {
      setGeoLoading(false);
    }
  };

  const openFullLocationScreen = () => {
    navigation.navigate('ClientLocation', {
      clientId: client?.id,
      clientNom: client ? `${client.prenom} ${client.nom}` : 'Nouveau client',
      isCreation: !isEditMode,
      onLocationSaved: (savedLocationData) => {
        setLocationData(savedLocationData);
        setLocationStep('captured');
      }
    });
  };

  const clearLocation = () => {
    Alert.alert(
      'Supprimer la localisation',
      'Voulez-vous supprimer la localisation de ce client ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', onPress: () => {
          setLocationData(null);
          setLocationStep('pending');
        }}
      ]
    );
  };

  // ============================================
  // FONCTIONS EXISTANTES (MODIFIÉES)
  // ============================================

  const testServicesConnection = async () => {
    console.log('🔍 === TEST DES SERVICES ===');
    
    try {
      // Test 1: Vérifier authService
      console.log('1️⃣ Test authService...');
      const user = await authService.getCurrentUser();
      console.log('👤 Utilisateur:', user);
      
      if (!user) {
        console.warn('⚠️ Pas d\'utilisateur connecté');
        return { success: false, error: 'Utilisateur non connecté' };
      }
      
      // Test 2: Test de connexivité clientService
      console.log('2️⃣ Test clientService...');
      const testConnection = await clientService.testConnection();
      console.log('🔗 Test connexion:', testConnection);
      
      if (!testConnection.success) {
        console.error('❌ Service client indisponible');
        return { success: false, error: 'Service client indisponible' };
      }
      
      // Test 3: Validation des données
      console.log('3️⃣ Test validation...');
      const testData = {
        nom: 'TestNom',
        prenom: 'TestPrenom',
        numeroCni: '123456789',
        telephone: '677123456',
        ville: 'Douala',
        quartier: 'Akwa'
      };
      
      const validation = clientService.validateClientDataLocally(testData);
      console.log('✅ Validation:', validation);
      
      console.log('🎉 === TOUS LES TESTS TERMINÉS ===');
      return { success: true, message: 'Tous les services opérationnels' };
      
    } catch (error) {
      console.error('❌ Erreur dans les tests:', error);
      return { success: false, error: error.message };
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      console.log('💾 Soumission formulaire:', { mode, data, locationData });
      
      // Validation supplémentaire
      const validation = clientService.validateClientDataLocally(data);
      if (!validation.isValid) {
        throw new Error(`Erreurs de validation: ${validation.errors.join(', ')}`);
      }
      
      // Préparer les données du client
      const clientData = {
        ...data,
        // 🔥 AJOUT GÉOLOCALISATION
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
        clientData.nom = client.nom;
        clientData.prenom = client.prenom;
      }
      
      console.log('📤 Données finales à envoyer:', clientData);
      
      // Sauvegarder le client
      const result = await saveClient(clientData, isEditMode);
      
      if (!result.success) {
        throw new Error(result.error || "Une erreur est survenue lors de l'enregistrement");
      }
      
      const savedClient = result.data;
      console.log('✅ Client sauvegardé:', savedClient);
      
      // 🔥 SAUVEGARDE SÉPARÉE DE LA GÉOLOCALISATION (si nouveau client)
      if (!isEditMode && locationData && savedClient.id) {
        try {
          await clientService.updateClientLocation(savedClient.id, {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            saisieManuelle: locationData.coordonneesSaisieManuelle,
            adresseComplete: locationData.adresseComplete,
            source: locationData.source
          });
          console.log('✅ Localisation sauvegardée séparément');
        } catch (locationError) {
          console.warn('⚠️ Erreur sauvegarde localisation (non bloquante):', locationError);
        }
      }
      
      // Navigation et messages de succès
      if (isEditMode) {
        Alert.alert(
          "Succès",
          `Les informations de ${savedClient.prenom} ${savedClient.nom} ont été mises à jour avec succès.`,
          [
            { 
              text: "OK", 
              onPress: () => navigateToClientDetail(navigation, savedClient)
            }
          ]
        );
      } else {
        const locationMessage = locationData 
          ? '\n📍 Localisation enregistrée' 
          : '\n⚠️ Localisation non renseignée';
          
        Alert.alert(
          "Succès",
          `Le client ${savedClient.prenom} ${savedClient.nom} a été créé avec succès.${locationMessage}`,
          [
            { 
              text: "Voir les clients", 
              onPress: () => navigateToClientList(navigation)
            },
            { 
              text: "Voir détails", 
              onPress: () => navigateToClientDetail(navigation, savedClient)
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      
      Alert.alert(
        "Erreur",
        `Impossible d'enregistrer le client: ${error.message}`,
        [
          { text: "Réessayer" },
          { 
            text: "Mode hors ligne", 
            onPress: () => {
              console.log('💾 Tentative sauvegarde hors ligne...');
            }
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions commission (inchangées)
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
  // RENDU
  // ============================================
  
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Modifier un client" : "Ajouter un client"}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          serviceStatus && !serviceStatus.success ? (
            <View style={styles.statusIndicator}>
              <Ionicons name="cloud-offline" size={20} color={theme.colors.warning} />
            </View>
          ) : null
        }
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
            
            {/* Indicateur de statut des services */}
            {serviceStatus && !serviceStatus.success && (
              <Card style={styles.warningCard}>
                <View style={styles.warningContent}>
                  <Ionicons name="warning" size={24} color={theme.colors.warning} />
                  <Text style={styles.warningText}>
                    Mode hors ligne - Vos données seront synchronisées plus tard
                  </Text>
                </View>
              </Card>
            )}
            
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
            
            {/* 🔥 SECTION GÉOLOCALISATION INTÉGRÉE */}
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
              
              {locationData ? (
                /* Localisation capturée */
                <View style={styles.locationCaptured}>
                  <View style={styles.locationInfo}>
                    <Text style={styles.coordinatesText}>
                      📍 {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.sourceText}>
                      📡 {locationData.coordonneesSaisieManuelle ? 'Saisie manuelle' : 'GPS'}
                    </Text>
                    {locationData.adresseComplete && (
                      <Text style={styles.addressText}>
                        🏠 {locationData.adresseComplete}
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.editLocationButton}
                    onPress={openFullLocationScreen}
                  >
                    <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.editLocationText}>Modifier</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Aucune localisation */
                <View style={styles.locationPending}>
                  <Text style={styles.geoSubtitle}>
                    Enregistrez la position de ce client pour faciliter vos futures visites
                  </Text>
                  
                  <View style={styles.geoActions}>
                    <Button
                      title="Capturer GPS"
                      onPress={captureQuickGPS}
                      loading={geoloading}
                      style={styles.quickGpsButton}
                      icon="location"
                      variant="outlined"
                    />
                    
                    <Button
                      title="Options avancées"
                      onPress={openFullLocationScreen}
                      style={styles.advancedGeoButton}
                      icon="settings-outline"
                      variant="text"
                    />
                  </View>
                </View>
              )}
            </Card>
            
            {/* Section paramètres de commission (inchangée) */}
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
  statusIndicator: {
    padding: 4,
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.warningLight,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    marginLeft: 8,
    color: theme.colors.warning,
    fontSize: 14,
    flex: 1,
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
  },
  geoSubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
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
  commissionSettings: {
    marginTop: 8,
  },
  commissionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    marginRight: 8,
  },
  selectedType: {
    backgroundColor: theme.colors.primary,
  },
  typeText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  selectedTypeText: {
    color: theme.colors.white,
  },
  configSection: {
    marginTop: 8,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  fixedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fixedInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    fontSize: 16,
  },
  currencyText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    width: 50,
  },
  descriptionBox: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  highlightText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 24,
  }
});

export default ClientAddEditScreen;