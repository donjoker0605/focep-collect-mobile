// src/services/superAdminService.js
import axiosConfig from '../api/axiosConfig';

class SuperAdminService {
  /**
   * 📊 DASHBOARD SUPER ADMIN
   */
  async getDashboardStats() {
    try {
      const response = await axiosConfig.get('/super-admin/dashboard');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getDashboardStats:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du dashboard'
      };
    }
  }

  /**
   * 👥 GESTION DES ADMINS
   */
  async getAllAdmins() {
    try {
      const response = await axiosConfig.get('/super-admin/admins');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAllAdmins:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des admins'
      };
    }
  }

  async getAdminDetails(adminId) {
    try {
      const response = await axiosConfig.get(`/super-admin/admins/${adminId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAdminDetails:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des détails admin'
      };
    }
  }

  async resetAdminPassword(adminId, newPassword, reason = '') {
    try {
      const response = await axiosConfig.post(`/super-admin/admins/${adminId}/reset-password`, {
        newPassword,
        reason
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur resetAdminPassword:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe'
      };
    }
  }

  async toggleAdminStatus(adminId) {
    try {
      const response = await axiosConfig.patch(`/super-admin/admins/${adminId}/toggle-status`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur toggleAdminStatus:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la modification du statut'
      };
    }
  }

  /**
   * 🏢 Récupère les admins d'une agence spécifique
   */
  async getAdminsByAgence(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/agences/${agenceId}/admins`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAdminsByAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des admins de l\'agence'
      };
    }
  }

  /**
   * 👨‍💼 GESTION DES COLLECTEURS
   */
  async getAllCollecteurs() {
    try {
      const response = await axiosConfig.get('/super-admin/collecteurs');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAllCollecteurs:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des collecteurs'
      };
    }
  }

  async getCollecteurDetails(collecteurId) {
    try {
      const response = await axiosConfig.get(`/super-admin/collecteurs/${collecteurId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getCollecteurDetails:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des détails collecteur'
      };
    }
  }

  async createCollecteur(collecteurData) {
    try {
      const response = await axiosConfig.post('/super-admin/collecteurs', collecteurData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur createCollecteur:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création du collecteur'
      };
    }
  }

  async updateCollecteur(collecteurId, collecteurData) {
    try {
      const response = await axiosConfig.put(`/super-admin/collecteurs/${collecteurId}`, collecteurData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur updateCollecteur:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la modification du collecteur'
      };
    }
  }

  async toggleCollecteurStatus(collecteurId) {
    try {
      const response = await axiosConfig.patch(`/super-admin/collecteurs/${collecteurId}/toggle-status`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur toggleCollecteurStatus:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la modification du statut collecteur'
      };
    }
  }

  async getClientsByCollecteur(collecteurId) {
    try {
      const response = await axiosConfig.get(`/super-admin/collecteurs/${collecteurId}/clients`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getClientsByCollecteur:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des clients'
      };
    }
  }

  /**
   * 📊 EXPORTS EXCEL
   */
  async exportExcelComplete(filters = {}) {
    try {
      const response = await axiosConfig.post('/super-admin/export/excel', filters, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      return {
        success: true,
        data: response.data,
        fileName: this.extractFileNameFromResponse(response) || 'FOCEP_Export_Complet.xlsx'
      };
    } catch (error) {
      console.error('Erreur exportExcelComplete:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'export Excel complet'
      };
    }
  }

  async exportExcelAgence(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/export/excel/agence/${agenceId}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      return {
        success: true,
        data: response.data,
        fileName: this.extractFileNameFromResponse(response) || `FOCEP_Export_Agence_${agenceId}.xlsx`
      };
    } catch (error) {
      console.error('Erreur exportExcelAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'export Excel agence'
      };
    }
  }

  async exportExcelSummary() {
    try {
      const response = await axiosConfig.get('/super-admin/export/excel/summary', {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      return {
        success: true,
        data: response.data,
        fileName: this.extractFileNameFromResponse(response) || 'FOCEP_Export_Resume.xlsx'
      };
    } catch (error) {
      console.error('Erreur exportExcelSummary:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'export Excel résumé'
      };
    }
  }

  // Utilitaire pour extraire le nom de fichier depuis les headers
  extractFileNameFromResponse(response) {
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        return fileNameMatch[1].replace(/['"]/g, '');
      }
    }
    return null;
  }

  /**
   * 🏢 GESTION COMPLÈTE DES AGENCES
   */
  async getAllAgences(params = {}) {
    try {
      const { page = 0, size = 20, sortBy = 'nomAgence', sortDir = 'asc', pagination = false } = params;
      
      let url = '/super-admin/agences';
      if (!pagination) {
        url += '/all';
      } else {
        url += `?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
      }
      
      const response = await axiosConfig.get(url);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAllAgences:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des agences'
      };
    }
  }

  async getAgenceDetails(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/agences/${agenceId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAgenceDetails:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des détails agence'
      };
    }
  }

  async createAgence(agenceData) {
    try {
      const response = await axiosConfig.post('/super-admin/agences', agenceData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur createAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création de l\'agence'
      };
    }
  }

  async updateAgence(agenceId, agenceData) {
    try {
      const response = await axiosConfig.put(`/super-admin/agences/${agenceId}`, agenceData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur updateAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la modification de l\'agence'
      };
    }
  }

  async toggleAgenceStatus(agenceId) {
    try {
      const response = await axiosConfig.patch(`/super-admin/agences/${agenceId}/toggle-status`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur toggleAgenceStatus:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du changement de statut de l\'agence'
      };
    }
  }

  async deleteAgence(agenceId) {
    try {
      const response = await axiosConfig.delete(`/super-admin/agences/${agenceId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur deleteAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression de l\'agence'
      };
    }
  }

  // ================================
  // 💰 GESTION PARAMÈTRES COMMISSION PAR AGENCE
  // ================================

  async getAgenceCommissionParams(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/agences/${agenceId}/commission-params`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAgenceCommissionParams:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des paramètres commission'
      };
    }
  }

  async setAgenceCommissionParams(agenceId, parametres) {
    try {
      const response = await axiosConfig.post(`/super-admin/agences/${agenceId}/commission-params`, parametres);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur setAgenceCommissionParams:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la définition des paramètres commission'
      };
    }
  }

  async updateAgenceCommissionParam(agenceId, parametreId, parametre) {
    try {
      const response = await axiosConfig.put(`/super-admin/agences/${agenceId}/commission-params/${parametreId}`, parametre);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur updateAgenceCommissionParam:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la modification du paramètre commission'
      };
    }
  }

  async deleteAgenceCommissionParam(agenceId, parametreId) {
    try {
      const response = await axiosConfig.delete(`/super-admin/agences/${agenceId}/commission-params/${parametreId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur deleteAgenceCommissionParam:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression du paramètre commission'
      };
    }
  }

  /**
   * 🏢 COLLECTEURS ET CLIENTS PAR AGENCE
   */
  async getCollecteursByAgence(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/agences/${agenceId}/collecteurs`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getCollecteursByAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des collecteurs'
      };
    }
  }

  async getClientsByAgence(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/agences/${agenceId}/clients`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getClientsByAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des clients'
      };
    }
  }

  /**
   * 👤 CRÉATION D'ADMIN (via UserController existant)
   */
  async createAdmin(adminData) {
    try {
      const response = await axiosConfig.post('/users/admin', adminData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur createAdmin:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création de l\'admin'
      };
    }
  }

  /**
   * 💰 GESTION DES PARAMÈTRES DE COMMISSION
   */
  async getAllParametresCommission() {
    try {
      const response = await axiosConfig.get('/super-admin/parametres-commission');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAllParametresCommission:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des paramètres de commission'
      };
    }
  }

  async getParametresCommissionByAgence(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/parametres-commission/agence/${agenceId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getParametresCommissionByAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des paramètres de commission'
      };
    }
  }

  async createParametreCommission(parametreData) {
    try {
      const response = await axiosConfig.post('/super-admin/parametres-commission', parametreData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur createParametreCommission:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création du paramètre de commission'
      };
    }
  }

  async updateParametreCommission(parametreId, parametreData) {
    try {
      const response = await axiosConfig.put(`/super-admin/parametres-commission/${parametreId}`, parametreData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur updateParametreCommission:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du paramètre de commission'
      };
    }
  }

  async deleteParametreCommission(parametreId) {
    try {
      const response = await axiosConfig.delete(`/super-admin/parametres-commission/${parametreId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur deleteParametreCommission:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression du paramètre de commission'
      };
    }
  }

  async getTypesOperation() {
    try {
      const response = await axiosConfig.get('/super-admin/parametres-commission/types-operation');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getTypesOperation:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des types d\'opération'
      };
    }
  }

  async calculerCommission(agenceId, typeOperation, montantTransaction) {
    try {
      const response = await axiosConfig.post('/super-admin/parametres-commission/calculer-commission', null, {
        params: {
          agenceId,
          typeOperation,
          montantTransaction
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur calculerCommission:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du calcul de commission'
      };
    }
  }

  /**
   * 🧪 ENDPOINTS DE TEST
   */
  async testStatus() {
    try {
      const response = await axiosConfig.get('/test/status');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur testStatus:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du test de status'
      };
    }
  }

  // ================================
  // 🏢 NOUVEAUX ENDPOINTS POUR DÉTAILS AGENCE
  // ================================

  /**
   * 🏢 DÉTAILS COMPLETS D'UNE AGENCE
   */
  async getAgenceDetailsComplete(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/agences/${agenceId}/details`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAgenceDetailsComplete:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des détails de l\'agence'
      };
    }
  }

  /**
   * 👥 CLIENTS D'UN COLLECTEUR
   */
  async getClientsByCollecteur(collecteurId) {
    try {
      const response = await axiosConfig.get(`/super-admin/collecteurs/${collecteurId}/clients`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getClientsByCollecteur:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des clients du collecteur'
      };
    }
  }

  // ================================
  // 👤 GESTION COMPLÈTE DES ADMINS
  // ================================

  /**
   * ✨ CRÉER UN NOUVEL ADMIN
   */
  async createAdmin(adminData) {
    try {
      const response = await axiosConfig.post('/super-admin/admins', adminData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur createAdmin:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création de l\'admin'
      };
    }
  }

  /**
   * 🔄 MODIFIER UN ADMIN
   */
  async updateAdmin(adminId, adminData) {
    try {
      const response = await axiosConfig.put(`/super-admin/admins/${adminId}`, adminData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur updateAdmin:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la modification de l\'admin'
      };
    }
  }

  // ================================
  // 👨‍💼 GESTION COMPLÈTE DES COLLECTEURS
  // ================================

  /**
   * 📋 LISTE TOUS LES COLLECTEURS
   */
  async getAllCollecteurs() {
    try {
      const response = await axiosConfig.get('/super-admin/collecteurs');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAllCollecteurs:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des collecteurs'
      };
    }
  }

  /**
   * 🔍 DÉTAILS D'UN COLLECTEUR
   */
  async getCollecteurDetails(collecteurId) {
    try {
      const response = await axiosConfig.get(`/super-admin/collecteurs/${collecteurId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getCollecteurDetails:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des détails du collecteur'
      };
    }
  }

  /**
   * ✨ CRÉER UN NOUVEAU COLLECTEUR
   */
  async createCollecteur(collecteurData) {
    try {
      const response = await axiosConfig.post('/super-admin/collecteurs', collecteurData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur createCollecteur:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création du collecteur'
      };
    }
  }

  /**
   * 🔄 MODIFIER UN COLLECTEUR
   */
  async updateCollecteur(collecteurId, collecteurData) {
    try {
      const response = await axiosConfig.put(`/super-admin/collecteurs/${collecteurId}`, collecteurData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur updateCollecteur:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la modification du collecteur'
      };
    }
  }

  /**
   * 🔄 ACTIVER/DÉSACTIVER UN COLLECTEUR
   */
  async toggleCollecteurStatus(collecteurId) {
    try {
      const response = await axiosConfig.patch(`/super-admin/collecteurs/${collecteurId}/toggle-status`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur toggleCollecteurStatus:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du changement de statut du collecteur'
      };
    }
  }

  // ================================
  // 📊 JOURNAUX D'ACTIVITÉS
  // ================================

  /**
   * 📋 JOURNAUX DE TOUS LES COLLECTEURS
   */
  async getAllJournaux(params = {}) {
    try {
      const { page = 0, size = 20, agenceId, collecteurId } = params;
      let url = `/super-admin/journaux?page=${page}&size=${size}`;
      
      if (agenceId) url += `&agenceId=${agenceId}`;
      if (collecteurId) url += `&collecteurId=${collecteurId}`;

      const response = await axiosConfig.get(url);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAllJournaux:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des journaux'
      };
    }
  }

  // ================================
  // 👥 GESTION COMPLÈTE DES CLIENTS
  // ================================

  /**
   * 📋 LISTE TOUS LES CLIENTS
   */
  async getAllClients(params = {}) {
    try {
      const { page = 0, size = 20, agenceId, collecteurId } = params;
      let url = `/super-admin/clients?page=${page}&size=${size}`;
      
      if (agenceId) url += `&agenceId=${agenceId}`;
      if (collecteurId) url += `&collecteurId=${collecteurId}`;

      const response = await axiosConfig.get(url);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAllClients:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des clients'
      };
    }
  }

  // ================================
  // 📊 MONITORING COLLECTEURS INACTIFS
  // ================================

  /**
   * 🔍 Récupère les collecteurs inactifs
   */
  async getCollecteursInactifs() {
    try {
      const response = await axiosConfig.get('/super-admin/monitoring/collecteurs/inactifs');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getCollecteursInactifs:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des collecteurs inactifs'
      };
    }
  }

  /**
   * 📈 Récupère les statistiques de monitoring
   */
  async getMonitoringStatistics() {
    try {
      const response = await axiosConfig.get('/super-admin/monitoring/collecteurs/statistiques');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getMonitoringStatistics:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des statistiques de monitoring'
      };
    }
  }

  /**
   * 🏢 Récupère les collecteurs inactifs par agence
   */
  async getCollecteursInactifsByAgence(agenceId) {
    try {
      const response = await axiosConfig.get(`/super-admin/monitoring/collecteurs/inactifs/agence/${agenceId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getCollecteursInactifsByAgence:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des collecteurs inactifs par agence'
      };
    }
  }

  /**
   * 🚨 Exécute une action corrective
   */
  async executeActionCorrective(collecteurId, typeAction, motif = '') {
    try {
      const response = await axiosConfig.post(
        `/super-admin/monitoring/collecteurs/action-corrective/${collecteurId}`,
        null,
        {
          params: {
            typeAction,
            motif
          }
        }
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur executeActionCorrective:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'exécution de l\'action corrective'
      };
    }
  }

  /**
   * 🔧 Récupère les types d'actions correctives disponibles
   */
  async getActionsCorrectivesDisponibles() {
    try {
      const response = await axiosConfig.get('/super-admin/monitoring/collecteurs/actions-correctives');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getActionsCorrectivesDisponibles:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des actions correctives'
      };
    }
  }

  /**
   * 📊 Récupère le dashboard de monitoring complet
   */
  async getMonitoringDashboard() {
    try {
      const response = await axiosConfig.get('/super-admin/monitoring/collecteurs/dashboard');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getMonitoringDashboard:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du dashboard de monitoring'
      };
    }
  }

  // ================================
  // 💰 MÉTHODES CLIENTS ENRICHIES
  // ================================

  /**
   * 💎 Récupère les détails complets d'un client avec données financières
   */
  async getClientDetailsComplete(clientId) {
    try {
      const response = await axiosConfig.get(`/super-admin/clients/${clientId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getClientDetailsComplete:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des détails du client'
      };
    }
  }

  /**
   * 💳 Récupère l'historique des transactions d'un client
   */
  async getClientTransactions(clientId, page = 0, size = 20) {
    try {
      const response = await axiosConfig.get(`/super-admin/clients/${clientId}/transactions`, {
        params: { page, size }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getClientTransactions:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des transactions'
      };
    }
  }

  /**
   * 🏢 Récupère tous les clients avec données enrichies (utilisé par ClientConsultationScreen)
   */
  async getAllClientsEnriched(agenceId = null, collecteurId = null, page = 0, size = 50) {
    try {
      const params = {};
      if (agenceId) params.agenceId = agenceId;
      if (collecteurId) params.collecteurId = collecteurId;
      params.page = page;
      params.size = size;

      const response = await axiosConfig.get('/super-admin/clients', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erreur getAllClientsEnriched:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des clients enrichis'
      };
    }
  }
}

export default new SuperAdminService();