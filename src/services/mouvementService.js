import ApiService from './api';

class MouvementService {
  // Enregistrer une épargne
  async enregistrerEpargne(data) {
    try {
      return await ApiService.post('/mouvements/epargne', {
        clientId: data.clientId,
        collecteurId: data.collecteurId,
        montant: data.montant,
        journalId: data.journalId,
      });
    } catch (error) {
      console.error('Error enregistring épargne:', error);
      throw error;
    }
  }

  // Effectuer un retrait
  async effectuerRetrait(data) {
    try {
      return await ApiService.post('/mouvements/retrait', {
        clientId: data.clientId,
        collecteurId: data.collecteurId,
        montant: data.montant,
        journalId: data.journalId,
      });
    } catch (error) {
      console.error('Error effectuing retrait:', error);
      throw error;
    }
  }

  // Consulter les mouvements d'un journal
  async getMouvementsByJournal(journalId) {
    try {
      return await ApiService.get(`/mouvements/journal/${journalId}`);
    } catch (error) {
      console.error('Error fetching mouvements:', error);
      throw error;
    }
  }

  // Consulter les mouvements d'un client
  async getMouvementsByClient(clientId, dateDebut, dateFin) {
    try {
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      
      return await ApiService.get(`/mouvements/client/${clientId}`, params);
    } catch (error) {
      console.error('Error fetching client mouvements:', error);
      throw error;
    }
  }

  // Consulter les mouvements d'un collecteur
  async getMouvementsByCollecteur(collecteurId, dateDebut, dateFin) {
    try {
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      
      return await ApiService.get(`/mouvements/collecteur/${collecteurId}`, params);
    } catch (error) {
      console.error('Error fetching collecteur mouvements:', error);
      throw error;
    }
  }
}

export default new MouvementService();