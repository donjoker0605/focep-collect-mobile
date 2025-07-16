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
      return this.formatResponse(response, 'Client mis à jour avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour du client');
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
  async getClientsByCollecteur(collecteurId, { page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /clients/collecteur/', collecteurId);
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Clients du collecteur récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients');
    }
  }

  /**
   * Rechercher des clients
   */
  async searchClients(query, collecteurId = null) {
    try {
      console.log('📱 API: GET /clients/search');
      const params = { q: query };
      if (collecteurId) params.collecteurId = collecteurId;
      
      const response = await this.axios.get('/clients/search', { params });
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
      throw this.handleError(error, 'Erreur lors de la suppression du client');
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
      console.log('📤 Données localisation:', locationData);
      
      const response = await this.axios.put(`/clients/${clientId}/location`, locationData);
      return this.formatResponse(response, 'Localisation mise à jour avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour de la localisation');
    }
  }

  /**
   * Récupérer la localisation d'un client
   */
  async getClientLocation(clientId) {
    try {
      console.log('📍 Récupération localisation client:', clientId);
      
      const response = await this.axios.get(`/clients/${clientId}/location`);
      return this.formatResponse(response, 'Localisation récupérée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération de la localisation');
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
      
      // Option 1: Utiliser l'endpoint ping du BaseApiService s'il existe
      try {
        const pingResponse = await this.ping();
        if (pingResponse) {
          console.log('✅ Service client disponible (ping)');
          return { success: true, message: 'Service client opérationnel via ping' };
        }
      } catch (pingError) {
        console.warn('⚠️ Ping échoué, test avec endpoint alternatif...');
      }
      
      // Option 2: Utiliser l'endpoint GET /clients avec des paramètres qui ne retournent pas de données
      try {
        const response = await this.axios.get('/clients', { 
          params: { 
            page: 0, 
            size: 1,
            search: '__test_connection__' // Recherche qui ne devrait rien retourner
          } 
        });
        
        // Si on arrive ici, c'est que l'endpoint répond correctement
        console.log('✅ Service client disponible (endpoint /clients)');
        return { success: true, message: 'Service client opérationnel' };
        
      } catch (clientsError) {
        // Si c'est une erreur 401 (non autorisé), le service fonctionne mais on n'est pas connecté
        if (clientsError.response && clientsError.response.status === 401) {
          console.log('✅ Service client disponible (erreur 401 = service OK, auth requise)');
          return { success: true, message: 'Service client opérationnel (authentification requise)' };
        }
        
        // Si c'est une erreur 403 (forbidden), le service fonctionne mais on n'a pas les droits
        if (clientsError.response && clientsError.response.status === 403) {
          console.log('✅ Service client disponible (erreur 403 = service OK, droits insuffisants)');
          return { success: true, message: 'Service client opérationnel (droits insuffisants)' };
        }
        
        throw clientsError;
      }
      
    } catch (error) {
      console.error('❌ Erreur test connexion client:', error);
      
      // Analyser l'erreur pour donner un message plus précis
      let message = 'Service client indisponible';
      
      if (error.code === 'NETWORK_ERROR') {
        message = 'Erreur réseau - Vérifiez votre connexion';
      } else if (error.code === 'ECONNREFUSED') {
        message = 'Serveur backend non démarré';
      } else if (error.response) {
        if (error.response.status >= 500) {
          message = `Erreur serveur (${error.response.status})`;
        } else if (error.response.status === 404) {
          message = 'Endpoint client non trouvé';
        } else {
          message = `Erreur client (${error.response.status})`;
        }
      }
      
      return { success: false, message, error: error.message };
    }
  }
  
  /**
   * 🔍 Recherche unifiée (nom + numéro de compte) avec priorité intelligente
   */
  async searchUnified(collecteurId, query, limit = 10) {
    try {
      console.log('🔍 API: Recherche unifiée:', { collecteurId, query, limit });
      
      if (!query || query.trim().length < 2) {
        return this.formatResponse({ data: [] }, 'Requête trop courte');
      }
      
      const params = { query: query.trim(), limit };
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}/search-unified`, { params });
      return this.formatResponse(response, 'Recherche unifiée effectuée');
      
    } catch (error) {
      // Fallback vers recherche normale si endpoint pas encore déployé
      if (error.response?.status === 404) {
        console.warn('⚠️ Fallback vers recherche optimisée');
        return this.searchClientsOptimized(collecteurId, query, limit);
      }
      throw this.handleError(error, 'Erreur lors de la recherche unifiée');
    }
  }

  /**
   * 🔍 Recherche client par numéro de compte exact
   */
  async findByAccountNumber(collecteurId, accountNumber) {
    try {
      console.log('🔍 API: Recherche par compte exact:', { collecteurId, accountNumber });
      
      if (!accountNumber || accountNumber.trim().length < 3) {
        return this.formatResponse({ data: null }, 'Numéro trop court');
      }
      
      const response = await this.axios.get(
        `/clients/collecteur/${collecteurId}/by-account/${encodeURIComponent(accountNumber.trim())}`
      );
      return this.formatResponse(response, 'Client trouvé par numéro de compte');
      
    } catch (error) {
      // Fallback vers recherche manuelle
      if (error.response?.status === 404) {
        console.warn('⚠️ Fallback vers recherche manuelle par compte');
        return this.fallbackFindByAccount(collecteurId, accountNumber);
      }
      throw this.handleError(error, 'Erreur lors de la recherche par compte');
    }
  }

  /**
   * 🔍 Suggestions numéros de compte pour autocomplete
   */
  async suggestAccountNumbers(collecteurId, partial, limit = 5) {
    try {
      console.log('🔍 API: Suggestions comptes:', { collecteurId, partial, limit });
      
      if (!partial || partial.trim().length < 2) {
        return this.formatResponse({ data: [] }, 'Requête trop courte');
      }
      
      const params = { partial: partial.trim(), limit };
      const response = await this.axios.get(
        `/clients/collecteur/${collecteurId}/accounts/suggest`, 
        { params }
      );
      return this.formatResponse(response, 'Suggestions générées');
      
    } catch (error) {
      // Fallback vers extraction depuis tous les clients
      if (error.response?.status === 404) {
        console.warn('⚠️ Fallback vers suggestions manuelles');
        return this.fallbackSuggestAccounts(collecteurId, partial, limit);
      }
      throw this.handleError(error, 'Erreur lors des suggestions');
    }
  }

  /**
   * 📋 Validation complète données client (compte + téléphone)
   */
  async validateClientData(collecteurId, accountNumber, clientName = null) {
    try {
      console.log('📋 API: Validation données client:', { collecteurId, accountNumber });
      
      const requestData = {
        collecteurId,
        accountNumber: accountNumber.trim(),
        clientName
      };
      
      const response = await this.axios.post('/clients/validate-client-data', requestData);
      return this.formatResponse(response, 'Validation effectuée');
      
    } catch (error) {
      // Fallback vers validation manuelle
      if (error.response?.status === 404) {
        console.warn('⚠️ Fallback vers validation manuelle');
        return this.fallbackValidateClient(collecteurId, accountNumber);
      }
      throw this.handleError(error, 'Erreur lors de la validation');
    }
  }

  // ========================================
  // MÉTHODES FALLBACK (compatibilité)
  // ========================================

  /**
   * Fallback : recherche manuelle par numéro de compte
   */
  async fallbackFindByAccount(collecteurId, accountNumber) {
    try {
      const allClients = await this.getClientsByCollecteur(collecteurId, { size: 1000 });
      
      if (allClients.success && allClients.data) {
        const clients = Array.isArray(allClients.data) ? allClients.data : [];
        const client = clients.find(c => c.numeroCompte === accountNumber.trim());
        
        if (client) {
          const formatted = this.formatClientForSearch(client);
          return this.formatResponse({ data: formatted }, 'Client trouvé (fallback)');
        }
      }
      
      return this.formatResponse({ data: null }, 'Client non trouvé');
    } catch (error) {
      throw this.handleError(error, 'Erreur fallback recherche par compte');
    }
  }

  /**
   * Fallback : suggestions manuelles de numéros de compte
   */
  async fallbackSuggestAccounts(collecteurId, partial, limit) {
    try {
      const allClients = await this.getClientsByCollecteur(collecteurId, { size: 1000 });
      
      if (allClients.success && allClients.data) {
        const clients = Array.isArray(allClients.data) ? allClients.data : [];
        const suggestions = clients
          .filter(c => c.numeroCompte && c.numeroCompte.includes(partial))
          .map(c => c.numeroCompte)
          .slice(0, limit);
        
        return this.formatResponse({ data: suggestions }, 'Suggestions générées (fallback)');
      }
      
      return this.formatResponse({ data: [] }, 'Aucune suggestion');
    } catch (error) {
      throw this.handleError(error, 'Erreur fallback suggestions');
    }
  }

  /**
   * Fallback : validation manuelle des données client
   */
  async fallbackValidateClient(collecteurId, accountNumber) {
    try {
      const clientResponse = await this.fallbackFindByAccount(collecteurId, accountNumber);
      
      if (clientResponse.data) {
        const client = clientResponse.data;
        return this.formatResponse({
          data: {
            clientFound: true,
            clientId: client.id,
            clientName: client.displayName,
            accountNumber: client.numeroCompte,
            hasValidPhone: client.hasPhone,
            phoneWarning: client.hasPhone ? null : 'Pas de téléphone renseigné',
            displayName: client.displayName,
            numeroCni: client.numeroCni
          }
        }, 'Validation manuelle effectuée');
      } else {
        return this.formatResponse({
          data: {
            clientFound: false,
            errorMessage: 'Aucun client trouvé avec ce numéro de compte'
          }
        }, 'Client non trouvé');
      }
    } catch (error) {
      throw this.handleError(error, 'Erreur validation manuelle');
    }
  }

  // ========================================
  // 🔧 UTILITAIRES AMÉLIORÉS
  // ========================================

  /**
   * Détection automatique du type de recherche (nom vs numéro)
   */
  detectSearchType(query) {
    if (!query) return 'unknown';
    
    const trimmed = query.trim();
    
    // Si contient que des chiffres et tirets/points, probablement un numéro de compte
    if (/^[0-9\-\.]+$/.test(trimmed)) {
      return 'account';
    }
    
    // Si commence par des lettres, probablement un nom
    if (/^[a-zA-ZÀ-ÿ]/.test(trimmed)) {
      return 'name';
    }
    
    // Mixte ou inconnu
    return 'mixed';
  }

  /**
   * Recherche intelligente avec détection automatique
   */
  async smartSearch(collecteurId, query, limit = 10) {
    const searchType = this.detectSearchType(query);
    
    console.log('🧠 Recherche intelligente:', { query, searchType });
    
    switch (searchType) {
      case 'account':
        // Recherche prioritaire par numéro de compte
        const accountResult = await this.findByAccountNumber(collecteurId, query);
        if (accountResult.data) {
          return this.formatResponse({ data: [accountResult.data] }, 'Trouvé par numéro');
        }
        // Fallback vers recherche unifiée
        return this.searchUnified(collecteurId, query, limit);
        
      case 'name':
        // Recherche prioritaire par nom
        return this.searchUnified(collecteurId, query, limit);
        
      default:
        // Recherche unifiée pour les cas mixtes
        return this.searchUnified(collecteurId, query, limit);
    }
  }
  
  /**
   * MÉTHODE MANQUANTE - Validation locale des données client
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
      if (!clientData.telephone || !phoneRegex.test(clientData.telephone.trim())) {
        errors.push('Le numéro de téléphone n\'est pas valide (format camerounais requis)');
      }
      
      // Validation ville
      if (!clientData.ville || clientData.ville.trim().length < 2) {
        errors.push('La ville est requise');
      }
      
      // Validation quartier (requis seulement pour création)
      if (!clientData.id && (!clientData.quartier || clientData.quartier.trim().length < 2)) {
        errors.push('Le quartier est requis');
      }
      
      // Validation coordonnées GPS (optionnelles mais doivent être valides si présentes)
      if (clientData.latitude !== null && clientData.latitude !== undefined) {
        if (typeof clientData.latitude !== 'number' || clientData.latitude < -90 || clientData.latitude > 90) {
          errors.push('La latitude doit être un nombre entre -90 et 90');
        }
      }
      
      if (clientData.longitude !== null && clientData.longitude !== undefined) {
        if (typeof clientData.longitude !== 'number' || clientData.longitude < -180 || clientData.longitude > 180) {
          errors.push('La longitude doit être un nombre entre -180 et 180');
        }
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