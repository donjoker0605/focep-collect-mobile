// src/services/journalActiviteService.js
import BaseApiService from './base/BaseApiService';
import { format } from 'date-fns';

class JournalActiviteService {
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

      const response = await api.get(
        `/journal-activite/user/${userId}?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des activités', error);
      throw error;
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

      const response = await api.get(
        `/journal-activite/agence/${agenceId}?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des activités agence', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle entrée dans le journal
   * @param {Object} activityData - Données de l'activité
   */
  async logActivity(activityData) {
    try {
      console.log('📝 API: POST /journal-activite');
      
      const response = await api.post('/journal-activite', {
        ...activityData,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'activité', error);
      throw error;
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

      const response = await api.get(
        `/journal-activite/stats/${userId}?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques', error);
      throw error;
    }
  }

  /**
   * Récupérer les types d'activités disponibles
   */
  async getActivityTypes() {
    try {
      const response = await api.get('/journal-activite/types');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des types d\'activité', error);
      throw error;
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

      const response = await api.get(
        `/journal-activite/export/${userId}?${params.toString()}`,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'export des activités', error);
      throw error;
    }
  }
}

export default new JournalActiviteService();