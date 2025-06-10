// src/services/adminCommissionService.js
import BaseApiService from './base/BaseApiService';

class AdminCommissionService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ TRAITEMENT DES COMMISSIONS
  async processCommissions(collecteurId, dateDebut, dateFin, forceRecalculation = false) {
    try {
      console.log('⚡ API: POST /commissions/process');
      const params = { 
        collecteurId, 
        startDate: dateDebut, 
        endDate: dateFin, 
        forceRecalculation 
      };
      
      const response = await this.axios.post('/commissions/process', null, { params });
      return this.formatResponse(response, 'Commissions traitées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du traitement des commissions');
    }
  }

  // ✅ TRAITEMENT ASYNCHRONE
  async processCommissionsAsync(collecteurId, dateDebut, dateFin) {
    try {
      console.log('🔄 API: POST /commissions/process/async');
      const params = { 
        collecteurId, 
        startDate: dateDebut, 
        endDate: dateFin 
      };
      
      const response = await this.axios.post('/commissions/process/async', null, { params });
      return this.formatResponse(response, 'Traitement asynchrone démarré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du démarrage du traitement asynchrone');
    }
  }

  // ✅ TRAITEMENT BATCH POUR UNE AGENCE
  async processCommissionsBatch(agenceId, dateDebut, dateFin) {
    try {
      console.log('📦 API: POST /commissions/process/batch/agence/', agenceId);
      const params = { 
        startDate: dateDebut, 
        endDate: dateFin 
      };
      
      const response = await this.axios.post(`/commissions/process/batch/agence/${agenceId}`, null, { params });
      return this.formatResponse(response, 'Traitement batch lancé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du traitement batch');
    }
  }

  // ✅ CONSULTATION DES COMMISSIONS
  async getCommissionsByCollecteur(collecteurId, dateDebut = null, dateFin = null) {
    try {
      console.log('💰 API: GET /commissions/collecteur/', collecteurId);
      const params = {};
      if (dateDebut) params.startDate = dateDebut;
      if (dateFin) params.endDate = dateFin;
      
      const response = await this.axios.get(`/commissions/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Commissions collecteur récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des commissions');
    }
  }

  async getCommissionsByAgence(agenceId) {
    try {
      console.log('🏢 API: GET /commissions/agence/', agenceId);
      const response = await this.axios.get(`/commissions/agence/${agenceId}`);
      return this.formatResponse(response, 'Commissions agence récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des commissions agence');
    }
  }

  // ✅ SIMULATION DE COMMISSION
  async simulateCommission(request) {
    try {
      console.log('🧮 API: POST /commissions/simulate', request);
      const response = await this.axios.post('/commissions/simulate', request);
      return this.formatResponse(response, 'Simulation effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la simulation');
    }
  }

  // ✅ VALIDATION DES PARAMÈTRES
  async validateCommissionParameter(parameterData) {
    try {
      console.log('✅ API: POST /commissions/parameters/validate', parameterData);
      const response = await this.axios.post('/commissions/parameters/validate', parameterData);
      return this.formatResponse(response, 'Validation effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la validation');
    }
  }

  // ✅ GESTION DES PALIERS
  async addTierToParameter(parameterId, tierData) {
    try {
      console.log('➕ API: POST /commission-parameters/{}/tiers', parameterId);
      const response = await this.axios.post(`/commission-parameters/${parameterId}/tiers`, tierData);
      return this.formatResponse(response, 'Palier ajouté');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'ajout du palier');
    }
  }

  async removeTierFromParameter(parameterId, tierId) {
    try {
      console.log('🗑️ API: DELETE /commission-parameters/{}/tiers/{}', parameterId, tierId);
      const response = await this.axios.delete(`/commission-parameters/${parameterId}/tiers/${tierId}`);
      return this.formatResponse(response, 'Palier supprimé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression du palier');
    }
  }

  // ✅ RAPPORTS DE COMMISSION
  async generateCommissionReport(collecteurId, dateDebut, dateFin, format = 'pdf') {
    try {
      console.log('📊 API: POST /commissions/reports/generate');
      const data = {
        collecteurId,
        dateDebut,
        dateFin,
        format
      };
      
      const response = await this.axios.post('/commissions/reports/generate', data, {
        responseType: format === 'excel' ? 'blob' : 'json'
      });
      
      return this.formatResponse(response, 'Rapport généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération du rapport');
    }
  }
}

export default new AdminCommissionService();