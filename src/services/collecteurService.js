// src/services/collecteurService.js 
import BaseApiService from './base/BaseApiService';

class CollecteurService extends BaseApiService {
  constructor() {
    super();
  }

  async getCollecteurs({ page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /collecteurs');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get('/collecteurs', { params });
      return this.formatResponse(response, 'Collecteurs récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs');
    }
  }

  async getCollecteurById(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}`);
      return this.formatResponse(response, 'Collecteur récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du collecteur');
    }
  }

  // ✅ CORRECTION CRITIQUE: Plus de données par défaut, lancer l'erreur
  async getCollecteurDashboard(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/dashboard/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}/dashboard`);
      return this.formatResponse(response, 'Dashboard récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du dashboard');
    }
  }
}

export default new CollecteurService();