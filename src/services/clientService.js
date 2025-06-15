// src/services/clientService.js - SERVICE COMPLET POUR LES CLIENTS
import BaseApiService from './base/BaseApiService';

class ClientService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * ✅ RÉCUPÉRER TOUS LES CLIENTS DE L'AGENCE DE L'ADMIN CONNECTÉ
   */
  async getAllClients({ page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /clients');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get('/clients', { params });
      return this.formatResponse(response, 'Clients récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients');
    }
  }

  /**
   * ✅ RÉCUPÉRER LES CLIENTS D'UN COLLECTEUR SPÉCIFIQUE
   */
  async getClientsByCollecteur(collecteurId, { page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /clients/collecteur/', collecteurId);
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Clients du collecteur récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients du collecteur');
    }
  }

  /**
   * ✅ RÉCUPÉRER UN CLIENT PAR ID
   */
  async getClientById(clientId) {
    try {
      console.log('👤 API: GET /clients/', clientId);
      const response = await this.axios.get(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du client');
    }
  }

  /**
   * ✅ CRÉER UN NOUVEAU CLIENT
   */
  async createClient(clientData) {
    try {
      console.log('➕ API: POST /clients', clientData);
      const response = await this.axios.post('/clients', clientData);
      return this.formatResponse(response, 'Client créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du client');
    }
  }

  /**
   * ✅ METTRE À JOUR UN CLIENT
   */
  async updateClient(clientId, clientData) {
    try {
      console.log('📝 API: PUT /clients/', clientId);
      const response = await this.axios.put(`/clients/${clientId}`, clientData);
      return this.formatResponse(response, 'Client mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour du client');
    }
  }

  /**
   * ✅ BASCULER LE STATUT DE VALIDATION D'UN CLIENT
   */
  async toggleClientStatus(clientId, newStatus) {
    try {
      console.log('🔄 API: PATCH /clients/', clientId, '/toggle-status');
      const response = await this.axios.patch(`/clients/${clientId}/toggle-status`, {
        valide: newStatus
      });
      return this.formatResponse(response, 'Statut du client modifié');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du changement de statut du client');
    }
  }

  /**
   * ✅ SUPPRIMER UN CLIENT (DÉSACTIVATION)
   */
  async deleteClient(clientId) {
    try {
      console.log('🗑️ API: DELETE /clients/', clientId);
      const response = await this.axios.delete(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client supprimé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression du client');
    }
  }

  /**
   * ✅ RECHERCHER DES CLIENTS
   */
  async searchClients(searchQuery, { page = 0, size = 20 } = {}) {
    try {
      console.log('🔍 API: GET /clients/search');
      const params = { 
        q: searchQuery,
        page, 
        size 
      };
      
      const response = await this.axios.get('/clients/search', { params });
      return this.formatResponse(response, 'Recherche de clients effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la recherche de clients');
    }
  }

  /**
   * ✅ RÉCUPÉRER LES COMPTES D'UN CLIENT
   */
  async getClientComptes(clientId) {
    try {
      console.log('💳 API: GET /clients/', clientId, '/comptes');
      const response = await this.axios.get(`/clients/${clientId}/comptes`);
      return this.formatResponse(response, 'Comptes du client récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des comptes');
    }
  }

  /**
   * ✅ RÉCUPÉRER LES TRANSACTIONS D'UN CLIENT
   */
  async getClientTransactions(clientId, { page = 0, size = 10, type = null } = {}) {
    try {
      console.log('📊 API: GET /clients/', clientId, '/transactions');
      const params = { page, size };
      if (type) params.type = type;
      
      const response = await this.axios.get(`/clients/${clientId}/transactions`, { params });
      return this.formatResponse(response, 'Transactions du client récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des transactions');
    }
  }

  /**
   * ✅ RÉCUPÉRER LE SOLDE TOTAL D'UN CLIENT
   */
  async getClientBalance(clientId) {
    try {
      console.log('💰 API: GET /clients/', clientId, '/solde');
      const response = await this.axios.get(`/clients/${clientId}/solde`);
      return this.formatResponse(response, 'Solde du client récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du solde');
    }
  }

  /**
   * ✅ RÉCUPÉRER LES STATISTIQUES D'UN CLIENT
   */
  async getClientStatistics(clientId) {
    try {
      console.log('📈 API: GET /clients/', clientId, '/statistics');
      const response = await this.axios.get(`/clients/${clientId}/statistics`);
      return this.formatResponse(response, 'Statistiques du client récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * ✅ TRANSFÉRER UN CLIENT VERS UN AUTRE COLLECTEUR
   */
  async transferClient(clientId, newCollecteurId, justification = '') {
    try {
      console.log('🔄 API: POST /clients/', clientId, '/transfer');
      const response = await this.axios.post(`/clients/${clientId}/transfer`, {
        newCollecteurId,
        justification
      });
      return this.formatResponse(response, 'Client transféré avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du transfert du client');
    }
  }

  /**
   * ✅ VALIDER UN CLIENT (APPROUVER)
   */
  async validateClient(clientId) {
    try {
      console.log('✅ API: POST /clients/', clientId, '/validate');
      const response = await this.axios.post(`/clients/${clientId}/validate`);
      return this.formatResponse(response, 'Client validé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la validation du client');
    }
  }

  /**
   * ✅ INVALIDER UN CLIENT (REJETER)
   */
  async invalidateClient(clientId, reason = '') {
    try {
      console.log('❌ API: POST /clients/', clientId, '/invalidate');
      const response = await this.axios.post(`/clients/${clientId}/invalidate`, {
        reason
      });
      return this.formatResponse(response, 'Client invalidé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'invalidation du client');
    }
  }

  /**
   * ✅ RÉCUPÉRER LES CLIENTS RÉCEMMENT CRÉÉS
   */
  async getRecentClients(days = 7) {
    try {
      console.log('🕐 API: GET /clients/recent');
      const response = await this.axios.get('/clients/recent', {
        params: { days }
      });
      return this.formatResponse(response, 'Clients récents récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients récents');
    }
  }

  /**
   * ✅ RÉCUPÉRER LES CLIENTS PAR STATUT
   */
  async getClientsByStatus(status, { page = 0, size = 20 } = {}) {
    try {
      console.log('📋 API: GET /clients/status/', status);
      const params = { page, size };
      
      const response = await this.axios.get(`/clients/status/${status}`, { params });
      return this.formatResponse(response, `Clients ${status} récupérés`);
    } catch (error) {
      throw this.handleError(error, `Erreur lors de la récupération des clients ${status}`);
    }
  }

  /**
   * ✅ EXPORTER LES CLIENTS EN CSV
   */
  async exportClients(format = 'csv', filters = {}) {
    try {
      console.log('📥 API: GET /clients/export');
      const params = { format, ...filters };
      
      const response = await this.axios.get('/clients/export', { 
        params,
        responseType: 'blob' 
      });
      
      return this.formatResponse(response, 'Clients exportés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'exportation des clients');
    }
  }

  /**
   * ✅ IMPORTER DES CLIENTS DEPUIS UN FICHIER
   */
  async importClients(file, collecteurId) {
    try {
      console.log('📤 API: POST /clients/import');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collecteurId', collecteurId);
      
      const response = await this.axios.post('/clients/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return this.formatResponse(response, 'Clients importés avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'importation des clients');
    }
  }

  /**
   * ✅ RÉCUPÉRER LES STATISTIQUES GLOBALES DES CLIENTS
   */
  async getClientsStatistics() {
    try {
      console.log('📊 API: GET /clients/statistics');
      const response = await this.axios.get('/clients/statistics');
      return this.formatResponse(response, 'Statistiques des clients récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * ✅ FILTRER LES CLIENTS PAR CRITÈRES MULTIPLES
   */
  async filterClients(filters = {}) {
    try {
      console.log('🔽 API: POST /clients/filter');
      const response = await this.axios.post('/clients/filter', filters);
      return this.formatResponse(response, 'Clients filtrés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du filtrage des clients');
    }
  }
}

export default new ClientService();