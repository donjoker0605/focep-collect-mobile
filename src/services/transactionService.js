// src/services/transactionService.js 
import BaseApiService from './base/BaseApiService';

class TransactionService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ CORRECTION: Ajout de la méthode manquante
  async fetchJournalTransactions({ collecteurId, date, page = 0, size = 20, sort = 'dateHeure,desc' }) {
    try {
      console.log('📱 API: GET /mouvements/journal/transactions');
      const params = { collecteurId, date, page, size, sort };
      
      const response = await this.axios.get('/mouvements/journal/transactions', { params });
      return this.formatResponse(response, 'Transactions récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des transactions du journal');
    }
  }

  // ✅ CORRECTION: Ajout de getTransactionDetails
  async getTransactionDetails(transactionId) {
    try {
      console.log('📱 API: GET /mouvements/', transactionId);
      const response = await this.axios.get(`/mouvements/${transactionId}`);
      return this.formatResponse(response, 'Détails de transaction récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des détails');
    }
  }

  // ✅ CORRECTION: Méthode de vérification de solde
  async verifyBalance({ clientId, montant }) {
    try {
      console.log('📱 API: POST /mouvements/verify-balance');
      const response = await this.axios.post('/mouvements/verify-balance', {
        clientId,
        montant
      });
      return this.formatResponse(response, 'Solde vérifié');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la vérification du solde');
    }
  }

  // ✅ MÉTHODES EXISTANTES CONSERVÉES
  async enregistrerEpargne(data) {
    try {
      console.log('📱 API: POST /mouvements/epargne', data);
      const response = await this.axios.post('/mouvements/epargne', data);
      return this.formatResponse(response, 'Épargne enregistrée avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'épargne');
    }
  }

  async effectuerRetrait(data) {
    try {
      console.log('📱 API: POST /mouvements/retrait', data);
      const response = await this.axios.post('/mouvements/retrait', data);
      return this.formatResponse(response, 'Retrait effectué avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du retrait');
    }
  }

  async getMouvementsByJournal(journalId) {
    try {
      console.log('📱 API: GET /mouvements/journal/', journalId);
      const response = await this.axios.get(`/mouvements/journal/${journalId}`);
      return this.formatResponse(response, 'Mouvements récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des mouvements');
    }
  }

  async getTransactionsByCollecteur(collecteurId) {
    try {
      console.log('📱 API: GET /mouvements/collecteur/', collecteurId);
      const response = await this.axios.get(`/mouvements/collecteur/${collecteurId}`);
      return this.formatResponse(response, 'Transactions collecteur récupérées');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des transactions');
    }
  }
}

export default new TransactionService();