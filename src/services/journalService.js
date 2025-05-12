import ApiService from './api';

class JournalService {
  // Créer un nouveau journal
  async createJournal(data) {
    try {
      return await ApiService.post('/journaux', {
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        collecteurId: data.collecteurId,
      });
    } catch (error) {
      console.error('Error creating journal:', error);
      throw error;
    }
  }

  // Consulter les journaux d'un collecteur
  async getJournauxByCollecteur(collecteurId, dateDebut, dateFin) {
    try {
      const params = {
        dateDebut,
        dateFin,
      };
      
      return await ApiService.get(`/journaux/collecteur/${collecteurId}`, params);
    } catch (error) {
      console.error('Error fetching journaux:', error);
      throw error;
    }
  }

  // Obtenir le détail d'un journal
  async getJournalById(journalId) {
    try {
      return await ApiService.get(`/journaux/${journalId}`);
    } catch (error) {
      console.error('Error fetching journal details:', error);
      throw error;
    }
  }

  // Clôturer un journal
  async cloturerJournal(journalId) {
    try {
      return await ApiService.post(`/journaux/cloture?journalId=${journalId}`);
    } catch (error) {
      console.error('Error closing journal:', error);
      throw error;
    }
  }

  // Obtenir le journal actif d'un collecteur
  async getJournalActif(collecteurId) {
    try {
      return await ApiService.get(`/journaux/collecteur/${collecteurId}/actif`);
    } catch (error) {
      console.error('Error fetching journal actif:', error);
      throw error;
    }
  }
}

export default new JournalService();