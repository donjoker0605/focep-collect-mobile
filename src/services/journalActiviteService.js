// src/services/journalActiviteService.js
import BaseApiService from './base/BaseApiService';
import { format } from 'date-fns';

class JournalActiviteService extends BaseApiService {
  constructor() {
    super();
  }

  async getUserActivities(userId, date, options = {}) {
    try {
      console.log('📋 Récupération activités utilisateur:', userId, date);
      
      const params = {
        date: format(date, 'yyyy-MM-dd'),
        page: options.page || 0,
        size: options.size || 20
      };
      
      const response = await this.axios.get(`/audit/user/${userId}`, { params });
      return this.formatResponse(response, 'Activités récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des activités');
    }
  }

  async getAdminActivities(agenceId, date, options = {}) {
    try {
      const params = { 
        date: format(date, 'yyyy-MM-dd'), 
        ...options 
      };
      
      const response = await this.axios.get(`/audit/agence/${agenceId}`, { params });
      return this.formatResponse(response, 'Activités admin récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération admin');
    }
  }

  async getActivityStats(userId, startDate, endDate) {
    try {
      const params = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      };
      
      const response = await this.axios.get(`/audit/user/${userId}/stats`, { params });
      return this.formatResponse(response, 'Statistiques récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des stats');
    }
  }
}

export default new JournalActiviteService();