// src/api/client.js - API CLIENTS RÉELLE
import apiService from '../services/api';

// Récupérer tous les clients d'un collecteur
export const getClients = async ({ collecteurId, page = 0, size = 20, search = '' }) => {
  try {
    const params = { page, size };
    if (search) params.search = search;
    
    const response = await apiService.get(`/clients/collecteur/${collecteurId}`, params);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    throw error;
  }
};

// Récupérer un client par ID
export const getClientById = async (clientId) => {
  try {
    const response = await apiService.get(`/clients/${clientId}`);
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    throw error;
  }
};

// Créer un nouveau client
export const createClient = async (clientData) => {
  try {
    const response = await apiService.post('/clients', clientData);
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    throw error;
  }
};

// Mettre à jour un client
export const updateClient = async (clientId, clientData) => {
  try {
    const response = await apiService.put(`/clients/${clientId}`, clientData);
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    throw error;
  }
};

// Supprimer un client
export const deleteClient = async (clientId) => {
  try {
    const response = await apiService.delete(`/clients/${clientId}`);
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    throw error;
  }
};

// Récupérer les transactions d'un client
export const getClientTransactions = async ({ clientId, page = 0, size = 20, startDate, endDate }) => {
  try {
    const params = { page, size };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiService.get(`/mouvements/client/${clientId}`, params);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions du client:', error);
    throw error;
  }
};

// Récupérer le solde d'un client
export const getClientBalance = async (clientId) => {
  try {
    const response = await apiService.get(`/comptes/client/${clientId}/solde`);
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de la récupération du solde du client:', error);
    throw error;
  }
};