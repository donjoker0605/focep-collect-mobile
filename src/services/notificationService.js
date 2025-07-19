// src/services/notificationService.js - VERSION CORRIGÉE ET COMPLÈTE
import BaseApiService from './base/BaseApiService';

/**
 * 🔔 Service pour la gestion des notifications collecteur
 * VERSION CORRIGÉE alignée avec le backend SpringBoot
 */
class NotificationService extends BaseApiService {
  constructor() {
    super();
    
    // Configuration locale
    this.pollingInterval = null;
    this.isPolling = false;
  }

  /**
   * 📋 Récupérer les notifications d'un collecteur
   */
  async getNotifications(page = 0, size = 10) {
    try {
      console.log('📋 API: GET /notifications - page:', page, 'size:', size);
      
      const response = await this.axios.get('/notifications', { 
        params: { page, size } 
      });
      
      return this.formatResponse(response, 'Notifications récupérées');
    } catch (error) {
      console.error('❌ Erreur getNotifications:', error);
      
      // Si l'endpoint n'existe pas côté backend, retourner des données vides
      if (error.response?.status === 404) {
        console.warn('⚠️ Endpoint notifications non implémenté côté backend');
        return {
          data: [],
          totalElements: 0,
          unreadCount: 0,
          success: true,
          warning: 'Endpoint notifications non disponible'
        };
      }
      
      throw this.handleError(error, 'Erreur lors de la récupération des notifications');
    }
  }

  /**
   * ✅ Marquer une notification comme lue
   */
  async markAsRead(notificationId) {
    try {
      console.log('✅ API: PATCH /notifications/', notificationId, '/read');
      
      const response = await this.axios.patch(`/notifications/${notificationId}/read`);
      return this.formatResponse(response, 'Notification marquée comme lue');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du marquage comme lu');
    }
  }

  /**
   * ✅ Marquer toutes les notifications comme lues
   */
  async markAllAsRead() {
    try {
      console.log('✅ API: PATCH /notifications/mark-all-read');
      
      const response = await this.axios.patch('/notifications/mark-all-read');
      return this.formatResponse(response, 'Toutes les notifications marquées comme lues');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du marquage global');
    }
  }

  /**
   * 🔢 Nombre de notifications non lues
   */
  async getUnreadCount() {
    try {
      console.log('🔢 API: GET /notifications/unread-count');
      
      const response = await this.axios.get('/notifications/unread-count');
      return this.formatResponse(response, 'Compteur récupéré');
    } catch (error) {
      console.error('❌ Erreur comptage non lues:', error);
      // Retourner 0 par défaut plutôt que de faire échouer
      return { data: 0, success: true };
    }
  }

  /**
   * 🆕 SPÉCIFIQUE VERSEMENTS: Notifications de clôture de journal
   */
  async getNotificationsVersement(collecteurId) {
    try {
      console.log('💰 API: GET /notifications/versements pour collecteur:', collecteurId);
      
      const response = await this.axios.get(`/notifications/versements`, {
        params: { collecteurId }
      });
      
      return this.formatResponse(response, 'Notifications versement récupérées');
    } catch (error) {
      console.error('❌ Erreur notifications versement:', error);
      
      // Fallback: retourner notifications générales
      return this.getNotifications();
    }
  }

