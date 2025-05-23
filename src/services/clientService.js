import BaseApiService from './base/BaseApiService';

class ClientService extends BaseApiService {
  constructor() {
    super();
  }

  async getClients({ collecteurId, page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /clients/collecteur/', collecteurId);
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Clients récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des clients');
    }
  }

  async getClientsByCollecteur(collecteurId) {
    const result = await this.getClients({ collecteurId, size: 1000 });
    return result.data || [];
  }

  async getClientById(clientId) {
    try {
      console.log('📱 API: GET /clients/', clientId);
      const response = await this.axios.get(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du client');
    }
  }

  async createClient(clientData) {
    try {
      console.log('📱 API: POST /clients', clientData);
      const response = await this.axios.post('/clients', clientData);
      return this.formatResponse(response, 'Client créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du client');
    }
  }

  async updateClient(clientId, clientData) {
    try {
      console.log('📱 API: PUT /clients/', clientId, clientData);
      const response = await this.axios.put(`/clients/${clientId}`, clientData);
      return this.formatResponse(response, 'Client mis à jour avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour du client');
    }
  }
}

export default new ClientService();