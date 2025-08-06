// src/services/adminCommissionService.js
import BaseApiService from './base/BaseApiService';

/**
 * Service pour la gestion administrative des commissions
 * Utilisé par les hooks d'administration
 */
class AdminCommissionService extends BaseApiService {
  constructor() {
    super();
  }

  // ================================
  // TRAITEMENT DES COMMISSIONS
  // ================================

  /**
   * Traiter les commissions pour un collecteur
   */
  async processCommissions(collecteurId, dateDebut, dateFin, force = false) {
    try {
      console.log('📱 API: POST /commissions/process');
      const response = await this.axios.post('/commissions/process', null, {
        params: {
          collecteurId,
          startDate: dateDebut,
          endDate: dateFin,
          forceRecalculation: force
        }
      });
      return this.formatResponse(response, 'Commissions traitées avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du traitement des commissions');
    }
  }

  /**
   * Traitement asynchrone des commissions
   */
  async processCommissionsAsync(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📱 API: POST /commissions/process/async');
      const response = await this.axios.post('/commissions/process/async', null, {
        params: {
          collecteurId,
          startDate: dateDebut,
          endDate: dateFin
        }
      });
      return this.formatResponse(response, 'Traitement asynchrone démarré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du lancement du traitement asynchrone');
    }
  }

  /**
   * Calculer les commissions (endpoint attendu par frontend)
   */
  async calculateCommissions(dateDebut, dateFin, collecteurId = null) {
    try {
      console.log('📱 API: POST /commissions/calculate');
      const response = await this.axios.post('/commissions/calculate', {
        dateDebut,
        dateFin,
        collecteurId
      });
      return this.formatResponse(response, 'Commissions calculées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du calcul des commissions');
    }
  }

  /**
   * Calculer les commissions pour toute l'agence
   */
  async calculateAgenceCommissions(dateDebut, dateFin) {
    try {
      console.log('📱 API: POST /commissions/agence/calculate');
      const response = await this.axios.post('/commissions/agence/calculate', {
        dateDebut,
        dateFin
      });
      return this.formatResponse(response, 'Commissions agence calculées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du calcul des commissions agence');
    }
  }

  /**
   * Calculer les commissions d'un collecteur spécifique
   */
  async calculateCollecteurCommissions(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📱 API: POST /commissions/collecteur/calculate');
      const response = await this.axios.post(`/commissions/collecteur/${collecteurId}/calculate`, {
        dateDebut,
        dateFin
      });
      return this.formatResponse(response, 'Commissions collecteur calculées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du calcul des commissions collecteur');
    }
  }

  // ================================
  // SIMULATION
  // ================================

  /**
   * Simuler une commission
   */
  async simulateCommission(simulationData) {
    try {
      console.log('📱 API: POST /commissions/simulate');
      const response = await this.axios.post('/commissions/simulate', simulationData);
      return this.formatResponse(response, 'Simulation effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la simulation');
    }
  }

  // ================================
  // CONSULTATION ET RAPPORTS
  // ================================

  /**
   * Récupérer les commissions d'un collecteur
   */
  async getCollecteurCommissions(collecteurId, startDate = null, endDate = null) {
    try {
      console.log('📱 API: GET /commissions/collecteur');
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await this.axios.get(`/commissions/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Commissions collecteur récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des commissions');
    }
  }

  /**
   * Traitement batch pour une agence
   */
  async processAgenceBatch(agenceId, dateDebut, dateFin) {
    try {
      console.log('📱 API: POST /commissions/process/batch/agence');
      const response = await this.axios.post(`/commissions/process/batch/agence/${agenceId}`, null, {
        params: {
          startDate: dateDebut,
          endDate: dateFin
        }
      });
      return this.formatResponse(response, 'Traitement batch agence terminé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du traitement batch agence');
    }
  }

  // ================================
  // MÉTHODES UTILITAIRES
  // ================================

  /**
   * Vérifier le statut d'un traitement asynchrone
   */
  async checkAsyncStatus(taskId) {
    try {
      console.log('📱 API: GET /commissions/async/status');
      const response = await this.axios.get(`/commissions/async/status/${taskId}`);
      return this.formatResponse(response, 'Statut récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la vérification du statut');
    }
  }

  /**
   * Annuler un traitement en cours
   */
  async cancelProcessing(taskId) {
    try {
      console.log('📱 API: DELETE /commissions/async/cancel');
      const response = await this.axios.delete(`/commissions/async/cancel/${taskId}`);
      return this.formatResponse(response, 'Traitement annulé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'annulation');
    }
  }
}

export default new AdminCommissionService();