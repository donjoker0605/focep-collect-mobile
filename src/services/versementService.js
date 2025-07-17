// src/services/versementService.js
import BaseApiService from './base/BaseApiService';

/**
 * 💰 Service pour la gestion des versements et clôtures de journaux
 */
class VersementService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * 📋 Obtenir un aperçu avant clôture
   */
  async getCloturePreview(collecteurId, date) {
    try {
      console.log('📋 API: GET /admin/versements/preview');
      const params = new URLSearchParams({
        collecteurId: collecteurId.toString(),
        date: date
      });

      const response = await this.axios.get(`/admin/versements/preview?${params.toString()}`);
      return this.formatResponse(response, 'Aperçu généré avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération de l\'aperçu');
    }
  }

  /**
   * 💰 Effectuer le versement et clôturer le journal
   */
  async effectuerVersementEtCloture(versementData) {
    try {
      console.log('💰 API: POST /admin/versements/cloture');
      const response = await this.axios.post('/admin/versements/cloture', versementData);
      return this.formatResponse(response, 'Versement effectué et journal clôturé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du versement et de la clôture');
    }
  }

  /**
   * 📊 Récupérer les comptes d'un collecteur
   */
  async getCollecteurComptes(collecteurId) {
    try {
      console.log('📊 API: GET /admin/versements/collecteur/comptes');
      const response = await this.axios.get(`/admin/versements/collecteur/${collecteurId}/comptes`);
      return this.formatResponse(response, 'Comptes récupérés avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des comptes');
    }
  }

  /**
   * 📈 Récupérer les statistiques des manquants d'un collecteur
   */
  async getManquantsStats(collecteurId) {
    try {
      console.log('📈 API: GET /admin/versements/collecteur/manquants');
      const response = await this.axios.get(`/admin/versements/collecteur/${collecteurId}/manquants`);
      return this.formatResponse(response, 'Statistiques manquants récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques manquants');
    }
  }

  /**
   * 🔍 Vérifier si une clôture est possible
   */
  async canCloseJournal(collecteurId, date) {
    try {
      console.log('🔍 API: GET /admin/versements/can-close');
      const params = new URLSearchParams({
        collecteurId: collecteurId.toString(),
        date: date
      });

      const response = await this.axios.get(`/admin/versements/can-close?${params.toString()}`);
      return this.formatResponse(response, 'Vérification effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la vérification');
    }
  }

  /**
   * 📅 Récupérer l'historique des versements d'un collecteur
   */
  async getHistoriqueVersements(collecteurId, { page = 0, size = 20 } = {}) {
    try {
      console.log('📅 API: GET /admin/versements/historique');
      const params = new URLSearchParams({
        collecteurId: collecteurId.toString(),
        page: page.toString(),
        size: size.toString()
      });

      const response = await this.axios.get(`/admin/versements/historique?${params.toString()}`);
      return this.formatResponse(response, 'Historique récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération de l\'historique');
    }
  }

  /**
   * 🔄 Annuler un versement (si autorisé)
   */
  async annulerVersement(versementId, motif) {
    try {
      console.log('🔄 API: POST /admin/versements/annuler');
      const response = await this.axios.post(`/admin/versements/${versementId}/annuler`, {
        motif
      });
      return this.formatResponse(response, 'Versement annulé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'annulation du versement');
    }
  }

  /**
   * 📊 Récupérer le dashboard des versements pour l'agence
   */
  async getDashboardVersements(agenceId = null, dateDebut = null, dateFin = null) {
    try {
      console.log('📊 API: GET /admin/versements/dashboard');
      const params = new URLSearchParams();
      
      if (agenceId) params.append('agenceId', agenceId.toString());
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const response = await this.axios.get(`/admin/versements/dashboard?${params.toString()}`);
      return this.formatResponse(response, 'Dashboard récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du dashboard');
    }
  }

  /**
   * 📋 Récupérer la liste des collecteurs avec manquants
   */
  async getCollecteursAvecManquants(agenceId = null) {
    try {
      console.log('📋 API: GET /admin/versements/collecteurs-manquants');
      const params = agenceId ? `?agenceId=${agenceId}` : '';
      
      const response = await this.axios.get(`/admin/versements/collecteurs-manquants${params}`);
      return this.formatResponse(response, 'Collecteurs avec manquants récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs avec manquants');
    }
  }

  /**
   * 💳 Effectuer un remboursement de manquant
   */
  async remboursementManquant(collecteurId, montant, commentaire = '') {
    try {
      console.log('💳 API: POST /admin/versements/remboursement-manquant');
      const response = await this.axios.post('/admin/versements/remboursement-manquant', {
        collecteurId,
        montant,
        commentaire
      });
      return this.formatResponse(response, 'Remboursement effectué');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du remboursement');
    }
  }

  /**
   * 📈 Obtenir les statistiques globales des manquants par agence
   */
  async getStatsManquantsAgence(agenceId = null) {
    try {
      console.log('📈 API: GET /admin/versements/stats-manquants-agence');
      const params = agenceId ? `?agenceId=${agenceId}` : '';
      
      const response = await this.axios.get(`/admin/versements/stats-manquants-agence${params}`);
      return this.formatResponse(response, 'Statistiques manquants agence récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * 🔧 Utilitaire : Calculer la différence de versement
   */
  calculateDifference(montantCollecte, montantVerse) {
    const difference = montantVerse - montantCollecte;
    return {
      difference,
      type: difference > 0 ? 'excedent' : difference < 0 ? 'manquant' : 'equilibre',
      montant: Math.abs(difference),
      isExcedent: difference > 0,
      isManquant: difference < 0,
      isEquilibre: difference === 0
    };
  }

  /**
   * 🔧 Utilitaire : Formater un montant en devise
   */
  formatCurrency(amount) {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  }

  /**
   * 🔧 Utilitaire : Valider les données de versement
   */
  validateVersementData(data) {
    const errors = [];

    if (!data.collecteurId) {
      errors.push('Le collecteur est obligatoire');
    }

    if (!data.date) {
      errors.push('La date est obligatoire');
    }

    if (!data.montantVerse && data.montantVerse !== 0) {
      errors.push('Le montant versé est obligatoire');
    }

    if (data.montantVerse < 0) {
      errors.push('Le montant versé ne peut pas être négatif');
    }

    if (data.commentaire && data.commentaire.length > 500) {
      errors.push('Le commentaire ne peut pas dépasser 500 caractères');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 🎯 Helper pour les données de test/debug
   */
  getMockPreviewData() {
    return {
      collecteurId: 1,
      collecteurNom: "Jean Dupont",
      date: "2025-07-17",
      journalId: 123,
      referenceJournal: "JRN-001-20250717",
      journalExiste: true,
      dejaClôture: false,
      soldeCompteService: 125000,
      totalEpargne: 150000,
      totalRetraits: 25000,
      soldeNet: 125000,
      nombreOperations: 12,
      operations: [
        {
          id: 1,
          type: "EPARGNE",
          montant: 10000,
          clientNom: "Martin",
          clientPrenom: "Pierre",
          dateOperation: "2025-07-17T09:30:00"
        },
        {
          id: 2,
          type: "RETRAIT",
          montant: 5000,
          clientNom: "Durand",
          clientPrenom: "Marie",
          dateOperation: "2025-07-17T11:15:00"
        }
      ],
      soldeCompteManquant: 0,
      soldeCompteAttente: 2500
    };
  }
}

export default new VersementService();