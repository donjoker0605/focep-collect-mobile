// src/components/SignatureInput/SignatureInput.js
import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const { width } = Dimensions.get('window');

const SignatureInput = ({
  label,
  onSignatureChange,
  error,
  style,
  height = 200,
  backgroundColor = theme.colors.white,
  placeholder = 'Signez ici',
  required = false,
  disabled = false,
  loading = false,
  showFrame = true,
  showLabel = true,
  readOnly = false,
  defaultSignature = null,
}) => {
  const [signatureImage, setSignatureImage] = useState(defaultSignature);
  
  // Version simplifiée qui ne fait rien pour le moment
  const handleSignPress = () => {
    // Cette fonction serait appelée quand l'utilisateur veut signer
    console.log('Fonctionnalité de signature temporairement désactivée');
    // Informer l'utilisateur
    alert('La fonctionnalité de signature est temporairement désactivée');
  };
  
  return (
    <View style={[styles.container, style]}>
      {showLabel && label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.requiredAsterisk}>*</Text>}
          </Text>
        </View>
      )}
      
      <View style={[
        styles.signatureContainer,
        showFrame && styles.signatureContainerWithFrame,
        error && styles.signatureContainerError,
        disabled && styles.signatureContainerDisabled,
      ]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyContainer}
            onPress={handleSignPress}
            disabled={disabled || readOnly}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={theme.colors.textLight}
            />
            <Text style={styles.emptyText}>
              Fonctionnalité de signature temporairement désactivée
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  requiredAsterisk: {
    color: theme.colors.error,
    marginLeft: 2,
  },
  signatureContainer: {
    width: '100%',
    minHeight: 150,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  signatureContainerWithFrame: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  signatureContainerError: {
    borderColor: theme.colors.error,
  },
  signatureContainerDisabled: {
    opacity: 0.7,
    backgroundColor: theme.colors.lightGray,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default SignatureInput;