// src/services/errorService.js
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import AsyncStorage from '../utils/storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { APP_CONFIG } from '../config/appConfig';

// Types d'erreurs
export const ERROR_TYPES = {
  NETWORK: 'network',
  API: 'api',
  AUTH: 'auth',
  VALIDATION: 'validation',
  BUSINESS: 'business',
  RUNTIME: 'runtime',
  UNEXPECTED: 'unexpected',
};

// Niveau de sévérité
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
  FATAL: 'fatal',
};

class ErrorService {
  constructor() {
    this.errorQueue = [];
    this.sendingErrors = false;
    this.maxQueueSize = 50;
    this.errorStorage = 'focep_error_logs';
  }

  // Traiter une erreur
  async handleError(error, options = {}) {
    try {
      const {
        type = ERROR_TYPES.UNEXPECTED,
        severity = ERROR_SEVERITY.ERROR,
        context = {},
        silent = false,
        reportToServer = true,
      } = options;

      // Formater l'erreur
      const formattedError = await this._formatError(error, type, severity, context);
      
      // Enregistrer l'erreur localement
      await this._logError(formattedError);
      
      // En mode production, envoyer au serveur si demandé
      if (APP_CONFIG.environment === 'production' && reportToServer) {
        await this._queueErrorForReporting(formattedError);
      }
      
      // Retourner un message utilisateur approprié
      return this._getUserFriendlyMessage(formattedError, silent);
    } catch (e) {
      // En cas d'erreur dans le gestionnaire d'erreurs, utiliser une approche minimaliste
      console.error('Erreur dans le gestionnaire d\'erreurs:', e);
      return {
        message: 'Une erreur inattendue est survenue.',
        show: true,
      };
    }
  }

  // Formater l'erreur avec les informations contextuelles
  async _formatError(error, type, severity, context) {
    // Récupérer les informations sur l'appareil et la connexion
    const deviceInfo = await this._getDeviceInfo();
    const netInfo = await NetInfo.fetch();
    const userId = await AsyncStorage.getItem('userId');

    return {
      timestamp: new Date().toISOString(),
      type,
      severity,
      message: error.message || 'Erreur inconnue',
      stack: error.stack,
      status: error.status || error.statusCode,
      code: error.code,
      name: error.name,
      context: {
        ...context,
        componentInfo: context.componentInfo || null,
        route: context.route || null,
        action: context.action || null,
        inputData: this._sanitizeData(context.inputData || null),
      },
      device: deviceInfo,
      network: {
        isConnected: netInfo.isConnected,
        type: netInfo.type,
        isInternetReachable: netInfo.isInternetReachable,
      },
      app: {
        version: Application.nativeApplicationVersion || 'unknown',
        build: Application.nativeBuildVersion || 'unknown',
        environment: APP_CONFIG.environment,
      },
      user: {
        id: userId || 'anonymous',
        // Ne pas inclure d'informations personnelles identifiables
      }
    };
  }

  // Obtenir les informations sur l'appareil
  async _getDeviceInfo() {
    try {
      const deviceType = await Device.getDeviceTypeAsync();
      return {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        modelId: Device.modelId,
        designName: Device.designName,
        productName: Device.productName,
        deviceYearClass: Device.deviceYearClass,
        totalMemory: Device.totalMemory,
        osName: Device.osName,
        osVersion: Device.osVersion,
        osBuildId: Device.osBuildId,
        osInternalBuildId: Device.osInternalBuildId,
        osBuildFingerprint: Device.osBuildFingerprint,
        platformApiLevel: Device.platformApiLevel,
        deviceType: this._getDeviceTypeString(deviceType),
      };
    } catch (e) {
      // Informations minimales en cas d'erreur
      return {
        platform: Platform.OS,
        version: Platform.Version,
      };
    }
  }

  // Convertir le type d'appareil en chaîne lisible
  _getDeviceTypeString(deviceType) {
    switch (deviceType) {
      case Device.DeviceType.PHONE:
        return 'phone';
      case Device.DeviceType.TABLET:
        return 'tablet';
      case Device.DeviceType.DESKTOP:
        return 'desktop';
      case Device.DeviceType.TV:
        return 'tv';
      default:
        return 'unknown';
    }
  }

