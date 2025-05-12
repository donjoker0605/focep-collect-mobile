// src/components/BiometricAuth/BiometricAuth.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import theme from '../../theme';

// Types d'authentification biométrique
const BIOMETRIC_TYPES = {
  FINGERPRINT: 'fingerprint',
  FACIAL: 'facial',
  IRIS: 'iris',
};

// Messages d'erreur
const ERROR_MESSAGES = {
  NOT_ENROLLED: 'Aucune donnée biométrique n\'est enregistrée sur cet appareil.',
  NOT_AVAILABLE: 'L\'authentification biométrique n\'est pas disponible sur cet appareil.',
  USER_CANCELED: 'Authentification annulée par l\'utilisateur.',
  USER_FALLBACK: 'Méthode alternative sélectionnée par l\'utilisateur.',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives échouées. Veuillez réessayer plus tard.',
  LOCKED_OUT: 'Authentification biométrique verrouillée en raison de trop de tentatives.',
  AUTHENTICATION_FAILED: 'Authentification échouée. Veuillez réessayer.',
  UNKNOWN_ERROR: 'Une erreur inconnue est survenue. Veuillez réessayer.',
};

const BiometricAuth = ({
  onAuthenticate,
  onCancel,
  onError,
  promptMessage = 'Confirmer votre identité',
  cancelButtonText = 'Annuler',
  fallbackButtonText = 'Utiliser le code PIN',
  allowFallback = true,
  autoPrompt = false,
  disableDeviceCheck = false,
  style,
  buttonStyle,
  iconSize = 24,
  customIcon,
  customErrorMessages = {},
  renderCustomButton,
  showAvailableBiometrics = false,
}) => {
  // États
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState([]);
  const [error, setError] = useState(null);
  
  // Vérifier la disponibilité de l'authentification biométrique
  useEffect(() => {
    checkBiometricAvailability();
  }, []);
  
  // Lancer automatiquement l'authentification si autoPrompt est activé
  useEffect(() => {
    if (autoPrompt && isBiometricAvailable) {
      handleAuthenticate();
    }
  }, [autoPrompt, isBiometricAvailable]);
  
  // Vérifier la disponibilité de l'authentification biométrique
  const checkBiometricAvailability = async () => {
    try {
      // Vérifier si le matériel prend en charge la biométrie
      const isHardwareSupported = await LocalAuthentication.hasHardwareAsync();
      
      if (!isHardwareSupported && !disableDeviceCheck) {
        setIsBiometricAvailable(false);
        setError('NOT_AVAILABLE');
        return;
      }
      
      // Vérifier si des données biométriques sont enregistrées
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!isEnrolled && !disableDeviceCheck) {
        setIsBiometricAvailable(false);
        setError('NOT_ENROLLED');
        return;
      }
      
      // Récupérer les types d'authentification biométrique disponibles
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Mapper les types aux constantes définies
      const mappedTypes = supportedTypes.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return BIOMETRIC_TYPES.FINGERPRINT;
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return BIOMETRIC_TYPES.FACIAL;
          case LocalAuthentication.AuthenticationType.IRIS:
            return BIOMETRIC_TYPES.IRIS;
          default:
            return null;
        }
      }).filter(Boolean);
      
      setBiometricTypes(mappedTypes);
      setIsBiometricAvailable(true);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la vérification de la biométrie:', error);
      setIsBiometricAvailable(false);
      setError('UNKNOWN_ERROR');
    }
  };
  
  // Gérer les erreurs d'authentification
  const handleAuthenticationError = (error) => {
    let errorCode;
    
    switch (error.message) {
      case 'not_enrolled':
        errorCode = 'NOT_ENROLLED';
        break;
      case 'not_available':
        errorCode = 'NOT_AVAILABLE';
        break;
      case 'user_canceled':
        errorCode = 'USER_CANCELED';
        break;
      case 'user_fallback':
        errorCode = 'USER_FALLBACK';
        break;
      case 'too_many_attempts':
        errorCode = 'TOO_MANY_ATTEMPTS';
        break;
      case 'locked_out':
        errorCode = 'LOCKED_OUT';
        break;
      case 'authentication_failed':
        errorCode = 'AUTHENTICATION_FAILED';
        break;
      default:
        errorCode = 'UNKNOWN_ERROR';
    }
    
    setError(errorCode);
    
    if (onError) {
      onError(errorCode, error);
    }
  };
  
  // Lancer l'authentification biométrique
  const handleAuthenticate = async () => {
    if (!isBiometricAvailable && !disableDeviceCheck) {
      Alert.alert(
        'Authentification biométrique',
        ERROR_MESSAGES[error] || ERROR_MESSAGES.NOT_AVAILABLE
      );
      return;
    }
    
    try {
      setIsAuthenticating(true);
      setError(null);
      
      // Options pour l'authentification
      const options = {
        promptMessage,
        cancelLabel: cancelButtonText,
        fallbackLabel: fallbackButtonText,
        disableDeviceFallback: !allowFallback,
      };
      
      // Lancer l'authentification
      const result = await LocalAuthentication.authenticateAsync(options);
      
      setIsAuthenticating(false);
      
      if (result.success) {
        // Authentification réussie
        if (onAuthenticate) {
          onAuthenticate(result);
        }
      } else if (result.error === 'user_canceled') {
        // Annulation par l'utilisateur
        if (onCancel) {
          onCancel();
        }
      } else {
        // Erreur d'authentification
        handleAuthenticationError({ message: result.error });
      }
    } catch (error) {
      setIsAuthenticating(false);
      console.error('Erreur lors de l\'authentification:', error);
      handleAuthenticationError(error);
    }
  };
  
  // Obtenir l'icône en fonction du type de biométrie disponible
  const getBiometricIcon = () => {
    if (customIcon) {
      return customIcon;
    }
    
    // Prioriser les types de biométrie disponibles
    if (biometricTypes.includes(BIOMETRIC_TYPES.FINGERPRINT)) {
      return <Ionicons name="finger-print" size={iconSize} color={theme.colors.primary} />;
    } else if (biometricTypes.includes(BIOMETRIC_TYPES.FACIAL)) {
      return <Ionicons name="scan-outline" size={iconSize} color={theme.colors.primary} />;
    } else if (biometricTypes.includes(BIOMETRIC_TYPES.IRIS)) {
      return <Ionicons name="eye-outline" size={iconSize} color={theme.colors.primary} />;
    }
    
    // Par défaut, utiliser l'empreinte digitale
    return <Ionicons name="finger-print" size={iconSize} color={theme.colors.primary} />;
  };
  
  // Obtenir le message d'erreur
  const getErrorMessage = () => {
    if (!error) return null;
    
    return customErrorMessages[error] || ERROR_MESSAGES[error] || ERROR_MESSAGES.UNKNOWN_ERROR;
  };
  
  // Bouton personnalisé s'il est fourni
  if (renderCustomButton) {
    return renderCustomButton({
      onPress: handleAuthenticate,
      isAuthenticating,
      isBiometricAvailable,
      error: getErrorMessage(),
      biometricTypes,
    });
  }
  
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.authButton,
          !isBiometricAvailable && styles.disabledButton,
          buttonStyle,
        ]}
        onPress={handleAuthenticate}
        disabled={isAuthenticating || (!isBiometricAvailable && !disableDeviceCheck)}
      >
        {isAuthenticating ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          getBiometricIcon()
        )}
        <Text style={styles.authButtonText}>
          {isAuthenticating ? 'Authentification...' : 'Authentification biométrique'}
        </Text>
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{getErrorMessage()}</Text>
      )}
      
      {showAvailableBiometrics && biometricTypes.length > 0 && (
        <View style={styles.biometricTypesContainer}>
          <Text style={styles.biometricTypesTitle}>
            Méthodes disponibles:
          </Text>
          <View style={styles.biometricTypesList}>
            {biometricTypes.map((type, index) => (
              <View key={index} style={styles.biometricTypeItem}>
                {type === BIOMETRIC_TYPES.FINGERPRINT && (
                  <Ionicons name="finger-print" size={16} color={theme.colors.textLight} />
                )}
                {type === BIOMETRIC_TYPES.FACIAL && (
                  <Ionicons name="scan-outline" size={16} color={theme.colors.textLight} />
                )}
                {type === BIOMETRIC_TYPES.IRIS && (
                  <Ionicons name="eye-outline" size={16} color={theme.colors.textLight} />
                )}
                <Text style={styles.biometricTypeText}>
                  {type === BIOMETRIC_TYPES.FINGERPRINT && 'Empreinte digitale'}
                  {type === BIOMETRIC_TYPES.FACIAL && 'Reconnaissance faciale'}
                  {type === BIOMETRIC_TYPES.IRIS && 'Reconnaissance de l\'iris'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 10,
    ...theme.shadows.small,
  },
  disabledButton: {
    opacity: 0.6,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginLeft: 10,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: 8,
    textAlign: 'center',
  },
  biometricTypesContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  biometricTypesTitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  biometricTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  biometricTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  biometricTypeText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
});

// Exporter les constantes pour utilisation externe
export { BIOMETRIC_TYPES, ERROR_MESSAGES };
export default BiometricAuth;