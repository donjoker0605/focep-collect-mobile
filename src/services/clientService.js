// src/services/clientService.js
import BaseApiService from './base/BaseApiService';

class ClientService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * Récupérer tous les clients (filtrés par agence côté backend)
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
   * Récupérer un client par son ID
   */
  async getClientById(clientId) {
    try {
      console.log('📱 API: GET /clients/', clientId);
      const response = await this.axios.get(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du client');
    }
  }

  /**
   * Créer un nouveau client
   */
  async createClient(clientData) {
    try {
      console.log('📱 API: POST /clients');
      const response = await this.axios.post('/clients', clientData);
      return this.formatResponse(response, 'Client créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du client');
    }
  }

  /**
   * Mettre à jour un client
   */
  async updateClient(clientId, clientData) {
    try {
      console.log('📱 API: PUT /clients/', clientId);
      const response = await this.axios.put(`/clients/${clientId}`, clientData);
      return this.formatResponse(response, 'Client mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour');
    }
  }

  /**
   * Basculer le statut actif/inactif d'un client
   */
  async toggleClientStatus(clientId, newStatus) {
    try {
      console.log('📱 API: PATCH /clients/toggle-status/', clientId);
      const response = await this.axios.patch(`/clients/${clientId}/toggle-status`, {
        valide: newStatus
      });
      return this.formatResponse(response, 'Statut modifié');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du changement de statut');
    }
  }

  /**
   * Récupérer les clients d'un collecteur
   */
	 async getClientsByCollecteur(collecteurId, params = {}) {
	  try {
		console.log('📱 API: GET /clients/collecteur/', collecteurId);
		const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
		return this.formatResponse(response, 'Clients du collecteur récupérés');
	  } catch (error) {
		throw this.handleError(error, 'Erreur lors de la récupération des clients');
	  }
	}

  /**
   * Rechercher des clients
   */
  async searchClients(searchQuery) {
    try {
      console.log('📱 API: GET /clients/search');
      const response = await this.axios.get('/clients/search', {
        params: { q: searchQuery }
      });
      return this.formatResponse(response, 'Recherche effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la recherche');
    }
  }
  
	async getClientWithTransactions(clientId) {
		try {
			console.log('📱 API: GET /clients/', clientId, '/with-transactions');
			const response = await this.axios.get(`/clients/${clientId}/with-transactions`);
			return this.formatResponse(response, 'Détails client récupérés');
		} catch (error) {
			throw this.handleError(error, 'Erreur lors de la récupération des détails du client');
		}
	}

  /**
   * Récupérer l'historique des transactions d'un client
   */
  async getClientTransactions(clientId, params = {}) {
    try {
      console.log('📱 API: GET /clients/transactions/', clientId);
      const response = await this.axios.get(`/clients/${clientId}/transactions`, { params });
      return this.formatResponse(response, 'Transactions récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des transactions');
    }
  }

  /**
   * Récupérer les statistiques d'un client
   */
  async getClientStatistics(clientId) {
    try {
      console.log('📱 API: GET /clients/statistics/', clientId);
      const response = await this.axios.get(`/clients/${clientId}/statistics`);
      return this.formatResponse(response, 'Statistiques récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Valider un client
   */
  async validateClient(clientId) {
    try {
      console.log('📱 API: POST /clients/validate/', clientId);
      const response = await this.axios.post(`/clients/${clientId}/validate`);
      return this.formatResponse(response, 'Client validé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la validation');
    }
  }

  /**
   * Transférer un client vers un autre collecteur
   */
  async transferClient(clientId, newCollecteurId) {
    try {
      console.log('📱 API: POST /clients/transfer/', clientId);
      const response = await this.axios.post(`/clients/${clientId}/transfer`, {
        newCollecteurId
      });
      return this.formatResponse(response, 'Client transféré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du transfert');
    }
  }

  /**
   * Récupérer le solde d'un client
   */
  async getClientBalance(clientId) {
    try {
      console.log('📱 API: GET /clients/balance/', clientId);
      const response = await this.axios.get(`/clients/${clientId}/balance`);
      return this.formatResponse(response, 'Solde récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du solde');
    }
  }

  /**
   * Récupérer les clients avec des opérations récentes
   */
  async getClientsWithRecentActivity(days = 7) {
    try {
      console.log('📱 API: GET /clients/recent-activity');
      const response = await this.axios.get('/clients/recent-activity', {
        params: { days }
      });
      return this.formatResponse(response, 'Clients actifs récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération');
    }
  }

  /**
   * Récupérer les meilleurs clients (par épargne)
   */
  async getTopClients(limit = 10) {
    try {
      console.log('📱 API: GET /clients/top');
      const response = await this.axios.get('/clients/top', {
        params: { limit }
      });
      return this.formatResponse(response, 'Meilleurs clients récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération');
    }
  }

  /**
   * Exporter la liste des clients
   */
  async exportClients(format = 'excel', filters = {}) {
    try {
      console.log('📱 API: GET /clients/export');
      const response = await this.axios.get('/clients/export', {
        params: { format, ...filters },
        responseType: 'blob'
      });
      return this.formatResponse(response, 'Export généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'export');
    }
  }

  /**
   * Récupérer le résumé des clients pour le dashboard
   */
  async getClientsSummary() {
    try {
      console.log('📱 API: GET /clients/summary');
      const response = await this.axios.get('/clients/summary');
      return this.formatResponse(response, 'Résumé récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du résumé');
    }
  }

  /**
   * Supprimer un client (soft delete)
   */
  async deleteClient(clientId) {
    try {
      console.log('📱 API: DELETE /clients/', clientId);
      const response = await this.axios.delete(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client supprimé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression');
    }
	
	// Nouvelle méthode pour mettre à jour la localisation
	async updateClientLocation(clientId, locationData) {
	  try {
		console.log('📍 Mise à jour localisation client:', clientId);
		
		const response = await this.axios.put(
		  `/clients/${clientId}/location`, 
		  locationData
		);
		
		return this.formatResponse(response, 'Localisation mise à jour');
	  } catch (error) {
		throw this.handleError(error, 'Erreur mise à jour localisation');
	  }
	}

	// Nouvelle méthode pour obtenir la localisation
	async getClientLocation(clientId) {
	  try {
		const response = await this.axios.get(`/clients/${clientId}/location`);
		return this.formatResponse(response, 'Localisation récupérée');
	  } catch (error) {
		throw this.handleError(error, 'Erreur récupération localisation');
	  }
	}

	// Nouvelle méthode pour obtenir les clients proches
	async getNearbyClients(latitude, longitude, radiusKm = 5) {
	  try {
		const params = { latitude, longitude, radiusKm };
		const response = await this.axios.get('/clients/location/nearby', { params });
		return this.formatResponse(response, 'Clients proches récupérés');
	  } catch (error) {
		throw this.handleError(error, 'Erreur recherche clients proches');
	  }
	}
  }
  

export default new ClientService();