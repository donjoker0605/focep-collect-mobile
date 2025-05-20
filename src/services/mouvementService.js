// src/services/mouvementService.js
import ApiService from './api';

class MouvementService {
  // Enregistrer une épargne avec gestion hors ligne
  async enregistrerEpargne(data) {
    try {
      return await ApiService.post('/mouvements/epargne', {
        clientId: data.clientId,
        collecteurId: data.collecteurId,
        montant: data.montant,
        journalId: data.journalId,
      }, { canQueue: true }); // Permet la mise en file d'attente si hors ligne
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'épargne:', error);
      throw error;
    }
  }

  // Effectuer un retrait avec gestion hors ligne
  async effectuerRetrait(data) {
    try {
      return await ApiService.post('/mouvements/retrait', {
        clientId: data.clientId,
        collecteurId: data.collecteurId,
        montant: data.montant,
        journalId: data.journalId,
      }, { canQueue: true }); // Permet la mise en file d'attente si hors ligne
    } catch (error) {
      console.error('Erreur lors de l\'effectuation du retrait:', error);
      throw error;
    }
  }

  // Consulter les mouvements d'un journal avec mise en cache
  async getMouvementsByJournal(journalId) {
    try {
      return await ApiService.get(`/mouvements/journal/${journalId}`, {}, {
        useCache: true,
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements:', error);
      throw error;
    }
  }

  // Consulter les mouvements d'un client avec mise en cache
  async getMouvementsByClient(clientId, dateDebut, dateFin) {
    try {
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      
      return await ApiService.get(`/mouvements/client/${clientId}`, params, {
        useCache: true,
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements client:', error);
      throw error;
    }
  }
}

export default new MouvementService();