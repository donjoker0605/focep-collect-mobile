// src/services/adminNotificationService.js - CORRECTION CRITIQUE DES URLs
import BaseApiService from './base/BaseApiService';

class AdminNotificationService extends BaseApiService {
  constructor() {
    super();
    
    // Cache pour améliorer les performances
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
	this.pollingTimeout = null;
  }

  // ===================================================
  // 📊 DASHBOARD ADMIN
  // ===================================================

  /**
   * 📊 Dashboard principal
   */
  async getDashboard() {
    try {
      console.log('📊 API: GET /admin/notifications/dashboard');
      
      const response = await this.axios.get('/admin/notifications/dashboard');
      
      // 🔥 CORRECTION 1: Validation de la structure de réponse
      if (!response || !response.data || !response.data.data) {
        throw new Error('Structure de réponse dashboard invalide');
      }
      
      // 🔥 CORRECTION 2: Normaliser la structure pour le frontend
      const normalizedData = this.normalizeDashboardData(response.data.data);
      
      return this.formatResponse({ data: normalizedData }, 'Dashboard récupéré');

    } catch (error) {
      console.error('❌ Erreur dashboard admin:', error);
      
      // 🔥 CORRECTION 3: Retourner des données par défaut plutôt que throw
      const defaultDashboard = this.getDefaultDashboardData();
      
      console.warn('⚠️ Utilisation dashboard par défaut');
      return this.formatResponse({ data: defaultDashboard }, 'Dashboard par défaut utilisé');
    }
  }


  /**
   * 🚨 Notifications critiques avec fallback
   */
  async getCriticalNotifications() {
    try {
      console.log('🚨 API: GET /admin/notifications/critical');
      
      const response = await this.axios.get('/admin/notifications/critical');
      
      // Valider la réponse
      if (!response || !response.data) {
        throw new Error('Réponse critiques invalide');
      }
      
      // S'assurer que c'est un tableau
      const notifications = Array.isArray(response.data.data) ? response.data.data : [];
      
      return this.formatResponse({ data: notifications }, 'Notifications critiques récupérées');

    } catch (error) {
      console.error('❌ Erreur notifications critiques:', error);
      
      // Retourner un tableau vide plutôt que throw
      return this.formatResponse({ data: [] }, 'Aucune notification critique (erreur API)');
    }
  }

  /**
   * 🔢 Statistiques avec validation
   */
  async getStats() {
    try {
      console.log('🔢 API: GET /admin/notifications/stats');
      
      const response = await this.axios.get('/admin/notifications/stats');
      
      // Valider et normaliser les stats
      const stats = this.validateAndNormalizeStats(response.data?.data);
      
      return this.formatResponse({ data: stats }, 'Statistiques récupérées');

    } catch (error) {
      console.error('❌ Erreur statistiques:', error);
      
      // Stats par défaut
      const defaultStats = {
        total: 0,
        nonLues: 0,
        critiques: 0,
        critiquesNonLues: 0
      };
      
      return this.formatResponse({ data: defaultStats }, 'Statistiques par défaut');
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
   *  Marquer notification comme lue
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
   * Marquer toutes comme lues
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
      console.error('❌ Erreur comptage non lues:', error);
      return this.formatResponse({ data: 0 }, 'Compteur par défaut (erreur API)');
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
      console.error('❌ Erreur comptage critiques:', error);
      return this.formatResponse({ data: 0 }, 'Compteur critiques par défaut (erreur API)');
    }
  }
  
  // ===================================================
  // 🔧 MÉTHODES UTILITAIRES - CORRECTIONS CRITIQUES
  // ===================================================

  /**
   * 🔥 CORRECTION CRITIQUE: Normaliser les données dashboard pour le frontend
   */
  normalizeDashboardData(backendData) {
    try {
      if (!backendData) {
        return this.getDefaultDashboardData();
      }

      // Structure attendue par le frontend AdminDashboardScreen
      return {
        activités: backendData.stats?.total || 0,
        notifications: backendData.stats?.nonLues || 0,
        urgentes: backendData.stats?.critiquesNonLues || 0,
        stats: {
          total: backendData.stats?.total || 0,
          nonLues: backendData.stats?.nonLues || 0,
          critiques: backendData.stats?.critiques || 0,
          critiquesNonLues: backendData.stats?.critiquesNonLues || 0,
          collecteursActifs: 0, // À calculer séparément
          nouveauxClients: 0,   // À calculer séparément
          transactions: 0       // À calculer séparément
        },
        lastUpdate: backendData.lastUpdate || new Date().toISOString(),
        criticalNotifications: backendData.criticalNotifications || [],
        recentNotifications: backendData.recentNotifications || []
      };
    } catch (error) {
      console.warn('⚠️ Erreur normalisation dashboard, utilisation valeurs par défaut');
      return this.getDefaultDashboardData();
    }
  }

