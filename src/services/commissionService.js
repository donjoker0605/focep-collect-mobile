// src/services/commissionService.js
import BaseApiService from './base/BaseApiService';

class CommissionService extends BaseApiService {
  constructor() {
    super();
  }

  // PARAMÈTRES DE COMMISSION

  /**
   * Récupérer les paramètres de commission de l'agence
   */
  async getAgenceCommissionParams() {
    try {
      console.log('📱 API: GET /commission-params/agence');
      const response = await this.axios.get('/commission-params/agence');
      return this.formatResponse(response, 'Paramètres agence récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des paramètres');
    }
  }

  /**
   * Mettre à jour les paramètres de commission de l'agence
   */
  async updateAgenceCommissionParams(params) {
    try {
      console.log('📱 API: PUT /commission-params/agence');
      const response = await this.axios.put('/commission-params/agence', params);
      return this.formatResponse(response, 'Paramètres agence mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour');
    }
  }

  /**
   * Récupérer les paramètres de commission d'un collecteur
   */
  async getCollecteurCommissionParams(collecteurId) {
    try {
      console.log('📱 API: GET /commission-params/collecteur/', collecteurId);
      const response = await this.axios.get(`/commission-params/collecteur/${collecteurId}`);
      return this.formatResponse(response, 'Paramètres collecteur récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des paramètres');
    }
  }

  /**
   * Mettre à jour les paramètres de commission d'un collecteur
   */
  async updateCollecteurCommissionParams(collecteurId, params) {
    try {
      console.log('📱 API: PUT /commission-params/collecteur/', collecteurId);
      const response = await this.axios.put(`/commission-params/collecteur/${collecteurId}`, params);
      return this.formatResponse(response, 'Paramètres collecteur mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour');
    }
  }

  /**
   * Récupérer les paramètres de commission d'un client
   */
  async getClientCommissionParams(clientId) {
    try {
      console.log('📱 API: GET /commission-params/client/', clientId);
      const response = await this.axios.get(`/commission-params/client/${clientId}`);
      return this.formatResponse(response, 'Paramètres client récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des paramètres');
    }
  }

  /**
   * Mettre à jour les paramètres de commission d'un client
   */
  async updateClientCommissionParams(clientId, params) {
    try {
      console.log('📱 API: PUT /commission-params/client/', clientId);
      const response = await this.axios.put(`/commission-params/client/${clientId}`, params);
      return this.formatResponse(response, 'Paramètres client mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour');
    }
  }

  // CALCUL DES COMMISSIONS

  /**
   * Calculer les commissions pour une période
   */
  async calculateCommissions(params) {
    try {
      console.log('📱 API: POST /commissions/calculate');
      const response = await this.axios.post('/commissions/calculate', params);
      return this.formatResponse(response, 'Commissions calculées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du calcul des commissions');
    }
  }

  /**
   * Calculer les commissions d'un collecteur
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
      throw this.handleError(error, 'Erreur lors du calcul');
    }
  }

  /**
   * Calculer les commissions de toute l'agence
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
      throw this.handleError(error, 'Erreur lors du calcul');
    }
  }

  // HISTORIQUE ET RAPPORTS

  /**
   * Récupérer l'historique des commissions
   */
  async getCommissionsHistory(params = {}) {
    try {
      console.log('📱 API: GET /commissions/history');
      const response = await this.axios.get('/commissions/history', { params });
      return this.formatResponse(response, 'Historique récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération');
    }
  }

  /**
   * Récupérer les commissions d'un collecteur
   */
  async getCollecteurCommissions(collecteurId, params = {}) {
    try {
      console.log('📱 API: GET /commissions/collecteur/', collecteurId);
      const response = await this.axios.get(`/commissions/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Commissions collecteur récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération');
    }
  }

  /**
   * Récupérer le détail d'une commission
   */
  async getCommissionDetails(commissionId) {
    try {
      console.log('📱 API: GET /commissions/', commissionId);
      const response = await this.axios.get(`/commissions/${commissionId}`);
      return this.formatResponse(response, 'Détails commission récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération');
    }
  }

  /**
   * Valider une commission
   */
  async validateCommission(commissionId) {
    try {
      console.log('📱 API: POST /commissions/validate/', commissionId);
      const response = await this.axios.post(`/commissions/${commissionId}/validate`);
      return this.formatResponse(response, 'Commission validée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la validation');
    }
  }

  /**
   * Payer une commission
   */
  async payCommission(commissionId, paymentData) {
    try {
      console.log('📱 API: POST /commissions/pay/', commissionId);
      const response = await this.axios.post(`/commissions/${commissionId}/pay`, paymentData);
      return this.formatResponse(response, 'Commission payée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du paiement');
    }
  }

  /**
   * Générer un rapport de commissions
   */
  async generateCommissionReport(params) {
    try {
      console.log('📱 API: POST /commissions/report');
      const response = await this.axios.post('/commissions/report', params, {
        responseType: 'blob' // Pour télécharger le fichier
      });
      return this.formatResponse(response, 'Rapport généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération du rapport');
    }
  }

  // STATISTIQUES

  /**
   * Récupérer les statistiques de commissions
   */
  async getCommissionStats(params = {}) {
    try {
      console.log('📱 API: GET /commissions/stats');
      const response = await this.axios.get('/commissions/stats', { params });
      return this.formatResponse(response, 'Statistiques récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération');
    }
  }

  /**
   * Récupérer les commissions en attente
   */
  async getPendingCommissions() {
    try {
      console.log('📱 API: GET /commissions/pending');
      const response = await this.axios.get('/commissions/pending');
      return this.formatResponse(response, 'Commissions en attente récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération');
    }
  }

  /**
   * Récupérer le résumé des commissions pour le dashboard
   */
  async getCommissionSummary() {
    try {
      console.log('📱 API: GET /commissions/summary');
      const response = await this.axios.get('/commissions/summary');
      return this.formatResponse(response, 'Résumé récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération');
    }
  }
}

export default new CommissionService();