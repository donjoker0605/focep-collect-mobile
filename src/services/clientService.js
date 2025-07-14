// src/services/clientService.js - CORRIGÉ
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
      console.log('📤 Données envoyées:', clientData);
      
      // Validation locale avant envoi
      const validation = this.validateClientDataLocally(clientData);
      if (!validation.isValid) {
        throw new Error(`Erreurs de validation: ${validation.errors.join(', ')}`);
      }
      
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
      console.log('📤 Données envoyées:', clientData);
      
      // Validation locale avant envoi
      const validation = this.validateClientDataLocally(clientData);
      if (!validation.isValid) {
        throw new Error(`Erreurs de validation: ${validation.errors.join(', ')}`);
      }
      
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
  
  /**
   * 🔥 MÉTHODE PRINCIPALE - Récupérer client avec toutes ses données
   * Utilise l'endpoint unifié /with-transactions qui existe déjà
   */
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
   * 🔥 CORRECTION - Utilise getClientWithTransactions au lieu d'endpoint séparé
   * Récupérer l'historique des transactions d'un client
   */
  async getClientTransactions(clientId, params = {}) {
    try {
      console.log('📱 API: Récupération transactions via /with-transactions pour client:', clientId);
      
      // Utilise l'endpoint unifié au lieu de l'endpoint séparé inexistant
      const response = await this.getClientWithTransactions(clientId);
      
      if (response && response.data && response.data.transactions) {
        let transactions = response.data.transactions;
        
        // Appliquer les filtres côté client si nécessaire
        if (params.type) {
          transactions = transactions.filter(t => 
            t.sens?.toLowerCase() === params.type.toLowerCase() ||
            t.typeMouvement?.toLowerCase() === params.type.toLowerCase()
          );
        }
        
        // Pagination côté client
        const page = params.page || 0;
        const size = params.size || 20;
        const start = page * size;
        const end = start + size;
        
        const paginatedTransactions = transactions.slice(start, end);
        
        const result = {
          content: paginatedTransactions,
          totalElements: transactions.length,
          totalPages: Math.ceil(transactions.length / size),
          size: size,
          number: page,
          numberOfElements: paginatedTransactions.length,
          first: page === 0,
          last: page >= Math.ceil(transactions.length / size) - 1
        };
        
        return this.formatResponse({ data: result }, 'Transactions récupérées');
      }
      
      // Si pas de transactions, retourner structure vide
      return this.formatResponse({ 
        data: { 
          content: [], 
          totalElements: 0, 
          totalPages: 0, 
          size: params.size || 20, 
          number: params.page || 0 
        } 
      }, 'Aucune transaction');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des transactions');
    }
  }

  /**
   * 🔥 CORRECTION - Utilise getClientWithTransactions au lieu d'endpoint séparé
   * Récupérer les statistiques d'un client
   */
  async getClientStatistics(clientId) {
    try {
      console.log('📱 API: Calcul statistiques via /with-transactions pour client:', clientId);
      
      // Utilise l'endpoint unifié
      const response = await this.getClientWithTransactions(clientId);
      
      if (response && response.data) {
        const data = response.data;
        
        // Extraire ou calculer les statistiques depuis les données unifiées
        const stats = {
          totalEpargne: data.totalEpargne || 0,
          totalRetraits: data.totalRetraits || 0,
          soldeTotal: data.soldeTotal || 0,
          nombreTransactions: data.transactions?.length || 0,
          derniereTransaction: data.transactions?.[0] ? {
            date: data.transactions[0].dateOperation,
            montant: data.transactions[0].montant,
            type: data.transactions[0].sens
          } : null,
          moyenneEpargneParTransaction: data.transactions?.length > 0 ? 
            (data.totalEpargne || 0) / data.transactions.length : 0,
          commission: data.commissionParam || null
        };
        
        return this.formatResponse({ data: stats }, 'Statistiques calculées');
      }
      
      throw new Error('Données insuffisantes pour calculer les statistiques');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * 🔥 CORRECTION - Utilise getClientWithTransactions au lieu d'endpoint séparé
   * Récupérer le solde d'un client
   */
  async getClientBalance(clientId) {
    try {
      console.log('📱 API: Calcul solde via /with-transactions pour client:', clientId);
      
      // Utilise l'endpoint unifié
      const response = await this.getClientWithTransactions(clientId);
      
      if (response && response.data) {
        const data = response.data;
        
        const balance = {
          soldeTotal: data.soldeTotal || 0,
          totalEpargne: data.totalEpargne || 0,
          totalRetraits: data.totalRetraits || 0,
          lastUpdated: new Date().toISOString(),
          clientNom: `${data.prenom || ''} ${data.nom || ''}`.trim()
        };
        
        return this.formatResponse({ data: balance }, 'Solde récupéré');
      }
      
      throw new Error('Impossible de récupérer le solde');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du solde');
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
  }

  // ============================================
  // MÉTHODES GÉOLOCALISATION
  // ============================================

  /**
   * Mettre à jour la localisation d'un client
   */
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

  /**
   * Obtenir la localisation d'un client
   */
  async getClientLocation(clientId) {
    try {
      const response = await this.axios.get(`/clients/${clientId}/location`);
      return this.formatResponse(response, 'Localisation récupérée');
    } catch (error) {
      throw this.handleError(error, 'Erreur récupération localisation');
    }
  }

  /**
   * Obtenir les clients proches d'une position
   */
  async getNearbyClients(latitude, longitude, radiusKm = 5) {
    try {
      const params = { latitude, longitude, radiusKm };
      const response = await this.axios.get('/clients/location/nearby', { params });
      return this.formatResponse(response, 'Clients proches récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur recherche clients proches');
    }
  }

  // ============================================
  // 🔥 MÉTHODES UTILITAIRES
  // ============================================

  /**
   * Vérifier si un endpoint existe (pour debug)
   */
  async testEndpoint(endpoint) {
    try {
      console.log(`🧪 Test endpoint: ${endpoint}`);
      const response = await this.axios.get(endpoint);
      console.log(`✅ Endpoint ${endpoint} disponible`);
      return true;
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} non disponible:`, error.response?.status);
      return false;
    }
  }

  /**
   * Diagnostiquer les endpoints client disponibles
   */
  async diagnoseClientEndpoints(clientId = 1) {
    console.log('🔍 Diagnostic des endpoints client...');
    
    const endpoints = [
      `/clients/${clientId}`,
      `/clients/${clientId}/with-transactions`,
      `/clients/${clientId}/statistics`,
      `/clients/${clientId}/balance`,
      `/clients/${clientId}/transactions`
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      results[endpoint] = await this.testEndpoint(endpoint);
    }
    
    console.log('📊 Résultats diagnostic:', results);
    return results;
  }
  
  /**
   * Tester la connexion au service client
   */
  async testConnection() {
    try {
      console.log('🧪 Test connexion service client...');
      
      // Tester avec un appel simple (ping ou summary)
      const response = await this.axios.get('/clients/summary');
      
      if (response && response.status === 200) {
        console.log('✅ Service client disponible');
        return { success: true, message: 'Service client opérationnel' };
      } else {
        console.log('❌ Service client indisponible');
        return { success: false, message: 'Service client indisponible' };
      }
    } catch (error) {
      console.error('❌ Erreur test connexion client:', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 🔥 MÉTHODE MANQUANTE - Validation locale des données client
   * @param {Object} clientData - Données du client à valider
   */
  validateClientDataLocally(clientData) {
    try {
      console.log('✅ Validation locale données client:', clientData);
      
      const errors = [];
      
      // Validation nom
      if (!clientData.nom || clientData.nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
      }
      
      // Validation prénom
      if (!clientData.prenom || clientData.prenom.trim().length < 2) {
        errors.push('Le prénom doit contenir au moins 2 caractères');
      }
      
      // Validation CNI
      if (!clientData.numeroCni || clientData.numeroCni.trim().length < 8) {
        errors.push('Le numéro CNI doit contenir au moins 8 caractères');
      }
      
      // Validation téléphone (format camerounais)
      const phoneRegex = /^(\+237|237)?[ ]?[6-9][0-9]{8}$/;
      if (!clientData.telephone || !phoneRegex.test(clientData.telephone)) {
        errors.push('Le numéro de téléphone n\'est pas valide (format camerounais requis)');
      }
      
      // Validation ville
      if (!clientData.ville || clientData.ville.trim().length < 2) {
        errors.push('La ville est requise');
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors,
        message: errors.length === 0 ? 'Données valides' : 'Erreurs de validation détectées'
      };
    } catch (error) {
      console.error('❌ Erreur validation locale:', error);
      return {
        isValid: false,
        errors: ['Erreur lors de la validation'],
        message: error.message
      };
    }
  }
  
  
}

export default new ClientService();