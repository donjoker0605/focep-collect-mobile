// src/services/journalActiviteService.js - VERSION CORRIGÉE
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

      // 🔥 CORRECTION CRITIQUE : utiliser this.axios au lieu de api
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

      // 🔥 CORRECTION : utiliser this.axios
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
      console.log(`📊 API: GET /journal-activite/stats/${userId}`);
      
      const params = new URLSearchParams();
      if (dateDebut) {
        params.append('dateDebut', dateDebut instanceof Date ? format(dateDebut, 'yyyy-MM-dd') : dateDebut);
      }
      if (dateFin) {
        params.append('dateFin', dateFin instanceof Date ? format(dateFin, 'yyyy-MM-dd') : dateFin);
      }

      // 🔥 CORRECTION : utiliser this.axios
      const response = await this.axios.get(
        `/journal-activite/stats/${userId}?${params.toString()}`
      );
      
      return this.formatResponse(response, 'Statistiques activité récupérées');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques', error);
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Ajouter une entrée au journal d'activité
   * @param {Object} activityData - Données de l'activité
   */
  async logActivity(activityData) {
    try {
      console.log('📝 API: POST /journal-activite');
      
      // 🔥 CORRECTION : utiliser this.axios
      const response = await this.axios.post('/journal-activite', activityData);
      
      return this.formatResponse(response, 'Activité enregistrée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'activité', error);
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'activité');
    }
  }
}

export default new JournalActiviteService();