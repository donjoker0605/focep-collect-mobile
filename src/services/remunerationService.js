// src/services/remunerationService.js
import api from '../api/axiosConfig';

/**
 * Service pour les opérations de rémunération
 * Basé sur les commissions calculées non rémunérées
 */
class RemunerationService {
  
  /**
   * Récupère les commissions calculées non rémunérées pour un collecteur
   * @param {number} collecteurId - ID du collecteur
   * @returns {Promise} Promesse résolue avec les commissions non rémunérées
   */
  async getCommissionsNonRemunerees(collecteurId) {
    console.log('📱 API: GET /historique-commissions/collecteur/:id/non-remuneres');
    
    try {
      const response = await api.get(`/v2/historique-commissions/collecteur/${collecteurId}/non-remuneres`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Erreur lors de la récupération des commissions non rémunérées');
      }
    } catch (error) {
      console.error('❌ Erreur getCommissionsNonRemunerees:', error);
      throw new Error(error.response?.data?.message || 'Erreur réseau ou serveur');
    }
  }

  /**
   * Récupère l'historique des rémunérations pour un collecteur
   * @param {number} collecteurId - ID du collecteur
   * @returns {Promise} Promesse résolue avec l'historique
   */
  async getHistoriqueRemunerations(collecteurId) {
    console.log('📱 API: GET /historique-remunerations/collecteur/:id');
    
    try {
      // TODO: Implémenter l'endpoint backend si nécessaire
      const response = await api.get(`/v2/commission-remuneration/collecteur/${collecteurId}/historique-remuneration`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Erreur lors de la récupération de l\'historique');
      }
    } catch (error) {
      console.error('❌ Erreur getHistoriqueRemunerations:', error);
      
      // Pour l'instant, retourner des données vides si l'endpoint n'existe pas
      if (error.response?.status === 404) {
        return {
          success: true,
          data: [],
          message: 'Aucun historique de rémunération trouvé'
        };
      }
      
      throw new Error(error.response?.data?.message || 'Erreur réseau ou serveur');
    }
  }

  /**
   * Récupère les rubriques de rémunération applicables à un collecteur
   * @param {number} collecteurId - ID du collecteur
   * @returns {Promise} Promesse résolue avec les rubriques
   */
  async getRubriquesByCollecteur(collecteurId) {
    console.log('📱 API: GET /rubriques-remuneration/collecteur/:id');
    
    try {
      const response = await api.get(`/v2/rubriques-remuneration/collecteur/${collecteurId}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Erreur lors de la récupération des rubriques');
      }
    } catch (error) {
      console.error('❌ Erreur getRubriquesByCollecteur:', error);
      throw new Error(error.response?.data?.message || 'Erreur réseau ou serveur');
    }
  }

  /**
   * Lance le processus de rémunération pour des commissions spécifiques
   * @param {number} collecteurId - ID du collecteur
   * @param {Array} commissionIds - IDs des commissions à rémunérer
   * @param {Array} rubriques - Rubriques à appliquer (optionnel)
   * @returns {Promise} Promesse résolue avec le résultat
   */
  async processRemuneration(collecteurId, commissionIds, rubriques = []) {
    console.log('📱 API: POST /commission-remuneration/collecteur/:id/remunerer');
    
    try {
      const payload = {
        commissionIds,
        rubriques,
        confirmationDateTime: new Date().toISOString()
      };

      const response = await api.post(
        `/v2/commission-remuneration/collecteur/${collecteurId}/remunerer`,
        payload
      );
      
      // Le backend renvoie directement RemunerationResult
      if (response.data && response.data.success !== false) {
        return {
          success: true,
          data: response.data,
          message: response.data.message || 'Rémunération effectuée avec succès'
        };
      } else {
        throw new Error(response.data.errorMessage || response.data.message || 'Erreur lors de la rémunération');
      }
    } catch (error) {
      console.error('❌ Erreur processRemuneration:', error);
      throw new Error(error.response?.data?.message || 'Erreur réseau ou serveur');
    }
  }

  /**
   * Marque une commission comme rémunérée
   * @param {number} historiqueId - ID de l'historique de calcul
   * @returns {Promise} Promesse résolue avec le résultat
   */
  async marquerCommeRemunere(historiqueId) {
    console.log('📱 API: PUT /historique-commissions/:id/marquer-remunere');
    
    try {
      const response = await api.put(`/v2/historique-commissions/${historiqueId}/marquer-remunere`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Erreur lors du marquage');
      }
    } catch (error) {
      console.error('❌ Erreur marquerCommeRemunere:', error);
      throw new Error(error.response?.data?.message || 'Erreur réseau ou serveur');
    }
  }

  /**
   * Calcule le montant total de rémunération pour des commissions sélectionnées
   * @param {Array} commissions - Liste des commissions sélectionnées
   * @param {Array} rubriques - Rubriques à appliquer
   * @returns {Object} Détail des calculs
   */
  calculateRemuneration(commissions, rubriques = []) {
    let totalCommissions = 0;
    let totalTVA = 0;
    
    // Calcul du total des commissions sélectionnées
    commissions.forEach(commission => {
      totalCommissions += parseFloat(commission.montantCommissionTotal || 0);
      totalTVA += parseFloat(commission.montantTvaTotal || 0);
    });

    let totalRubriques = 0;
    let detailRubriques = [];

    // Calcul des rubriques
    rubriques.forEach(rubrique => {
      if (!rubrique.active) return;

      let montantRubrique = 0;
      
      if (rubrique.type === 'CONSTANT') {
        montantRubrique = parseFloat(rubrique.valeur || 0);
      } else if (rubrique.type === 'PERCENTAGE') {
        montantRubrique = (totalCommissions * parseFloat(rubrique.valeur || 0)) / 100;
      }

      totalRubriques += montantRubrique;
      detailRubriques.push({
        nom: rubrique.nom,
        type: rubrique.type,
        valeur: rubrique.valeur,
        montant: montantRubrique
      });
    });

    return {
      totalCommissions,
      totalTVA,
      montantS: totalCommissions, // S = Commission totale
      totalRubriques,
      detailRubriques,
      montantFinalRemuneration: totalCommissions + totalRubriques,
      nombreCommissions: commissions.length
    };
  }
}

export default new RemunerationService();