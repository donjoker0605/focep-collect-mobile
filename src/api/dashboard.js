// src/api/dashboard.js
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import axiosInstance from './axiosConfig';

// Service de gestion du tableau de bord
const DashboardService = {
  // Récupérer les données du tableau de bord d'un collecteur
  getCollecteurDashboard: async (collecteurId) => {
    try {
      // En production, vous appelleriez l'API réelle
      // const response = await axiosInstance.get(`/api/collecteurs/${collecteurId}/dashboard`);
      // return response.data;
      
      // Pour le développement, simuler des données
      await new Promise(resolve => setTimeout(resolve, 800)); // Délai simulé
      
      return {
        soldeTotal: 7783000, // Total des épargnes (en centimes)
        totalRetraits: 1187400, // Total des retraits (en centimes)
        objectifMensuel: 20000000, // Objectif mensuel (en centimes)
        progressionObjectif: 30, // Pourcentage de progression vers l'objectif
        totalClients: 45,
        clientsPercentChange: 5.2,
        totalTransactions: 132,
        transactionsPercentChange: 12.8,
        totalEpargnes: 7783000, // Même que soldeTotal
        epargnesPercentChange: 8.7,
        totalRetraitsMois: 1187400, // Même que totalRetraits
        retraitsPercentChange: -3.2,
        unreadNotifications: 3,
        commissionActuelle: 400000, // Commission du mois (en centimes)
        remunerationEstimee: 280000, // Rémunération estimée (en centimes)
        montantCollecte: 6000000, // Montant collecté pour le mois en cours (en centimes)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du tableau de bord:', error);
      throw new Error('Erreur lors de la récupération des données du tableau de bord');
    }
  },

  // Récupérer les transactions récentes
  fetchRecentTransactions: async ({ collecteurId, limit = 5 }) => {
    try {
      // En production, vous appelleriez l'API réelle
      // const response = await axiosInstance.get(`/api/collecteurs/${collecteurId}/transactions/recent?limit=${limit}`);
      // return response.data;
      
      // Pour le développement, simuler des données
      await new Promise(resolve => setTimeout(resolve, 600)); // Délai simulé
      
      // Données fictives pour les transactions récentes
      const mockTransactions = [
        {
          id: 1,
          type: 'Épargne',
          montant: 400000, // 4000 FCFA en centimes
          dateHeure: new Date(2025, 3, 7, 18, 27).toISOString(),
          status: 'COMPLETED',
          reference: 'SAL20240407',
          client: {
            id: 1,
            nom: 'Dupont',
            prenom: 'Marie',
            telephone: '+237 655 123 456',
            numeroCompte: '37305D0100015254'
          }
        },
        {
          id: 2,
          type: 'Retrait',
          montant: 10000, // 100 FCFA en centimes
          dateHeure: new Date(2025, 3, 3, 17, 0).toISOString(),
          status: 'COMPLETED',
          reference: 'GRO20240403',
          client: {
            id: 2,
            nom: 'Martin',
            prenom: 'Jean',
            telephone: '+237 677 234 567',
            numeroCompte: '37305D0100015255'
          }
        },
        {
          id: 3,
          type: 'Retrait',
          montant: 67440, // 674,40 FCFA en centimes
          dateHeure: new Date(2025, 2, 15, 8, 30).toISOString(),
          status: 'COMPLETED',
          reference: 'RNT20240315',
          client: {
            id: 3,
            nom: 'Dubois',
            prenom: 'Sophie',
            telephone: '+237 698 345 678',
            numeroCompte: '37305D0100015256'
          }
        },
      ];
      
      return {
        content: mockTransactions,
        totalPages: 1,
        totalElements: mockTransactions.length,
        size: limit,
        number: 0,
        last: true
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions récentes:', error);
      throw new Error('Erreur lors de la récupération des transactions récentes');
    }
  },

  // Récupérer le résumé des commissions
  getCommissionsSummary: async ({ collecteurId }) => {
    try {
      // En production, vous appelleriez l'API réelle
      // const response = await axiosInstance.get(`/api/commissions/summary/${collecteurId}`);
      // return response.data;
      
      // Pour le développement, simuler des données
      await new Promise(resolve => setTimeout(resolve, 700)); // Délai simulé
      
      return {
        objectifMensuel: 20000000, // 200,000 FCFA en centimes
        montantCollecte: 6000000, // 60,000 FCFA en centimes
        commissionActuelle: 400000, // 4,000 FCFA en centimes
        remunerationEstimee: 280000, // 2,800 FCFA en centimes
        lastMonthCommission: 380000, // 3,800 FCFA en centimes
        percentChange: 5.26 // Pourcentage de changement par rapport au mois précédent
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé des commissions:', error);
      throw new Error('Erreur lors de la récupération du résumé des commissions');
    }
  }
};

export default DashboardService;
export const { getCollecteurDashboard, fetchRecentTransactions, getCommissionsSummary } = DashboardService;