// src/services/clientService.js
import ApiService from './api';

class ClientService {
  // Lister les clients d'un collecteur avec mise en cache
  async getClientsByCollecteur(collecteurId) {
    try {
      return await ApiService.get(`/clients/collecteur/${collecteurId}`, {}, {
        useCache: true,
        maxAge: 60 * 60 * 1000 // 1 heure
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  }

  // Créer un nouveau client avec gestion hors ligne
  async createClient(clientData) {
    try {
      return await ApiService.post('/clients', clientData, { canQueue: true });
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  }

  // Mettre à jour un client avec gestion hors ligne
  async updateClient(clientId, clientData) {
    try {
      return await ApiService.put(`/clients/${clientId}`, clientData, { canQueue: true });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      throw error;
    }
  }

  // Obtenir le détail d'un client avec mise en cache
  async getClientById(clientId) {
    try {
      return await ApiService.get(`/clients/${clientId}`, {}, {
        useCache: true,
        maxAge: 60 * 60 * 1000 // 1 heure
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du client:', error);
      throw error;
    }
  }
}

export default new ClientService();