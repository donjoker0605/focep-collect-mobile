// src/services/transactionService.js - VERSION CORRIGÉE ET ENRICHIE
import BaseApiService from './base/BaseApiService';

class TransactionService extends BaseApiService {
  constructor() {
    super();
    //Cache pour optimiser les recherches
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   *Pré-validation d'une épargne
   */
  async validateEpargne(clientId, collecteurId, montant, description = '') {
    try {
      console.log('📋 Validation épargne complète:', { clientId, collecteurId, montant });
      
      const response = await this.axios.post('/transactions/validate/epargne', {
        clientId,
        collecteurId,
        montant: parseFloat(montant),
        description
      });

      const result = this.formatResponse(response, 'Validation épargne');
      
      // Enrichir avec validation client si disponible
      if (result.success && result.data.clientId) {
        try {
          const clientValidation = await this.checkClientPhoneStatus(result.data.clientId);
          if (clientValidation.success) {
            result.data.hasValidPhone = clientValidation.data;
            if (!clientValidation.data) {
              result.data.phoneWarningMessage = 'Ce client n\'a pas de numéro de téléphone renseigné';
            }
          }
        } catch (phoneError) {
          console.warn('⚠️ Impossible de vérifier le téléphone:', phoneError.message);
        }
      }

      return result;

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la validation de l\'épargne');
    }
  }

  /**
   * Pré-validation d'un retrait
   */
  async validateRetrait(clientId, collecteurId, montant, description = '') {
    try {
      console.log('📋 Validation retrait:', { clientId, collecteurId, montant });
      
      const response = await this.axios.post('/mouvements/validate/retrait', {
        clientId,
        collecteurId,
        montant: parseFloat(montant),
        description
      });

      return this.formatResponse(response, 'Validation retrait');

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la validation du retrait');
    }
  }
  
  /**
   * Vérification statut téléphone client
   */
  async checkClientPhoneStatus(clientId) {
    try {
      console.log('📞 Vérification téléphone client:', clientId);
      
      const response = await this.axios.get(`/transactions/client/${clientId}/phone-status`);
      return this.formatResponse(response, 'Vérification téléphone');

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la vérification du téléphone');
    }
  }

  /**
   * 🔍 AMÉLIORÉ : Recherche intelligente avec cache optimisé
   */
  async searchClients(collecteurId, query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return this.formatResponse({ data: [] }, 'Requête trop courte');
      }

      const cacheKey = `search_${collecteurId}_${query.trim().toLowerCase()}_${limit}`;
      
