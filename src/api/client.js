import axios from 'axios';
import api, { handleApiError } from './axiosConfig';
import { ENDPOINTS } from '../config/apiConfig';

// Configuration de base pour Axios
const API = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Service de gestion des clients
const ClientService = {
  // Récupérer tous les clients (avec pagination)
  getAllClients: async (page = 0, size = 10, search = '') => {
    try {
      const response = await API.get(`${API_ENDPOINTS.CLIENTS.BASE}?page=${page}&size=${size}&search=${search}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Récupérer les clients d'un collecteur spécifique
  getClientsByCollecteur: async (collecteurId, page = 0, size = 10, search = '') => {
    try {
      const url = `${API_ENDPOINTS.COLLECTEURS.CLIENTS(collecteurId)}?page=${page}&size=${size}&search=${search}`;
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Récupérer les détails d'un client spécifique
  getClientById: async (clientId) => {
    try {
      const response = await API.get(API_ENDPOINTS.CLIENTS.DETAILS(clientId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Créer un nouveau client
  createClient: async (clientData) => {
    try {
      const response = await API.post(API_ENDPOINTS.CLIENTS.BASE, clientData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mettre à jour un client existant
  updateClient: async (clientId, clientData) => {
    try {
      const response = await API.put(API_ENDPOINTS.CLIENTS.DETAILS(clientId), clientData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Activer/désactiver un client
  toggleClientStatus: async (clientId, active) => {
    try {
      const response = await API.patch(
        `${API_ENDPOINTS.CLIENTS.DETAILS(clientId)}/status`, 
        { active }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les transactions d'un client
  getClientTransactions: async (clientId, page = 0, size = 10, startDate = null, endDate = null) => {
    try {
      let url = `${API_ENDPOINTS.CLIENTS.TRANSACTIONS(clientId)}?page=${page}&size=${size}`;
      
      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      
      if (endDate) {
        url += `&endDate=${endDate}`;
      }
      
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir le solde du compte d'un client
  getClientBalance: async (clientId) => {
    try {
      const response = await API.get(API_ENDPOINTS.CLIENTS.COMPTE(clientId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Abonner un client à un collecteur
  subscribeToCollecteur: async (clientId, collecteurId) => {
    try {
      const response = await API.post(`${API_ENDPOINTS.CLIENTS.DETAILS(clientId)}/subscribe`, {
        collecteurId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Désabonner un client d'un collecteur
  unsubscribeFromCollecteur: async (clientId, collecteurId) => {
    try {
      const response = await API.post(`${API_ENDPOINTS.CLIENTS.DETAILS(clientId)}/unsubscribe`, {
        collecteurId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Importer des clients par lot (CSV/Excel)
  importClients: async (collecteurId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collecteurId', collecteurId);

      const response = await API.post(`${API_ENDPOINTS.CLIENTS.BASE}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default ClientService;