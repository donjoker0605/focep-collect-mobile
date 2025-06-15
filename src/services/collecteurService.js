// src/services/collecteurService.js
import BaseApiService from './base/BaseApiService';

class CollecteurService extends BaseApiService {
  constructor() {
    super();
  }

  // Méthode principale pour récupérer les collecteurs
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

  // Alias pour compatibilité avec le code existant
  async getAllCollecteurs(params = {}) {
    return this.getCollecteurs(params);
  }

  // Méthode de recherche
  async searchCollecteurs(searchQuery) {
    return this.getCollecteurs({ search: searchQuery });
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

  async createCollecteur(collecteurData) {
    try {
      console.log('📱 API: POST /collecteurs');
      // Ne pas envoyer l'agenceId depuis le frontend - elle sera assignée automatiquement côté backend
      const { agenceId, ...dataToSend } = collecteurData;
      const response = await this.axios.post('/collecteurs', dataToSend);
      return this.formatResponse(response, 'Collecteur créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du collecteur');
    }
  }

  async updateCollecteur(collecteurId, collecteurData) {
    try {
      console.log('📱 API: PUT /collecteurs/', collecteurId);
      // Ne pas permettre la modification de l'agenceId
      const { agenceId, ...dataToSend } = collecteurData;
      const response = await this.axios.put(`/collecteurs/${collecteurId}`, dataToSend);
      return this.formatResponse(response, 'Collecteur mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour');
    }
  }

  async toggleStatus(collecteurId, newStatus) {
    try {
      console.log('📱 API: PATCH /collecteurs/toggle-status/', collecteurId);
      const response = await this.axios.patch(`/collecteurs/${collecteurId}/toggle-status`, {
        active: newStatus
      });
      return this.formatResponse(response, 'Statut modifié');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du changement de statut');
    }
  }

  async searchCollecteurs(searchQuery) {
    try {
      console.log('📱 API: GET /collecteurs/search');
      const response = await this.axios.get('/collecteurs/search', {
        params: { q: searchQuery }
      });
      return this.formatResponse(response, 'Recherche effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la recherche');
    }
  }

  async getCollecteurStatistics(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/statistics/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}/statistics`);
      return this.formatResponse(response, 'Statistiques récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  async getCollecteurDashboard(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/dashboard/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}/dashboard`);
      return this.formatResponse(response, 'Dashboard récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du dashboard');
    }
  }

  // Méthode pour récupérer les collecteurs d'une agence
  async getCollecteursByAgence(agenceId, params = {}) {
    try {
      console.log('📱 API: GET /agences/collecteurs/', agenceId);
      const response = await this.axios.get(`/agences/${agenceId}/collecteurs`, { params });
      return this.formatResponse(response, 'Collecteurs de l\'agence récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs de l\'agence');
    }
  }
}

export default new CollecteurService();