// ===================================================
// 📱 ADMIN NOTIFICATION SERVICE - REACT NATIVE
// ===================================================
// Version complète intégrée avec votre API Spring Boot

import BaseApiService from './base/BaseApiService';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AdminNotificationService extends BaseApiService {
  constructor() {
    super();
    this.pollingInterval = null;
    this.circuitBreaker = new PollingCircuitBreaker();
    this.listeners = new Set();
    this.lastDashboardData = null;
    this.isPolling = false;
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 secondes
  }

  // ===================================================
  // 📊 DASHBOARD ET STATISTIQUES
  // ===================================================

  /**
   * 📊 Dashboard principal des notifications
   */
  async getDashboard() {
    try {
      console.log('📊 API: GET /api/admin/notifications/dashboard');
      
      // Vérifier cache
      const cached = this.getFromCache('dashboard');
      if (cached) {
        console.log('📊 Dashboard depuis cache');
        return cached;
      }
      
      const response = await this.axios.get('/api/admin/notifications/dashboard');
      const data = this.formatResponse(response, 'Dashboard récupéré');
      
      // Mettre en cache
      this.setCache('dashboard', data);
      this.lastDashboardData = data;
      
      return data;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      throw this.handleError(error, 'Erreur dashboard admin');
    }
  }

  /**
   * 📋 Récupérer toutes les notifications avec filtres
   */
  async getAllNotifications(options = {}) {
    try {
      const {
        page = 0,
        size = 20,
        sort = 'dateCreation',
        direction = 'desc',
        type = null,
        priority = null,
        unreadOnly = false
      } = options;

      console.log('📋 API: GET /api/admin/notifications', options);

      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort,
        direction,
        unreadOnly: unreadOnly.toString()
      });

      if (type) params.append('type', type);
      if (priority) params.append('priority', priority);

      const response = await this.axios.get(`/api/admin/notifications?${params}`);
      return this.formatResponse(response, 'Notifications récupérées');

    } catch (error) {
      throw this.handleError(error, 'Erreur récupération notifications');
    }
  }

  /**
   * 🚨 Notifications critiques non lues
   */
  async getCriticalNotifications() {
    try {
      console.log('🚨 API: GET /api/admin/notifications/critical');
      
      const cached = this.getFromCache('critical');
      if (cached) {
        return cached;
      }
      
      const response = await this.axios.get('/api/admin/notifications/critical');
      const data = this.formatResponse(response, 'Notifications critiques récupérées');
      
      this.setCache('critical', data, 15000); // Cache 15s seulement
      return data;

    } catch (error) {
      throw this.handleError(error, 'Erreur notifications critiques');
    }
  }

  /**
   * 🔢 Statistiques des notifications
   */
  async getStats() {
    try {
      console.log('🔢 API: GET /api/admin/notifications/stats');
      
      const response = await this.axios.get('/api/admin/notifications/stats');
      return this.formatResponse(response, 'Statistiques récupérées');

    } catch (error) {
      throw this.handleError(error, 'Erreur statistiques');
    }
  }

  // ===================================================
  // ✅ ACTIONS SUR NOTIFICATIONS
  // ===================================================

  /**
   * ✅ Marquer notification comme lue
   */
  async markAsRead(notificationId) {
    try {
      console.log('✅ API: PUT /api/admin/notifications/', notificationId, '/read');
      
      const response = await this.axios.put(`/api/admin/notifications/${notificationId}/read`);
      
      // Invalider le cache
      this.invalidateCache(['dashboard', 'critical', 'stats']);
      
      return this.formatResponse(response, 'Notification marquée comme lue');

    } catch (error) {
      throw this.handleError(error, 'Erreur mise à jour notification');
    }
  }

  /**
   * ✅ Marquer toutes les notifications comme lues
   */
  async markAllAsRead() {
    try {
      console.log('✅ API: PUT /api/admin/notifications/read-all');
      
      const response = await this.axios.put('/api/admin/notifications/read-all');
      
      // Invalider tout le cache
      this.clearCache();
      
      return this.formatResponse(response, 'Toutes notifications marquées comme lues');

    } catch (error) {
      throw this.handleError(error, 'Erreur marquage global');
    }
  }

  /**
   * 🗑️ Supprimer une notification
   */
  async deleteNotification(notificationId) {
    try {
      console.log('🗑️ API: DELETE /api/admin/notifications/', notificationId);
      
      const response = await this.axios.delete(`/api/admin/notifications/${notificationId}`);
      
      // Invalider le cache
      this.invalidateCache(['dashboard', 'stats']);
      
      return this.formatResponse(response, 'Notification supprimée');

    } catch (error) {
      throw this.handleError(error, 'Erreur suppression notification');
    }
  }

  // ===================================================
  // 🔢 COMPTEURS
  // ===================================================

  /**
   * 🔢 Compter notifications non lues
   */
  async getUnreadCount() {
    try {
      const response = await this.axios.get('/api/admin/notifications/unread-count');
      return this.formatResponse(response);

    } catch (error) {
      console.error('❌ Erreur comptage non lues:', error);
      return { success: false, data: 0, error: error.message };
    }
  }

  /**
   * 🔢 Compter notifications critiques
   */
  async getCriticalCount() {
    try {
      const response = await this.axios.get('/api/admin/notifications/critical-count');
      return this.formatResponse(response);

    } catch (error) {
      console.error('❌ Erreur comptage critiques:', error);
      return { success: false, data: 0, error: error.message };
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
      console.log('🔍 API: GET /api/admin/notifications/collecteur/', collecteurId);
      
      const response = await this.axios.get(`/api/admin/notifications/collecteur/${collecteurId}`);
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
      console.log('🔍 API: GET /api/admin/notifications/period');
      
      const params = new URLSearchParams({
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString()
      });

      const response = await this.axios.get(`/api/admin/notifications/period?${params}`);
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
      console.log('⚙️ API: GET /api/admin/notifications/settings');
      
      const response = await this.axios.get('/api/admin/notifications/settings');
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
      console.log('⚙️ API: PUT /api/admin/notifications/settings');
      
      const response = await this.axios.put('/api/admin/notifications/settings', settings);
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
      console.log('🧪 API: POST /api/admin/notifications/test');
      
      const response = await this.axios.post('/api/admin/notifications/test', testData);
      
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
      console.log('📧 API: POST /api/admin/notifications/', notificationId, '/resend-email');
      
      const response = await this.axios.post(`/api/admin/notifications/${notificationId}/resend-email`);
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
      console.log('🧹 API: DELETE /api/admin/notifications/cleanup');
      
      const response = await this.axios.delete(`/api/admin/notifications/cleanup?daysOld=${daysOld}`);
      
      // Invalider le cache
      this.invalidateCache(['dashboard', 'stats']);
      
      return this.formatResponse(response, 'Nettoyage effectué');

    } catch (error) {
      throw this.handleError(error, 'Erreur nettoyage');
    }
  }

  // ===================================================
  // 🔄 POLLING INTELLIGENT ADAPTATIF
  // ===================================================

  /**
   * 🔄 Démarrage polling avec intervalle adaptatif
   */
  startIntelligentPolling(callback) {
    if (this.isPolling) {
      this.stopPolling();
    }
    
    console.log('🔄 Démarrage polling intelligent admin notifications');
    this.isPolling = true;
    this.listeners.add(callback);
    
    // Premier appel immédiat
    this.executePoll();
    
    // Démarrer cycle de polling adaptatif
    this.scheduleNextPoll();

    // Écouter changements d'état de l'app
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * 🔄 Exécuter un cycle de polling
   */
  async executePoll() {
    if (!this.circuitBreaker.shouldPoll()) {
      console.log('⚡ Circuit breaker ouvert - polling suspendu');
      this.scheduleNextPoll();
      return;
    }

    try {
      console.log('🔄 Exécution polling dashboard admin...');
      
      // Récupérer dashboard + stats critiques
      const [dashboard, criticalCount] = await Promise.all([
        this.getDashboard(),
        this.getCriticalCount()
      ]);

      this.circuitBreaker.recordSuccess();
      
      // Détecter changements significatifs
      const hasSignificantChanges = this.detectSignificantChanges(dashboard);
      
      // Construire données enrichies
      const enrichedData = {
        ...dashboard,
        criticalCount: criticalCount.data || 0,
        hasChanges: hasSignificantChanges,
        lastPoll: new Date().toISOString()
      };
      
      // Notifier listeners
      this.notifyListeners(enrichedData, hasSignificantChanges);
      
    } catch (error) {
      this.circuitBreaker.recordFailure();
      console.error('❌ Erreur polling dashboard:', error);
      
      // Notifier listeners de l'erreur
      this.notifyListeners(null, false, error);
    }
  }

  /**
   * 📊 Détecter changements significatifs
   */
  detectSignificantChanges(newData) {
    if (!this.lastDashboardData || !newData.success) return true;
    
    const oldStats = this.lastDashboardData.data?.stats || {};
    const newStats = newData.data?.stats || {};
    
    const significant = 
      newStats.critiquesNonLues > oldStats.critiquesNonLues ||
      newStats.nonLues > oldStats.nonLues ||
      (newData.data?.recentNotifications?.length || 0) > 
      (this.lastDashboardData.data?.recentNotifications?.length || 0);
    
    if (significant) {
      console.log('🔔 Changements significatifs détectés:', {
        critiquesAvant: oldStats.critiquesNonLues || 0,
        critiquesApres: newStats.critiquesNonLues || 0,
        totalAvant: oldStats.nonLues || 0,
        totalApres: newStats.nonLues || 0
      });
      
      // Vibration pour notifications critiques urgentes
      if (newStats.critiquesNonLues > (oldStats.critiquesNonLues || 0)) {
        this.triggerUrgentNotification();
      }
    }
    
    return significant;
  }

  /**
   * 📱 Déclencher notification urgente
   */
  triggerUrgentNotification() {
    try {
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 500, 200, 500]); // Pattern d'urgence
      console.log('📳 Vibration urgence déclenchée');
    } catch (error) {
      console.log('📳 Vibration non disponible');
    }
  }

  /**
   * 🔔 Notifier tous les listeners
   */
  notifyListeners(data, hasChanges, error = null) {
    this.listeners.forEach(callback => {
      try {
        callback({
          data,
          hasChanges,
          error,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Erreur callback polling:', error);
      }
    });
  }

  /**
   * ⏰ Planifier prochain polling avec intervalle adaptatif
   */
  scheduleNextPoll() {
    if (!this.isPolling) return;
    
    const interval = this.getAdaptivePollingInterval();
    
    this.pollingInterval = setTimeout(() => {
      if (this.isPolling) {
        this.executePoll().then(() => {
          this.scheduleNextPoll();
        });
      }
    }, interval);
    
    console.log(`⏰ Prochain polling admin dans ${Math.round(interval/1000)}s`);
  }

  /**
   * 📐 Calculer intervalle adaptatif selon contexte
   */
  getAdaptivePollingInterval() {
    const appState = AppState.currentState;
    const hasUrgent = this.lastDashboardData?.data?.stats?.critiquesNonLues > 0;
    const circuitBreakerStatus = this.circuitBreaker.getStatus();
    
    // En arrière-plan : polling très lent
    if (appState === 'background') {
      return 5 * 60 * 1000; // 5 minutes
    }
    
    // Récupération après erreurs
    if (circuitBreakerStatus === 'half-open') {
      return 2 * 60 * 1000; // 2 minutes
    }
    
    // Mode urgent : notifications critiques non lues
    if (hasUrgent) {
      return 30 * 1000; // 30 secondes
    }
    
    // Mode normal actif
    return 90 * 1000; // 90 secondes
  }

  /**
   * 📱 Gérer changements d'état de l'app
   */
  handleAppStateChange(nextAppState) {
    console.log('📱 App state changed:', nextAppState);
    
    if (nextAppState === 'active' && this.isPolling) {
      // App redevient active : polling immédiat
      this.executePoll();
    }
  }

  /**
   * ⏹️ Arrêter polling
   */
  stopPolling() {
    console.log('⏹️ Arrêt polling admin notifications');
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.listeners.clear();
  }

  // ===================================================
  // 💾 GESTION CACHE INTELLIGENT
  // ===================================================

  /**
   * 💾 Mettre en cache avec TTL
   */
  setCache(key, data, ttl = this.cacheTimeout) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  /**
   * 📖 Récupérer du cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * 🗑️ Invalider cache spécifique
   */
  invalidateCache(keys) {
    keys.forEach(key => this.cache.delete(key));
    console.log('🗑️ Cache invalidé:', keys);
  }

  /**
   * 🧹 Nettoyer tout le cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache totalement nettoyé');
  }

  // ===================================================
  // 🎨 UTILITAIRES UI
  // ===================================================

  /**
   * 🎨 Obtenir couleur de priorité
   */
  getPriorityColor(priority) {
    const colors = {
      'CRITIQUE': '#e53e3e',
      'ELEVEE': '#f56500', 
      'NORMALE': '#3182ce',
      'FAIBLE': '#38a169'
    };
    return colors[priority] || '#718096';
  }

  /**
   * 🎨 Obtenir icône de type
   */
  getTypeIcon(type) {
    const icons = {
      'SOLDE_NEGATIF': '💰',
      'MONTANT_ELEVE': '📈',
      'INACTIVITE': '😴',
      'CONNEXION_ECHEC': '🔐',
      'TRANSACTION_SUSPECTE': '🚨',
      'NOUVEAU_CLIENT': '👤',
      'RETRAIT_IMPORTANT': '💸',
      'CLIENT_SANS_GPS': '📍',
      'COLLECTEUR_CREATED': '👨‍💼',
      'COLLECTEUR_MODIFIED': '✏️'
    };
    return icons[type] || '📨';
  }

  /**
   * 📅 Formater date relative
   */
  formatRelativeDate(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      if (diffDays < 7) return `Il y a ${diffDays}j`;
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * 📊 Formater statistiques pour affichage
   */
  formatStatsForDisplay(stats) {
    if (!stats) return null;
    
    return {
      total: this.formatNumber(stats.total || 0),
      nonLues: this.formatNumber(stats.nonLues || 0),
      critiques: this.formatNumber(stats.critiques || 0),
      critiquesNonLues: this.formatNumber(stats.critiquesNonLues || 0),
      tauxLecture: stats.total > 0 ? 
        Math.round(((stats.total - stats.nonLues) / stats.total) * 100) : 0
    };
  }

  /**
   * 🔢 Formater nombres
   */
  formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
    return (num / 1000000).toFixed(1) + 'M';
  }

  // ===================================================
  // 💾 PERSISTENCE LOCALE
  // ===================================================

  /**
   * 💾 Sauvegarder état local
   */
  async saveLocalState() {
    try {
      const state = {
        lastDashboardData: this.lastDashboardData,
        lastUpdate: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('admin_notifications_state', JSON.stringify(state));
    } catch (error) {
      console.error('❌ Erreur sauvegarde état local:', error);
    }
  }

  /**
   * 📖 Restaurer état local
   */
  async restoreLocalState() {
    try {
      const stateString = await AsyncStorage.getItem('admin_notifications_state');
      if (stateString) {
        const state = JSON.parse(stateString);
        this.lastDashboardData = state.lastDashboardData;
        console.log('📖 État local restauré');
      }
    } catch (error) {
      console.error('❌ Erreur restauration état local:', error);
    }
  }

  // ===================================================
  // 🏁 LIFECYCLE
  // ===================================================

  /**
   * 🚀 Initialiser le service
   */
  async initialize() {
    console.log('🚀 Initialisation AdminNotificationService');
    await this.restoreLocalState();
    this.circuitBreaker.reset();
  }

  /**
   * 🏁 Nettoyer le service
   */
  async cleanup() {
    console.log('🏁 Nettoyage AdminNotificationService');
    this.stopPolling();
    await this.saveLocalState();
    this.clearCache();
  }
}

// ===================================================
// ⚡ CIRCUIT BREAKER POUR RÉSILIENCE
// ===================================================

class PollingCircuitBreaker {
  constructor(maxFailures = 3, timeout = 2 * 60 * 1000) {
    this.maxFailures = maxFailures;
    this.timeout = timeout;
    this.reset();
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = null;
    this.lastFailure = null;
  }

  shouldPoll() {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN') return true;
    
    // État OPEN
    if (Date.now() > this.nextAttempt) {
      this.state = 'HALF_OPEN';
      console.log('⚡ Circuit breaker -> HALF_OPEN');
      return true;
    }
    
    return false;
  }

  recordSuccess() {
    if (this.failures > 0) {
      console.log('✅ Circuit breaker -> CLOSED (récupéré)');
    }
    this.reset();
  }

  recordFailure() {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`⚡ Circuit breaker -> OPEN (${this.failures} échecs) - réouverture dans ${this.timeout/1000}s`);
    } else {
      console.log(`⚠️ Circuit breaker échec ${this.failures}/${this.maxFailures}`);
    }
  }

  getStatus() {
    return this.state.toLowerCase();
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      maxFailures: this.maxFailures,
      nextAttempt: this.nextAttempt,
      lastFailure: this.lastFailure
    };
  }
}

// Exporter instance singleton
export default new AdminNotificationService();