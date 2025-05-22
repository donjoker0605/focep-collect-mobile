// src/api/transaction.js - STRUCTURE CORRIGÉE
import apiService from '../services/api';

export const saveEpargne = async (data) => {
  try {
    if (!data.clientId || !data.collecteurId || !data.montant) {
      throw new Error('Données manquantes pour l\'épargne');
    }

    if (data.montant <= 0) {
      throw new Error('Le montant doit être positif');
    }

    const requestData = {
      clientId: data.clientId,
      collecteurId: data.collecteurId,
      montant: parseFloat(data.montant),
      journalId: data.journalId || null
    };

    const response = await apiService.post('/mouvements/epargne', requestData);
    
    return {
      data: response.data || response,
      success: true,
      message: 'Épargne enregistrée avec succès'
    };
  } catch (error) {
    console.error('Erreur saveEpargne:', error);
    throw error;
  }
};

export const saveRetrait = async (data) => {
  try {
    if (!data.clientId || !data.collecteurId || !data.montant) {
      throw new Error('Données manquantes pour le retrait');
    }

    if (data.montant <= 0) {
      throw new Error('Le montant doit être positif');
    }

    const requestData = {
      clientId: data.clientId,
      collecteurId: data.collecteurId,
      montant: parseFloat(data.montant),
      journalId: data.journalId || null
    };

    const response = await apiService.post('/mouvements/retrait', requestData);
    
    return {
      data: response.data || response,
      success: true,
      message: 'Retrait effectué avec succès'
    };
  } catch (error) {
    console.error('Erreur saveRetrait:', error);
    throw error;
  }
};

export const fetchJournalTransactions = async ({ collecteurId, page = 0, size = 10, dateDebut, dateFin }) => {
  try {
    const params = { 
      page, 
      size,
      sort: 'dateHeure,desc'
    };
    
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;
    
    const response = await apiService.get(`/mouvements/collecteur/${collecteurId}`, params);
    
    return {
      data: response.content || response.data || [],
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 0,
      success: true
    };
  } catch (error) {
    console.error('Erreur fetchJournalTransactions:', error);
    return {
      data: [],
      totalElements: 0,
      totalPages: 0,
      success: false,
      error: error.message
    };
  }
};

export const getCollecteurDashboard = async (collecteurId) => {
  try {
    // Essayer l'endpoint dashboard spécialisé
    try {
      const response = await apiService.get(`/collecteurs/${collecteurId}/dashboard`);
      return {
        data: response.data || response,
        success: true
      };
    } catch (dashboardError) {
      console.warn('Endpoint dashboard non disponible, construction manuelle...');
      
      // Construire le dashboard depuis les APIs existantes
      const [clientsResult, transactionsResult] = await Promise.allSettled([
        apiService.get(`/clients/collecteur/${collecteurId}`, { page: 0, size: 1 }),
        apiService.get(`/mouvements/collecteur/${collecteurId}`, { page: 0, size: 100 })
      ]);

      let dashboardData = {
        totalClients: 0,
        totalTransactions: 0,
        totalEpargnes: 0,
        totalRetraits: 0,
        soldeTotal: 0,
        unreadNotifications: 0
      };

      // Traiter les clients
      if (clientsResult.status === 'fulfilled') {
        const clientsResponse = clientsResult.value;
        dashboardData.totalClients = clientsResponse.totalElements || 
                                    (Array.isArray(clientsResponse.data) ? clientsResponse.data.length : 0) ||
                                    (Array.isArray(clientsResponse.content) ? clientsResponse.content.length : 0);
      }

      // Traiter les transactions
      if (transactionsResult.status === 'fulfilled') {
        const transactionsResponse = transactionsResult.value;
        const transactions = transactionsResponse.content || transactionsResponse.data || [];
        
        if (Array.isArray(transactions)) {
          dashboardData.totalTransactions = transactions.length;
          
          transactions.forEach(t => {
            const montant = t.montant || 0;
            if (t.type === 'EPARGNE') {
              dashboardData.totalEpargnes += montant;
            } else if (t.type === 'RETRAIT') {
              dashboardData.totalRetraits += montant;
            }
          });
          
          dashboardData.soldeTotal = dashboardData.totalEpargnes - dashboardData.totalRetraits;
        }
      }

      return {
        data: dashboardData,
        success: true
      };
    }
  } catch (error) {
    console.error('Erreur getCollecteurDashboard:', error);
    return {
      data: {
        totalClients: 0,
        totalTransactions: 0,
        totalEpargnes: 0,
        totalRetraits: 0,
        soldeTotal: 0,
        unreadNotifications: 0
      },
      success: false,
      error: error.message
    };
  }
};

// Export default
const transactionAPI = {
  saveEpargne,
  saveRetrait,
  fetchJournalTransactions,
  getCollecteurDashboard
};

export default transactionAPI;