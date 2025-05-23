// src/api/compte.js
import axiosInstance from './axiosConfig';

export const transferComptes = async (transferData) => {
  try {
    console.log('📱 Appel API: POST /comptes/transfer', transferData);
    
    const response = await axiosInstance.post('/comptes/transfer', {
      sourceCollecteurId: transferData.sourceCollecteurId,
      destinationCollecteurId: transferData.destinationCollecteurId,
      clientIds: transferData.clientIds
    });
    
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ Erreur transferComptes:', error);
    throw error;
  }
};

export const getComptesByCollecteur = async (collecteurId) => {
  try {
    const response = await axiosInstance.get(`/comptes/collecteur/${collecteurId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ Erreur getComptesByCollecteur:', error);
    throw error;
  }
};

export const getCompteById = async (compteId) => {
  try {
    const response = await axiosInstance.get(`/comptes/${compteId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ Erreur getCompteById:', error);
    throw error;
  }
};

const compteAPI = {
  transferComptes,
  getComptesByCollecteur,
  getCompteById
};

export default compteAPI;