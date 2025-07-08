import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

/**
 * 🎯 Service pour la gestion des activités des collecteurs par les admins
 * 
 * FONCTIONNALITÉS :
 * - Appels API vers AdminCollecteurActivityController
 * - Cache local intelligent (5 minutes)
 * - Gestion des erreurs réseau
 * - Transformation et formatage des données
 * - Retry automatique avec backoff exponentiel
 */
class AdminCollecteurService {
  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
    this.apiPath = '/api/admin/collecteurs';
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.MAX_RETRIES = 3;
  }

  // =====================================
  // MÉTHODES UTILITAIRES
  // =====================================

  /**
   * 🔑 Récupère le token d'authentification depuis le stockage
   */
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }
      return token;
    } catch (error) {
      console.error('❌ Erreur récupération token:', error);
      throw new Error('Authentification requise');
    }
  }

  /**
   * 🌐 Effectue une requête HTTP avec retry et gestion d'erreurs
   */
  async makeRequest(endpoint, options = {}, retryCount = 0) {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${this.apiPath}${endpoint}`;
      
      console.log(`🌐 Requête API: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      // Gestion des erreurs HTTP
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;

        switch (response.status) {
          case 401:
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            // TODO: Déclencher la déconnexion
            break;
          case 403:
            errorMessage = 'Accès non autorisé à cette ressource.';
            break;
          case 404:
            errorMessage = 'Ressource non trouvée.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          default:
            errorMessage = `Erreur HTTP ${response.status}: ${errorText}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ Réponse API reçue: ${data.data ? 'avec données' : 'vide'}`);
      
      return data;

    } catch (error) {
      console.error(`❌ Erreur requête API (tentative ${retryCount + 1}):`, error);

      // Retry automatique avec backoff exponentiel
      if (retryCount < this.MAX_RETRIES && this.shouldRetry(error)) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retry dans ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 🔍 Détermine si une erreur justifie un retry
   */
  shouldRetry(error) {
    // Retry sur les erreurs réseau, pas sur les erreurs d'authentification
    return !error.message.includes('401') && 
           !error.message.includes('403') &&
           (error.message.includes('Network') || 
            error.message.includes('timeout') ||
            error.message.includes('500'));
  }

  /**
   * 💾 Gestion du cache local
   */
  getCacheKey(endpoint, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${paramString}`;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    console.log(`💾 Cache hit pour: ${key}`);
    return cached.data;
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache vidé');
  }

  // =====================================
  // API ENDPOINTS
  // =====================================

  /**
   * 📊 Récupère le résumé des activités de tous les collecteurs
   */
  async getCollecteursActivitySummary(dateDebut = null, dateFin = null) {
    try {
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;

      const cacheKey = this.getCacheKey('/activites/resume', params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/activites/resume${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await this.makeRequest(endpoint);
      const collecteurs = response.data || [];

      // Transformation et enrichissement des données
      const collecteursEnrichis = collecteurs.map(this.enrichirCollecteurSummary);

      this.setCache(cacheKey, collecteursEnrichis);
      return collecteursEnrichis;

    } catch (error) {
      console.error('❌ Erreur getCollecteursActivitySummary:', error);
      throw new Error(`Impossible de récupérer le résumé des activités: ${error.message}`);
    }
  }

  /**
   * 📋 Récupère les activités d'un collecteur spécifique
   */
  async getCollecteurActivities(collecteurId, date = null, page = 0, size = 20, sortBy = 'timestamp', sortDir = 'desc') {
    try {
      if (!collecteurId) {
        throw new Error('ID du collecteur requis');
      }

      const params = { page, size, sortBy, sortDir };
      if (date) params.date = date;

      const cacheKey = this.getCacheKey(`/${collecteurId}/activites`, params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/${collecteurId}/activites?${queryParams}`;
      
      const response = await this.makeRequest(endpoint);
      const activites = response.data || { content: [], totalElements: 0 };

      // Enrichissement des activités
      if (activites.content) {
        activites.content = activites.content.map(this.enrichirActivite);
      }

      this.setCache(cacheKey, activites);
      return activites;

    } catch (error) {
      console.error('❌ Erreur getCollecteurActivities:', error);
      throw new Error(`Impossible de récupérer les activités: ${error.message}`);
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

      const cacheKey = this.getCacheKey(`/${collecteurId}/activites/stats`, params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/${collecteurId}/activites/stats${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await this.makeRequest(endpoint);
      const stats = response.data || {};

      // Transformation des stats pour l'affichage
      const statsEnrichies = this.enrichirStatistiques(stats);

      this.setCache(cacheKey, statsEnrichies);
      return statsEnrichies;

    } catch (error) {
      console.error('❌ Erreur getCollecteurDetailedStats:', error);
      throw new Error(`Impossible de récupérer les statistiques: ${error.message}`);
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
      const cacheKey = this.getCacheKey(`/${collecteurId}/activites/critiques`, params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/${collecteurId}/activites/critiques?${queryParams}`;
      
      const response = await this.makeRequest(endpoint);
      const activitesCritiques = response.data || [];

      // Enrichissement des activités critiques
      const activitesEnrichies = activitesCritiques.map(this.enrichirActivite);

      this.setCache(cacheKey, activitesEnrichies);
      return activitesEnrichies;

    } catch (error) {
      console.error('❌ Erreur getCollecteurCriticalActivities:', error);
      throw new Error(`Impossible de récupérer les activités critiques: ${error.message}`);
    }
  }

  /**
   * 🔍 Recherche d'activités avec filtres
   */
  async searchCollecteurActivities(collecteurId, filters = {}) {
    try {
      if (!collecteurId) {
        throw new Error('ID du collecteur requis');
      }

      const params = {
        page: 0,
        size: 50,
        ...filters,
      };

      // Pas de cache pour les recherches
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/${collecteurId}/activites/search?${queryParams}`;
      
      const response = await this.makeRequest(endpoint);
      const activites = response.data || { content: [], totalElements: 0 };

      // Enrichissement des résultats
      if (activites.content) {
        activites.content = activites.content.map(this.enrichirActivite);
      }

      return activites;

    } catch (error) {
      console.error('❌ Erreur searchCollecteurActivities:', error);
      throw new Error(`Impossible d'effectuer la recherche: ${error.message}`);
    }
  }

  // =====================================
  // MÉTHODES D'ENRICHISSEMENT DES DONNÉES
  // =====================================

  /**
   * ✨ Enrichit un résumé de collecteur pour l'affichage
   */
  enrichirCollecteurSummary = (collecteur) => {
    return {
      ...collecteur,
      
      // Calculs dérivés
      activitesParJour: collecteur.joursActifs > 0 
        ? Math.round((collecteur.totalActivites / collecteur.joursActifs) * 10) / 10 
        : 0,
      
      pourcentageCritiques: collecteur.totalActivites > 0 
        ? Math.round((collecteur.activitesCritiques / collecteur.totalActivites) * 100 * 10) / 10 
        : 0,

      // Niveau de priorité pour le tri
      niveauPriorite: this.getNiveauPriorite(collecteur.statut),

      // Indicateur d'attention
      necessiteAttention: collecteur.statut === 'ATTENTION' || 
                         collecteur.statut === 'INACTIF' || 
                         (collecteur.activitesCritiques || 0) > 0,

      // Formatage des dates
      derniereActiviteFormatee: collecteur.derniereActivite 
        ? this.formaterDate(collecteur.derniereActivite)
        : 'Aucune activité',

      // Performance visuelle
      etoilesPerformance: this.calculerEtoiles(collecteur.scoreActivite),
      emojiPerformance: this.getEmojiPerformance(collecteur.scoreActivite),
    };
  };

  /**
   * ✨ Enrichit une activité pour l'affichage
   */
  enrichirActivite = (activite) => {
    return {
      ...activite,
      
      // Formatage des dates
      timestampFormate: this.formaterDateHeure(activite.timestamp),
      timeAgo: this.calculerTempsEcoule(activite.timestamp),
      
      // Catégorisation
      estCritique: this.estActiviteCritique(activite),
      categorieAction: this.categoriserAction(activite.action),
      
      // Affichage
      iconeAction: this.getIconeAction(activite.action),
      couleurAction: this.getCouleurAction(activite.action, activite.success),
      descriptionFormattee: this.formaterDescription(activite),
    };
  };

  /**
   * ✨ Enrichit les statistiques pour l'affichage
   */
  enrichirStatistiques = (stats) => {
    return {
      ...stats,
      
      // Métriques calculées
      tauxActiviteJournaliere: stats.joursActifs && stats.totalActivites 
        ? Math.round((stats.totalActivites / stats.joursActifs) * 10) / 10 
        : 0,
      
      tauxCritiques: stats.totalActivites > 0 && stats.activitesSuspectes 
        ? Math.round((stats.activitesSuspectes.length / stats.totalActivites) * 100 * 10) / 10 
        : 0,

      // Formatage pour graphiques
      repartitionActionsFormattee: this.formaterRepartition(stats.repartitionActions),
      repartitionEntitesFormattee: this.formaterRepartition(stats.repartitionEntites),
      heuresActivitesFormattees: this.formaterHeuresActivites(stats.heuresActivites),
      
      // Tendances
      indicateurTendance: this.getIndicateurTendance(stats.tendanceActivite),
    };
  };

  // =====================================
  // MÉTHODES UTILITAIRES DE FORMATAGE
  // =====================================

  getNiveauPriorite(statut) {
    switch (statut) {
      case 'INACTIF': return 1;
      case 'ATTENTION': return 2;
      case 'ACTIF': return 3;
      default: return 4;
    }
  }

  calculerEtoiles(score) {
    if (!score) return 1;
    if (score >= 90) return 5;
    if (score >= 75) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    return 1;
  }

  getEmojiPerformance(score) {
    const etoiles = this.calculerEtoiles(score);
    switch (etoiles) {
      case 5: return '🌟';
      case 4: return '⭐';
      case 3: return '✨';
      case 2: return '🔸';
      default: return '🔹';
    }
  }

  formaterDate(dateString) {
    try {
      const date = new Date(dateString);
      const maintenant = new Date();
      const diffMs = maintenant - date;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHeures = Math.floor(diffMs / 3600000);
      const diffJours = Math.floor(diffMs / 86400000);

      if (diffMinutes < 1) return "À l'instant";
      if (diffMinutes < 60) return `${diffMinutes} min`;
      if (diffHeures < 24) return `${diffHeures}h`;
      if (diffJours < 7) return `${diffJours}j`;
      
      return format(date, 'dd/MM');
    } catch (error) {
      return 'Date invalide';
    }
  }

  formaterDateHeure(dateString) {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy à HH:mm');
    } catch (error) {
      return 'Date invalide';
    }
  }

  calculerTempsEcoule(dateString) {
    try {
      const date = new Date(dateString);
      const maintenant = new Date();
      const diffMs = maintenant - date;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHeures = Math.floor(diffMs / 3600000);
      const diffJours = Math.floor(diffMs / 86400000);

      if (diffMinutes < 1) return "à l'instant";
      if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
      if (diffHeures < 24) return `il y a ${diffHeures}h`;
      return `il y a ${diffJours} jour${diffJours > 1 ? 's' : ''}`;
    } catch (error) {
      return '';
    }
  }

  estActiviteCritique(activite) {
    const actionsCritiques = ['DELETE_CLIENT', 'MODIFY_SOLDE', 'LOGIN_FAILED'];
    return actionsCritiques.includes(activite.action) || 
           (activite.success === false) ||
           (activite.durationMs && activite.durationMs > 10000);
  }

  categoriserAction(action) {
    const categories = {
      'CREATE_CLIENT': 'creation',
      'MODIFY_CLIENT': 'modification',
      'DELETE_CLIENT': 'suppression',
      'CREATE_MOUVEMENT': 'transaction',
      'LOGIN': 'connexion',
      'LOGOUT': 'deconnexion',
    };
    return categories[action] || 'autre';
  }

  getIconeAction(action) {
    const icones = {
      'CREATE_CLIENT': '👤➕',
      'MODIFY_CLIENT': '👤✏️',
      'DELETE_CLIENT': '👤❌',
      'CREATE_MOUVEMENT': '💰',
      'LOGIN': '🔑',
      'LOGOUT': '🚪',
      'CREATE_JOURNAL': '📋',
    };
    return icones[action] || '📋';
  }

  getCouleurAction(action, success) {
    if (success === false) return '#F44336';
    
    const couleurs = {
      'CREATE_CLIENT': '#4CAF50',
      'MODIFY_CLIENT': '#FF9800',
      'DELETE_CLIENT': '#F44336',
      'CREATE_MOUVEMENT': '#2196F3',
      'LOGIN': '#4CAF50',
      'LOGOUT': '#9E9E9E',
    };
    return couleurs[action] || '#6c757d';
  }

  formaterDescription(activite) {
    const { action, entityType, entityId } = activite;
    
    const actions = {
      'CREATE_CLIENT': 'Création client',
      'MODIFY_CLIENT': 'Modification client',
      'DELETE_CLIENT': 'Suppression client',
      'CREATE_MOUVEMENT': 'Nouvelle transaction',
      'LOGIN': 'Connexion',
      'LOGOUT': 'Déconnexion',
    };

    let description = actions[action] || action;
    
    if (entityType && entityId) {
      description += ` (${entityType} #${entityId})`;
    }
    
    return description;
  }

  formaterRepartition(repartition) {
    if (!repartition || typeof repartition !== 'object') return [];
    
    return Object.entries(repartition)
      .map(([key, value]) => ({
        label: key,
        value: value,
        percentage: 0, // Sera calculé côté UI
      }))
      .sort((a, b) => b.value - a.value);
  }

  formaterHeuresActivites(heuresActivites) {
    if (!heuresActivites || typeof heuresActivites !== 'object') return [];
    
    return Object.entries(heuresActivites)
      .map(([heure, count]) => ({
        heure: parseInt(heure),
        activites: count,
        label: `${heure}h`,
      }))
      .sort((a, b) => a.heure - b.heure);
  }

  getIndicateurTendance(tendance) {
    switch (tendance) {
      case 'CROISSANTE': return { icone: '📈', couleur: '#4CAF50', texte: 'En hausse' };
      case 'DÉCROISSANTE': return { icone: '📉', couleur: '#F44336', texte: 'En baisse' };
      default: return { icone: '➡️', couleur: '#6c757d', texte: 'Stable' };
    }
  }

  // =====================================
  // MÉTHODES DE GESTION DU CACHE
  // =====================================

  /**
   * 🔄 Force le rechargement des données (invalide le cache)
   */
  async refreshData(collecteurId = null) {
    if (collecteurId) {
      // Supprimer le cache pour un collecteur spécifique
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.includes(`/${collecteurId}/`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // Vider tout le cache
      this.clearCache();
    }
    
    console.log(`🔄 Cache invalidé ${collecteurId ? `pour collecteur ${collecteurId}` : 'globalement'}`);
  }

  /**
   * 📊 Informations sur le cache (pour le débogage)
   */
  getCacheInfo() {
    const entries = Array.from(this.cache.entries());
    return {
      size: entries.length,
      entries: entries.map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp,
      })),
    };
  }
}

// Export de l'instance singleton
const adminCollecteurService = new AdminCollecteurService();

export default adminCollecteurService;