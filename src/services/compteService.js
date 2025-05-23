import BaseApiService from './base/BaseApiService';

class CompteService extends BaseApiService {
  constructor() {
    super();
  }

  async getComptes({ collecteurId, clientId, page = 0, size = 20 } = {}) {
    try {
      let url = '/comptes';
      if (collecteurId) {
        url = `/comptes/collecteur/${collecteurId}`;
      } else if (clientId) {
        url = `/comptes/client/${clientId}`;
      }
      
      console.log('📱 API: GET', url);
      const params = { page, size };
      const response = await this.axios.get(url, { params });
      return this.formatResponse(response, 'Comptes récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des comptes');
    }
  }

  async getCompteBalance(compteId) {
    try {
      console.log('📱 API: GET /comptes/solde/', compteId);
      const response = await this.axios.get(`/comptes/${compteId}/solde`);
      return {
        solde: response.data?.solde || response.solde || response || 0,
        success: true
      };
    } catch (error) {
      return {
        solde: 0,
        success: false,
        error: error.message
      };
    }
  }
}

export default new CompteService();