  /**
   * 🎫 NOUVEAU: Récupérer le ticket d'autorisation de versement
   */
  async getTicketAutorisation(versementId) {
    try {
      console.log('🎫 API: GET /versements/', versementId, '/ticket');
      
      const response = await this.axios.get(`/versements/${versementId}/ticket`);
      return this.formatResponse(response, 'Ticket récupéré');
    } catch (error) {
      console.warn('⚠️ Ticket non disponible, génération locale');
      
      // Fallback: générer un ticket simple côté client
      return {
        data: {
          numeroAutorisation: `TMP-${Date.now()}`,
          message: "Ticket temporaire - Contactez l'administrateur",
          dateExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        success: true,
        isTemporary: true
      };
    }
  }

  /**
   * 🔄 POLLING INTELLIGENT pour les notifications
   */
  startPolling(callback, options = {}) {
    if (this.isPolling) {
      console.warn('⚠️ Polling déjà en cours');
      return;
    }

    const config = {
      interval: 30000, // 30 secondes par défaut
      maxRetries: 3,
      onError: null,
      ...options
    };

    console.log('🔄 Démarrage polling notifications - Intervalle:', config.interval);
    
    this.isPolling = true;
    let retryCount = 0;

    const poll = async () => {
      if (!this.isPolling) return;

      try {
        console.log('🔄 Polling notifications...');
        
        const [notifications, unreadCount] = await Promise.allSettled([
          this.getNotifications(0, 5), // Dernières 5 notifications
          this.getUnreadCount()
        ]);

        const notifData = notifications.status === 'fulfilled' ? notifications.value : { data: [] };
        const countData = unreadCount.status === 'fulfilled' ? unreadCount.value : { data: 0 };

        if (callback) {
          callback({
            notifications: notifData.data || [],
            unreadCount: countData.data || 0,
            lastUpdate: new Date(),
            success: true
          });
        }

        retryCount = 0; // Reset retry count on success

      } catch (error) {
        console.error('❌ Erreur polling notifications:', error);
        retryCount++;

        if (retryCount >= config.maxRetries) {
          console.error('💥 Arrêt du polling après', config.maxRetries, 'échecs');
          this.stopPolling();
          
          if (config.onError) {
            config.onError(error);
          }
          return;
        }

        console.warn(`⚠️ Retry ${retryCount}/${config.maxRetries} dans 5s`);
        setTimeout(poll, 5000);
        return;
      }

      // Programmer le prochain poll
      this.pollingInterval = setTimeout(poll, config.interval);
    };

    // Démarrer le polling
    poll();

    return {
      stop: () => this.stopPolling(),
      changeInterval: (newInterval) => {
        console.log('🔄 Changement intervalle polling:', newInterval);
        config.interval = newInterval;
      }
    };
  }

  /**
   * ⏹️ Arrêter le polling
   */
  stopPolling() {
    console.log('⏹️ Arrêt polling notifications');
    
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * 📱 SIMULATION: Notification push locale
   */
  async simulateVersementNotification(type, data) {
    console.log('📱 Simulation notification versement:', type, data);

    const notifications = {
      'CLOTURE_OK': {
        title: '✅ Journal clôturé',
        message: `Votre journal a été clôturé. Montant: ${data.montant} FCFA`,
        type: 'success',
        action: 'ALLER_VERSER'
      },
      'MANQUANT_DETECTE': {
        title: '⚠️ Manquant détecté',
        message: `Manquant de ${data.manquant} FCFA. Contactez l'agence.`,
        type: 'warning',
        action: 'CONTACT_AGENCE'
      },
      'EXCEDENT_DETECTE': {
        title: '💰 Excédent détecté',
        message: `Excédent de ${data.excedent} FCFA crédité à votre compte.`,
        type: 'info',
        action: 'VOIR_DETAILS'
      }
    };

    const notification = notifications[type];
    if (!notification) {
      console.warn('⚠️ Type de notification inconnue:', type);
      return;
    }

    // Simuler l'affichage (dans une vraie app, utiliser le système de notifications natif)
    if (window.showNotification) {
      window.showNotification(notification);
    } else {
      console.log('📢 NOTIFICATION:', notification);
    }

    return notification;
  }

  /**
   * 🧪 Test de connectivité
   */
  async testConnection() {
    try {
      console.log('🧪 Test connexion notifications...');
      
      const response = await this.axios.get('/notifications', { 
        params: { page: 0, size: 1 }
      });
      
      console.log('✅ Connexion notifications OK');
      return { success: true, response };
      
    } catch (error) {
      console.error('❌ Test connexion notifications échoué:', error);
      return { 
        success: false, 
        error: error.message,
        fallbackAvailable: true 
      };
    }
  }

  /**
   * 🔧 Configuration du service
   */
  configure(options = {}) {
    console.log('🔧 Configuration NotificationService:', options);
    
    if (options.baseURL) {
      this.axios.defaults.baseURL = options.baseURL;
    }
    
    if (options.timeout) {
      this.axios.defaults.timeout = options.timeout;
    }
    
    if (options.headers) {
      Object.assign(this.axios.defaults.headers, options.headers);
    }
  }

  /**
   * 📊 Statistiques du service
   */
  getStats() {
    return {
      isPolling: this.isPolling,
      pollingInterval: this.pollingInterval ? 'actif' : 'inactif',
      lastRequest: this.lastRequestTime || null,
      requestCount: this.requestCount || 0
    };
  }
}

export default new NotificationService();