// src/services/transferService.js - SERVICE UNIFIÉ POUR LES TRANSFERTS
import BaseApiService from './base/BaseApiService';

class TransferService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ TRANSFERT PRINCIPAL - ENDPOINT RÉEL
  async transferComptes(transferData) {
    try {
      console.log('🔄 API: POST /transfers/collecteurs', transferData);
      
      // Validation côté client
      if (!transferData.sourceCollecteurId || !transferData.destinationCollecteurId) {
        throw new Error('Collecteur source et destination requis');
      }
      
      if (!transferData.clientIds || transferData.clientIds.length === 0) {
        throw new Error('Au moins un client doit être sélectionné');
      }
      
      if (transferData.sourceCollecteurId === transferData.destinationCollecteurId) {
        throw new Error('Les collecteurs source et destination ne peuvent pas être identiques');
      }

      // ✅ UTILISER L'ENDPOINT RÉEL DU BACKEND
      const requestData = {
        sourceCollecteurId: transferData.sourceCollecteurId,
        targetCollecteurId: transferData.destinationCollecteurId, // Backend attend "targetCollecteurId"
        clientIds: transferData.clientIds,
        justification: transferData.justification || 'Transfert administratif'
      };

      const response = await this.axios.post('/transfers/collecteurs', requestData);
      return this.formatResponse(response, 'Transfert effectué avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du transfert des comptes');
    }
  }

  // ✅ ENDPOINT ALTERNATIF POUR COMPATIBILITÉ
  async transferComptesLegacy(sourceCollecteurId, targetCollecteurId, clientIds) {
    try {
      console.log('🔄 API: POST /transfers/transfers (legacy)');
      
      const params = new URLSearchParams();
      params.append('sourceCollecteurId', sourceCollecteurId);
      params.append('targetCollecteurId', targetCollecteurId);
      
      const response = await this.axios.post(`/transfers/transfers?${params.toString()}`, clientIds);
      return this.formatResponse(response, 'Transfert effectué avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du transfert (legacy)');
    }
  }

  // ✅ DÉTAILS D'UN TRANSFERT
  async getTransferDetails(transferId) {
    try {
      console.log('🔍 API: GET /transfers/', transferId);
      const response = await this.axios.get(`/transfers/${transferId}`);
      return this.formatResponse(response, 'Détails du transfert récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des détails');
    }
  }

  // ✅ HISTORIQUE DES TRANSFERTS
  async getTransferHistory({ page = 0, size = 20, agenceId = null, collecteurId = null } = {}) {
    try {
      console.log('📋 API: GET /transfers');
      const params = { page, size };
      if (agenceId) params.agenceId = agenceId;
      if (collecteurId) params.collecteurId = collecteurId;
      
      const response = await this.axios.get('/transfers', { params });
      return this.formatResponse(response, 'Historique des transferts récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération de l\'historique');
    }
  }

  // ✅ TRANSFERTS PAR COLLECTEUR
  async getTransfersByCollecteur(collecteurId, { page = 0, size = 20 } = {}) {
    try {
      console.log('👤 API: GET /transfers/collecteur/', collecteurId);
      const params = { page, size };
      const response = await this.axios.get(`/transfers/collecteur/${collecteurId}`, { params });
      return this.formatResponse(response, 'Transferts du collecteur récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des transferts du collecteur');
    }
  }

  // ✅ TRANSFERTS PAR AGENCE
  async getTransfersByAgence(agenceId, { page = 0, size = 20 } = {}) {
    try {
      console.log('🏢 API: GET /transfers/agence/', agenceId);
      const params = { page, size };
      const response = await this.axios.get(`/transfers/agence/${agenceId}`, { params });
      return this.formatResponse(response, 'Transferts de l\'agence récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des transferts de l\'agence');
    }
  }

  // ✅ STATISTIQUES DES TRANSFERTS
  async getTransferStats(period = 'MONTH') {
    try {
      console.log('📊 API: GET /transfers/stats');
      const params = { period };
      const response = await this.axios.get('/transfers/stats', { params });
      return this.formatResponse(response, 'Statistiques des transferts récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  // ✅ VALIDATION AVANT TRANSFERT
  async validateTransfer(transferData) {
    try {
      console.log('✅ API: POST /transfers/validate', transferData);
      const response = await this.axios.post('/transfers/validate', transferData);
      return this.formatResponse(response, 'Validation effectuée');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la validation du transfert');
    }
  }

  // ✅ ANNULER UN TRANSFERT (SI POSSIBLE)
  async cancelTransfer(transferId, reason) {
    try {
      console.log('❌ API: POST /transfers/{}/cancel', transferId);
      const response = await this.axios.post(`/transfers/${transferId}/cancel`, { reason });
      return this.formatResponse(response, 'Transfert annulé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'annulation du transfert');
    }
  }

  // ✅ CONFIRMER UN TRANSFERT EN ATTENTE
  async confirmTransfer(transferId) {
    try {
      console.log('✅ API: POST /transfers/{}/confirm', transferId);
      const response = await this.axios.post(`/transfers/${transferId}/confirm`);
      return this.formatResponse(response, 'Transfert confirmé');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la confirmation du transfert');
    }
  }

  // ✅ RÉCUPÉRER LES CLIENTS ÉLIGIBLES POUR TRANSFERT
  async getEligibleClientsForTransfer(sourceCollecteurId) {
    try {
      console.log('👥 API: GET /transfers/eligible-clients/', sourceCollecteurId);
      const response = await this.axios.get(`/transfers/eligible-clients/${sourceCollecteurId}`);
      return this.formatResponse(response, 'Clients éligibles récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients éligibles');
    }
  }

  // ✅ RÉCUPÉRER LES COLLECTEURS DISPONIBLES POUR TRANSFERT
  async getAvailableCollecteursForTransfer(agenceId = null) {
    try {
      console.log('👤 API: GET /transfers/available-collecteurs');
      const params = agenceId ? { agenceId } : {};
      const response = await this.axios.get('/transfers/available-collecteurs', { params });
      return this.formatResponse(response, 'Collecteurs disponibles récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs disponibles');
    }
  }

  // ✅ EXPORTER L'HISTORIQUE DES TRANSFERTS
  async exportTransferHistory(filters = {}) {
    try {
      console.log('📄 API: GET /transfers/export');
      const response = await this.axios.get('/transfers/export', {
        params: filters,
        responseType: 'blob'
      });
      return this.formatResponse(response, 'Export généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de l\'export');
    }
  }

  // ✅ MÉTHODES UTILITAIRES POUR LA VALIDATION CÔTÉ CLIENT
  validateTransferData(transferData) {
    const errors = {};

    if (!transferData.sourceCollecteurId) {
      errors.sourceCollecteur = 'Collecteur source requis';
    }

    if (!transferData.destinationCollecteurId) {
      errors.destinationCollecteur = 'Collecteur destination requis';
    }

    if (transferData.sourceCollecteurId === transferData.destinationCollecteurId) {
      errors.collecteurs = 'Les collecteurs source et destination ne peuvent pas être identiques';
    }

    if (!transferData.clientIds || transferData.clientIds.length === 0) {
      errors.clients = 'Au moins un client doit être sélectionné';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // ✅ FORMATER LES DONNÉES DE TRANSFERT POUR L'AFFICHAGE
  formatTransferForDisplay(transfer) {
    return {
      ...transfer,
      formattedDate: this.formatTransferDate(transfer.dateTransfert),
      statusText: this.getTransferStatusText(transfer.statut),
      typeText: this.getTransferTypeText(transfer.type),
      montantFormate: this.formatCurrency(transfer.montantTotal)
    };
  }

  formatTransferDate(dateString) {
    try {
      if (!dateString) return 'Date inconnue';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur formatage date transfert:', error);
      return 'Date invalide';
    }
  }

  getTransferStatusText(status) {
    const statusMap = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmé',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
      'FAILED': 'Échoué'
    };
    return statusMap[status] || status;
  }

  getTransferTypeText(type) {
    const typeMap = {
      'INTER_COLLECTEUR': 'Entre collecteurs',
      'INTER_AGENCE': 'Entre agences',
      'ADMINISTRATIF': 'Administratif'
    };
    return typeMap[type] || type;
  }

  formatCurrency(amount) {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) return '0 FCFA';
      return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + ' FCFA';
    } catch (error) {
      console.error('Erreur formatage montant:', error);
      return '0 FCFA';
    }
  }
}

export default new TransferService();