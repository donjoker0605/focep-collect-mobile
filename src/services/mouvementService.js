// src/services/mouvementService.js
import BaseApiService from './base/BaseApiService';

class MouvementService extends BaseApiService {
  constructor() {
    super();
  }

  // Enregistrer une épargne avec gestion hors ligne
  async enregistrerEpargne(data) {
    try {
      const response = await this.axios.post('/mouvements/epargne', {
        clientId: data.clientId,
        collecteurId: data.collecteurId,
        montant: data.montant,
        journalId: data.journalId,
      }, { canQueue: true }); // Permet la mise en file d'attente si hors ligne
      
      return this.formatResponse(response, 'Épargne enregistrée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'épargne:', error);
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'épargne');
    }
  }

  // Effectuer un retrait avec gestion hors ligne
  async effectuerRetrait(data) {
    try {
      const response = await this.axios.post('/mouvements/retrait', {
        clientId: data.clientId,
        collecteurId: data.collecteurId,
        montant: data.montant,
        journalId: data.journalId,
      }, { canQueue: true }); // Permet la mise en file d'attente si hors ligne
      
      return this.formatResponse(response, 'Retrait effectué avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'effectuation du retrait:', error);
      throw this.handleError(error, 'Erreur lors du retrait');
    }
  }

  // Consulter les mouvements d'un journal avec mise en cache
  async getMouvementsByJournal(journalId) {
    try {
      const response = await this.axios.get(`/mouvements/journal/${journalId}`, {}, {
        useCache: true,
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
      
      return this.formatResponse(response, 'Mouvements récupérés');
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements:', error);
      return this.handleError(error, 'Erreur lors de la récupération des mouvements');
    }
  }

  // Consulter les mouvements d'un client avec mise en cache
  async getMouvementsByClient(clientId, dateDebut, dateFin) {
    try {
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      
      const response = await this.axios.get(`/mouvements/client/${clientId}`, { params }, {
        useCache: true,
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
      
      return this.formatResponse(response, 'Mouvements client récupérés');
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements client:', error);
      return this.handleError(error, 'Erreur lors de la récupération des mouvements client');
    }
  }
}

export default new MouvementService();