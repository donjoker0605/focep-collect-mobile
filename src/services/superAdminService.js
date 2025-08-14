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
   * 🏢 GESTION DES AGENCES
   */
  async getAllAgences() {
    try {
      const response = await axiosConfig.get('/agences');
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

  async createAgence(agenceData) {
    try {
      const response = await axiosConfig.post('/agences', agenceData);
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

  async getAgenceDetails(agenceId) {
    try {
      const response = await axiosConfig.get(`/agences/${agenceId}`);
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
}

export default new SuperAdminService();