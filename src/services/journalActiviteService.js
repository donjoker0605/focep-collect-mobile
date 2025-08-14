// src/services/journalActiviteService.js - CORRECTION FINALE
import BaseApiService from './base/BaseApiService';
import { format } from 'date-fns';

class JournalActiviteService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * Récupérer le journal d'activité d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string|Date} date - Date au format string ou Date object
   * @param {Object} options - Options supplémentaires
   */
  async getUserActivities(userId, date, options = {}) {
    try {
      console.log(`📋 API: GET /journal-activite/user/${userId}`);
      
      // Formater la date correctement - CORRECTION CRITIQUE
      let formattedDate = date instanceof Date 
        ? format(date, 'yyyy-MM-dd')  // Format simple sans heure
        : date.split('T')[0];  // Si c'est déjà une string, prendre juste la date
      
      let fromDate = null;
      
      // Pour les collecteurs, utiliser la logique de réinitialisation après clôture
      if (!options.ignoreClosureLogic && date instanceof Date && date.toDateString() === new Date().toDateString()) {
        try {
          // Import dynamique pour éviter les dépendances circulaires
          const { default: collecteurService } = await import('./collecteurService');
          const lastClosureDate = await collecteurService.getLastClosureDate(userId);
          
          if (lastClosureDate) {
            fromDate = lastClosureDate;
            console.log('📅 Journal activité filtré depuis dernière clôture:', lastClosureDate);
          }
        } catch (error) {
          console.warn('⚠️ Impossible de récupérer date clôture pour journal activité:', error.message);
        }
      }
      
      console.log('📅 Date formatée pour l\'API:', formattedDate);
      
      const params = new URLSearchParams({
        date: formattedDate,
        page: options.page || 0,
        size: options.size || 20,
        sortBy: options.sortBy || 'timestamp',
        sortDir: options.sortDir || 'desc'
      });

      // Ajouter le paramètre fromDate si disponible
      if (fromDate) {
        params.set('fromDate', fromDate);
      }

      console.log('🌐 URL finale:', `/journal-activite/user/${userId}?${params.toString()}`);

      const response = await this.axios.get(
        `/journal-activite/user/${userId}?${params.toString()}`
      );
      
      const result = this.formatResponse(response, 'Activités récupérées');
      
      // Ajouter les informations de période
      if (result.success && result.data) {
        result.data.periodInfo = {
          hasLastClosure: !!fromDate,
          fromDate: fromDate,
          isFiltered: !!fromDate,
          currentDate: formattedDate
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des activités', error);
      throw this.handleError(error, 'Erreur lors de la récupération des activités');
    }
  }

  /**
   * Forcer le rafraîchissement du journal après une clôture
   * @param {number} userId - ID de l'utilisateur
   */
  async refreshAfterClosure(userId) {
    try {
      console.log('🔄 Rafraîchissement du journal après clôture pour utilisateur:', userId);
      
      // Forcer le rechargement sans cache en ignorant la logique de clôture
      const today = new Date();
      return await this.getUserActivities(userId, today, { 
        ignoreClosureLogic: false, // Utiliser la logique de clôture
        page: 0, 
        size: 20 
      });
    } catch (error) {
      console.error('❌ Erreur rafraîchissement après clôture:', error);
      throw this.handleError(error, 'Erreur lors du rafraîchissement du journal');
    }
  }
  
  /**
   * Récupérer les statistiques d'activité d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string|Date} dateDebut - Date début
   * @param {string|Date} dateFin - Date fin
   */
  async getUserActivityStats(userId, dateDebut, dateFin) {
    try {
      console.log('📊 API: GET /journal-activite/stats/user/', userId);
      
      // Formater les dates correctement
      const formattedDateDebut = dateDebut instanceof Date 
        ? format(dateDebut, 'yyyy-MM-dd')
        : dateDebut.split('T')[0];
        
      const formattedDateFin = dateFin instanceof Date 
        ? format(dateFin, 'yyyy-MM-dd')
        : dateFin.split('T')[0];

      const params = new URLSearchParams({
        dateDebut: formattedDateDebut,
        dateFin: formattedDateFin
      });

      const response = await this.axios.get(
        `/journal-activite/stats/user/${userId}?${params.toString()}`
      );
      
      return this.formatResponse(response, 'Statistiques récupérées');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques', error);
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
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
   *  Récupérer les actions disponibles pour les filtres
   */
  async getAvailableActions() {
    try {
      console.log('📋 API: GET /journal-activite/actions');
      
      const response = await this.axios.get('/journal-activite/actions');
      
      return this.formatResponse(response, 'Actions disponibles récupérées');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des actions', error);
      throw this.handleError(error, 'Erreur lors de la récupération des actions');
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
  async testConnection() {
    try {
      console.log('🧪 Test connexion journal activité...');
      
      // Tester avec un appel simple aux actions disponibles
      const response = await this.getAvailableActions();
      
      if (response && response.success) {
        console.log('✅ Service journal activité disponible');
        return { success: true, message: 'Service journal activité opérationnel' };
      } else {
        console.log('❌ Service journal activité indisponible');
        return { success: false, message: 'Service journal activité indisponible' };
      }
    } catch (error) {
      console.error('❌ Erreur test connexion journal:', error);
      return { success: false, message: error.message };
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
  
  /**
   * Obtenir l'icône pour une action
   * @param {string} action - Action effectuée
   */
  getActivityIcon(action) {
    const iconMap = {
      'CREATE_CLIENT': 'person-add',
      'MODIFY_CLIENT': 'person-outline',
      'DELETE_CLIENT': 'person-remove',
      'LOGIN': 'log-in',
      'LOGOUT': 'log-out',
      'TRANSACTION_EPARGNE': 'cash',
      'TRANSACTION_RETRAIT': 'card',
      'VALIDATE_TRANSACTION': 'checkmark-circle'
    };

    return iconMap[action] || 'help-circle';
  }
  
  /**
   * Obtenir la couleur pour une action
   * @param {string} action - Action effectuée
   */
  getActivityColor(action) {
    const colorMap = {
      'CREATE_CLIENT': '#4CAF50',
      'MODIFY_CLIENT': '#FF9800',
      'DELETE_CLIENT': '#F44336',
      'LOGIN': '#2196F3',
      'LOGOUT': '#9E9E9E',
      'TRANSACTION_EPARGNE': '#4CAF50',
      'TRANSACTION_RETRAIT': '#FF5722',
      'VALIDATE_TRANSACTION': '#00BCD4'
    };

    return colorMap[action] || '#9E9E9E';
  }
}

export default new JournalActiviteService();