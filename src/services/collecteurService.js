import ApiService from './api';

class CollecteurService {
  // Lister les collecteurs d'une agence
  async getCollecteursByAgence(agenceId) {
    try {
      return await ApiService.get(`/collecteurs/agence/${agenceId}`);
    } catch (error) {
      console.error('Error fetching collecteurs:', error);
      throw error;
    }
  }

  // Créer un nouveau collecteur
  async createCollecteur(collecteurData) {
    try {
      return await ApiService.post('/collecteurs', collecteurData);
    } catch (error) {
      console.error('Error creating collecteur:', error);
      throw error;
    }
  }

  // Mettre à jour un collecteur
  async updateCollecteur(collecteurId, collecteurData) {
    try {
      return await ApiService.put(`/collecteurs/${collecteurId}`, collecteurData);
    } catch (error) {
      console.error('Error updating collecteur:', error);
      throw error;
    }
  }

  // Modifier le montant max de retrait
  async updateMontantMaxRetrait(collecteurId, nouveauMontant, justification) {
    try {
      return await ApiService.put(`/collecteurs/${collecteurId}/montant-max`, {
        nouveauMontant,
        justification,
      });
    } catch (error) {
      console.error('Error updating montant max:', error);
      throw error;
    }
  }

  // Obtenir les comptes d'un collecteur
  async getComptesCollecteur(collecteurId) {
    try {
      return await ApiService.get(`/comptes/collecteur/${collecteurId}`);
    } catch (error) {
      console.error('Error fetching comptes collecteur:', error);
      throw error;
    }
  }

  // Réinitialiser le mot de passe d'un collecteur
  async resetPassword(collecteurId, newPassword) {
    try {
      return await ApiService.post(`/collecteurs/${collecteurId}/reset-password`, {
        newPassword,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
}

export default new CollecteurService();