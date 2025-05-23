// src/services/apiService.js - SERVICE API CENTRALISÉ ET UNIFIÉ
import axiosInstance from '../api/axiosConfig';

class ApiService {
  // ===== COLLECTEURS =====
  async getCollecteurs({ page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /collecteurs');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await axiosInstance.get('/collecteurs', { params });
      return this.formatResponse(response, 'Collecteurs récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des collecteurs');
    }
  }

  async getCollecteurById(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/', collecteurId);
      const response = await axiosInstance.get(`/collecteurs/${collecteurId}`);
      return this.formatResponse(response, 'Collecteur récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du collecteur');
    }
  }

  async getCollecteurDashboard(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/dashboard/', collecteurId);
      const response = await axiosInstance.get(`/collecteurs/${collecteurId}/dashboard`);
      return this.formatResponse(response, 'Dashboard récupéré');
    } catch (error) {
      // Fallback si l'endpoint n'existe pas encore
      console.warn('Dashboard endpoint non disponible, utilisation de données par défaut');
      return {
        data: {
          totalClients: 0,
          totalEpargne: 0,
          totalRetraits: 0,
          soldeTotal: 0,
          transactionsRecentes: [],
          journalActuel: null
        },
        success: true,
        warning: 'Données par défaut utilisées'
      };
    }
  }

  // ===== CLIENTS =====
  async getClients({ collecteurId, page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /clients/collecteur/', collecteurId);
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await axiosInstance.get(`/clients/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Clients récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des clients');
    }
  }

  async getClientById(clientId) {
    try {
      console.log('📱 API: GET /clients/', clientId);
      const response = await axiosInstance.get(`/clients/${clientId}`);
      return this.formatResponse(response, 'Client récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du client');
    }
  }

  async createClient(clientData) {
    try {
      console.log('📱 API: POST /clients', clientData);
      const response = await axiosInstance.post('/clients', clientData);
      return this.formatResponse(response, 'Client créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du client');
    }
  }

  async updateClient(clientId, clientData) {
    try {
      console.log('📱 API: PUT /clients/', clientId, clientData);
      const response = await axiosInstance.put(`/clients/${clientId}`, clientData);
      return this.formatResponse(response, 'Client mis à jour avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour du client');
    }
  }

  // ===== COMPTES =====
  async getComptes({ collecteurId, clientId, page = 0, size = 20 } = {}) {
    try {
      let url = '/comptes';
      if (collecteurId) {
        url = `/comptes/collecteur/${collecteurId}`;
      } else if (clientId) {
        url = `/comptes/client/${clientId}`;
      }
      
      console.log('📱 API: GET', url);
      const params = { page, size };
      const response = await axiosInstance.get(url, { params });
      return this.formatResponse(response, 'Comptes récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des comptes');
    }
  }

  async getCompteBalance(compteId) {
    try {
      console.log('📱 API: GET /comptes/solde/', compteId);
      const response = await axiosInstance.get(`/comptes/${compteId}/solde`);
      return {
        solde: response.data?.solde || response.solde || response || 0,
        success: true
      };
    } catch (error) {
      return {
        solde: 0,
        success: false,
        error: error.message
      };
    }
  }

  // ===== TRANSFERTS =====
  async transferComptes(transferData) {
    try {
      console.log('📱 API: POST /transfers/collecteurs', transferData);
      
      const response = await axiosInstance.post('/transfers/collecteurs', transferData.clientIds, {
        params: {
          sourceCollecteurId: transferData.sourceCollecteurId,
          targetCollecteurId: transferData.destinationCollecteurId || transferData.targetCollecteurId
        }
      });
      
      return this.formatResponse(response, 'Transfert effectué avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du transfert');
    }
  }

  // ===== MOUVEMENTS =====
  async enregistrerEpargne(data) {
    try {
      console.log('📱 API: POST /mouvements/epargne', data);
      const response = await axiosInstance.post('/mouvements/epargne', data);
      return this.formatResponse(response, 'Épargne enregistrée avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'épargne');
    }
  }

  async effectuerRetrait(data) {
    try {
      console.log('📱 API: POST /mouvements/retrait', data);
      const response = await axiosInstance.post('/mouvements/retrait', data);
      return this.formatResponse(response, 'Retrait effectué avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du retrait');
    }
  }

  async getMouvementsByJournal(journalId) {
    try {
      console.log('📱 API: GET /mouvements/journal/', journalId);
      const response = await axiosInstance.get(`/mouvements/journal/${journalId}`);
      return this.formatResponse(response, 'Mouvements récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des mouvements');
    }
  }

  // ===== JOURNAUX =====
  async getJournauxByCollecteur(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📱 API: GET /journaux/collecteur/', collecteurId);
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      
      const response = await axiosInstance.get(`/journaux/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Journaux récupérés');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération des journaux');
    }
  }

  async getJournalActif(collecteurId) {
    try {
      console.log('📱 API: GET /journaux/collecteur/actif/', collecteurId);
      const response = await axiosInstance.get(`/journaux/collecteur/${collecteurId}/actif`);
      return this.formatResponse(response, 'Journal actif récupéré');
    } catch (error) {
      return this.handleError(error, 'Erreur lors de la récupération du journal actif');
    }
  }

  async createJournal(data) {
    try {
      console.log('📱 API: POST /journaux', data);
      const response = await axiosInstance.post('/journaux', data);
      return this.formatResponse(response, 'Journal créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du journal');
    }
  }

  async cloturerJournal(journalId) {
    try {
      console.log('📱 API: POST /journaux/cloture', { journalId });
      const response = await axiosInstance.post(`/journaux/cloture?journalId=${journalId}`);
      return this.formatResponse(response, 'Journal clôturé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la clôture du journal');
    }
  }

  // ===== UTILITAIRES =====
  formatResponse(response, message = 'Opération réussie') {
    const data = response.data || response;
    return {
      data: data?.data || data?.content || data,
      totalElements: data?.totalElements || 0,
      totalPages: data?.totalPages || 0,
      success: true,
      message
    };
  }

  handleError(error, defaultMessage = 'Une erreur est survenue') {
    console.error('❌', defaultMessage, error);
    
    return {
      data: [],
      totalElements: 0,
      totalPages: 0,
      success: false,
      error: error.response?.data?.message || error.message || defaultMessage
    };
  }

  // ===== TEST DE CONNECTIVITÉ =====
  async ping() {
    try {
      console.log('📱 API: GET /public/ping');
      const response = await axiosInstance.get('/public/ping');
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();