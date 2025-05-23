// src/api/collecteur.js
import axiosInstance from './axiosConfig';

export const getCollecteurs = async () => {
  try {
    const response = await fetch('/api/collecteurs');
    return await response.json();
  } catch (error) {
    console.error('Erreur getCollecteurs:', error);
    throw error;
  }
};

export const getCollecteurById = async (collecteurId) => {
  try {
    const response = await axiosInstance.get(`/collecteurs/${collecteurId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ Erreur getCollecteurById:', error);
    throw error;
  }
};

export const createCollecteur = async (collecteurData) => {
  try {
    const response = await axiosInstance.post('/collecteurs', collecteurData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ Erreur createCollecteur:', error);
    throw error;
  }
};

export const updateCollecteur = async (collecteurId, collecteurData) => {
  try {
    const response = await axiosInstance.put(`/collecteurs/${collecteurId}`, collecteurData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ Erreur updateCollecteur:', error);
    throw error;
  }
};

const collecteurAPI = {
  getCollecteurs,
  getCollecteurById,
  createCollecteur,
  updateCollecteur
};

export default collecteurAPI;