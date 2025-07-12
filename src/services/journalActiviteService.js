// src/services/journalActiviteService.js - CORRECTION FINALE
import BaseApiService from './base/BaseApiService';
import { format } from 'date-fns';

class JournalActiviteService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * 🔥 CORRECTION CRITIQUE - Paramètre date requis par backend
   * Récupérer le journal d'activité d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string|Date} date - Date au format string ou Date object
   * @param {Object} options - Options supplémentaires
   */
  async getUserActivities(userId, date = new Date(), options = {}) {
    try {
      console.log(`📋 API: GET /journal-activite/user/${userId}`);
      
      // 🔥 CORRECTION 1: Validation et formatage date robuste
      let formattedDate;
      try {
        if (date instanceof Date) {
          formattedDate = format(date, 'yyyy-MM-dd');
        } else if (typeof date === 'string') {
          // Si contient l'heure, la retirer
          formattedDate = date.includes('T') ? date.split('T')[0] : date;
          // Vérifier le format YYYY-MM-DD
          if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
            throw new Error('Format de date invalide');
          }
        } else {
          formattedDate = format(new Date(), 'yyyy-MM-dd');
        }
      } catch (dateError) {
        console.warn('⚠️ Problème formatage date, utilisation date actuelle:', dateError);
        formattedDate = format(new Date(), 'yyyy-MM-dd');
      }
      
      console.log(`📅 Date formatée pour l'API: ${formattedDate}`);
      
      // 🔥 CORRECTION 2: Construire les paramètres avec date OBLIGATOIRE
      const params = new URLSearchParams({
        date: formattedDate,  // Backend exige ce paramètre
        page: options.page || 0,
        size: options.size || 20,
        sortBy: options.sortBy || 'timestamp',
        sortDir: options.sortDir || 'desc',
        ...options
      });

      // 🔥 CORRECTION 3: URL complète avec debug
      const fullUrl = `/journal-activite/user/${userId}?${params.toString()}`;
      console.log(`🌐 URL finale: ${fullUrl}`);
      
      const response = await this.axios.get(fullUrl);
      
      console.log(`✅ Réponse journal activité:`, response.status);
      return this.formatResponse(response, 'Activités récupérées');
      
    } catch (error) {
      console.error('❌ Erreur détaillée journal activité:', {
        userId,
        date,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // 🔥 CORRECTION 4: Gestion d'erreur spécifique
      if (error.response?.status === 400) {
        throw new Error('Paramètres de date invalides. Vérifiez le format YYYY-MM-DD');
      } else if (error.response?.status === 403) {
        throw new Error('Accès refusé. Vérifiez vos permissions pour ce collecteur');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint journal d\'activité non trouvé. Vérifiez la configuration backend');
      }
      
      throw this.handleError(error, 'Erreur lors de la récupération des activités');
    }
  }

  /**
   * Récupérer le journal d'activité par agence (admin)
   * @param {number} agenceId - ID de l'agence
   * @param {string|Date} date - Date au format string ou Date object
   * @param {Object} filters - Filtres supplémentaires
   */
  async getAgenceActivities(agenceId, date = new Date(), filters = {}) {
    try {
      console.log(`📋 API: GET /journal-activite/agence/${agenceId}`);
      
      // Formater la date correctement
      const formattedDate = date instanceof Date 
        ? format(date, 'yyyy-MM-dd')
        : (date.includes('T') ? date.split('T')[0] : date);
      
      const params = new URLSearchParams({
        date: formattedDate,
        page: filters.page || 0,
        size: filters.size || 20,
        sortBy: filters.sortBy || 'timestamp',
        sortDir: filters.sortDir || 'desc',
        ...filters
      });

      const response = await this.axios.get(
        `/journal-activite/agence/${agenceId}?${params.toString()}`
      );
      
      return this.formatResponse(response, 'Activités agence récupérées');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des activités agence', error);
      throw this.handleError(error, 'Erreur lors de la récupération des activités agence');
    }
  }

  /**
   * Récupérer les statistiques du journal d'activité
   * @param {number} userId - ID de l'utilisateur
   * @param {string|Date} dateDebut - Date de début
   * @param {string|Date} dateFin - Date de fin
   */
  async getActivityStats(userId, dateDebut, dateFin) {
    try {
      console.log(`📊 API: GET /journal-activite/stats/user/${userId}`);
      
      const params = new URLSearchParams();
      if (dateDebut) {
        params.append('dateDebut', dateDebut instanceof Date ? format(dateDebut, 'yyyy-MM-dd') : dateDebut);
      }
      if (dateFin) {
        params.append('dateFin', dateFin instanceof Date ? format(dateFin, 'yyyy-MM-dd') : dateFin);
      }

      // 🔥 CORRECTION: URL correcte selon backend
      const response = await this.axios.get(
        `/journal-activite/stats/user/${userId}?${params.toString()}`
      );
      
      return this.formatResponse(response, 'Statistiques activité récupérées');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques', error);
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * 🔥 NOUVELLE MÉTHODE: Recherche avancée d'activités
   * @param {Object} searchParams - Paramètres de recherche
   */
  async searchActivities(searchParams = {}) {
    try {
      console.log(`🔍 API: GET /journal-activite/search`);
      
      // Formater les dates si présentes
      const params = { ...searchParams };
      if (params.dateDebut) {
        params.dateDebut = params.dateDebut instanceof Date 
          ? format(params.dateDebut, 'yyyy-MM-dd')
          : params.dateDebut.split('T')[0];
      }
      if (params.dateFin) {
        params.dateFin = params.dateFin instanceof Date 
          ? format(params.dateFin, 'yyyy-MM-dd')
          : params.dateFin.split('T')[0];
      }

      const response = await this.axios.get('/journal-activite/search', { params });
      
      return this.formatResponse(response, 'Recherche d\'activités effectuée');
    } catch (error) {
      console.error('❌ Erreur lors de la recherche d\'activités', error);
      throw this.handleError(error, 'Erreur lors de la recherche d\'activités');
    }
  }

  /**
   * 🔥 NOUVELLE MÉTHODE: Récupérer les actions disponibles
   */
  async getAvailableActions() {
    try {
      console.log(`📋 API: GET /journal-activite/actions`);
      
      const response = await this.axios.get('/journal-activite/actions');
      
      return this.formatResponse(response, 'Actions disponibles récupérées');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des actions', error);
      // Retourner des actions par défaut si l'endpoint n'existe pas
      const defaultActions = {
        'CREATE_CLIENT': 'Création client',
        'MODIFY_CLIENT': 'Modification client',
        'DELETE_CLIENT': 'Suppression client',
        'LOGIN': 'Connexion',
        'LOGOUT': 'Déconnexion',
        'TRANSACTION_EPARGNE': 'Épargne',
        'TRANSACTION_RETRAIT': 'Retrait'
      };
      return this.formatResponse({ data: defaultActions }, 'Actions par défaut');
    }
  }

  /**
   * Ajouter une entrée au journal d'activité
   * @param {Object} activityData - Données de l'activité
   */
  async logActivity(activityData) {
    try {
      console.log('📝 API: POST /journal-activite');
      
      const response = await this.axios.post('/journal-activite', activityData);
      
      return this.formatResponse(response, 'Activité enregistrée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'activité', error);
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'activité');
    }
  }

  // ============================================
  // 🔥 MÉTHODES UTILITAIRES ET DEBUG
  // ============================================

  /**
   * Valider le format d'une date
   * @param {string|Date} date - Date à valider
   * @returns {string} - Date au format YYYY-MM-DD
   */
  validateAndFormatDate(date) {
    try {
      if (!date) {
        return format(new Date(), 'yyyy-MM-dd');
      }
      
      if (date instanceof Date) {
        return format(date, 'yyyy-MM-dd');
      }
      
      if (typeof date === 'string') {
        // Si la date contient l'heure, la retirer
        if (date.includes('T')) {
          return date.split('T')[0];
        }
        
        // Vérifier le format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(date)) {
          return date;
        }
        
        // Essayer de parser et reformater
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return format(parsedDate, 'yyyy-MM-dd');
        }
      }
      
      throw new Error('Format de date invalide');
    } catch (error) {
      console.warn('⚠️ Problème avec le format de date, utilisation de la date actuelle');
      return format(new Date(), 'yyyy-MM-dd');
    }
  }

  /**
   * 🔥 MÉTHODE DE DEBUG: Tester la connexion journal d'activité
   * @param {number} userId - ID utilisateur pour test
   */
  async testConnection(userId = 4) {
    try {
      console.log('🧪 Test connexion journal d\'activité...');
      
      // Test 1: Endpoint actions (devrait marcher)
      console.log('📋 Test 1: Actions disponibles');
      await this.getAvailableActions();
      
      // Test 2: Endpoint utilisateur avec date aujourd'hui
      console.log('📋 Test 2: Activités utilisateur');
      const today = format(new Date(), 'yyyy-MM-dd');
      const testUrl = `/journal-activite/user/${userId}?date=${today}&page=0&size=5`;
      console.log(`🌐 URL de test: ${testUrl}`);
      
      const response = await this.axios.get(testUrl);
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Data type:`, typeof response.data);
      console.log(`📊 Data keys:`, Object.keys(response.data || {}));
      
      return {
        success: true,
        status: response.status,
        dataStructure: response.data
      };
    } catch (error) {
      console.error('❌ Échec test connexion journal d\'activité:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.response?.status || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * 🔥 MÉTHODE DIAGNOSTIC: Vérifier les endpoints disponibles
   */
  async diagnoseEndpoints() {
    console.log('🔍 Diagnostic endpoints journal d\'activité...');
    
    const endpoints = [
      '/journal-activite/actions',
      '/journal-activite/user/4?date=2025-07-12',
      '/journal-activite/agence/1?date=2025-07-12',
      '/journal-activite/stats/user/4',
      '/journal-activite/search'
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.axios.get(endpoint);
        results[endpoint] = {
          status: response.status,
          available: true
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
}

export default new JournalActiviteService();