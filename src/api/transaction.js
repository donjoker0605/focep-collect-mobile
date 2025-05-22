// src/api/transaction.js - API TRANSACTIONS RÉELLE
import apiService from '../services/api';

// Enregistrer une épargne
export const saveEpargne = async (data) => {
  try {
    const response = await apiService.post('/mouvements/epargne', {
      clientId: data.clientId,
      collecteurId: data.collecteurId,
      montant: data.montant,
      description: data.description,
      journalId: data.journalId
    });
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'épargne:', error);
    throw error;
  }
};

// Effectuer un retrait
export const saveRetrait = async (data) => {
  try {
    const response = await apiService.post('/mouvements/retrait', {
      clientId: data.clientId,
      collecteurId: data.collecteurId,
      montant: data.montant,
      description: data.description,
      journalId: data.journalId
    });
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du retrait:', error);
    throw error;
  }
};

// Sauvegarder une transaction (générique)
export const saveTransaction = async (transactionData) => {
  try {
    if (transactionData.type === 'EPARGNE') {
      return await saveEpargne(transactionData);
    } else if (transactionData.type === 'RETRAIT') {
      return await saveRetrait(transactionData);
    } else {
      throw new Error('Type de transaction invalide');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la transaction:', error);
    throw error;
  }
};

// Récupérer les transactions d'un journal
export const fetchJournalTransactions = async ({ collecteurId, date, page = 0, size = 20, sort = 'dateHeure,desc' }) => {
  try {
    const params = { 
      page, 
      size, 
      sort,
      date 
    };
    
    const response = await apiService.get(`/mouvements/collecteur/${collecteurId}`, params);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions du journal:', error);
    throw error;
  }
};

// Récupérer les transactions récentes d'un collecteur
export const fetchRecentTransactions = async ({ collecteurId, page = 0, size = 5 }) => {
  try {
    const params = { page, size, sort: 'dateHeure,desc' };
    const response = await apiService.get(`/mouvements/collecteur/${collecteurId}`, params);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions récentes:', error);
    throw error;
  }
};

// Vérifier le solde disponible pour un retrait
export const verifyBalance = async ({ clientId, montant }) => {
  try {
    const response = await apiService.post('/mouvements/verify-balance', {
      clientId,
      montant
    });
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de la vérification du solde:', error);
    throw error;
  }
};

// Fermer un journal
export const closeJournal = async ({ collecteurId, date }) => {
  try {
    const response = await apiService.post('/journaux/cloture', {
      collecteurId,
      date
    });
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de la fermeture du journal:', error);
    throw error;
  }
};

// Récupérer le résumé du dashboard
export const getCollecteurDashboard = async (collecteurId) => {
  try {
    const response = await apiService.get(`/collecteurs/${collecteurId}/dashboard`);
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard:', error);
    // Retourner des données par défaut en cas d'erreur
    return {
      soldeTotal: 0,
      totalRetraits: 0,
      totalClients: 0,
      totalTransactions: 0,
      totalEpargnes: 0,
      unreadNotifications: 0
    };
  }
};