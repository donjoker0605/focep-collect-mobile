// src/services/adminNotificationService.js - CORRECTION CRITIQUE DES URLs
import BaseApiService from './base/BaseApiService';

class AdminNotificationService extends BaseApiService {
  constructor() {
    super();
    
    // Cache pour améliorer les performances
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // ===================================================
  // 📊 DASHBOARD ADMIN
  // ===================================================

  /**
   * 📊 Dashboard principal
   */
  async getDashboard() {
    try {
      // ❌ AVANT: '/api/admin/notifications/dashboard' (double /api/)
      // ✅ APRÈS: '/admin/notifications/dashboard' (baseURL déjà /api/)
      console.log('📊 API: GET /admin/notifications/dashboard');
      
      const response = await this.axios.get('/admin/notifications/dashboard');
      return this.formatResponse(response, 'Dashboard récupéré');

    } catch (error) {
      throw this.handleError(error, 'Erreur dashboard admin');
    }
  }

  /**
   * 🚨 Notifications critiques
   */
  async getCriticalNotifications() {
    try {
      console.log('🚨 API: GET /admin/notifications/critical');
      
      const response = await this.axios.get('/admin/notifications/critical');
      return this.formatResponse(response, 'Notifications critiques récupérées');

    } catch (error) {
      throw this.handleError(error, 'Erreur notifications critiques');
    }
  }

  /**
   * 🔢 Statistiques
   */
  async getStats() {
    try {
      console.log('🔢 API: GET /admin/notifications/stats');
      
      const response = await this.axios.get('/admin/notifications/stats');
      return this.formatResponse(response, 'Statistiques récupérées');

    } catch (error) {
      throw this.handleError(error, 'Erreur statistiques');
    }
  }

  // ===================================================
  // 📋 GESTION DES NOTIFICATIONS
  // ===================================================

  /**
   * 📋 Liste paginée des notifications
   */
  async getAllNotifications({
    page = 0,
    size = 20,
    sort = 'dateCreation',
    direction = 'desc',
    type = null,
    priority = null,
    unreadOnly = false
  } = {}) {
    try {
      console.log('📋 API: GET /admin/notifications');
      
      const params = {
        page,
        size,
        sort,
        direction,
        unreadOnly
      };
      
      if (type) params.type = type;
      if (priority) params.priority = priority;

      const response = await this.axios.get('/admin/notifications', { params });
      return this.formatResponse(response, 'Notifications récupérées');

    } catch (error) {
      throw this.handleError(error, 'Erreur récupération notifications');
    }
  }

  /**
   * ✅ Marquer notification comme lue
   */
  async markAsRead(notificationId) {
    try {
      console.log('✅ API: PUT /admin/notifications/', notificationId, '/read');
      
      const response = await this.axios.put(`/admin/notifications/${notificationId}/read`);
      
      // Invalider le cache
      this.invalidateCache(['dashboard', 'critical', 'stats']);
      
      return this.formatResponse(response, 'Notification marquée comme lue');

    } catch (error) {
      throw this.handleError(error, 'Erreur marquage lecture');
    }
  }

  /**
   * ✅ Marquer toutes comme lues
   */
  async markAllAsRead() {
    try {
      console.log('✅ API: PUT /admin/notifications/read-all');
      
      const response = await this.axios.put('/admin/notifications/read-all');
      
      // Invalider tout le cache
      this.cache.clear();
      
      return this.formatResponse(response, 'Toutes notifications marquées comme lues');

    } catch (error) {
      throw this.handleError(error, 'Erreur marquage global');
    }
  }

  /**
   * 🗑️ Supprimer notification
   */
  async deleteNotification(notificationId) {
    try {
      console.log('🗑️ API: DELETE /admin/notifications/', notificationId);
      
      const response = await this.axios.delete(`/admin/notifications/${notificationId}`);
      
      // Invalider le cache
      this.invalidateCache(['dashboard', 'critical', 'stats']);
      
      return this.formatResponse(response, 'Notification supprimée');

    } catch (error) {
      throw this.handleError(error, 'Erreur suppression notification');
    }
  }

  // ===================================================
  // 🔢 COMPTEURS ET MÉTRIQUES
  // ===================================================

  /**
   * 🔢 Nombre notifications non lues
   */
  async getUnreadCount() {
    try {
      console.log('🔢 API: GET /admin/notifications/unread-count');
      
      const response = await this.axios.get('/admin/notifications/unread-count');
      return this.formatResponse(response, 'Compteur récupéré');

    } catch (error) {
      throw this.handleError(error, 'Erreur comptage');
    }
  }

  /**
   * 🔢 Nombre notifications critiques
   */
  async getCriticalCount() {
    try {
      console.log('🔢 API: GET /admin/notifications/critical-count');
      
      const response = await this.axios.get('/admin/notifications/critical-count');
      return this.formatResponse(response, 'Compteur critiques récupéré');

    } catch (error) {
      throw this.handleError(error, 'Erreur comptage critiques');
    }
  }

  // ===================================================
  // 🔍 FILTRES ET RECHERCHE
  // ===================================================

  /**
   * 🔍 Notifications par collecteur
   */
  async getNotificationsByCollecteur(collecteurId) {
    try {
      console.log('🔍 API: GET /admin/notifications/collecteur/', collecteurId);
      
      const response = await this.axios.get(`/admin/notifications/collecteur/${collecteurId}`);
      return this.formatResponse(response, 'Notifications collecteur récupérées');

    } catch (error) {
      throw this.handleError(error, 'Erreur notifications collecteur');
    }
  }

  /**
   * 🔍 Notifications par période
   */
  async getNotificationsByPeriod(dateDebut, dateFin) {
    try {
      console.log('🔍 API: GET /admin/notifications/period');
      
      const params = new URLSearchParams({
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString()
      });

      const response = await this.axios.get(`/admin/notifications/period?${params}`);
      return this.formatResponse(response, 'Notifications période récupérées');

    } catch (error) {
      throw this.handleError(error, 'Erreur notifications période');
    }
  }

  // ===================================================
  // ⚙️ CONFIGURATION
  // ===================================================

  /**
   * ⚙️ Récupérer configuration
   */
  async getSettings() {
    try {
      console.log('⚙️ API: GET /admin/notifications/settings');
      
      const response = await this.axios.get('/admin/notifications/settings');
      return this.formatResponse(response, 'Configuration récupérée');

    } catch (error) {
      throw this.handleError(error, 'Erreur configuration');
    }
  }

  /**
   * ⚙️ Mettre à jour configuration
   */
  async updateSettings(settings) {
    try {
      console.log('⚙️ API: PUT /admin/notifications/settings');
      
      const response = await this.axios.put('/admin/notifications/settings', settings);
      return this.formatResponse(response, 'Configuration mise à jour');

    } catch (error) {
      throw this.handleError(error, 'Erreur mise à jour configuration');
    }
  }

  // ===================================================
  // 🧪 TESTS ET MAINTENANCE
  // ===================================================

  /**
   * 🧪 Créer notification de test
   */
  async createTestNotification(testData) {
    try {
      console.log('🧪 API: POST /admin/notifications/test');
      
      const response = await this.axios.post('/admin/notifications/test', testData);
      
      // Invalider le cache pour forcer le rafraîchissement
      this.invalidateCache(['dashboard', 'critical']);
      
      return this.formatResponse(response, 'Notification test créée');

    } catch (error) {
      throw this.handleError(error, 'Erreur création notification test');
    }
  }

  /**
   * 📧 Renvoyer email notification
   */
  async resendEmail(notificationId) {
    try {
      console.log('📧 API: POST /admin/notifications/', notificationId, '/resend-email');
      
      const response = await this.axios.post(`/admin/notifications/${notificationId}/resend-email`);
      return this.formatResponse(response, 'Email renvoyé');

    } catch (error) {
      throw this.handleError(error, 'Erreur renvoi email');
    }
  }

  /**
   * 🧹 Nettoyer anciennes notifications
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      console.log('🧹 API: DELETE /admin/notifications/cleanup');
      
      const response = await this.axios.delete('/admin/notifications/cleanup', {
        params: { daysOld }
      });
      
      // Invalider tout le cache
      this.cache.clear();
      
      return this.formatResponse(response, 'Nettoyage effectué');

    } catch (error) {
      throw this.handleError(error, 'Erreur nettoyage');
    }
  }

  // ===================================================
  // 🔧 UTILITAIRES CACHE
  // ===================================================

  /**
   * Invalider certaines clés du cache
   */
  invalidateCache(keys) {
    keys.forEach(key => {
      this.cache.delete(key);
    });
  }

  /**
   * Vérifier si une donnée en cache est encore valide
   */
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * Mettre en cache avec timestamp
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Récupérer du cache si valide
   */
  getCache(key) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key).data;
    }
    return null;
  }

  // ===================================================
  // 🔄 POLLING INTELLIGENT (MÉTHODE MANQUANTE)
  // ===================================================

  /**
   * 🔄 Démarrer le polling intelligent des notifications
   */
  startIntelligentPolling(callback, options = {}) {
    const defaultOptions = {
      initialDelay: 2000,       // 2 secondes avant le premier poll
      normalInterval: 30000,    // 30 secondes normalement
      activeInterval: 10000,    // 10 secondes si activité
      maxRetries: 3,
      retryDelay: 5000
    };

    const config = { ...defaultOptions, ...options };
    
    console.log('🔄 Démarrage polling intelligent admin notifications');
    
    let retryCount = 0;
    let currentInterval = config.normalInterval;
    let isPolling = false;

    const poll = async () => {
      if (isPolling) return; // Éviter les appels multiples
      
      isPolling = true;
      
      try {
        console.log('🔄 Exécution polling dashboard admin...');
        console.log(`⏰ Prochain polling admin dans ${currentInterval/1000}s`);
        
        // Récupérer dashboard et notifications critiques
        const [dashboardResult, criticalResult] = await Promise.allSettled([
          this.getDashboard(),
          this.getCriticalNotifications()
        ]);

        const hasError = dashboardResult.status === 'rejected' || criticalResult.status === 'rejected';
        
        if (hasError) {
          retryCount++;
          console.warn(`⚠️ Circuit breaker échec ${retryCount}/${config.maxRetries}`);
          
          if (retryCount >= config.maxRetries) {
            console.error(`⚡ Circuit breaker -> OPEN (${retryCount} échecs) - réouverture dans ${config.retryDelay/1000}s`);
            this.stopIntelligentPolling();
            return;
          }
          
          // Retry avec délai
          setTimeout(poll, config.retryDelay);
          return;
        }

        // Reset retry count on success
        retryCount = 0;
        
        // ✅ CORRECTION : Appeler le callback avec la structure attendue par le screen
        if (callback && dashboardResult.status === 'fulfilled') {
          callback(dashboardResult.value);
        }

        // Programmer le prochain poll
        this.pollingTimeout = setTimeout(poll, currentInterval);
        
      } catch (error) {
        console.error('❌ Erreur polling dashboard:', error);
        retryCount++;
        
        if (retryCount < config.maxRetries) {
          setTimeout(poll, config.retryDelay);
        } else {
          this.stopIntelligentPolling();
        }
      } finally {
        isPolling = false;
      }
    };

    // Démarrer le polling après le délai initial
    this.pollingTimeout = setTimeout(poll, config.initialDelay);
    
    return {
      stop: () => this.stopIntelligentPolling(),
      changeInterval: (newInterval) => {
        currentInterval = newInterval;
        console.log(`🔄 Intervalle polling changé: ${newInterval}ms`);
      }
    };
  }

  /**
   * ⏹️ Arrêter le polling intelligent
   */
  stopIntelligentPolling() {
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
      console.log('⏹️ Arrêt polling admin notifications');
    }
  }

  /**
   * 🔄 Vérifier si le polling est actif
   */
  isPollingActive() {
    return !!this.pollingTimeout;
  }

  // ✅ ALIAS POUR COMPATIBILITÉ AVEC L'ANCIEN CODE
  stopPolling() {
    return this.stopIntelligentPolling();
  }
}

export default new AdminNotificationService();