// src/services/clientService.js - VERSION FINALE CORRIGÉE POUR TON ARCHITECTURE
import BaseApiService from './base/BaseApiService';
import authService from './authService'; // ✅ IMPORT CORRECT (sans destructuring)

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

  // ✅ MÉTHODE PRINCIPALE COMPLÈTEMENT CORRIGÉE
  async createClient(clientData) {
    try {
      console.log('📱 API: POST /clients - Données reçues:', clientData);
      
      // ✅ RÉCUPÉRATION SÉCURISÉE DE L'UTILISATEUR CONNECTÉ
      const user = await authService.getCurrentUser();
      console.log('👤 Utilisateur connecté:', user);
      
      if (!user) {
        throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');
      }

      // ✅ ENRICHISSEMENT CORRECT DES DONNÉES
      const enrichedData = {
        nom: clientData.nom,
        prenom: clientData.prenom,
        numeroCni: clientData.numeroCni,
        telephone: clientData.telephone,
        ville: clientData.ville || 'Douala',
        quartier: clientData.quartier || '',
        // IDs obligatoires pour le backend
        collecteurId: clientData.collecteurId || user.id,
        agenceId: clientData.agenceId || user.agenceId,
      };

      console.log('📤 Données enrichies envoyées:', enrichedData);
      
      // Validation côté client avant envoi
      const validation = this.validateClientDataLocally(enrichedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Données invalides',
          validationErrors: validation.errors
        };
      }
      
      const response = await this.axios.post('/clients', enrichedData);
      console.log('✅ Réponse serveur:', response.data);
      
      return this.formatResponse(response, 'Client créé avec succès');
    } catch (error) {
      console.error('❌ Erreur création client:', error);
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

  // ✅ NOUVELLES MÉTHODES UTILES
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

  async deleteClient(clientId) {
    try {
      console.log('📱 API: DELETE /clients/', clientId);
      const response = await this.axios.delete(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client supprimé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression du client');
    }
  }

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

  // ✅ VALIDATION CÔTÉ CLIENT ROBUSTE
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

    if (!clientData.collecteurId) {
      errors.collecteurId = 'ID collecteur manquant';
    }

    if (!clientData.agenceId) {
      errors.agenceId = 'ID agence manquant';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // ✅ MÉTHODES UTILITAIRES
  formatClientForDisplay(client) {
    return {
      ...client,
      displayName: `${client.prenom} ${client.nom}`,
      statusText: client.valide ? 'Actif' : 'Inactif',
      formattedPhone: this.formatPhoneNumber(client.telephone),
      fullAddress: `${client.ville}${client.quartier ? ', ' + client.quartier : ''}`,
    };
  }

  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 9 && cleaned.startsWith('6')) {
      return `+237 ${cleaned.substring(0, 1)}${cleaned.substring(1, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7)}`;
    }
    
    return phone;
  }

  // ✅ MÉTHODE DE DÉBOGAGE
  async testConnection() {
    try {
      const user = await authService.getCurrentUser();
      console.log('🔍 Test connexion - Utilisateur:', user);
      
      if (!user) {
        return { success: false, error: 'Pas d\'utilisateur connecté' };
      }
      
      // Test simple avec un GET
      const response = await this.axios.get('/clients/collecteur/' + user.id);
      return { 
        success: true, 
        message: 'Connexion OK',
        user: user,
        dataCount: response.data?.length || 0
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data || 'Pas de détails'
      };
    }
  }
}

export default new ClientService();