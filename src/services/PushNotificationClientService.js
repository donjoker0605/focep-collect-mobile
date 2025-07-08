import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, AppState } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { CommonActions } from '@react-navigation/native';

/**
 * 🔔 Service de gestion des notifications push côté client React Native
 * 
 * FONCTIONNALITÉS :
 * - Configuration Firebase Cloud Messaging
 * - Gestion des permissions de notification
 * - Traitement des notifications reçues
 * - Navigation automatique vers les écrans appropriés
 * - Badge de compteur de notifications
 * - Sons et vibrations personnalisés
 */
class PushNotificationClientService {
  constructor() {
    this.navigationRef = null;
    this.isInitialized = false;
    this.messageHandlers = new Map();
    this.unsubscribers = [];
    
    // Configuration des canaux de notification Android
    this.notificationChannels = {
      system_alerts: {
        channelId: 'system_alerts',
        channelName: 'Alertes Système',
        channelDescription: 'Notifications critiques du système',
        soundName: 'notification_critical.mp3',
        importance: 4, // HIGH
        vibrate: true,
      },
      warnings: {
        channelId: 'warnings',
        channelName: 'Avertissements',
        channelDescription: 'Avertissements et alertes importantes',
        soundName: 'notification_warning.mp3',
        importance: 3, // DEFAULT
        vibrate: true,
      },
      reminders: {
        channelId: 'reminders',
        channelName: 'Rappels',
        channelDescription: 'Rappels de clôture et autres tâches',
        soundName: 'notification_reminder.mp3',
        importance: 3, // DEFAULT
        vibrate: false,
      },
      admin_messages: {
        channelId: 'admin_messages',
        channelName: 'Messages Admin',
        channelDescription: 'Messages des administrateurs',
        soundName: 'notification_message.mp3',
        importance: 3, // DEFAULT
        vibrate: false,
      },
      financial_alerts: {
        channelId: 'financial_alerts',
        channelName: 'Alertes Financières',
        channelDescription: 'Alertes de solde et transactions',
        soundName: 'notification_money.mp3',
        importance: 4, // HIGH
        vibrate: true,
      },
      general: {
        channelId: 'general',
        channelName: 'Général',
        channelDescription: 'Notifications générales',
        soundName: 'default',
        importance: 2, // LOW
        vibrate: false,
      },
    };
  }

  // =====================================
  // INITIALISATION
  // =====================================