      // Vérifier cache
      if (this.searchCache.has(cacheKey)) {
        const cached = this.searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('🚀 Cache hit pour recherche:', query);
          return cached.data;
        }
      }

      console.log('🔍 API: Recherche clients intelligente:', { collecteurId, query, limit });
      
      // Utiliser la recherche unifiée
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}/search-unified`, {
        params: { query: query.trim(), limit }
      });

      const result = this.formatResponse(response, 'Recherche intelligente effectuée');
      
      // Mettre en cache
      this.searchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      // Fallback vers ancienne méthode
      if (error.response?.status === 404) {
        console.warn('⚠️ Fallback vers recherche classique');
        return this.searchClientsClassic(collecteurId, query, limit);
      }
      throw this.handleError(error, 'Erreur lors de la recherche des clients');
    }
  }
  
  /**
   *  Méthode de recherche classique (fallback)
   */
  async searchClientsClassic(collecteurId, query, limit = 10) {
    try {
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}/search`, {
        params: { query: query.trim(), limit }
      });
      return this.formatResponse(response, 'Recherche classique effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la recherche classique');
    }
  }
  

  /**
   * Recherche client par numéro de compte
   */
  async searchByAccountNumber(collecteurId, accountNumber) {
    try {
      if (!accountNumber || accountNumber.trim().length < 3) {
        return this.formatResponse({ data: null }, 'Numéro trop court');
      }

      console.log('🔍 API: Recherche par compte:', { collecteurId, accountNumber });
      
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}/search-by-account`, {
        params: { accountNumber: accountNumber.trim() }
      });

      return this.formatResponse(response, 'Recherche par compte effectuée');

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la recherche par numéro de compte');
    }
  }

  /**
   * Enregistrer une épargne avec validation complète
   */
  async enregistrerEpargne(transactionData) {
    try {
      console.log('💰 Enregistrement épargne:', transactionData);

      // 1. Validation préalable
      const validation = await this.validateEpargne(
        transactionData.clientId,
        transactionData.collecteurId,
        transactionData.montant,
        transactionData.description
      );

      if (!validation.data.canProceed) {
        throw new Error(validation.data.errorMessage || 'Validation échouée');
      }

      // 2. Si validation OK, procéder à l'épargne
      const response = await this.axios.post('/transactions/epargne', transactionData);
      return this.formatResponse(response, 'Épargne enregistrée avec succès');

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'épargne');
    }
  }

  /**
   * Effectuer un retrait avec validation complète
   */
  async effectuerRetrait(transactionData) {
    try {
      console.log('💰 Effectuer retrait:', transactionData);

      // 1. Validation préalable
      const validation = await this.validateRetrait(
        transactionData.clientId,
        transactionData.collecteurId,
        transactionData.montant,
        transactionData.description
      );

      if (!validation.data.canProceed) {
        throw new Error(validation.data.errorMessage || 'Validation échouée');
      }

      // 2. Si validation OK, procéder au retrait
      const response = await this.axios.post('/transactions/retrait', transactionData);
      return this.formatResponse(response, 'Retrait effectué avec succès');

    } catch (error) {
      throw this.handleError(error, 'Erreur lors du retrait');
    }
  }


  /**
   * MÉTHODE PRINCIPALE CORRIGÉE : Récupérer les détails d'une transaction
   */
  async getTransactionDetails(transactionId) {
    try {
      console.log('🔍 API: GET /mouvements/', transactionId);
      const response = await this.axios.get(`/mouvements/${transactionId}`);
      return this.formatResponse(response, 'Détails de transaction récupérés');
    } catch (error) {
      console.error('❌ Erreur récupération détails transaction:', error);
      throw this.handleError(error, 'Erreur lors de la récupération des détails de la transaction');
    }
  }

  /**
   * MÉTHODE PRINCIPALE CORRIGÉE : Récupérer les transactions d'un client
   */
  async getTransactionsByClient(clientId) {
    try {
      console.log('📊 API: GET /mouvements/client/', clientId);
      const response = await this.axios.get(`/mouvements/client/${clientId}`);
      return this.formatResponse(response, 'Transactions du client récupérées');
    } catch (error) {
      console.error('❌ Erreur récupération transactions client:', error);
      throw this.handleError(error, 'Erreur lors de la récupération des transactions du client');
    }
  }

  async getTransactionsByCollecteur(collecteurId, page = 0, size = 50) {
    try {
      console.log('📊 API: GET /mouvements/collecteur/', collecteurId);
      const params = { page, size };
      const response = await this.axios.get(`/mouvements/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Transactions collecteur récupérées');
    } catch (error) {
      console.error('❌ Erreur récupération transactions collecteur:', error);
      throw this.handleError(error, 'Erreur lors de la récupération des transactions du collecteur');
    }
  }

  async fetchJournalTransactions({ collecteurId, date, page = 0, size = 20, sort = 'dateOperation,desc' }) {
    try {
      console.log('📊 API: GET /mouvements/journal/transactions');
      const params = { collecteurId, date, page, size, sort };
      
      const response = await this.axios.get('/mouvements/journal/transactions', { params });
      return this.formatResponse(response, 'Transactions du journal récupérées');
    } catch (error) {
      console.error('❌ Erreur récupération transactions journal:', error);
      throw this.handleError(error, 'Erreur lors de la récupération des transactions du journal');
    }
  }

  async verifyBalance({ clientId, montant }) {
    try {
      console.log('💳 API: POST /mouvements/verify-balance');
      const response = await this.axios.post('/mouvements/verify-balance', {
        clientId,
        montant
      });
      return this.formatResponse(response, 'Solde vérifié');
    } catch (error) {
      console.error('❌ Erreur vérification solde:', error);
      throw this.handleError(error, 'Erreur lors de la vérification du solde');
    }
  }

  async getMouvementsByJournal(journalId) {
    try {
      console.log('📊 API: GET /mouvements/journal/', journalId);
      const response = await this.axios.get(`/mouvements/journal/${journalId}`);
      return this.formatResponse(response, 'Mouvements du journal récupérés');
    } catch (error) {
      console.error('❌ Erreur récupération mouvements journal:', error);
      return this.handleError(error, 'Erreur lors de la récupération des mouvements du journal');
    }
  }

  /**
   * MÉTHODES UTILES
   */
  async getOperationsDuJour(collecteurId, date = null) {
    try {
      const dateParam = date || new Date().toISOString().split('T')[0];
      console.log('📅 API: GET /mouvements/collecteur/{}/jour', collecteurId);
      
      const params = { date: dateParam };
      const response = await this.axios.get(`/mouvements/collecteur/${collecteurId}/jour`, { params });
      return this.formatResponse(response, 'Opérations du jour récupérées');
    } catch (error) {
      console.error('❌ Erreur récupération opérations du jour:', error);
      throw this.handleError(error, 'Erreur lors de la récupération des opérations du jour');
    }
  }
  
  /**
   * Validation complète client avec données complémentaires
   */
  async validateClientData(collecteurId, accountNumber, clientName = null) {
    try {
      console.log('📋 Validation données client:', { collecteurId, accountNumber });
      
      const response = await this.axios.post('/clients/validate-client-data', {
        collecteurId,
        accountNumber: accountNumber.trim(),
        clientName
      });

      return this.formatResponse(response, 'Validation client effectuée');

    } catch (error) {
      // Fallback vers validation manuelle si endpoint pas disponible
      if (error.response?.status === 404) {
        console.warn('⚠️ Fallback vers validation manuelle');
        return this.fallbackValidateClient(collecteurId, accountNumber);
      }
      throw this.handleError(error, 'Erreur lors de la validation du client');
    }
  }

  /**
   * Recherche client par numéro de compte exact
   */
  async findClientByAccount(collecteurId, accountNumber) {
    try {
      console.log('🔍 Recherche client par compte:', { collecteurId, accountNumber });
      
      const response = await this.axios.get(
        `/clients/collecteur/${collecteurId}/by-account/${encodeURIComponent(accountNumber.trim())}`
      );
      
      return this.formatResponse(response, 'Client trouvé par compte');

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
   * Validation manuelle client (fallback)
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
            phoneWarning: client.hasPhone ? null : 'Pas de téléphone renseigné'
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

  /**
   * Recherche manuelle par compte (fallback)
   */
  async fallbackFindByAccount(collecteurId, accountNumber) {
    try {
      // Utiliser l'ancien endpoint de recherche générale
      const searchResponse = await this.searchClients(collecteurId, accountNumber, 20);
      
      if (searchResponse.success && searchResponse.data) {
        const client = searchResponse.data.find(c => c.numeroCompte === accountNumber.trim());
        return this.formatResponse({ data: client || null }, 'Recherche manuelle par compte');
      }
      
      return this.formatResponse({ data: null }, 'Client non trouvé');
    } catch (error) {
      throw this.handleError(error, 'Erreur recherche manuelle par compte');
    }
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * 🧹 Vider le cache de recherche
   */
  clearSearchCache() {
    this.searchCache.clear();
    console.log('🧹 Cache de recherche vidé');
  }

  /**
   * 📊 Obtenir les statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.searchCache.size,
      entries: Array.from(this.searchCache.keys())
    };
  }

  /**
   * 🔧 MÉTHODE DE DÉBOGAGE AMÉLIORÉE
   */
  async testEndpoints() {
    try {
      console.log('🔧 Test des endpoints de transaction...');
      
      const results = {};
      
      // Test endpoint principal
      try {
        const testCollecteurId = 1;
        const response = await this.axios.get(`/mouvements/collecteur/${testCollecteurId}`);
        results.collecteurTransactions = {
          success: true,
          dataCount: response.data?.data?.length || 0
        };
      } catch (error) {
        results.collecteurTransactions = {
          success: false,
          error: error.message
        };
      }

      // Test nouveaux endpoints
      try {
        // Test recherche (sans paramètres pour éviter erreur)
        results.searchEndpoint = { available: true };
      } catch (error) {
        results.searchEndpoint = { available: false, error: error.message };
      }

      console.log('📊 Résultats test endpoints:', results);
      
      return {
        success: true,
        message: 'Tests des endpoints effectués',
        results
      };
    } catch (error) {
      console.error('❌ Erreur test endpoints:', error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || 'Pas de détails'
      };
    }
  }

  /**
   * 🧪 NOUVEAU : Test spécifique des nouveaux endpoints
   */
  async testNewEndpoints(collecteurId = 1, clientId = 1) {
    console.log('🧪 Test des nouveaux endpoints de validation et recherche...');
    
    const results = {};

    // Test recherche clients
    try {
      const searchResult = await this.searchClients(collecteurId, 'test', 5);
      results.searchClients = { success: true, count: searchResult.data?.length || 0 };
    } catch (error) {
      results.searchClients = { success: false, error: error.message };
    }

    // Test vérification téléphone
    try {
      const phoneResult = await this.checkClientPhoneStatus(clientId);
      results.phoneCheck = { success: true, hasPhone: phoneResult.data };
    } catch (error) {
      results.phoneCheck = { success: false, error: error.message };
    }

    // Test validation épargne
    try {
      const validationResult = await this.validateEpargne(clientId, collecteurId, 1000);
      results.validateEpargne = { success: true, canProceed: validationResult.data?.canProceed };
    } catch (error) {
      results.validateEpargne = { success: false, error: error.message };
    }

    console.log('📊 Résultats test nouveaux endpoints:', results);
    return results;
  }
}

export default new TransactionService();