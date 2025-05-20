// src/components/ErrorBoundary.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import * as Updates from 'expo-updates';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import errorService, { ERROR_TYPES, ERROR_SEVERITY } from '../services/errorService';
import theme from '../theme';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorCode: null,
      reloading: false
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de secours
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Générer un code d'erreur unique pour le support
    const errorCode = `E${Date.now().toString(36).substring(4)}`;
    
    this.setState({
      error,
      errorInfo,
      errorCode,
    });
    
    // Enregistrer l'erreur
    this._logFatalError(error, errorInfo, errorCode);
  }
  
  // Enregistrer l'erreur fatale
  async _logFatalError(error, errorInfo, errorCode) {
    try {
      // Collecter des informations supplémentaires
      const deviceInfo = await this._getDeviceInfo();
      
      // Enregistrer via le service d'erreur
      errorService.handleError(error, {
        type: ERROR_TYPES.RUNTIME,
        severity: ERROR_SEVERITY.FATAL,
        context: {
          componentStack: errorInfo.componentStack,
          errorCode,
          deviceInfo,
        },
        reportToServer: true, // S'assurer que cette erreur est signalée
      });
    } catch (logError) {
      console.error('Erreur lors de l\'enregistrement de l\'erreur fatale:', logError);
    }
  }
  
  // Obtenir les informations sur l'appareil
  async _getDeviceInfo() {
    try {
      return {
        brand: Device.brand || 'unknown',
        model: Device.modelName || 'unknown',
        osName: Device.osName || 'unknown',
        osVersion: Device.osVersion || 'unknown',
        appVersion: Application.nativeApplicationVersion || 'unknown',
        appBuild: Application.nativeBuildVersion || 'unknown',
      };
    } catch (e) {
      return { error: 'Impossible de récupérer les informations de l\'appareil' };
    }
  }
  
  // Recharger l'application
  handleReload = async () => {
    this.setState({ reloading: true });
    
    try {
      // Pour les builds de développement
      if (__DEV__) {
        // Réinitialiser simplement l'état
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          errorCode: null,
          reloading: false,
        });
        return;
      }
      
      // Pour les builds de production avec Expo Updates
      if (Updates.isAvailable) {
        await Updates.reloadAsync();
      } else {
        // Si pas de mise à jour disponible, réinitialiser simplement l'état
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          errorCode: null,
          reloading: false,
        });
      }
    } catch (e) {
      // En cas d'échec, afficher un message et inviter à redémarrer l'application
      this.setState({
        reloading: false,
        error: new Error('Impossible de recharger l\'application. Veuillez la fermer et la rouvrir manuellement.'),
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // UI de secours en cas d'erreur
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Image
              source={require('../../assets/images/error-icon.png')}
              style={styles.errorImage}
            />
            
            <Text style={styles.title}>Oops ! Quelque chose s'est mal passé</Text>
            
            <Text style={styles.subtitle}>
              L'application a rencontré un problème inattendu. Nous en sommes désolés.
            </Text>
            
            {this.state.errorCode && (
              <View style={styles.errorCodeContainer}>
                <Text style={styles.errorCodeLabel}>Code d'erreur:</Text>
                <Text style={styles.errorCode}>{this.state.errorCode}</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReload}
              disabled={this.state.reloading}
            >
              <Text style={styles.buttonText}>
                {this.state.reloading ? 'Rechargement en cours...' : 'Redémarrer l\'application'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.supportText}>
              Si le problème persiste, veuillez contacter le support technique en indiquant le code d'erreur ci-dessus.
            </Text>
          </View>
          
          {__DEV__ && this.state.error && (
            <ScrollView style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Détails de l'erreur (mode développement uniquement):</Text>
              <Text style={styles.errorMessage}>{this.state.error.toString()}</Text>
              {this.state.errorInfo && (
                <Text style={styles.componentStack}>{this.state.errorInfo.componentStack}</Text>
              )}
            </ScrollView>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  errorCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: theme.colors.backgroundLight,
    padding: 10,
    borderRadius: 8,
  },
  errorCodeLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginRight: 10,
  },
  errorCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  supportText: {
    fontSize: 13,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  debugContainer: {
    marginTop: 40,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    maxHeight: 300,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.colors.error,
  },
  errorMessage: {
    color: theme.colors.error,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  componentStack: {
    color: theme.colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
});

export default ErrorBoundary;