  /**
   * 🚀 Initialise le service de notifications push
   */
  async initialize(navigationRef) {
    if (this.isInitialized) {
      console.log('📱 Service push déjà initialisé');
      return;
    }

    try {
      console.log('🚀 Initialisation service notifications push...');
      
      this.navigationRef = navigationRef;

      // Configuration des canaux Android
      await this.setupNotificationChannels();

      // Vérification et demande des permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Permissions de notification refusées');
        return false;
      }

      // Configuration des handlers de messages
      await this.setupMessageHandlers();

      // Récupération et envoi du token FCM
      await this.setupFCMToken();

      // Configuration du badge
      await this.setupBadgeManagement();

      this.isInitialized = true;
      console.log('✅ Service notifications push initialisé');
      
      return true;

    } catch (error) {
      console.error('❌ Erreur initialisation notifications push:', error);
      return false;
    }
  }

  /**
   * 🔧 Configure les canaux de notification Android
   */
  async setupNotificationChannels() {
    if (Platform.OS !== 'android') return;

    try {
      // Suppression des anciens canaux si nécessaire
      // PushNotification.deleteChannel('old_channel_id');

      // Création des nouveaux canaux
      Object.values(this.notificationChannels).forEach(channel => {
        PushNotification.createChannel(
          {
            channelId: channel.channelId,
            channelName: channel.channelName,
            channelDescription: channel.channelDescription,
            soundName: channel.soundName,
            importance: channel.importance,
            vibrate: channel.vibrate,
          },
          (created) => {
            console.log(`📱 Canal ${channel.channelId} ${created ? 'créé' : 'existant'}`);
          }
        );
      });

      console.log('✅ Canaux de notification configurés');

    } catch (error) {
      console.error('❌ Erreur configuration canaux:', error);
    }
  }

  /**
   * 🔑 Demande les permissions de notification
   */
  async requestPermissions() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        // Afficher une alerte explicative
        Alert.alert(
          'Notifications désactivées',
          'Les notifications vous permettent de recevoir des alertes importantes et des messages de votre administrateur. Vous pouvez les activer dans les paramètres.',
          [
            { text: 'Plus tard', style: 'cancel' },
            { text: 'Paramètres', onPress: () => this.openNotificationSettings() },
          ]
        );
      }

      console.log(`🔑 Permissions notifications: ${enabled ? 'accordées' : 'refusées'}`);
      return enabled;

    } catch (error) {
      console.error('❌ Erreur demande permissions:', error);
      return false;
    }
  }

  /**
   * ⚙️ Ouvre les paramètres de notification
   */
  openNotificationSettings() {
    // TODO: Implémenter l'ouverture des paramètres
    console.log('📱 Ouverture paramètres notifications');
  }

  // =====================================
  // GESTION DES MESSAGES
  // =====================================

  /**
   * 📨 Configure les handlers de messages Firebase
   */
  async setupMessageHandlers() {
    try {
      // Message reçu en arrière-plan
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('📨 Message reçu en arrière-plan:', remoteMessage);
        await this.handleBackgroundMessage(remoteMessage);
      });

      // Message reçu quand l'app est au premier plan
      const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
        console.log('📨 Message reçu au premier plan:', remoteMessage);
        await this.handleForegroundMessage(remoteMessage);
      });

      // Notification ouverte (tap utilisateur)
      const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('👆 Notification ouverte:', remoteMessage);
        this.handleNotificationOpened(remoteMessage);
      });

      // App ouverte depuis une notification (app fermée)
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('🚀 App ouverte depuis notification:', initialNotification);
        setTimeout(() => {
          this.handleNotificationOpened(initialNotification);
        }, 2000); // Délai pour s'assurer que la navigation est prête
      }

      this.unsubscribers.push(unsubscribeOnMessage, unsubscribeOnNotificationOpenedApp);
      console.log('✅ Handlers de messages configurés');

    } catch (error) {
      console.error('❌ Erreur configuration handlers:', error);
    }
  }

  /**
   * 📱 Traite un message reçu au premier plan
   */
  async handleForegroundMessage(remoteMessage) {
    try {
      const { notification, data } = remoteMessage;
      
      // Affichage d'une notification locale car les notifications Firebase
      // ne s'affichent pas automatiquement au premier plan
      this.showLocalNotification({
        title: notification?.title || 'Nouvelle notification',
        message: notification?.body || '',
        data: data || {},
        channelId: this.getChannelId(data?.type),
      });

      // Mise à jour du badge
      await this.updateBadgeCount();

      // Traitement métier spécifique
      await this.processNotificationData(data);

    } catch (error) {
      console.error('❌ Erreur traitement message premier plan:', error);
    }
  }

  /**
   * 🔇 Traite un message reçu en arrière-plan
   */
  async handleBackgroundMessage(remoteMessage) {
    try {
      const { data } = remoteMessage;
      
      // Mise à jour du badge
      await this.updateBadgeCount();

      // Traitement métier en arrière-plan (minimal)
      await this.processNotificationData(data, true);

    } catch (error) {
      console.error('❌ Erreur traitement message arrière-plan:', error);
    }
  }

  /**
   * 👆 Traite l'ouverture d'une notification
   */
  handleNotificationOpened(remoteMessage) {
    try {
      const { data } = remoteMessage;
      
      // Navigation vers l'écran approprié
      this.navigateFromNotification(data);
      
      // Marquer la notification comme lue si applicable
      if (data?.notificationId) {
        this.markNotificationAsRead(data.notificationId);
      }

    } catch (error) {
      console.error('❌ Erreur ouverture notification:', error);
    }
  }

  /**
   * 🧭 Navigation basée sur les données de notification
   */
  navigateFromNotification(data) {
    if (!this.navigationRef?.current || !data) return;

    try {
      const { type, entityType, entityId, actionUrl } = data;

      // Navigation basée sur l'URL d'action si disponible
      if (actionUrl) {
        this.navigateToUrl(actionUrl);
        return;
      }

      // Navigation basée sur le type de notification
      switch (type) {
        case 'SYSTEM_ALERT':
        case 'WARNING':
          this.navigationRef.current.dispatch(
            CommonActions.navigate({
              name: 'Notifications',
            })
          );
          break;

        case 'ADMIN_MESSAGE':
          this.navigationRef.current.dispatch(
            CommonActions.navigate({
              name: 'Messages',
            })
          );
          break;

        case 'SOLDE_ALERT':
          this.navigationRef.current.dispatch(
            CommonActions.navigate({
              name: 'CompteDetails',
            })
          );
          break;

        case 'JOURNAL_REMINDER':
          this.navigationRef.current.dispatch(
            CommonActions.navigate({
              name: 'Journal',
            })
          );
          break;

        default:
          // Navigation vers l'écran principal par défaut
          this.navigationRef.current.dispatch(
            CommonActions.navigate({
              name: 'Dashboard',
            })
          );
      }

    } catch (error) {
      console.error('❌ Erreur navigation notification:', error);
    }
  }

  /**
   * 🔗 Navigation vers une URL spécifique
   */
  navigateToUrl(url) {
    try {
      // Parser l'URL interne de l'application
      // Exemple: /collecteur/journal/123/cloture
      const urlParts = url.split('/').filter(Boolean);
      
      if (urlParts.length >= 2) {
        const [section, screen, ...params] = urlParts;
        
        this.navigationRef.current.dispatch(
          CommonActions.navigate({
            name: this.capitalizeFirst(screen),
            params: this.parseUrlParams(params),
          })
        );
      }

    } catch (error) {
      console.error('❌ Erreur navigation URL:', error);
    }
  }

  // =====================================
  // GESTION DU TOKEN FCM
  // =====================================

  /**
   * 🔑 Configure et envoie le token FCM au serveur
   */
  async setupFCMToken() {
    try {
      // Récupération du token actuel
      const token = await messaging().getToken();
      if (token) {
        console.log('🔑 Token FCM récupéré:', token.substring(0, 20) + '...');
        await this.sendTokenToServer(token);
      }

      // Écoute des changements de token
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
        console.log('🔄 Token FCM rafraîchi:', newToken.substring(0, 20) + '...');
        await this.sendTokenToServer(newToken);
      });

      this.unsubscribers.push(unsubscribeTokenRefresh);

    } catch (error) {
      console.error('❌ Erreur configuration token FCM:', error);
    }
  }

  /**
   * 📤 Envoie le token FCM au serveur backend
   */
  async sendTokenToServer(token) {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!authToken || !userId) {
        console.warn('⚠️ Utilisateur non connecté, token FCM non envoyé');
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          fcmToken: token,
        }),
      });

      if (response.ok) {
        console.log('✅ Token FCM envoyé au serveur');
        await AsyncStorage.setItem('fcmToken', token);
      } else {
        console.error('❌ Erreur envoi token FCM:', response.status);
      }

    } catch (error) {
      console.error('❌ Erreur envoi token FCM:', error);
    }
  }

  // =====================================
  // GESTION DES NOTIFICATIONS LOCALES
  // =====================================

  /**
   * 📱 Affiche une notification locale
   */
  showLocalNotification({ title, message, data, channelId = 'general' }) {
    try {
      const channel = this.notificationChannels[channelId] || this.notificationChannels.general;

      PushNotification.localNotification({
        title,
        message,
        userInfo: data,
        channelId: channel.channelId,
        soundName: channel.soundName,
        vibrate: channel.vibrate,
        playSound: true,
        largeIcon: 'ic_launcher',
        smallIcon: 'ic_notification',
        color: data?.color || '#007AFF',
        category: data?.type || 'general',
      });

    } catch (error) {
      console.error('❌ Erreur affichage notification locale:', error);
    }
  }

  // =====================================
  // GESTION DU BADGE
  // =====================================

  /**
   * 🔢 Configure la gestion du badge de notifications
   */
  async setupBadgeManagement() {
    try {
      // Mise à jour du badge au démarrage
      await this.updateBadgeCount();

      // Écoute des changements d'état de l'app
      AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    } catch (error) {
      console.error('❌ Erreur configuration badge:', error);
    }
  }

  /**
   * 🔄 Met à jour le compteur de badge
   */
  async updateBadgeCount() {
    try {
      // TODO: Récupérer le nombre réel de notifications non lues depuis l'API
      const unreadCount = await this.getUnreadNotificationsCount();
      
      if (Platform.OS === 'ios') {
        PushNotification.setApplicationIconBadgeNumber(unreadCount);
      }

      console.log(`🔢 Badge mis à jour: ${unreadCount}`);

    } catch (error) {
      console.error('❌ Erreur mise à jour badge:', error);
    }
  }

  /**
   * 📊 Récupère le nombre de notifications non lues
   */
  async getUnreadNotificationsCount() {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return 0;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const { count } = await response.json();
        return count || 0;
      }

      return 0;

    } catch (error) {
      console.error('❌ Erreur récupération compteur notifications:', error);
      return 0;
    }
  }

  /**
   * ✅ Marque une notification comme lue
   */
  async markNotificationAsRead(notificationId) {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Mise à jour du badge après lecture
      await this.updateBadgeCount();

    } catch (error) {
      console.error('❌ Erreur marquage notification lue:', error);
    }
  }

  // =====================================
  // MÉTHODES UTILITAIRES
  // =====================================

  /**
   * 🏷️ Détermine le canal de notification
   */
  getChannelId(notificationType) {
    switch (notificationType) {
      case 'SYSTEM_ALERT': return 'system_alerts';
      case 'WARNING': return 'warnings';
      case 'REMINDER': return 'reminders';
      case 'ADMIN_MESSAGE': return 'admin_messages';
      case 'SOLDE_ALERT': return 'financial_alerts';
      default: return 'general';
    }
  }

  /**
   * 🔄 Traite les données métier d'une notification
   */
  async processNotificationData(data, isBackground = false) {
    try {
      // Traitement spécifique selon le type
      const { type, entityType, entityId } = data;

      // Exemple: mise en cache de données importantes
      if (type === 'SOLDE_ALERT' && !isBackground) {
        // Déclencher une synchronisation des données de compte
        console.log('💰 Déclenchement sync solde suite notification');
      }

      // Autre traitements métier...

    } catch (error) {
      console.error('❌ Erreur traitement données notification:', error);
    }
  }

  /**
   * 📱 Gère les changements d'état de l'app
   */
  handleAppStateChange(nextAppState) {
    if (nextAppState === 'active') {
      // App au premier plan - mise à jour du badge
      this.updateBadgeCount();
    }
  }

  /**
   * 🔤 Met en forme un texte (première lettre majuscule)
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 🔗 Parse les paramètres d'URL
   */
  parseUrlParams(params) {
    const result = {};
    for (let i = 0; i < params.length; i += 2) {
      if (params[i + 1]) {
        result[params[i]] = params[i + 1];
      }
    }
    return result;
  }

  // =====================================
  // NETTOYAGE
  // =====================================

  /**
   * 🧹 Nettoie les ressources du service
   */
  cleanup() {
    try {
      // Désabonnement des listeners
      this.unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });

      this.unsubscribers = [];
      this.isInitialized = false;

      console.log('🧹 Service notifications nettoyé');

    } catch (error) {
      console.error('❌ Erreur nettoyage service notifications:', error);
    }
  }
}

// Export de l'instance singleton
const pushNotificationService = new PushNotificationClientService();
export default pushNotificationService;