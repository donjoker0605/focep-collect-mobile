import BaseApiService from './base/BaseApiService';

class TransactionService extends BaseApiService {
  constructor() {
    super();
  }

  // GARDER TOUTES VOS MÉTHODES EXISTANTES + AJOUTER NOUVELLES
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

  // NOUVELLE MÉTHODE POUR VÉRIFIER LE SOLDE
  async verifyBalance(data) {
    try {
      console.log('📱 API: POST /mouvements/verify-balance', data);
      const response = await this.axios.post('/mouvements/verify-balance', data);
      return this.formatResponse(response, 'Solde vérifié');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la vérification du solde');
    }
  }
}

export default new TransactionService();