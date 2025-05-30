// src/services/transactionService.js 
import BaseApiService from './base/BaseApiService';

class TransactionService extends BaseApiService {
  constructor() {
    super();
  }

  // MÉTHODE PRINCIPALE CORRIGÉE : Récupérer les détails d'une transaction
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

  // MÉTHODE PRINCIPALE CORRIGÉE : Récupérer les transactions d'un client
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

  async enregistrerEpargne(data) {
    try {
      console.log('💰 API: POST /mouvements/epargne', data);
      const response = await this.axios.post('/mouvements/epargne', data);
      return this.formatResponse(response, 'Épargne enregistrée avec succès');
    } catch (error) {
      console.error('❌ Erreur enregistrement épargne:', error);
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'épargne');
    }
  }

  async effectuerRetrait(data) {
    try {
      console.log('🏧 API: POST /mouvements/retrait', data);
      const response = await this.axios.post('/mouvements/retrait', data);
      return this.formatResponse(response, 'Retrait effectué avec succès');
    } catch (error) {
      console.error('❌ Erreur effectuation retrait:', error);
      throw this.handleError(error, 'Erreur lors du retrait');
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

  // NOUVELLES MÉTHODES UTILES
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

  // MÉTHODE DE DÉBOGAGE
  async testEndpoints() {
    try {
      console.log('🔧 Test des endpoints de transaction...');
      
      // Test simple avec collecteur ID = 1 (ajustez selon vos données)
      const testCollecteurId = 1;
      const response = await this.axios.get(`/mouvements/collecteur/${testCollecteurId}`);
      
      return {
        success: true,
        message: 'Endpoints de transaction fonctionnels',
        dataCount: response.data?.data?.length || 0
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
}

export default new TransactionService();