  // Nettoyer les données sensibles
  _sanitizeData(data) {
    if (!data) return null;
    
    // Créer une copie pour ne pas modifier l'original
    const sanitized = { ...data };
    
    // Liste des champs à masquer
    const sensitiveFields = ['password', 'token', 'secret', 'credit_card', 'card_number', 'cvv', 'pin'];
    
    Object.keys(sanitized).forEach(key => {
      // Vérifier si le champ est sensible
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Récursion pour les objets imbriqués
        sanitized[key] = this._sanitizeData(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  // Enregistrer l'erreur localement
  async _logError(error) {
    try {
      // Récupérer les erreurs existantes
      const storedErrorsString = await AsyncStorage.getItem(this.errorStorage);
      let storedErrors = storedErrorsString ? JSON.parse(storedErrorsString) : [];
      
      // Ajouter la nouvelle erreur
      storedErrors.push(error);
      
      // Limiter la taille du stockage (garder seulement les N dernières erreurs)
      if (storedErrors.length > this.maxQueueSize) {
        storedErrors = storedErrors.slice(-this.maxQueueSize);
      }
      
      // Sauvegarder
      await AsyncStorage.setItem(this.errorStorage, JSON.stringify(storedErrors));
    } catch (e) {
      console.error('Erreur lors de l\'enregistrement de l\'erreur:', e);
    }
  }

  // Mettre l'erreur en file d'attente pour l'envoi au serveur
  async _queueErrorForReporting(error) {
    this.errorQueue.push(error);
    
    // Déclencher l'envoi s'il n'est pas déjà en cours
    if (!this.sendingErrors) {
      this._processErrorQueue();
    }
  }

  // Traiter la file d'attente d'erreurs
  async _processErrorQueue() {
    if (this.errorQueue.length === 0 || this.sendingErrors) {
      return;
    }
    
    this.sendingErrors = true;
    
    try {
      // Vérifier la connexion internet
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        this.sendingErrors = false;
        return; // Réessayer plus tard
      }
      
      // Copier la file d'attente et la vider
      const errors = [...this.errorQueue];
      this.errorQueue = [];
      
      // Envoyer les erreurs au serveur
      await this._reportErrorsToServer(errors);
    } catch (e) {
      console.error('Erreur lors du traitement de la file d\'attente:', e);
      // Remettre les erreurs en file d'attente en cas d'échec
      this.errorQueue = [...this.errorQueue, ...errors];
    } finally {
      this.sendingErrors = false;
      
      // Si d'autres erreurs sont arrivées entre-temps, traiter à nouveau
      if (this.errorQueue.length > 0) {
        setTimeout(() => this._processErrorQueue(), 1000);
      }
    }
  }

  // Envoyer les erreurs au serveur
  async _reportErrorsToServer(errors) {
    try {
      // Exemple d'implémentation - À adapter à votre API
      await fetch(`${APP_CONFIG.apiBaseUrl}/logs/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ajouter un token d'API dédié aux logs, pas le token utilisateur
          'X-API-Key': APP_CONFIG.errorReportingApiKey,
        },
        body: JSON.stringify({
          errors,
          app: {
            id: APP_CONFIG.appId,
            version: Application.nativeApplicationVersion,
            environment: APP_CONFIG.environment,
          },
        }),
      });
    } catch (e) {
      console.error('Erreur lors de l\'envoi des erreurs au serveur:', e);
      throw e;
    }
  }

  // Obtenir un message d'erreur adapté à l'utilisateur
  _getUserFriendlyMessage(error, silent) {
    // Si l'erreur est silencieuse, ne pas afficher de message
    if (silent) {
      return { message: '', show: false };
    }
    
    // Messages par type d'erreur
    const typeMessages = {
      [ERROR_TYPES.NETWORK]: 'Problème de connexion. Veuillez vérifier votre connexion internet et réessayer.',
      [ERROR_TYPES.API]: 'Le service est temporairement indisponible. Veuillez réessayer ultérieurement.',
      [ERROR_TYPES.AUTH]: 'Votre session a expiré. Veuillez vous reconnecter.',
      [ERROR_TYPES.VALIDATION]: error.message || 'Veuillez vérifier les informations saisies.',
      [ERROR_TYPES.BUSINESS]: error.message || 'Une erreur de traitement est survenue.',
      [ERROR_TYPES.RUNTIME]: 'Une erreur inattendue est survenue dans l\'application.',
      [ERROR_TYPES.UNEXPECTED]: 'Une erreur inattendue est survenue. Veuillez réessayer.',
    };
    
    // Messages par code HTTP spécifique
    const statusMessages = {
      400: 'Les données envoyées sont incorrectes.',
      401: 'Vous devez vous connecter pour accéder à cette fonctionnalité.',
      403: 'Vous n\'avez pas les droits nécessaires pour cette action.',
      404: 'La ressource demandée n\'existe pas.',
      409: 'Un conflit est survenu lors du traitement de votre demande.',
      413: 'Les données envoyées sont trop volumineuses.',
      429: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
    };
    
    let finalMessage = '';
    
    // Priorité 1: Message spécifique par code HTTP si disponible
    if (error.status && statusMessages[error.status]) {
      finalMessage = statusMessages[error.status];
    } 
    // Priorité 2: Message par type d'erreur
    else if (typeMessages[error.type]) {
      finalMessage = typeMessages[error.type];
    } 
    // Priorité 3: Message d'erreur brut (si approprié) ou message générique
    else {
      finalMessage = 'Une erreur est survenue. Veuillez réessayer ultérieurement.';
    }
    
    // Ajouter un code pour le support en environnement de production
    if (APP_CONFIG.environment === 'production' && error.type === ERROR_TYPES.UNEXPECTED) {
      const errorCode = error.timestamp.replace(/[-:.TZ]/g, '').substring(0, 12);
      finalMessage += ` (Code: ${errorCode})`;
    }
    
    return {
      message: finalMessage,
      show: true,
      severity: this._mapSeverityToUi(error.severity),
    };
  }

  // Mapper la sévérité pour l'UI
  _mapSeverityToUi(severity) {
    switch (severity) {
      case ERROR_SEVERITY.INFO:
        return 'info';
      case ERROR_SEVERITY.WARNING:
        return 'warning';
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.FATAL:
        return 'error';
      case ERROR_SEVERITY.ERROR:
      default:
        return 'error';
    }
  }

  // Récupérer les erreurs stockées (utile pour le débogage)
  async getStoredErrors() {
    try {
      const storedErrorsString = await AsyncStorage.getItem(this.errorStorage);
      return storedErrorsString ? JSON.parse(storedErrorsString) : [];
    } catch (e) {
      console.error('Erreur lors de la récupération des erreurs stockées:', e);
      return [];
    }
  }

  // Nettoyer les erreurs stockées
  async clearStoredErrors() {
    try {
      await AsyncStorage.removeItem(this.errorStorage);
      return true;
    } catch (e) {
      console.error('Erreur lors du nettoyage des erreurs stockées:', e);
      return false;
    }
  }
}

export default new ErrorService();