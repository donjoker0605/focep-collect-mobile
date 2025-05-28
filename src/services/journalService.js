import BaseApiService from './base/BaseApiService';

class JournalService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ NOUVELLE MÉTHODE PRINCIPALE: Récupération automatique du journal du jour
  async getJournalDuJour(collecteurId, date = null) {
    try {
      const dateParam = date || new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      console.log('📅 Récupération journal du jour:', collecteurId, dateParam);
      
      const response = await this.axios.get(`/journaux/collecteur/${collecteurId}/jour`, {
        params: { date: dateParam }
      });
      
      return this.formatResponse(response, 'Journal du jour récupéré');
    } catch (error) {
      console.error('Erreur récupération journal du jour:', error);
      throw this.handleError(error, 'Erreur lors de la récupération du journal du jour');
    }
  }

  // ✅ RÉCUPÉRATION DU JOURNAL ACTIF (AUJOURD'HUI)
  async getJournalActif(collecteurId) {
    try {
      console.log('📅 Récupération journal actif pour collecteur:', collecteurId);
      
      const response = await this.axios.get(`/journaux/collecteur/${collecteurId}/actif`);
      return this.formatResponse(response, 'Journal actif récupéré');
    } catch (error) {
      console.error('Error fetching journal actif:', error);
      throw this.handleError(error, 'Erreur lors de la récupération du journal actif');
    }
  }

  // ✅ CLÔTURE AUTOMATIQUE DU JOURNAL DU JOUR
  async cloturerJournalAujourdhui(collecteurId) {
    try {
      const dateAujourdhui = new Date().toISOString().split('T')[0];
      console.log('🔒 Clôture journal du jour:', collecteurId, dateAujourdhui);
      
      const response = await this.axios.post(`/journaux/collecteur/${collecteurId}/cloture-jour`, {
        date: dateAujourdhui
      });
      
      return this.formatResponse(response, 'Journal du jour clôturé avec succès');
    } catch (error) {
      console.error('Erreur clôture journal du jour:', error);
      throw this.handleError(error, 'Erreur lors de la clôture du journal du jour');
    }
  }

  // ✅ RÉCUPÉRATION DES MOUVEMENTS DU JOURNAL DU JOUR
  async getMouvementsJournalDuJour(collecteurId, date = null) {
    try {
      // 1. Récupérer le journal du jour
      const journalResponse = await this.getJournalDuJour(collecteurId, date);
      const journal = journalResponse.data;

      // 2. Récupérer les mouvements de ce journal
      const mouvementsResponse = await this.axios.get(`/mouvements/journal/${journal.id}`, {}, {
        useCache: true,
        maxAge: 5 * 60 * 1000 // 5 minutes de cache
      });

      return this.formatResponse(mouvementsResponse, 'Mouvements du jour récupérés');
    } catch (error) {
      console.error('Erreur récupération mouvements du jour:', error);
      throw this.handleError(error, 'Erreur lors de la récupération des mouvements du jour');
    }
  }

  // MÉTHODES EXISTANTES CONSERVÉES
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
}

export default new JournalService();