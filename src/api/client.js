// src/api/client.js - STRUCTURE CORRIGÉE
import apiService from '../services/api';

export const getClients = async ({ collecteurId, page = 0, size = 20, search = '' }) => {
  try {
    const params = { page, size };
    if (search?.trim()) params.search = search.trim();
    
    const response = await apiService.get(`/clients/collecteur/${collecteurId}`, params);
    
    return {
      data: response.content || response.data || [],
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 0,
      success: true
    };
  } catch (error) {
    console.error('Erreur getClients:', error);
    return {
      data: [],
      totalElements: 0,
      totalPages: 0,
      success: false,
      error: error.message
    };
  }
};

export const getClientById = async (clientId) => {
  try {
    const response = await apiService.get(`/clients/${clientId}`);
    return {
      data: response.data || response,
      success: true
    };
  } catch (error) {
    console.error('Erreur getClientById:', error);
    throw error;
  }
};

export const createClient = async (clientData) => {
  try {
    if (!clientData.nom || !clientData.prenom) {
      throw new Error('Nom et prénom requis');
    }

    const response = await apiService.post('/clients', clientData);
    return {
      data: response.data || response,
      success: true,
      message: 'Client créé avec succès'
    };
  } catch (error) {
    console.error('Erreur createClient:', error);
    throw error;
  }
};

export const updateClient = async (clientId, clientData) => {
  try {
    const response = await apiService.put(`/clients/${clientId}`, clientData);
    return {
      data: response.data || response,
      success: true,
      message: 'Client mis à jour avec succès'
    };
  } catch (error) {
    console.error('Erreur updateClient:', error);
    throw error;
  }
};

export const getClientBalance = async (clientId) => {
  try {
    const response = await apiService.get(`/comptes/client/${clientId}/solde`);
    return {
      solde: response.data?.solde || response.solde || response || 0,
      success: true
    };
  } catch (error) {
    console.error('Erreur getClientBalance:', error);
    return {
      solde: 0,
      success: false,
      error: error.message
    };
  }
};

// ✅ Export default également pour flexibilité
const clientAPI = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  getClientBalance
};

export default clientAPI;