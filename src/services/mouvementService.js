import BaseApiService from './base/BaseApiService';

class MouvementService extends BaseApiService {
  constructor() {
    super();
  }

  // ✅ ÉPARGNE AVEC JOURNAL AUTOMATIQUE
  async enregistrerEpargne(data) {
    try {
      console.log('💰 Enregistrement épargne avec journal automatique:', data);
      
      // ✅ PLUS BESOIN DE PASSER LE JOURNAL - IL EST CRÉÉ AUTOMATIQUEMENT
      const response = await this.axios.post('/mouvements/epargne', {
        clientId: data.clientId,
        collecteurId: data.collecteurId,
        montant: data.montant,
      }, { canQueue: true });
      
      return this.formatResponse(response, 'Épargne enregistrée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'épargne:', error);
      throw this.handleError(error, 'Erreur lors de l\'enregistrement de l\'épargne');
    }
  }

  // ✅ RETRAIT AVEC JOURNAL AUTOMATIQUE
  async effectuerRetrait(data) {
    try {
      console.log('🏧 Effectuation retrait avec journal automatique:', data);
      
      const response = await this.axios.post('/mouvements/retrait', {
        clientId: data.clientId,
        collecteurId: data.collecteurId,
        montant: data.montant,
        // journalId: PAS BESOIN - GÉRÉ AUTOMATIQUEMENT CÔTÉ BACKEND
      }, { canQueue: true });
      
      return this.formatResponse(response, 'Retrait effectué avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'effectuation du retrait:', error);
      throw this.handleError(error, 'Erreur lors du retrait');
    }
  }

  // ✅ RÉCUPÉRATION DES OPÉRATIONS DU JOUR POUR UN COLLECTEUR
  async getOperationsDuJour(collecteurId, date = null) {
    try {
      const dateParam = date || new Date().toISOString().split('T')[0];
      console.log('📊 Récupération opérations du jour:', collecteurId, dateParam);
      
      const response = await this.axios.get(`/mouvements/collecteur/${collecteurId}/jour`, {
        params: { date: dateParam }
      }, {
        useCache: true,
        maxAge: 2 * 60 * 1000 // 2 minutes de cache
      });
      
      return this.formatResponse(response, 'Opérations du jour récupérées');
    } catch (error) {
      console.error('Erreur récupération opérations du jour:', error);
      throw this.handleError(error, 'Erreur lors de la récupération des opérations du jour');
    }
  }

  // MÉTHODES EXISTANTES CONSERVÉES
  async getMouvementsByJournal(journalId) {
    try {
      const response = await this.axios.get(`/mouvements/journal/${journalId}`, {}, {
        useCache: true,
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
      
      return this.formatResponse(response, 'Mouvements récupérés');
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements:', error);
      return this.handleError(error, 'Erreur lors de la récupération des mouvements');
    }
  }

  async getMouvementsByClient(clientId, dateDebut, dateFin) {
    try {
      const params = {};
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      
      const response = await this.axios.get(`/mouvements/client/${clientId}`, { params }, {
        useCache: true,
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
      
      return this.formatResponse(response, 'Mouvements client récupérés');
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements client:', error);
      return this.handleError(error, 'Erreur lors de la récupération des mouvements client');
    }
  }

  // ✅ NOUVELLE MÉTHODE: Vérification du solde avant retrait
  async verifierSoldeRetrait(clientId, montant) {
    try {
      const response = await this.axios.post('/mouvements/verify-balance', {
        clientId,
        montant
      });
      
      return this.formatResponse(response, 'Solde vérifié');
    } catch (error) {
      console.error('Erreur vérification solde:', error);
      throw this.handleError(error, 'Erreur lors de la vérification du solde');
    }
  }
  
  async getOperationsDuJour(collecteurId, date = null) {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0];
    console.log('📊 Récupération opérations du jour:', collecteurId, dateParam);
    
    // ✅ NOUVEAU ENDPOINT qui gère tout automatiquement
    const response = await this.axios.get(`/mouvements/collecteur/${collecteurId}/jour`, {
      params: { date: dateParam }
    }, {
      useCache: true,
      maxAge: 2 * 60 * 1000 // 2 minutes de cache
    });
    
    return this.formatResponse(response, 'Opérations du jour récupérées');
  } catch (error) {
    console.error('Erreur récupération opérations du jour:', error);
    throw this.handleError(error, 'Erreur lors de la récupération des opérations du jour');
  }
}
}

export default new MouvementService();