import BaseApiService from './base/BaseApiService';

class JournalService extends BaseApiService {
  constructor() {
    super();
  }

  // GARDER TOUTES VOS MÉTHODES EXISTANTES + UTILISER LES NOUVELLES MÉTHODES DE BASE
  async createJournal(data) {
    try {
      const response = await this.axios.post('/journaux', {
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        collecteurId: data.collecteurId,
      });
      return this.formatResponse(response, 'Journal créé avec succès');
    } catch (error) {
      console.error('Error creating journal:', error);
      throw this.handleError(error, 'Erreur lors de la création du journal');
    }
  }

  async getJournauxByCollecteur(collecteurId, dateDebut, dateFin) {
    try {
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      
      const response = await this.axios.get(`/journaux/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Journaux récupérés');
    } catch (error) {
      console.error('Error fetching journaux:', error);
      throw this.handleError(error, 'Erreur lors de la récupération des journaux');
    }
  }

  async getJournalById(journalId) {
    try {
      const response = await this.axios.get(`/journaux/${journalId}`);
      return this.formatResponse(response, 'Journal récupéré');
    } catch (error) {
      console.error('Error fetching journal details:', error);
      throw this.handleError(error, 'Erreur lors de la récupération du journal');
    }
  }

  async cloturerJournal(journalId) {
    try {
      const response = await this.axios.post(`/journaux/cloture?journalId=${journalId}`);
      return this.formatResponse(response, 'Journal clôturé avec succès');
    } catch (error) {
      console.error('Error closing journal:', error);
      throw this.handleError(error, 'Erreur lors de la clôture du journal');
    }
  }

  async getJournalActif(collecteurId) {
    try {
      const response = await this.axios.get(`/journaux/collecteur/${collecteurId}/actif`);
      return this.formatResponse(response, 'Journal actif récupéré');
    } catch (error) {
      console.error('Error fetching journal actif:', error);
      throw this.handleError(error, 'Erreur lors de la récupération du journal actif');
    }
  }
}

export default new JournalService();