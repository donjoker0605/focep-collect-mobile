// src/services/journalActiviteService.js
import BaseApiService from './base/BaseApiService';

class JournalActiviteService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * Récupérer les activités d'un utilisateur pour une date
   */
  async getUserActivities(userId, date, { page = 0, size = 20, sortBy = 'timestamp', sortDir = 'desc' } = {}) {
    try {
      console.log('📋 API: GET /journal-activite/user/', userId);
      
      const params = {
        date: date, // Format YYYY-MM-DD
        page,
        size,
        sortBy,
        sortDir
      };
      
      const response = await this.axios.get(`/journal-activite/user/${userId}`, { params });
      return this.formatResponse(response, 'Activités récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des activités');
    }
  }

  /**
   * Récupérer les activités d'une agence pour une date
   */
  async getAgenceActivities(agenceId, date, { page = 0, size = 20, sortBy = 'timestamp', sortDir = 'desc' } = {}) {
    try {
      console.log('📋 API: GET /journal-activite/agence/', agenceId);
      
      const params = {
        date: date,
        page,
        size,
        sortBy,
        sortDir
      };
      
      const response = await this.axios.get(`/journal-activite/agence/${agenceId}`, { params });
      return this.formatResponse(response, 'Activités de l\'agence récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des activités de l\'agence');
    }
  }

  /**
   * Recherche avancée avec filtres
   */
  async searchActivities(filters, { page = 0, size = 20, sortBy = 'timestamp', sortDir = 'desc' } = {}) {
    try {
      console.log('🔍 API: GET /journal-activite/search');
      
      const params = {
        ...filters,
        page,
        size,
        sortBy,
        sortDir
      };
      
      const response = await this.axios.get('/journal-activite/search', { params });
      return this.formatResponse(response, 'Recherche effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la recherche');
    }
  }

  /**
   * Statistiques d'activité pour un utilisateur
   */
  async getUserActivityStats(userId, dateDebut, dateFin) {
    try {
      console.log('📊 API: GET /journal-activite/stats/user/', userId);
      
      const params = {
        dateDebut,
        dateFin
      };
      
      const response = await this.axios.get(`/journal-activite/stats/user/${userId}`, { params });
      return this.formatResponse(response, 'Statistiques récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Récupérer les actions disponibles pour les filtres
   */
  async getAvailableActions() {
    try {
      console.log('📋 API: GET /journal-activite/actions');
      
      const response = await this.axios.get('/journal-activite/actions');
      return this.formatResponse(response, 'Actions récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des actions');
    }
  }
}

export default new JournalActiviteService();