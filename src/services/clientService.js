import ApiService from './api';

class ClientService {
  // Lister les clients d'un collecteur
  async getClientsByCollecteur(collecteurId) {
    try {
      return await ApiService.get(`/clients/collecteur/${collecteurId}`);
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  // Créer un nouveau client
  async createClient(clientData) {
    try {
      return await ApiService.post('/clients', clientData);
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Mettre à jour un client
  async updateClient(clientId, clientData) {
    try {
      return await ApiService.put(`/clients/${clientId}`, clientData);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  // Supprimer un client
  async deleteClient(clientId) {
    try {
      return await ApiService.delete(`/clients/${clientId}`);
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Obtenir les comptes d'un client
  async getComptesClient(clientId) {
    try {
      return await ApiService.get(`/comptes/client/${clientId}`);
    } catch (error) {
      console.error('Error fetching comptes client:', error);
      throw error;
    }
  }

  // Obtenir le détail d'un client
  async getClientById(clientId) {
    try {
      return await ApiService.get(`/clients/${clientId}`);
    } catch (error) {
      console.error('Error fetching client details:', error);
      throw error;
    }
  }
}

export default new ClientService();