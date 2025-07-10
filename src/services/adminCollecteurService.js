// src/services/adminCollecteurService.js - VERSION CORRIGÉE AVEC AUTHENTIFICATION
import BaseApiService from './base/BaseApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/apiConfig';

/**
 * 🎯 Service pour la gestion des activités des collecteurs par les admins
 * 
 * CORRECTION MAJEURE : Hérite de BaseApiService pour l'authentification
 */
class AdminCollecteurService extends BaseApiService {
  constructor() {
    super();
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // =====================================
  // MÉTHODES PRINCIPALES
  // =====================================

  /**
   * 📊 Récupère le résumé des activités de tous les collecteurs
   */
  async getCollecteursActivitySummary(dateDebut = null, dateFin = null) {
    try {
      console.log('📊 Chargement résumé activités collecteurs...');
      
      // Construire les paramètres de la requête
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;

      // Vérifier le cache
      const cacheKey = this.getCacheKey('/admin/collecteurs/activites/summary', params);
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('📊 Résumé depuis cache');
        return cached;
      }

      // Construire l'URL avec les paramètres
      const queryParams = new URLSearchParams(params).toString();
      const url = `/admin/collecteurs/activites/summary${queryParams ? `?${queryParams}` : ''}`;
      
      console.log('🌐 API: GET', url);
      
      // ✅ UTILISATION DE L'AXIOS CONFIGURÉ DE BaseApiService
      const response = await this.axios.get(url);
      
      // Utiliser le formatage standard de BaseApiService
      const result = this.formatResponse(response, 'Résumé activités récupéré');
      
      // Enrichir les données pour l'affichage
      const collecteurs = result.data || [];
      const collecteursEnrichis = collecteurs.map(this.enrichirCollecteurSummary);

      // Mettre en cache
      this.setCache(cacheKey, collecteursEnrichis);
      
      console.log(`✅ ${collecteursEnrichis.length} collecteurs récupérés`);
      return collecteursEnrichis;

    } catch (error) {
      console.error('❌ Erreur getCollecteursActivitySummary:', error);
      throw this.handleError(error, 'Impossible de récupérer le résumé des activités');
    }
  }

