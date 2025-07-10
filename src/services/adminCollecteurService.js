// src/services/adminCollecteurService.js - SERVICE ADMIN COLLECTEURS
import BaseApiService from './base/BaseApiService';

/**
 * 🎯 Service pour la gestion des activités des collecteurs par les admins
 * 
 * UTILISE : BaseApiService pour l'authentification automatique
 */
class AdminCollecteurService extends BaseApiService {
  constructor() {
    super();
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // =====================================
  // MÉTHODES PRINCIPALES COLLECTEURS
  // =====================================

  /**
   * 📊 Récupère tous les collecteurs pour l'admin
   */
  async getCollecteurs({ page = 0, size = 20, search = '', agenceId = null } = {}) {
    try {
      console.log('👥 API Admin: GET /collecteurs');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      if (agenceId) params.agenceId = agenceId;
      
      const response = await this.axios.get('/collecteurs', { params });
      return this.formatResponse(response, 'Collecteurs récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs');
    }
  }

  /**
   * 📋 Récupère les détails d'un collecteur spécifique
   */
  async getCollecteurById(collecteurId) {
    try {
      console.log('👤 API Admin: GET /collecteurs/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}`);
      return this.formatResponse(response, 'Collecteur récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du collecteur');
    }
  }

  /**
   * 👥 Récupère les clients d'un collecteur
   */
  async getCollecteurClients(collecteurId, { page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('👥 API Admin: GET /clients/collecteur/', collecteurId);
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Clients du collecteur récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients');
    }
  }

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
      const cacheKey = this.getCacheKey('admin-collecteurs-summary', params);
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('📊 Résumé depuis cache');
        return cached;
      }

      // ✅ ENDPOINT SIMPLIFIÉ : Utiliser l'endpoint collecteurs existant
      const response = await this.axios.get('/collecteurs', { params });
      
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
   * 📈 Récupère les statistiques d'un collecteur
   */
  async getCollecteurStats(collecteurId, dateDebut = null, dateFin = null) {
    try {
      console.log('📈 API Admin: GET /collecteurs/stats/', collecteurId);
      
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;

      const response = await this.axios.get(`/collecteurs/${collecteurId}/stats`, { params });
      return this.formatResponse(response, 'Statistiques collecteur récupérées');
    } catch (error) {
      // Fallback: créer des stats basiques si l'endpoint n'existe pas
      if (error.response?.status === 404) {
        return this.createBasicStats(collecteurId);
      }
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * 🏦 Récupère les journaux d'un collecteur
   */
  async getCollecteurJournaux(collecteurId, dateDebut = null, dateFin = null) {
    try {
      console.log('🏦 API Admin: GET /journaux/collecteur/', collecteurId);
      
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;

      const response = await this.axios.get(`/journaux/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Journaux collecteur récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des journaux');
    }
  }

  // =====================================
  // MÉTHODES UTILITAIRES
  // =====================================

  /**
   * ✨ Enrichit les données d'un collecteur pour l'affichage
   */
  enrichirCollecteurSummary = (collecteur) => {
    return {
      ...collecteur,
      // Calculer le statut basé sur les données disponibles
      statut: this.determinerStatutCollecteur(collecteur),
      
      // Calculer les indicateurs de performance
      performance: this.calculerPerformance(collecteur),
      
      // Formatage pour l'affichage
      displayName: `${collecteur.prenom} ${collecteur.nom}`,
      agenceNom: collecteur.agence?.nom || 'N/A',
      
      // Couleurs et icônes pour l'UI
      statusColor: this.getStatusColor(collecteur),
      statusIcon: this.getStatusIcon(collecteur),
      
      // Métriques
      nombreClients: collecteur.nombreClients || 0,
      collecteJour: collecteur.collecteJour || 0,
      dernierConnexion: collecteur.dernierConnexion || null,
    };
  };

  /**
   * 🎯 Détermine le statut d'un collecteur
   */
  determinerStatutCollecteur(collecteur) {
    // Logique simple basée sur les données disponibles
    if (!collecteur.actif) return 'INACTIF';
    
    const maintenant = new Date();
    const dernierConnexion = collecteur.dernierConnexion ? new Date(collecteur.dernierConnexion) : null;
    
    if (!dernierConnexion) return 'NOUVEAU';
    
    const diffHeures = (maintenant - dernierConnexion) / (1000 * 60 * 60);
    
    if (diffHeures < 24) return 'ACTIF';
    if (diffHeures < 72) return 'ATTENTION';
    return 'INACTIF';
  }

  /**
   * 📊 Calcule la performance d'un collecteur
   */
  calculerPerformance(collecteur) {
    // Calcul simple basé sur les métriques disponibles
    let score = 0;
    
    if (collecteur.nombreClients > 10) score += 30;
    else if (collecteur.nombreClients > 5) score += 20;
    else if (collecteur.nombreClients > 0) score += 10;
    
    if (collecteur.collecteJour > 100000) score += 40;
    else if (collecteur.collecteJour > 50000) score += 30;
    else if (collecteur.collecteJour > 10000) score += 20;
    else if (collecteur.collecteJour > 0) score += 10;
    
    const maintenant = new Date();
    const dernierConnexion = collecteur.dernierConnexion ? new Date(collecteur.dernierConnexion) : null;
    
    if (dernierConnexion) {
      const diffHeures = (maintenant - dernierConnexion) / (1000 * 60 * 60);
      if (diffHeures < 24) score += 30;
      else if (diffHeures < 72) score += 15;
    }
    
    return Math.min(score, 100);
  }

  /**
   * 🎨 Retourne la couleur selon le statut
   */
  getStatusColor(collecteur) {
    const statut = this.determinerStatutCollecteur(collecteur);
    const colors = {
      'ACTIF': '#10B981',      // Vert
      'ATTENTION': '#F59E0B',  // Orange
      'INACTIF': '#EF4444',    // Rouge
      'NOUVEAU': '#3B82F6'     // Bleu
    };
    return colors[statut] || '#6B7280';
  }

  /**
   * 🎭 Retourne l'icône selon le statut
   */
  getStatusIcon(collecteur) {
    const statut = this.determinerStatutCollecteur(collecteur);
    const icons = {
      'ACTIF': 'checkmark-circle',
      'ATTENTION': 'warning',
      'INACTIF': 'close-circle',
      'NOUVEAU': 'person-add'
    };
    return icons[statut] || 'help-circle';
  }

  /**
   * 📊 Crée des stats basiques en fallback
   */
  createBasicStats(collecteurId) {
    return {
      success: true,
      data: {
        nombreClients: 0,
        collecteJour: 0,
        transactionsDuJour: 0,
        dernierConnexion: null,
        performance: 0
      },
      message: 'Statistiques basiques générées'
    };
  }

  // =====================================
  // GESTION DU CACHE
  // =====================================

  /**
   * 🔑 Génère une clé de cache
   */
  getCacheKey(prefix, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}-${paramStr}`;
  }

  /**
   * 💾 Met en cache avec timestamp
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 📥 Récupère du cache si valide
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
   * 🗑️ Invalide le cache
   */
  invalidateCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export default new AdminCollecteurService();