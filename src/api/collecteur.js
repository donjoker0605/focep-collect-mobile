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

// Service de gestion des collecteurs
const CollecteurService = {
  // Récupérer tous les collecteurs (avec pagination)
  getAllCollecteurs: async (page = 0, size = 10, search = '') => {
    try {
      const response = await API.get(`${API_ENDPOINTS.COLLECTEURS.BASE}?page=${page}&size=${size}&search=${search}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Récupérer les données du tableau de bord d'un collecteur
getCollecteurDashboard: async (collecteurId) => {
  try {
    // En production, vous appelleriez l'API réelle
    // const response = await API.get(`/api/collecteurs/${collecteurId}/dashboard`);
    // return response.data;
    
    // Pour le développement, simuler des données
    await new Promise(resolve => setTimeout(resolve, 1000)); // Délai simulé
    
    return {
      soldeTotal: 1248500,
      totalClients: 45,
      clientsPercentChange: 5.2,
      totalTransactions: 132,
      transactionsPercentChange: 12.8,
      totalEpargnes: 1850000,
      epargnesPercentChange: 8.7,
      totalRetraits: 601500,
      retraitsPercentChange: -3.2,
      unreadNotifications: 3
    };
  } catch (error) {
    throw handleApiError(error);
  }
},

  // Récupérer les collecteurs d'une agence spécifique
  getCollecteursByAgence: async (agenceId, page = 0, size = 10) => {
    try {
      const response = await API.get(`/api/agences/${agenceId}/collecteurs?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Récupérer les détails d'un collecteur spécifique
  getCollecteurById: async (collecteurId) => {
    try {
      const response = await API.get(API_ENDPOINTS.COLLECTEURS.DETAILS(collecteurId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Créer un nouveau collecteur
  createCollecteur: async (collecteurData) => {
    try {
      const response = await API.post(API_ENDPOINTS.COLLECTEURS.BASE, collecteurData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mettre à jour un collecteur existant
  updateCollecteur: async (collecteurId, collecteurData) => {
    try {
      const response = await API.put(API_ENDPOINTS.COLLECTEURS.DETAILS(collecteurId), collecteurData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Affecter un collecteur à une agence
  affecterCollecteurAgence: async (collecteurId, agenceId) => {
    try {
      const response = await API.put(`${API_ENDPOINTS.COLLECTEURS.DETAILS(collecteurId)}/agence`, {
        agenceId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Modifier le montant maximal de retrait d'un collecteur
  updateMontantMaxRetrait: async (collecteurId, montant, justification) => {
    try {
      const response = await API.patch(`${API_ENDPOINTS.COLLECTEURS.DETAILS(collecteurId)}/montant-max-retrait`, {
        montant,
        justification
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir l'historique des modifications du montant maximal de retrait
  getMontantMaxRetraitHistory: async (collecteurId) => {
    try {
      const response = await API.get(`${API_ENDPOINTS.COLLECTEURS.DETAILS(collecteurId)}/montant-max-retrait/history`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les comptes d'un collecteur
  getCollecteurComptes: async (collecteurId) => {
    try {
      const response = await API.get(API_ENDPOINTS.COLLECTEURS.COMPTES(collecteurId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir le journal d'un collecteur
  getCollecteurJournal: async (collecteurId, page = 0, size = 10, startDate = null, endDate = null) => {
    try {
      let url = `${API_ENDPOINTS.COLLECTEURS.JOURNAL(collecteurId)}?page=${page}&size=${size}`;
      
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

  // Créer un journal pour un collecteur
  createCollecteurJournal: async (collecteurId) => {
    try {
      const response = await API.post(API_ENDPOINTS.COLLECTEURS.JOURNAL(collecteurId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Clôturer un journal
  cloturerJournal: async (journalId) => {
    try {
      const response = await API.put(API_ENDPOINTS.JOURNAL.CLOTURE(journalId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Obtenir les commissions d'un collecteur
  getCollecteurCommissions: async (collecteurId, mois, annee) => {
    try {
      const response = await API.get(
        `${API_ENDPOINTS.COLLECTEURS.COMMISSIONS(collecteurId)}?mois=${mois}&annee=${annee}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Générer le rapport mensuel d'un collecteur
  generateMonthlyReport: async (collecteurId, annee, mois) => {
    try {
      const response = await API.get(
        API_ENDPOINTS.RAPPORTS.MENSUEL(collecteurId, annee, mois),
        { responseType: 'blob' } // Pour télécharger le fichier Excel
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Transférer des comptes entre collecteurs
  transferComptes: async (sourceCollecteurId, targetCollecteurId, clientIds) => {
    try {
      const response = await API.post(API_ENDPOINTS.COMPTES.TRANSFERT, {
        sourceCollecteurId,
        targetCollecteurId,
        clientIds
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Valider la création d'un collecteur
  validateCollecteur: async (collecteurId) => {
    try {
      const response = await API.put(`${API_ENDPOINTS.COLLECTEURS.DETAILS(collecteurId)}/validate`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default CollecteurService;