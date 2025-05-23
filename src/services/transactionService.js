import axiosInstance from '../api/axiosConfig';

class TransactionService {
  // Enregistrer une épargne
  async enregistrerEpargne(data) {
    try {
      console.log('📱 Appel API: POST /mouvements/epargne', data);
      const response = await axiosInstance.post('/mouvements/epargne', data);
      console.log('✅ Épargne enregistrée:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur épargne:', error.response || error);
      throw error;
    }
  }

  // Effectuer un retrait
  async effectuerRetrait(data) {
    try {
      console.log('📱 Appel API: POST /mouvements/retrait', data);
      const response = await axiosInstance.post('/mouvements/retrait', data);
      console.log('✅ Retrait effectué:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur retrait:', error.response || error);
      throw error;
    }
  }

  // Récupérer les mouvements d'un journal
  async getMouvementsByJournal(journalId) {
    try {
      console.log('📱 Appel API: GET /mouvements/journal/', journalId);
      const response = await axiosInstance.get(`/mouvements/journal/${journalId}`);
      console.log('✅ Mouvements récupérés:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur mouvements:', error.response || error);
      throw error;
    }
  }

  // Récupérer les transactions du collecteur
  async getTransactionsByCollecteur(collecteurId) {
    try {
      console.log('📱 Appel API: GET /mouvements/collecteur/', collecteurId);
      const response = await axiosInstance.get(`/mouvements/collecteur/${collecteurId}`);
      console.log('✅ Transactions collecteur:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur transactions:', error.response || error);
      throw error;
    }
  }
}

export default new TransactionService();