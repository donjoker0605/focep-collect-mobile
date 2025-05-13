// src/api/collecteurService.js
import api from './config';

export const collecteurService = {
  // Récupérer les informations du collecteur connecté
  getCurrentCollecteur: async () => {
    try {
      const response = await api.get('/collecteur/me');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  // Récupérer les clients du collecteur
  getClients: async () => {
    try {
      const response = await api.get('/collecteur/clients');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  // Effectuer une collecte
  createCollecte: async (collecteData) => {
    try {
      const response = await api.post('/collecteur/collecte', collecteData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  // Effectuer un retrait
  createRetrait: async (retraitData) => {
    try {
      const response = await api.post('/collecteur/retrait', retraitData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  // Récupérer l'historique des transactions
  getTransactions: async (page = 0, size = 20) => {
    try {
      const response = await api.get(`/collecteur/transactions?page=${page}&size=${size}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
};