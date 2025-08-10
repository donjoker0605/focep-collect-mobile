// src/services/adminCollecteurService.js - SERVICE ADMIN COLLECTEURS ENRICHI
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
  // 🔥 MÉTHODES ADMIN-COLLECTEUR SPÉCIFIQUES
  // =====================================

  /**
   * 👥 Récupère les collecteurs ASSIGNÉS à l'admin connecté
   * Cette méthode utilise la nouvelle logique admin-collecteur
   */
  async getAssignedCollecteurs({ page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('👥 API Admin: GET /admin/mes-collecteurs');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      // Essayer l'endpoint spécialisé d'abord
      try {
        const response = await this.axios.get('/admin/mes-collecteurs', { params });
        return this.formatResponse(response, 'Collecteurs assignés récupérés');
      } catch (notFoundError) {
        if (notFoundError.response?.status === 404) {
          console.log('📋 Fallback vers endpoint collecteurs standard');
          return await this.getCollecteursFallback(params);
        }
        throw notFoundError;
      }
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs assignés');
    }
  }

  /**
   * 🔄 Fallback pour récupérer les collecteurs via l'endpoint standard
   */
  async getCollecteursFallback(params) {
    const response = await this.axios.get('/collecteurs', { params });
    return this.formatResponse(response, 'Collecteurs récupérés (fallback)');
  }

  // =====================================
  // MÉTHODES PRINCIPALES COLLECTEURS
  // =====================================

  /**
   * 📊 Récupère tous les collecteurs pour l'admin (ANCIEN - pour compatibilité)
   * @deprecated Utiliser getAssignedCollecteurs() à la place
   */
  async getCollecteurs({ page = 0, size = 20, search = '', agenceId = null } = {}) {
    try {
      console.log('👥 API Admin: GET /collecteurs (DEPRECATED)');
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
   * 👥 Récupère les clients d'un collecteur ASSIGNÉ (avec vérification d'accès)
   */
  async getAssignedCollecteurClients(collecteurId, { page = 0, size = 20, search = '' } = {}) {
    try {
      console.log(`👥 API Admin: GET /admin/collecteurs/${collecteurId}/clients`);
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      // Essayer l'endpoint admin spécialisé d'abord
      try {
        const response = await this.axios.get(`/admin/collecteurs/${collecteurId}/clients`, { params });
        return this.formatResponse(response, 'Clients du collecteur assigné récupérés');
      } catch (notFoundError) {
        if (notFoundError.response?.status === 404) {
          console.log('📋 Fallback vers endpoint clients/collecteur standard');
          return await this.getCollecteurClientsFallback(collecteurId, params);
        }
        throw notFoundError;
      }
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients du collecteur assigné');
    }
  }

  /**
   * 🔄 Fallback pour récupérer les clients d'un collecteur
   */
  async getCollecteurClientsFallback(collecteurId, params) {
    const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
    return this.formatResponse(response, 'Clients du collecteur récupérés (fallback)');
  }

  /**
   * 👥 Récupère les clients d'un collecteur (ANCIEN - pour compatibilité)
   * @deprecated Utiliser getAssignedCollecteurClients() à la place
   */
  async getCollecteurClients(collecteurId, { page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('👥 API Admin: GET /clients/collecteur/', collecteurId, '(DEPRECATED)');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Clients du collecteur récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients');
    }
  }

  /**
   * 📊 Récupère le résumé des activités des collecteurs ASSIGNÉS à l'admin
   */
  async getAssignedCollecteursActivitySummary(dateDebut = null, dateFin = null) {
    try {
      console.log('📊 Chargement résumé activités collecteurs assignés...');
      
      // Construire les paramètres de la requête
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;

      // Vérifier le cache
      const cacheKey = this.getCacheKey('admin-assigned-collecteurs-summary', params);
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('📊 Résumé depuis cache');
        return cached;
      }

      // 🔥 NOUVELLE LOGIQUE : Utiliser l'endpoint des collecteurs assignés
      const collecteursResponse = await this.getAssignedCollecteurs(params);
      const collecteurs = collecteursResponse.data || [];
      
      // Enrichir les données pour l'affichage
      const collecteursEnrichis = collecteurs.map(this.enrichirCollecteurSummary);

      // Mettre en cache
      this.setCache(cacheKey, collecteursEnrichis);
      
      console.log(`✅ ${collecteursEnrichis.length} collecteurs assignés récupérés`);
      return collecteursEnrichis;

    } catch (error) {
      console.error('❌ Erreur getAssignedCollecteursActivitySummary:', error);
      throw this.handleError(error, 'Impossible de récupérer le résumé des activités');
    }
  }

  /**
   * 📊 Récupère le résumé des activités de tous les collecteurs (ANCIEN - pour compatibilité)
   * @deprecated Utiliser getAssignedCollecteursActivitySummary() à la place
   */
  async getCollecteursActivitySummary(dateDebut = null, dateFin = null) {
    try {
      console.log('📊 Chargement résumé activités collecteurs... (DEPRECATED)');
      
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

      // 🔥 NOUVELLE APPROCHE : Essayer plusieurs endpoints
      try {
        // Endpoint préféré avec statistics
        const response = await this.axios.get(`/collecteurs/${collecteurId}/statistics`, { params });
        return this.formatResponse(response, 'Statistiques collecteur récupérées');
      } catch (statsError) {
        if (statsError.response?.status === 404) {
          // Fallback vers l'endpoint stats standard
          try {
            const response = await this.axios.get(`/collecteurs/${collecteurId}/stats`, { params });
            return this.formatResponse(response, 'Statistiques collecteur récupérées');
          } catch (fallbackError) {
            // Si aucun endpoint stats n'existe, créer des stats basiques
            return this.createBasicStats(collecteurId);
          }
        }
        throw statsError;
      }
    } catch (error) {
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
  // 🔥 NOUVEAUX SERVICES MANQUANTS
  // =====================================

  /**
   * 📋 Récupérer les activités d'un collecteur (journal d'activité)
   * Service manquant identifié dans l'analyse
   */
  async getCollecteurActivities(collecteurId, params = {}) {
    try {
      console.log(`📋 API: GET /admin/collecteurs/${collecteurId}/activites`);
      
      // Formater la date si nécessaire
      if (params.date && params.date instanceof Date) {
        params.date = params.date.toISOString().split('T')[0];
      }
      
      // Essayer l'endpoint admin spécialisé d'abord
      try {
        const response = await this.axios.get(`/admin/collecteurs/${collecteurId}/activites`, { params });
        return this.formatResponse(response, 'Activités collecteur récupérées');
      } catch (adminError) {
        if (adminError.response?.status === 404) {
          // Fallback vers l'endpoint journal-activite standard
          console.log('📋 Fallback vers journal-activite standard');
          return await this.getCollecteurActivitiesFallback(collecteurId, params);
        }
        throw adminError;
      }
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des activités');
    }
  }

  /**
   * 📋 Fallback pour les activités via l'endpoint journal-activite
   */
  async getCollecteurActivitiesFallback(collecteurId, params = {}) {
    try {
      // Utiliser l'endpoint journal-activite/user/{userId}
      const date = params.date || new Date().toISOString().split('T')[0];
      const fallbackParams = {
        date,
        page: params.page || 0,
        size: params.size || 20,
        sortBy: params.sortBy || 'timestamp',
        sortDir: params.sortDir || 'desc'
      };
      
      const response = await this.axios.get(`/journal-activite/user/${collecteurId}`, { params: fallbackParams });
      return this.formatResponse(response, 'Activités récupérées (fallback)');
    } catch (error) {
      console.warn('❌ Fallback journal-activite échoué:', error.response?.status);
      // Retourner structure vide si tout échoue
      return this.formatResponse({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: params.size || 20,
          number: params.page || 0
        }
      }, 'Aucune activité trouvée');
    }
  }

  /**
   * 🚨 Récupérer les activités critiques d'un collecteur
   */
  async getCriticalActivities(collecteurId, params = {}) {
    try {
      console.log(`🚨 API: GET /admin/collecteurs/${collecteurId}/activites/critiques`);
      const response = await this.axios.get(`/admin/collecteurs/${collecteurId}/activites/critiques`, { params });
      return this.formatResponse(response, 'Activités critiques récupérées');
    } catch (error) {
      // Si l'endpoint n'existe pas, retourner une liste vide
      if (error.response?.status === 404) {
        return this.formatResponse({ data: [] }, 'Aucune activité critique');
      }
      throw this.handleError(error, 'Erreur lors de la récupération des activités critiques');
    }
  }

  /**
   * 🔍 Recherche d'activités avec filtres avancés
   */
  async searchActivities(collecteurId, filters = {}) {
    try {
      console.log(`🔍 API: GET /admin/collecteurs/${collecteurId}/activites/search`);
      const response = await this.axios.get(`/admin/collecteurs/${collecteurId}/activites/search`, { params: filters });
      return this.formatResponse(response, 'Recherche activités effectuée');
    } catch (error) {
      if (error.response?.status === 404) {
        // Fallback vers recherche simple
        return await this.getCollecteurActivities(collecteurId, filters);
      }
      throw this.handleError(error, 'Erreur lors de la recherche d\'activités');
    }
  }

  /**
   * ⚡ Changer le statut d'un collecteur (activer/suspendre)
   */
  async toggleCollecteurStatus(collecteurId, active) {
    try {
      console.log(`⚡ API: PUT /admin/collecteurs/${collecteurId}/status`);
      const response = await this.axios.put(`/admin/collecteurs/${collecteurId}/status`, { active });
      
      // Invalider le cache après modification
      this.invalidateCache('collecteurs');
      
      return this.formatResponse(response, `Collecteur ${active ? 'activé' : 'suspendu'}`);
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du changement de statut');
    }
  }

  /**
   * 📧 Envoyer un message à un collecteur
   */
  async sendMessageToCollecteur(collecteurId, messageData) {
    try {
      console.log(`📧 API: POST /admin/collecteurs/${collecteurId}/message`);
      const response = await this.axios.post(`/admin/collecteurs/${collecteurId}/message`, messageData);
      return this.formatResponse(response, 'Message envoyé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'envoi du message');
    }
  }

  /**
   * ⚙️ Mettre à jour les paramètres d'un collecteur
   */
  async updateCollecteurSettings(collecteurId, updateData) {
    try {
      console.log(`⚙️ API: PUT /admin/collecteurs/${collecteurId}/settings`);
      const response = await this.axios.put(`/admin/collecteurs/${collecteurId}/settings`, updateData);
      
      // Invalider le cache après modification
      this.invalidateCache('collecteurs');
      
      return this.formatResponse(response, 'Paramètres mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour des paramètres');
    }
  }

  /**
   * 📈 Récupérer les performances d'un collecteur
   */
  async getCollecteurPerformance(collecteurId, params = {}) {
    try {
      console.log(`📈 API: GET /admin/collecteurs/${collecteurId}/performance`);
      const response = await this.axios.get(`/admin/collecteurs/${collecteurId}/performance`, { params });
      return this.formatResponse(response, 'Performance récupérée');
    } catch (error) {
      // Fallback vers statistiques basiques
      if (error.response?.status === 404) {
        return await this.getCollecteurStats(collecteurId, params.dateDebut, params.dateFin);
      }
      throw this.handleError(error, 'Erreur lors de la récupération de la performance');
    }
  }

  /**
   * 📄 Générer un rapport pour un collecteur
   */
  async generateCollecteurReport(collecteurId, reportParams) {
    try {
      console.log(`📄 API: POST /admin/collecteurs/${collecteurId}/report`);
      const response = await this.axios.post(`/admin/collecteurs/${collecteurId}/report`, reportParams, {
        responseType: 'blob' // Pour les fichiers PDF/Excel
      });
      return this.formatResponse(response, 'Rapport généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération du rapport');
    }
  }

  /**
   * 🔄 Transférer les clients d'un collecteur vers un autre
   */
  async transferClients(fromCollecteurId, toCollecteurId, clientIds = []) {
    try {
      console.log(`🔄 API: POST /admin/collecteurs/${fromCollecteurId}/transfer-clients`);
      const response = await this.axios.post(`/admin/collecteurs/${fromCollecteurId}/transfer-clients`, {
        toCollecteurId,
        clientIds
      });
      
      // Invalider le cache après transfert
      this.invalidateCache('collecteurs');
      this.invalidateCache('clients');
      
      return this.formatResponse(response, 'Clients transférés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du transfert des clients');
    }
  }

  /**
   * ✅ Valider les données d'un collecteur
   */
  async validateCollecteurData(collecteurId) {
    try {
      console.log(`✅ API: POST /admin/collecteurs/${collecteurId}/validate`);
      const response = await this.axios.post(`/admin/collecteurs/${collecteurId}/validate`);
      return this.formatResponse(response, 'Validation effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la validation');
    }
  }

  /**
   * 📚 Récupérer l'historique des modifications d'un collecteur
   */
  async getCollecteurHistory(collecteurId, params = {}) {
    try {
      console.log(`📚 API: GET /admin/collecteurs/${collecteurId}/history`);
      const response = await this.axios.get(`/admin/collecteurs/${collecteurId}/history`, { params });
      return this.formatResponse(response, 'Historique récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération de l\'historique');
    }
  }

  /**
   * 🚨 Récupérer les alertes liées à un collecteur
   */
  async getCollecteurAlerts(collecteurId, params = {}) {
    try {
      console.log(`🚨 API: GET /admin/collecteurs/${collecteurId}/alerts`);
      const response = await this.axios.get(`/admin/collecteurs/${collecteurId}/alerts`, { params });
      return this.formatResponse(response, 'Alertes récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des alertes');
    }
  }

  // =====================================
  // 🔥 MÉTHODES DE DIAGNOSTIC ET DEBUG
  // =====================================

  /**
   * 🧪 Tester la connexion aux endpoints admin collecteurs
   */
  async testConnection() {
    try {
      console.log('🧪 Test de connexion admin collecteurs');
      
      // Test endpoint de base
      const response = await this.axios.get('/collecteurs', { params: { page: 0, size: 1 } });
      console.log('✅ Endpoint collecteurs de base OK');
      
      return {
        success: true,
        status: response.status,
        message: 'Connexion admin collecteurs OK'
      };
    } catch (error) {
      console.error('❌ Échec test connexion admin collecteurs:', error);
      return {
        success: false,
        error: error.response?.status || error.message,
        message: 'Connexion admin collecteurs échouée'
      };
    }
  }

  /**
   * 🔍 Diagnostiquer les endpoints disponibles
   */
  async diagnoseEndpoints(collecteurId = 4) {
    console.log('🔍 Diagnostic endpoints admin collecteurs...');
    
    const endpoints = [
      `/collecteurs`,
      `/collecteurs/${collecteurId}`,
      `/collecteurs/${collecteurId}/statistics`,
      `/clients/collecteur/${collecteurId}`,
      `/admin/collecteurs/${collecteurId}/activites`,
      `/journal-activite/user/${collecteurId}`,
      `/admin/collecteurs/${collecteurId}/performance`
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const testParams = endpoint.includes('journal-activite') 
          ? { date: new Date().toISOString().split('T')[0] }
          : {};
          
        const response = await this.axios.get(endpoint, { params: testParams });
        results[endpoint] = {
          status: response.status,
          available: true,
          dataType: typeof response.data
        };
        console.log(`✅ ${endpoint} → ${response.status}`);
      } catch (error) {
        results[endpoint] = {
          status: error.response?.status || 'NETWORK_ERROR',
          available: false,
          error: error.response?.data?.message || error.message
        };
        console.log(`❌ ${endpoint} → ${error.response?.status || 'ERROR'}`);
      }
    }
    
    console.log('📊 Résultats diagnostic:', results);
    return results;
  }

  // =====================================
  // MÉTHODES UTILITAIRES EXISTANTES
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
        collecteurId,
        nombreClients: 0,
        collecteJour: 0,
        totalEpargne: 0,
        totalRetraits: 0,
        soldeNet: 0,
        transactionsDuJour: 0,
        dernierConnexion: null,
        performance: 0,
        dateCalcul: new Date().toISOString()
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