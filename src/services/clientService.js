// src/services/clientService.js
import axiosInstance from '../api/axiosConfig';

class ClientService {
  // Récupérer tous les clients du collecteur
  async getClientsByCollecteur(collecteurId) {
    try {
      console.log('📱 Appel API: GET /clients/collecteur/', collecteurId);
      const response = await axiosInstance.get(`/clients/collecteur/${collecteurId}`);
      console.log('✅ Réponse clients:', response.data);
      
      // Gérer la structure de réponse du backend
      if (response.data?.data) {
        return response.data.data; // Si wrapped dans {success, data, message}
      }
      return response.data; // Si array direct
    } catch (error) {
      console.error('❌ Erreur getClients:', error.response || error);
      throw error;
    }
  }

  // Créer un nouveau client
  async createClient(clientData) {
    try {
      console.log('📱 Appel API: POST /clients', clientData);
      const response = await axiosInstance.post('/clients', clientData);
      console.log('✅ Client créé:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur createClient:', error.response || error);
      throw error;
    }
  }

  // Obtenir les détails d'un client
  async getClientById(clientId) {
    try {
      console.log('📱 Appel API: GET /clients/', clientId);
      const response = await axiosInstance.get(`/clients/${clientId}`);
      console.log('✅ Détails client:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getClientById:', error.response || error);
      throw error;
    }
  }

  // Mettre à jour un client
  async updateClient(clientId, clientData) {
    try {
      console.log('📱 Appel API: PUT /clients/', clientId, clientData);
      const response = await axiosInstance.put(`/clients/${clientId}`, clientData);
      console.log('✅ Client mis à jour:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur updateClient:', error.response || error);
      throw error;
    }
  }
}

export default new ClientService();