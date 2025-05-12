// src/api/commission.js
import axios from './axiosConfig';

/**
 * Service API pour gérer les commissions
 */

/**
 * Récupère les paramètres de commission pour un collecteur spécifique
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.collecteurId ID du collecteur
 * @returns {Promise<Object>} Paramètres de commission
 */
export const getCommissionParameters = async ({ collecteurId }) => {
  try {
    const response = await axios.get(`/api/v1/commissions/parameters/${collecteurId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de commission:', error);
    throw error;
  }
};

/**
 * Récupère les paramètres de commission pour un client spécifique
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.clientId ID du client
 * @returns {Promise<Object>} Paramètres de commission
 */
export const getClientCommissionParameters = async ({ clientId }) => {
  try {
    const response = await axios.get(`/api/v1/commissions/parameters/client/${clientId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de commission du client:', error);
    throw error;
  }
};

/**
 * Récupère les paramètres de commission pour une agence spécifique
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.agenceId ID de l'agence
 * @returns {Promise<Object>} Paramètres de commission
 */
export const getAgencyCommissionParameters = async ({ agenceId }) => {
  try {
    const response = await axios.get(`/api/v1/commissions/parameters/agence/${agenceId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de commission de l\'agence:', error);
    throw error;
  }
};

/**
 * Enregistre ou met à jour les paramètres de commission
 * 
 * @param {Object} params Paramètres de commission à enregistrer
 * @returns {Promise<Object>} Paramètres de commission enregistrés
 */
export const saveCommissionParameters = async (params) => {
  try {
    const response = await axios.post('/api/v1/commissions/parameters', params);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des paramètres de commission:', error);
    throw error;
  }
};

/**
 * Désactive les paramètres de commission
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.parameterId ID des paramètres de commission
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const deactivateCommissionParameters = async ({ parameterId }) => {
  try {
    const response = await axios.put(`/api/v1/commissions/parameters/${parameterId}/deactivate`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la désactivation des paramètres de commission:', error);
    throw error;
  }
};

/**
 * Calcule les commissions pour une période donnée et un collecteur spécifique
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.collecteurId ID du collecteur
 * @param {string} params.dateDebut Date de début de la période (format YYYY-MM-DD)
 * @param {string} params.dateFin Date de fin de la période (format YYYY-MM-DD)
 * @returns {Promise<Object>} Résultat du calcul des commissions
 */
export const calculateCommissions = async ({ collecteurId, dateDebut, dateFin }) => {
  try {
    const response = await axios.post('/api/v1/commissions/calculate', {
      collecteurId,
      dateDebut,
      dateFin
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du calcul des commissions:', error);
    throw error;
  }
};

/**
 * Récupère le rapport de commission pour une période donnée et un collecteur spécifique
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.collecteurId ID du collecteur
 * @param {string} params.dateDebut Date de début de la période (format YYYY-MM-DD)
 * @param {string} params.dateFin Date de fin de la période (format YYYY-MM-DD)
 * @returns {Promise<Object>} Rapport de commission
 */
export const getCommissionReport = async ({ collecteurId, dateDebut, dateFin }) => {
  try {
    const response = await axios.get('/api/v1/commissions/report', {
      params: {
        collecteurId,
        dateDebut,
        dateFin
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport de commission:', error);
    throw error;
  }
};

/**
 * Exporte le rapport de commission au format Excel
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.collecteurId ID du collecteur
 * @param {string} params.dateDebut Date de début de la période (format YYYY-MM-DD)
 * @param {string} params.dateFin Date de fin de la période (format YYYY-MM-DD)
 * @returns {Promise<Blob>} Fichier Excel
 */
export const exportCommissionReport = async ({ collecteurId, dateDebut, dateFin }) => {
  try {
    const response = await axios.get('/api/v1/commissions/report/export', {
      params: {
        collecteurId,
        dateDebut,
        dateFin
      },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'exportation du rapport de commission:', error);
    throw error;
  }
};

/**
 * Récupère les clients pour lesquels un collecteur a des commissions calculées
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.collecteurId ID du collecteur
 * @returns {Promise<Array>} Liste des clients
 */
export const getClientsWithCommissions = async ({ collecteurId }) => {
  try {
    const response = await axios.get(`/api/v1/commissions/clients/${collecteurId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des clients avec commissions:', error);
    throw error;
  }
};

/**
 * Récupère l'historique des commissions d'un collecteur
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.collecteurId ID du collecteur
 * @param {number} params.page Numéro de page
 * @param {number} params.size Taille de la page
 * @returns {Promise<Object>} Historique des commissions
 */
export const getCommissionsHistory = async ({ collecteurId, page = 0, size = 10 }) => {
  try {
    const response = await axios.get(`/api/v1/commissions/history/${collecteurId}`, {
      params: {
        page,
        size
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des commissions:', error);
    throw error;
  }
};

/**
 * Obtient le résumé des commissions pour le tableau de bord
 * 
 * @param {Object} params Les paramètres de la requête
 * @param {string} params.collecteurId ID du collecteur
 * @returns {Promise<Object>} Résumé des commissions
 */
export const getCommissionsSummary = async ({ collecteurId }) => {
  try {
    const response = await axios.get(`/api/v1/commissions/summary/${collecteurId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des commissions:', error);
    throw error;
  }
};