  /**
   * 📋 Récupère les activités d'un collecteur spécifique
   */
  async getCollecteurActivities(collecteurId, options = {}) {
    try {
      if (!collecteurId) {
        throw new Error('ID du collecteur requis');
      }

      const {
        date = null,
        page = 0,
        size = 20,
        sortBy = 'timestamp',
        sortDir = 'desc'
      } = options;

      const params = { page, size, sortBy, sortDir };
      if (date) params.date = date;

      const cacheKey = this.getCacheKey(`/admin/collecteurs/${collecteurId}/activites`, params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams(params).toString();
      const url = `/admin/collecteurs/${collecteurId}/activites?${queryParams}`;
      
      console.log('🌐 API: GET', url);
      
      const response = await this.axios.get(url);
      const result = this.formatResponse(response, 'Activités récupérées');
      
      // Enrichir les activités
      const activites = result.data || { content: [], totalElements: 0 };
      if (activites.content) {
        activites.content = activites.content.map(this.enrichirActivite);
      }

      this.setCache(cacheKey, activites);
      return activites;

    } catch (error) {
      console.error('❌ Erreur getCollecteurActivities:', error);
      throw this.handleError(error, 'Impossible de récupérer les activités');
    }
  }

  /**
   * 📈 Récupère les statistiques détaillées d'un collecteur
   */
  async getCollecteurDetailedStats(collecteurId, dateDebut = null, dateFin = null) {
    try {
      if (!collecteurId) {
        throw new Error('ID du collecteur requis');
      }

      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;

      const cacheKey = this.getCacheKey(`/admin/collecteurs/${collecteurId}/activites/stats`, params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams(params).toString();
      const url = `/admin/collecteurs/${collecteurId}/activites/stats${queryParams ? `?${queryParams}` : ''}`;
      
      console.log('🌐 API: GET', url);
      
      const response = await this.axios.get(url);
      const result = this.formatResponse(response, 'Statistiques récupérées');
      
      // Enrichir les statistiques
      const stats = result.data || {};
      const statsEnrichies = this.enrichirStatistiques(stats);

      this.setCache(cacheKey, statsEnrichies);
      return statsEnrichies;

    } catch (error) {
      console.error('❌ Erreur getCollecteurDetailedStats:', error);
      throw this.handleError(error, 'Impossible de récupérer les statistiques');
    }
  }

  /**
   * 🚨 Récupère les activités critiques d'un collecteur
   */
  async getCollecteurCriticalActivities(collecteurId, dernierJours = 7, limit = 20) {
    try {
      if (!collecteurId) {
        throw new Error('ID du collecteur requis');
      }

      const params = { dernierJours, limit };
      const cacheKey = this.getCacheKey(`/admin/collecteurs/${collecteurId}/activites/critiques`, params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams(params).toString();
      const url = `/admin/collecteurs/${collecteurId}/activites/critiques?${queryParams}`;
      
      console.log('🌐 API: GET', url);
      
      const response = await this.axios.get(url);
      const result = this.formatResponse(response, 'Activités critiques récupérées');
      
      // Enrichir les activités critiques
      const activitesCritiques = result.data || [];
      const activitesEnrichies = activitesCritiques.map(this.enrichirActivite);

      this.setCache(cacheKey, activitesEnrichies);
      return activitesEnrichies;

    } catch (error) {
      console.error('❌ Erreur getCollecteurCriticalActivities:', error);
      throw this.handleError(error, 'Impossible de récupérer les activités critiques');
    }
  }

  // =====================================
  // MÉTHODES D'ENRICHISSEMENT
  // =====================================

  /**
   * 📊 Enrichit un résumé de collecteur avec des données calculées
   */
  enrichirCollecteurSummary = (collecteur) => {
    if (!collecteur) return collecteur;

    return {
      ...collecteur,
      // Calculs d'affichage
      activitesMoyennesParJour: collecteur.joursActifs > 0 
        ? Math.round(collecteur.totalActivites / collecteur.joursActifs) 
        : 0,
      
      // Statuts visuels
      statusText: this.getStatusText(collecteur),
      statusColor: this.getStatusColor(collecteur),
      
      // Formatage des dates
      derniereActiviteFormatee: collecteur.derniereActivite 
        ? this.formatDate(collecteur.derniereActivite)
        : 'Aucune activité',
      
      // Indicateurs de performance
      performanceScore: this.calculatePerformanceScore(collecteur),
      
      // Alertes
      hasAlerts: collecteur.activitesCritiques > 0 || collecteur.inactifDepuis > 24,
      alertLevel: this.getAlertLevel(collecteur)
    };
  };

  /**
   * 📋 Enrichit une activité avec des données d'affichage
   */
  enrichirActivite = (activite) => {
    if (!activite) return activite;

    return {
      ...activite,
      // Formatage des dates
      timestampFormate: this.formatDate(activite.timestamp),
      heureFormatee: this.formatTime(activite.timestamp),
      
      // Données d'affichage
      actionFormatee: this.formatActionName(activite.action),
      statusColor: this.getActionColor(activite.action),
      
      // Indicateurs
      isCritical: this.isActivityCritical(activite),
      riskLevel: this.evaluateRiskLevel(activite),
      
      // Métadonnées
      detailsFormates: this.formatActivityDetails(activite.details)
    };
  };

  /**
   * 📊 Enrichit les statistiques avec des calculs d'affichage
   */
  enrichirStatistiques = (stats) => {
    if (!stats) return stats;

    return {
      ...stats,
      // Calculs supplémentaires
      efficiency: this.calculateEfficiency(stats),
      trends: this.calculateTrends(stats),
      
      // Formatage pour l'affichage
      formattedPeriod: this.formatPeriod(stats.dateDebut, stats.dateFin),
      
      // Comparaisons
      comparisonWithPrevious: this.compareWithPrevious(stats),
      
      // Recommandations
      recommendations: this.generateRecommendations(stats)
    };
  };

  // =====================================
  // MÉTHODES UTILITAIRES
  // =====================================

  /**
   * 🎯 Calcule le score de performance d'un collecteur
   */
  calculatePerformanceScore(collecteur) {
    if (!collecteur) return 0;
    
    let score = 100;
    
    // Pénalités
    if (collecteur.activitesCritiques > 0) score -= 20;
    if (collecteur.inactifDepuis > 24) score -= 30;
    if (collecteur.totalActivites < 10) score -= 10;
    
    // Bonus
    if (collecteur.joursActifs > 20) score += 10;
    if (collecteur.activitesCritiques === 0) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 🚨 Détermine le niveau d'alerte d'un collecteur
   */
  getAlertLevel(collecteur) {
    if (!collecteur) return 'none';
    
    if (collecteur.activitesCritiques > 5) return 'critical';
    if (collecteur.inactifDepuis > 48) return 'critical';
    if (collecteur.activitesCritiques > 0) return 'warning';
    if (collecteur.inactifDepuis > 24) return 'warning';
    
    return 'normal';
  }

  /**
   * 🎨 Retourne la couleur selon le statut
   */
  getStatusColor(collecteur) {
    const level = this.getAlertLevel(collecteur);
    
    switch (level) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'normal': return '#28a745';
      default: return '#6c757d';
    }
  }

  /**
   * 📝 Retourne le texte de statut
   */
  getStatusText(collecteur) {
    const level = this.getAlertLevel(collecteur);
    
    switch (level) {
      case 'critical': return 'Attention requise';
      case 'warning': return 'Surveillance';
      case 'normal': return 'Normal';
      default: return 'Inconnu';
    }
  }

  /**
   * 🎨 Retourne la couleur selon l'action
   */
  getActionColor(action) {
    const criticalActions = ['DELETE_CLIENT', 'MODIFY_SOLDE', 'LOGIN_FAILED'];
    const warningActions = ['MODIFY_CLIENT', 'LARGE_TRANSACTION'];
    
    if (criticalActions.includes(action)) return '#dc3545';
    if (warningActions.includes(action)) return '#ffc107';
    return '#28a745';
  }

  /**
   * 📝 Formate le nom d'une action
   */
  formatActionName(action) {
    const actionNames = {
      'LOGIN': 'Connexion',
      'LOGOUT': 'Déconnexion',
      'CREATE_CLIENT': 'Création client',
      'MODIFY_CLIENT': 'Modification client',
      'DELETE_CLIENT': 'Suppression client',
      'TRANSACTION_EPARGNE': 'Épargne',
      'TRANSACTION_RETRAIT': 'Retrait',
      'CLOTURE_JOURNAL': 'Clôture journal',
      'MODIFY_SOLDE': 'Modification solde',
      'LOGIN_FAILED': 'Échec connexion'
    };
    
    return actionNames[action] || action;
  }

  /**
   * 🚨 Détermine si une activité est critique
   */
  isActivityCritical(activite) {
    const criticalActions = ['DELETE_CLIENT', 'MODIFY_SOLDE', 'LOGIN_FAILED'];
    return criticalActions.includes(activite.action);
  }

  /**
   * 📅 Formate une date
   */
  formatDate(date) {
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  }

  /**
   * ⏰ Formate une heure
   */
  formatTime(date) {
    try {
      return new Date(date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Heure invalide';
    }
  }

  // =====================================
  // GESTION DU CACHE
  // =====================================

  /**
   * 🔑 Génère une clé de cache
   */
  getCacheKey(endpoint, params = {}) {
    const paramString = Object.keys(params).length > 0 
      ? JSON.stringify(params) 
      : '';
    return `${endpoint}${paramString}`;
  }

  /**
   * 💾 Met en cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 📖 Récupère du cache
   */
  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = (Date.now() - cached.timestamp) > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * 🧹 Nettoie le cache
   */
  clearCache() {
    this.cache.clear();
  }

  // Méthodes d'assistance (à implémenter selon vos besoins)
  calculateEfficiency(stats) { return 85; }
  calculateTrends(stats) { return { up: true, percentage: 12 }; }
  formatPeriod(debut, fin) { return `${debut} - ${fin}`; }
  compareWithPrevious(stats) { return { change: '+5%', direction: 'up' }; }
  generateRecommendations(stats) { return ['Maintenir le rythme', 'Surveiller les activités critiques']; }
  evaluateRiskLevel(activite) { return this.isActivityCritical(activite) ? 'high' : 'low'; }
  formatActivityDetails(details) { return details || 'Aucun détail'; }
}

export default new AdminCollecteurService();