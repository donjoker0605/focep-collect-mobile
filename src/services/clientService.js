// src/services/clientService.js - VERSION COMPLÈTE SANS MOCKS
import BaseApiService from './base/BaseApiService';

class ClientService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ MÉTHODE EXISTANTE CONSERVÉE
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

  // ✅ MÉTHODE EXISTANTE CONSERVÉE
  async getClientsByCollecteur(collecteurId) {
    const result = await this.getClients({ collecteurId, size: 1000 });
    return result.data || [];
  }

  // ✅ MÉTHODE EXISTANTE CONSERVÉE
  async getClientById(clientId) {
    try {
      console.log('📱 API: GET /clients/', clientId);
      const response = await this.axios.get(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du client');
    }
  }

  // ✅ MÉTHODE EXISTANTE CONSERVÉE
  async createClient(clientData) {
	  const user = await authService.getCurrentUser();
    try {
      console.log('📱 API: POST /clients', clientData);
      
      // ✅ CORRECTION: Ajouter les IDs manquants depuis le contexte utilisateur
      const enrichedData = {
        ...clientData,
		collecteurId: user.id, 
		agenceId: user.agenceId,
        collecteurId: clientData.collecteurId || this.getCurrentUserId(),
        agenceId: clientData.agenceId || this.getCurrentUserAgenceId(),
      };
      
      const response = await this.axios.post('/clients', enrichedData);
      return this.formatResponse(response, 'Client créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du client');
    }
  }

  // ✅ MÉTHODE EXISTANTE CONSERVÉE
  async updateClient(clientId, clientData) {
    try {
      console.log('📱 API: PUT /clients/', clientId, clientData);
      const response = await this.axios.put(`/clients/${clientId}`, clientData);
      return this.formatResponse(response, 'Client mis à jour avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour du client');
    }
  }

  // ✅ NOUVELLE MÉTHODE MANQUANTE: Changer le statut d'un client
  async updateClientStatus(clientId, newStatus) {
    try {
      console.log('📱 API: PATCH /clients/status/', clientId, { valide: newStatus });
      const response = await this.axios.patch(`/clients/${clientId}/status`, {
        valide: newStatus
      });
      return this.formatResponse(response, 'Statut du client mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du changement de statut');
    }
  }

  // ✅ NOUVELLE MÉTHODE MANQUANTE: Supprimer un client
  async deleteClient(clientId) {
    try {
      console.log('📱 API: DELETE /clients/', clientId);
      const response = await this.axios.delete(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client supprimé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression du client');
    }
  }

  // ✅ NOUVELLE MÉTHODE MANQUANTE: Rechercher des clients
  async searchClients(query, collecteurId) {
    try {
      console.log('📱 API: GET /clients/search');
      const params = { 
        q: query,
        collecteurId: collecteurId
      };
      
      const response = await this.axios.get('/clients/search', { params });
      return this.formatResponse(response, 'Recherche de clients effectuée');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la recherche de clients');
    }
  }

  // ✅ NOUVELLE MÉTHODE MANQUANTE: Obtenir les statistiques d'un client
  async getClientStats(clientId) {
    try {
      console.log('📱 API: GET /clients/stats/', clientId);
      const response = await this.axios.get(`/clients/${clientId}/stats`);
      return this.formatResponse(response, 'Statistiques client récupérées');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  // ✅ NOUVELLE MÉTHODE MANQUANTE: Obtenir le solde d'un client
  async getClientBalance(clientId) {
    try {
      console.log('📱 API: GET /clients/balance/', clientId);
      const response = await this.axios.get(`/clients/${clientId}/balance`);
      return this.formatResponse(response, 'Solde client récupéré');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération du solde');
    }
  }

  // ✅ NOUVELLE MÉTHODE MANQUANTE: Obtenir les transactions d'un client
  async getClientTransactions(clientId, { page = 0, size = 20, startDate, endDate } = {}) {
    try {
      console.log('📱 API: GET /clients/transactions/', clientId);
      const params = { page, size };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.axios.get(`/clients/${clientId}/transactions`, { params });
      return this.formatResponse(response, 'Transactions client récupérées');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des transactions');
    }
  }

  // ✅ NOUVELLE MÉTHODE MANQUANTE: Valider les données d'un client
  async validateClientData(clientData) {
    try {
      console.log('📱 API: POST /clients/validate');
      const response = await this.axios.post('/clients/validate', clientData);
      return this.formatResponse(response, 'Validation effectuée');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la validation');
    }
  }

  // ✅ NOUVELLE MÉTHODE MANQUANTE: Vérifier l'unicité du CNI
  async checkCniUniqueness(numeroCni, excludeClientId = null) {
    try {
      console.log('📱 API: GET /clients/check-cni');
      const params = { numeroCni };
      if (excludeClientId) params.excludeId = excludeClientId;
      
      const response = await this.axios.get('/clients/check-cni', { params });
      return this.formatResponse(response, 'Vérification CNI effectuée');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la vérification du CNI');
    }
  }

  // ✅ MÉTHODES UTILITAIRES PRIVÉES
  getCurrentUserId() {
    // Cette méthode devrait récupérer l'ID de l'utilisateur actuel depuis le contexte d'auth
    // Pour l'instant, on retourne null et laisse le backend gérer
    return null;
  }

  getCurrentUserAgenceId() {
    // Cette méthode devrait récupérer l'ID de l'agence de l'utilisateur actuel
    // Pour l'instant, on retourne null et laisse le backend gérer
    return null;
  }

  // ✅ MÉTHODE UTILITAIRE: Formater les données client pour l'affichage
  formatClientForDisplay(client) {
    return {
      ...client,
      displayName: `${client.prenom} ${client.nom}`,
      statusText: client.valide ? 'Actif' : 'Inactif',
      formattedPhone: this.formatPhoneNumber(client.telephone),
      fullAddress: `${client.ville}${client.quartier ? ', ' + client.quartier : ''}`,
    };
  }

  // ✅ MÉTHODE UTILITAIRE: Formater un numéro de téléphone
  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Nettoyer le numéro
    const cleaned = phone.replace(/\D/g, '');
    
    // Format camerounais: +237 6XX XX XX XX
    if (cleaned.length === 9 && cleaned.startsWith('6')) {
      return `+237 ${cleaned.substring(0, 1)}${cleaned.substring(1, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7)}`;
    }
    
    return phone;
  }

  // ✅ MÉTHODE UTILITAIRE: Filtrer les clients localement
  filterClientsLocally(clients, query) {
    if (!query || !query.trim()) return clients;
    
    const searchTerm = query.toLowerCase().trim();
    
    return clients.filter(client => 
      client.nom?.toLowerCase().includes(searchTerm) ||
      client.prenom?.toLowerCase().includes(searchTerm) ||
      client.numeroCni?.toLowerCase().includes(searchTerm) ||
      client.telephone?.includes(searchTerm) ||
      client.ville?.toLowerCase().includes(searchTerm) ||
      client.quartier?.toLowerCase().includes(searchTerm)
    );
  }

  // ✅ MÉTHODE UTILITAIRE: Trier les clients
  sortClients(clients, sortBy = 'nom', sortOrder = 'asc') {
    const sorted = [...clients].sort((a, b) => {
      let valueA = a[sortBy] || '';
      let valueB = b[sortBy] || '';
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
    
    return sorted;
  }

  // ✅ MÉTHODE UTILITAIRE: Valider les données client côté client
  validateClientDataLocally(clientData) {
    const errors = {};
    
    if (!clientData.nom?.trim()) {
      errors.nom = 'Le nom est requis';
    }
    
    if (!clientData.prenom?.trim()) {
      errors.prenom = 'Le prénom est requis';
    }
    
    if (!clientData.numeroCni?.trim()) {
      errors.numeroCni = 'Le numéro CNI est requis';
    }
    
    if (!clientData.telephone?.trim()) {
      errors.telephone = 'Le numéro de téléphone est requis';
    } else if (!/^(\+237|237)?[6-9][0-9]{8}$/.test(clientData.telephone.replace(/\s/g, ''))) {
      errors.telephone = 'Numéro de téléphone invalide (format camerounais attendu)';
    }
    
    if (!clientData.ville?.trim()) {
      errors.ville = 'La ville est requise';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new ClientService();