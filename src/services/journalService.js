// src/services/journalActiviteService.js
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
      const formattedDate = date instanceof Date 
        ? format(date, 'yyyy-MM-dd')  // Format simple sans heure
        : date.split('T')[0];  // Si c'est déjà une string, prendre juste la date
      
      const params = new URLSearchParams({
        date: formattedDate,
        ...options
      });

      const response = await this.axios.get(
        `/journal-activite/user/${userId}?${params.toString()}`
      );
      
      return this.formatResponse(response, 'Activités récupérées');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des activités', error);
      throw this.handleError(error, 'Erreur lors de la récupération des activités');
    }
  }

  /**
   * Récupérer le journal d'activité par agence (admin)
   * @param {number} agenceId - ID de l'agence
   * @param {string|Date} date - Date au format string ou Date object
   * @param {Object} filters - Filtres supplémentaires
   */
  async getAgenceActivities(agenceId, date, filters = {}) {
    try {
      console.log(`📋 API: GET /journal-activite/agence/${agenceId}`);
      
      // Formater la date correctement
      const formattedDate = date instanceof Date 
        ? format(date, 'yyyy-MM-dd')
        : date.split('T')[0];
      
      const params = new URLSearchParams({
        date: formattedDate,
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
   * Créer une nouvelle entrée dans le journal
   * @param {Object} activityData - Données de l'activité
   */
  async logActivity(activityData) {
    try {
      console.log('📝 API: POST /journal-activite');
      
      const response = await this.axios.post('/journal-activite', {
        ...activityData,
        timestamp: new Date().toISOString()
      });
      
      return this.formatResponse(response, 'Activité enregistrée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'activité', error);
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'activité');
    }
  }

  /**
   * Récupérer les statistiques d'activité
   * @param {number} userId - ID de l'utilisateur
   * @param {string} startDate - Date de début
   * @param {string} endDate - Date de fin
   */
  async getActivityStats(userId, startDate, endDate) {
    try {
      console.log(`📊 API: GET /journal-activite/stats/${userId}`);
      
      const params = new URLSearchParams({
        startDate: format(new Date(startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(endDate), 'yyyy-MM-dd')
      });

      const response = await this.axios.get(
        `/journal-activite/stats/${userId}?${params.toString()}`
      );
      
      return this.formatResponse(response, 'Statistiques récupérées');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques', error);
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Récupérer les types d'activités disponibles
   */
  async getActivityTypes() {
    try {
      console.log('📋 API: GET /journal-activite/types');
      const response = await this.axios.get('/journal-activite/types');
      return this.formatResponse(response, 'Types d\'activité récupérés');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des types d\'activité', error);
      throw this.handleError(error, 'Erreur lors de la récupération des types d\'activité');
    }
  }

  /**
   * Exporter le journal d'activité
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options d'export (format, période, etc.)
   */
  async exportActivities(userId, options = {}) {
    try {
      console.log(`📤 API: GET /journal-activite/export/${userId}`);
      
      const params = new URLSearchParams({
        format: options.format || 'excel',
        startDate: options.startDate ? format(new Date(options.startDate), 'yyyy-MM-dd') : '',
        endDate: options.endDate ? format(new Date(options.endDate), 'yyyy-MM-dd') : ''
      });

      const response = await this.axios.get(
        `/journal-activite/export/${userId}?${params.toString()}`,
        { responseType: 'blob' }
      );
      
      return this.formatResponse(response, 'Export réalisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export des activités', error);
      throw this.handleError(error, 'Erreur lors de l\'export des activités');
    }
  }
}

export default new JournalActiviteService();