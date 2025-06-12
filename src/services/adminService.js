// src/services/adminService.js - VERSION FINALE SANS DONNÉES MOCKÉES
import BaseApiService from './base/BaseApiService';

class AdminService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ DASHBOARD ADMIN - ENDPOINT CORRIGÉ
  async getDashboardStats() {
    try {
      console.log('📊 API: GET /admin/dashboard');
      const response = await this.axios.get('/admin/dashboard');
      return this.formatResponse(response, 'Dashboard admin récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du dashboard admin');
    }
  }

  // ✅ GESTION DES COLLECTEURS - ENDPOINTS RÉELS
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

  async getCollecteurById(collecteurId) {
    try {
      console.log('👤 API: GET /collecteurs/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}`);
      return this.formatResponse(response, 'Collecteur récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du collecteur');
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

  async getCollecteurClients(collecteurId, { page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('👥 API: GET /clients/collecteur/', collecteurId);
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get(`/clients/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Clients du collecteur récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients');
    }
  }

  // ✅ GESTION DES AGENCES - ENDPOINTS RÉELS
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

  async updateAgence(agenceId, agenceData) {
    try {
      console.log('📝 API: PUT /agences/', agenceId);
      const response = await this.axios.put(`/agences/${agenceId}`, agenceData);
      return this.formatResponse(response, 'Agence mise à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour de l\'agence');
    }
  }

  async deleteAgence(agenceId) {
    try {
      console.log('🗑️ API: DELETE /agences/', agenceId);
      const response = await this.axios.delete(`/agences/${agenceId}`);
      return this.formatResponse(response, 'Agence supprimée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression de l\'agence');
    }
  }

  // ✅ PARAMÈTRES DE COMMISSION - ENDPOINTS RÉELS
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

  async deleteCommissionParameter(parameterId) {
    try {
      console.log('🗑️ API: DELETE /commission-parameters/', parameterId);
      const response = await this.axios.delete(`/commission-parameters/${parameterId}`);
      return this.formatResponse(response, 'Paramètre supprimé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression du paramètre');
    }
  }

  // ✅ TRANSFERTS DE COMPTES - ENDPOINTS RÉELS
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

  async getTransferDetails(transferId) {
    try {
      console.log('🔍 API: GET /transfers/', transferId);
      const response = await this.axios.get(`/transfers/${transferId}`);
      return this.formatResponse(response, 'Détails du transfert récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des détails');
    }
  }

  // ✅ RAPPORTS ET STATISTIQUES - ENDPOINTS RÉELS
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

  async generateCollecteurReport(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📊 API: GET /reports/collecteur/', collecteurId);
      const params = { dateDebut, dateFin };
      const response = await this.axios.get(`/reports/collecteur/${collecteurId}`, { 
        params,
        responseType: 'blob' // Pour télécharger le fichier
      });
      return this.formatResponse(response, 'Rapport collecteur généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération du rapport collecteur');
    }
  }

  async generateAgenceReport(agenceId, dateDebut, dateFin) {
    try {
      console.log('📊 API: GET /reports/agence/', agenceId);
      const params = { dateDebut, dateFin };
      const response = await this.axios.get(`/reports/agence/${agenceId}`, { 
        params,
        responseType: 'blob'
      });
      return this.formatResponse(response, 'Rapport agence généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération du rapport agence');
    }
  }

  // ✅ GESTION DES UTILISATEURS ADMIN
  async getAdmins({ page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('👨‍💼 API: GET /users/admins');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get('/users/admins', { params });
      return this.formatResponse(response, 'Administrateurs récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des administrateurs');
    }
  }

  async createAdmin(adminData) {
    try {
      console.log('➕ API: POST /users/admin', adminData);
      const response = await this.axios.post('/users/admin', adminData);
      return this.formatResponse(response, 'Administrateur créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création de l\'administrateur');
    }
  }

  async updateAdmin(adminId, adminData) {
    try {
      console.log('📝 API: PUT /users/admin/', adminId);
      const response = await this.axios.put(`/users/admin/${adminId}`, adminData);
      return this.formatResponse(response, 'Administrateur mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour de l\'administrateur');
    }
  }

  async deleteAdmin(adminId) {
    try {
      console.log('🗑️ API: DELETE /users/admin/', adminId);
      const response = await this.axios.delete(`/users/admin/${adminId}`);
      return this.formatResponse(response, 'Administrateur supprimé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la suppression de l\'administrateur');
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

  async getSystemLogs({ page = 0, size = 50, level = null } = {}) {
    try {
      console.log('📋 API: GET /admin/logs');
      const params = { page, size };
      if (level) params.level = level;
      
      const response = await this.axios.get('/admin/logs', { params });
      return this.formatResponse(response, 'Logs système récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des logs');
    }
  }

  // ✅ STATISTIQUES AVANCÉES
  async getAdvancedStats(period = 'MONTH') {
    try {
      console.log('📈 API: GET /admin/stats/advanced');
      const params = { period };
      const response = await this.axios.get('/admin/stats/advanced', { params });
      return this.formatResponse(response, 'Statistiques avancées récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques avancées');
    }
  }

  async getPerformanceMetrics() {
    try {
      console.log('⚡ API: GET /admin/metrics/performance');
      const response = await this.axios.get('/admin/metrics/performance');
      return this.formatResponse(response, 'Métriques de performance récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des métriques');
    }
  }
}

export default new AdminService();