// src/services/adminNotificationService.js
import BaseApiService from './base/BaseApiService';
import { AppState } from 'react-native';

class AdminNotificationService extends BaseApiService {
  constructor() {
    super();
    this.pollingInterval = null;
    this.circuitBreaker = new PollingCircuitBreaker();
    this.listeners = new Set();
    this.lastDashboardData = null;
  }

  // ===== INTÉGRATION AVEC TON BACKEND =====
  
  /**
   * 📊 Dashboard admin - utilise ton endpoint getDashboardActivities
   */
  async getDashboard(lastMinutes = 60) {
    try {
      console.log('📊 API: GET /admin/notifications/dashboard', { lastMinutes });
      
      const response = await this.axios.get('/admin/notifications/dashboard', {
        params: { lastMinutes }
      });
      
      const data = this.formatResponse(response, 'Dashboard récupéré');
      this.lastDashboardData = data;
      
      return data;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      throw this.handleError(error, 'Erreur dashboard admin');
    }
  }

  /**
   * 🚨 Notifications critiques - utilise ton endpoint getCriticalNotifications
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
   * ✅ Marquer comme lu - utilise ton endpoint markAsRead
   */
  async markAsRead(notificationId) {
    try {
      console.log('✅ API: PUT /admin/notifications/', notificationId, '/read');
      const response = await this.axios.put(`/admin/notifications/${notificationId}/read`);
      return this.formatResponse(response, 'Notification marquée comme lue');
    } catch (error) {
      throw this.handleError(error, 'Erreur mise à jour notification');
    }
  }

  // ===== POLLING INTELLIGENT ADAPTATIF =====
  
  /**
   * 🔄 Démarrage polling avec intervalle adaptatif selon urgence
   */
  startIntelligentPolling(callback) {
    if (this.pollingInterval) {
      this.stopPolling();
    }
    
    console.log('🔄 Démarrage polling intelligent admin');
    this.listeners.add(callback);
    
    // Premier appel immédiat
    this.executePoll();
    
    // Démarrer cycle de polling adaptatif
    this.scheduleNextPoll();
  }

  /**
   * 🔄 Exécuter un cycle de polling
   */
  async executePoll() {
    if (!this.circuitBreaker.shouldPoll()) {
      console.log('⚡ Circuit breaker ouvert - polling suspendu');
      return;
    }

    try {
      const dashboard = await this.getDashboard(60); // Dernière heure
      this.circuitBreaker.recordSuccess();
      
      // Détecter changements significatifs
      const hasSignificantChanges = this.detectSignificantChanges(dashboard);
      
      // Notifier listeners
      this.listeners.forEach(callback => {
        try {
          callback(dashboard, hasSignificantChanges);
        } catch (error) {
          console.error('❌ Erreur callback polling:', error);
        }
      });
      
    } catch (error) {
      this.circuitBreaker.recordFailure();
      console.error('❌ Erreur polling dashboard:', error);
    }
  }

  /**
   * 📊 Détecter changements significatifs pour optimiser les notifications
   */
  detectSignificantChanges(newData) {
    if (!this.lastDashboardData) return true;
    
    const significant = 
      newData.urgentNotifications > this.lastDashboardData.urgentNotifications ||
      newData.unreadNotifications > this.lastDashboardData.unreadNotifications ||
      newData.activitiesCount > this.lastDashboardData.activitiesCount;
    
    if (significant) {
      console.log('🔔 Changements significatifs détectés:', {
        urgentesAvant: this.lastDashboardData.urgentNotifications,
        urgentesApres: newData.urgentNotifications,
        totalAvant: this.lastDashboardData.unreadNotifications,
        totalApres: newData.unreadNotifications
      });
    }
    
    return significant;
  }

  /**
   * ⏰ Planifier prochain polling avec intervalle adaptatif intelligent
   */
  scheduleNextPoll() {
    const interval = this.getAdaptivePollingInterval();
    
    this.pollingInterval = setTimeout(() => {
      this.executePoll().then(() => {
        this.scheduleNextPoll(); // Récursif pour polling continu
      });
    }, interval);
    
    console.log(`⏰ Prochain polling admin dans ${interval/1000}s`);
  }

  /**
   * 📐 Calculer intervalle adaptatif selon contexte
   */
  getAdaptivePollingInterval() {
    const appState = AppState.currentState;
    const hasUrgent = this.lastDashboardData?.urgentNotifications > 0;
    const circuitBreakerStatus = this.circuitBreaker.getStatus();
    
    // ✅ TON SYSTÈME HYBRIDE INTELLIGENT IMPLÉMENTÉ
    if (appState === 'background') {
      return 5 * 60 * 1000; // 5 minutes en arrière-plan
    }
    
    if (circuitBreakerStatus === 'half-open') {
      return 2 * 60 * 1000; // 2 minutes en récupération
    }
    
    if (hasUrgent) {
      return 30 * 1000; // 30 secondes si notifications urgentes
    }
    
    return 90 * 1000; // 90 secondes normal (ton système hybride)
  }

  /**
   * ⏹️ Arrêter polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
      this.listeners.clear();
      console.log('⏹️ Polling admin arrêté');
    }
  }
}

// ===== CIRCUIT BREAKER POUR RÉSILIENCE =====

class PollingCircuitBreaker {
  constructor(maxFailures = 3) {
    this.maxFailures = maxFailures;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = null;
    this.timeout = 2 * 60 * 1000; // 2 minutes
  }

  shouldPoll() {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN') return true;
    
    // État OPEN
    if (Date.now() > this.nextAttempt) {
      this.state = 'HALF_OPEN';
      return true;
    }
    
    return false;
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.nextAttempt = null;
  }

  recordFailure() {
    this.failures++;
    
    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`⚡ Circuit breaker OUVERT - réouverture dans ${this.timeout/1000}s`);
    }
  }

  getStatus() {
    return this.state.toLowerCase();
  }
}

export default new AdminNotificationService();
