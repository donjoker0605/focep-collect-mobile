import axios from 'axios';
import api, { handleApiError } from './axiosConfig';
import { ENDPOINTS } from '../config/apiConfig';
import { BACKEND_URL } from '@env'; 


// Configuration de base pour Axios
const API = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Service de gestion des transactions (mouvements)
const TransactionService = {
  // Enregistrer une épargne
  enregistrerEpargne: async (clientId, montant, journalId = null) => {
    try {
      const response = await API.post(API_ENDPOINTS.COLLECTE.EPARGNE, {
        clientId,
        montant,
        journalId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Enregistrer un retrait
  enregistrerRetrait: async (clientId, montant, journalId = null) => {
    try {
      const response = await API.post(API_ENDPOINTS.COLLECTE.RETRAIT, {
        clientId,
        montant,
        journalId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Ventiler la collecte journalière
  ventilerCollecte: async (collecteurId, ventilations, journalId = null) => {
    try {
      const response = await API.post(API_ENDPOINTS.COLLECTE.VENTILATION, {
        collecteurId,
        ventilations, // [{clientId, montant}]
        journalId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les mouvements d'un journal
  getMouvementsByJournal: async (journalId, page = 0, size = 10) => {
    try {
      const response = await API.get(`${API_ENDPOINTS.JOURNAL.DETAILS(journalId)}/mouvements?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les totaux pour un journal
  getJournalTotals: async (journalId) => {
    try {
      const response = await API.get(`${API_ENDPOINTS.JOURNAL.DETAILS(journalId)}/totals`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Récupérer les détails d'un mouvement spécifique
  getMouvementById: async (mouvementId) => {
    try {
      const response = await API.get(`/api/mouvements/${mouvementId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Enregistrer un versement en agence (dépôt du collecteur)
  enregistrerVersement: async (collecteurId, montant, journalId = null) => {
    try {
      const response = await API.post(`/api/mouvements/versement`, {
        collecteurId,
        montant,
        journalId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Importer les ventilations à partir d'un fichier Excel
  importVentilations: async (collecteurId, file, journalId = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collecteurId', collecteurId);
      if (journalId) {
        formData.append('journalId', journalId);
      }

      const response = await API.post(`${API_ENDPOINTS.COLLECTE.VENTILATION}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Valider un lot de ventilation
  validerVentilation: async (lotId) => {
    try {
      const response = await API.put(`${API_ENDPOINTS.COLLECTE.VENTILATION}/${lotId}/validate`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Récupérer les transactions récentes d'un collecteur
  getRecentTransactionsByCollecteur: async (collecteurId, limit = 5) => {
    try {
      const response = await API.get(`/api/collecteurs/${collecteurId}/transactions/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },



  // Récupérer les statistiques de transactions pour un collecteur
  getTransactionStatsByCollecteur: async (collecteurId, period = 'month') => {
    try {
      const response = await API.get(`/api/collecteurs/${collecteurId}/transactions/stats?period=${period}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default TransactionService;