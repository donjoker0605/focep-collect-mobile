// src/services/adminService.js - SERVICE PRINCIPAL ADMIN
import BaseApiService from './base/BaseApiService';

class AdminService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ DASHBOARD ADMIN - STATISTIQUES GLOBALES
  async getDashboardStats() {
    try {
      console.log('📊 API: GET /admin/dashboard');
      const response = await this.axios.get('/admin/dashboard');
      return this.formatResponse(response, 'Dashboard admin récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du dashboard admin');
    }
  }

  // ✅ GESTION DES COLLECTEURS
  async getCollecteurs({ page = 0, size = 20, search = '', agenceId = null } = {}) {
    try {
      console.log('👥 API: GET /collecteurs');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      if (agenceId) params.agenceId = agenceId;
      
      const response = await this.axios.get('/collecteurs', { params });
      return this.formatResponse(response, 'Collecteurs récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs');
    }
  }

  async createCollecteur(collecteurData) {
    try {
      console.log('➕ API: POST /collecteurs', collecteurData);
      const response = await this.axios.post('/collecteurs', collecteurData);
      return this.formatResponse(response, 'Collecteur créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du collecteur');
    }
  }

  async updateCollecteur(collecteurId, collecteurData) {
    try {
      console.log('📝 API: PUT /collecteurs/', collecteurId);
      const response = await this.axios.put(`/collecteurs/${collecteurId}`, collecteurData);
      return this.formatResponse(response, 'Collecteur mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour du collecteur');
    }
  }

  async toggleCollecteurStatus(collecteurId, newStatus) {
    try {
      console.log('🔄 API: PUT /collecteurs/{}/status', collecteurId);
      const response = await this.axios.put(`/collecteurs/${collecteurId}/status`, {
        active: newStatus
      });
      return this.formatResponse(response, 'Statut collecteur mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du changement de statut');
    }
  }

  // ✅ GESTION DES AGENCES
  async getAgences({ page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('🏢 API: GET /agences');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get('/agences', { params });
      return this.formatResponse(response, 'Agences récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des agences');
    }
  }

  async createAgence(agenceData) {
    try {
      console.log('➕ API: POST /agences', agenceData);
      const response = await this.axios.post('/agences', agenceData);
      return this.formatResponse(response, 'Agence créée avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création de l\'agence');
    }
  }

  // ✅ PARAMÈTRES DE COMMISSION
  async getCommissionParameters({ page = 0, size = 20 } = {}) {
    try {
      console.log('⚙️ API: GET /commission-parameters');
      const params = { page, size };
      const response = await this.axios.get('/commission-parameters', { params });
      return this.formatResponse(response, 'Paramètres de commission récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des paramètres');
    }
  }

  async createCommissionParameter(parameterData) {
    try {
      console.log('➕ API: POST /commission-parameters', parameterData);
      const response = await this.axios.post('/commission-parameters', parameterData);
      return this.formatResponse(response, 'Paramètre de commission créé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du paramètre');
    }
  }

  async updateCommissionParameter(parameterId, parameterData) {
    try {
      console.log('📝 API: PUT /commission-parameters/', parameterId);
      const response = await this.axios.put(`/commission-parameters/${parameterId}`, parameterData);
      return this.formatResponse(response, 'Paramètre mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour du paramètre');
    }
  }

  // ✅ TRANSFERTS DE COMPTES
  async transferComptes(transferData) {
    try {
      console.log('🔄 API: POST /transfers/collecteurs', transferData);
      const response = await this.axios.post('/transfers/collecteurs', transferData);
      return this.formatResponse(response, 'Transfert effectué avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du transfert');
    }
  }

  async getTransferHistory({ page = 0, size = 20 } = {}) {
    try {
      console.log('📋 API: GET /transfers');
      const params = { page, size };
      const response = await this.axios.get('/transfers', { params });
      return this.formatResponse(response, 'Historique des transferts récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération de l\'historique');
    }
  }

  // ✅ RAPPORTS ET STATISTIQUES
  async generateReport(reportType, params = {}) {
    try {
      console.log('📊 API: POST /reports/generate', { reportType, ...params });
      const response = await this.axios.post('/reports/generate', {
        type: reportType,
        ...params
      });
      return this.formatResponse(response, 'Rapport généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération du rapport');
    }
  }

  async getReports({ page = 0, size = 20, type = null } = {}) {
    try {
      console.log('📋 API: GET /reports');
      const params = { page, size };
      if (type) params.type = type;
      
      const response = await this.axios.get('/reports', { params });
      return this.formatResponse(response, 'Rapports récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des rapports');
    }
  }

  // ✅ SANTÉ DU SYSTÈME
  async getSystemHealth() {
    try {
      console.log('🏥 API: GET /admin/compte-health/check');
      const response = await this.axios.get('/admin/compte-health/check');
      return this.formatResponse(response, 'État du système récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la vérification système');
    }
  }

  async fixCollecteurComptes(collecteurId) {
    try {
      console.log('🔧 API: POST /admin/compte-health/fix/', collecteurId);
      const response = await this.axios.post(`/admin/compte-health/fix/${collecteurId}`);
      return this.formatResponse(response, 'Comptes corrigés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la correction');
    }
  }

  // ✅ CACHE ET MAINTENANCE
  async clearCache() {
    try {
      console.log('🗑️ API: POST /admin/cache/clear-all');
      const response = await this.axios.post('/admin/cache/clear-all');
      return this.formatResponse(response, 'Cache vidé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du vidage du cache');
    }
  }
}

export default new AdminService();