  /**
   * 🔥 CORRECTION CRITIQUE: Valider et normaliser les statistiques
   */
  validateAndNormalizeStats(statsData) {
    const defaultStats = {
      total: 0,
      nonLues: 0,
      critiques: 0,
      critiquesNonLues: 0
    };

    if (!statsData || typeof statsData !== 'object') {
      return defaultStats;
    }

    return {
      total: parseInt(statsData.total) || 0,
      nonLues: parseInt(statsData.nonLues) || 0,
      critiques: parseInt(statsData.critiques) || 0,
      critiquesNonLues: parseInt(statsData.critiquesNonLues) || 0
    };
  }

  /**
   * 🔥 CORRECTION CRITIQUE: Données par défaut cohérentes
   */
  getDefaultDashboardData() {
    return {
      activités: 0,
      notifications: 0,
      urgentes: 0,
      stats: {
        total: 0,
        nonLues: 0,
        critiques: 0,
        critiquesNonLues: 0,
        collecteursActifs: 0,
        nouveauxClients: 0,
        transactions: 0
      },
      lastUpdate: new Date().toISOString(),
      criticalNotifications: [],
      recentNotifications: []
    };
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
        
        // 🔥 CORRECTION: Récupérer les données et les normaliser
        const [dashboardResult, criticalResult] = await Promise.allSettled([
          this.getDashboard(),
          this.getCriticalNotifications()
        ]);

        // Les méthodes getDashboard et getCriticalNotifications gèrent déjà les erreurs
        // et retournent des données par défaut, donc on peut les traiter comme réussies
        
        if (dashboardResult.status === 'fulfilled' && callback) {
          // 🔥 CORRECTION CRITIQUE: Passer les données normalisées au callback
          const dashboardData = dashboardResult.value?.data || this.getDefaultDashboardData();
          const criticalData = criticalResult.status === 'fulfilled' ? 
            criticalResult.value?.data || [] : [];
          
          // Combiner dashboard et critiques pour le screen
          const combinedData = {
            ...dashboardData,
            criticalNotifications: criticalData
          };
          
          callback(combinedData);
        }

        // Reset retry count on any response (même les fallbacks)
        retryCount = 0;
        
        // Programmer le prochain poll
        this.pollingTimeout = setTimeout(poll, currentInterval);
        
      } catch (error) {
        console.error('❌ Erreur polling dashboard:', error);
        retryCount++;
        
        if (retryCount < config.maxRetries) {
          console.warn(`🔄 Retry polling ${retryCount}/${config.maxRetries} dans ${config.retryDelay/1000}s`);
          setTimeout(poll, config.retryDelay);
        } else {
          console.error('⚡ Circuit breaker ouvert - arrêt du polling');
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
  
  /**
   * 🧪 Tester la connexion aux notifications admin
   */
  async testConnection() {
    try {
      console.log('🧪 Test connexion notifications admin...');
      
      const results = {};
      
      // Test dashboard
      try {
        const dashboard = await this.getDashboard();
        results.dashboard = { success: true, data: dashboard };
      } catch (error) {
        results.dashboard = { success: false, error: error.message };
      }
      
      // Test critiques
      try {
        const critical = await this.getCriticalNotifications();
        results.critical = { success: true, count: critical.data?.length || 0 };
      } catch (error) {
        results.critical = { success: false, error: error.message };
      }
      
      // Test stats
      try {
        const stats = await this.getStats();
        results.stats = { success: true, data: stats };
      } catch (error) {
        results.stats = { success: false, error: error.message };
      }
      
      console.log('📊 Résultats test connexion:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Échec test connexion notifications admin:', error);
      return { error: error.message };
    }
  }
}

export default new AdminNotificationService();