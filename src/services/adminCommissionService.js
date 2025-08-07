// src/services/adminCommissionService.js - V2 INTEGRATION
import BaseApiService from './base/BaseApiService';

/**
 * Service pour la gestion administrative des commissions V2
 * Utilise les nouvelles API V2 commission-remuneration
 */
class AdminCommissionService extends BaseApiService {
  constructor() {
    super();
  }

  // ================================
  // TRAITEMENT DES COMMISSIONS V2
  // ================================

  /**
   * Calcul des commissions V2 avec hiérarchie
   */
  async calculateCommissionsV2(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📱 API V2: POST /commission-remuneration/collecteur/:id/calculer');
      const response = await this.axios.post(
        `/v2/commission-remuneration/collecteur/${collecteurId}/calculer`,
        null,
        {
          params: {
            dateDebut,
            dateFin
          }
        }
      );
      return this.formatResponse(response, 'Commission V2 calculée avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur calcul commission V2');
    }
  }

  /**
   * Processus complet : Commission + Rémunération en une seule API V2
   */
  async processComplet(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📱 API V2: POST /commission-remuneration/collecteur/:id/processus-complet');
      const response = await this.axios.post(
        `/v2/commission-remuneration/collecteur/${collecteurId}/processus-complet`,
        null,
        {
          params: {
            dateDebut,
            dateFin
          }
        }
      );
      return this.formatResponse(response, 'Processus complet V2 réussi');
    } catch (error) {
      throw this.handleError(error, 'Erreur processus complet V2');
    }
  }

  /**
   * Génération du rapport Excel de commission V2
   */
  async generateCommissionReport(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📱 API V2: POST /commission-remuneration/collecteur/:id/rapport-commission');
      const response = await this.axios.post(
        `/v2/commission-remuneration/collecteur/${collecteurId}/rapport-commission`,
        null,
        {
          params: {
            dateDebut,
            dateFin
          },
          responseType: 'blob'
        }
      );
      return this.formatResponse(response, 'Rapport commission généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur génération rapport commission');
    }
  }

  /**
   * Génération du rapport Excel de rémunération complet V2
   */
  async generateRemunerationReport(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📱 API V2: POST /commission-remuneration/collecteur/:id/rapport-remuneration');
      const response = await this.axios.post(
        `/v2/commission-remuneration/collecteur/${collecteurId}/rapport-remuneration`,
        null,
        {
          params: {
            dateDebut,
            dateFin
          },
          responseType: 'blob'
        }
      );
      return this.formatResponse(response, 'Rapport rémunération généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur génération rapport rémunération');
    }
  }

  /**
   * Calculer les commissions (méthode de compatibilité pour ancien code)
   */
  async calculateCommissions(dateDebut, dateFin, collecteurId = null) {
    // Redirection vers la nouvelle API V2
    return this.calculateCommissionsV2(collecteurId, dateDebut, dateFin);
  }

  // ================================
  // GESTION DES RUBRIQUES DE RÉMUNÉRATION V2
  // ================================

  /**
   * Récupérer les rubriques actives pour un collecteur
   */
  async getRubriquesByCollecteur(collecteurId) {
    try {
      console.log('📱 API V2: GET /rubriques-remuneration/collecteur/:id');
      const response = await this.axios.get(`/v2/rubriques-remuneration/collecteur/${collecteurId}`);
      return this.formatResponse(response, 'Rubriques récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur récupération rubriques');
    }
  }

  /**
   * Récupérer toutes les rubriques (pour admin)
   */
  async getAllRubriques() {
    try {
      console.log('📱 API V2: GET /rubriques-remuneration');
      const response = await this.axios.get('/v2/rubriques-remuneration');
      return this.formatResponse(response, 'Toutes rubriques récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur récupération toutes rubriques');
    }
  }

  /**
   * Créer une nouvelle rubrique de rémunération
   */
  async createRubrique(rubriqueData) {
    try {
      console.log('📱 API V2: POST /rubriques-remuneration');
      const response = await this.axios.post('/v2/rubriques-remuneration', rubriqueData);
      return this.formatResponse(response, 'Rubrique créée');
    } catch (error) {
      throw this.handleError(error, 'Erreur création rubrique');
    }
  }

  /**
   * Modifier une rubrique existante
   */
  async updateRubrique(rubriqueId, rubriqueData) {
    try {
      console.log('📱 API V2: PUT /rubriques-remuneration/:id');
      const response = await this.axios.put(`/v2/rubriques-remuneration/${rubriqueId}`, rubriqueData);
      return this.formatResponse(response, 'Rubrique mise à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur modification rubrique');
    }
  }

  /**
   * Désactiver une rubrique
   */
  async deactivateRubrique(rubriqueId) {
    try {
      console.log('📱 API V2: DELETE /rubriques-remuneration/:id');
      const response = await this.axios.delete(`/v2/rubriques-remuneration/${rubriqueId}`);
      return this.formatResponse(response, 'Rubrique désactivée');
    } catch (error) {
      throw this.handleError(error, 'Erreur désactivation rubrique');
    }
  }

  // ================================
  // STATUT ET UTILITÉS V2
  // ================================

  /**
   * Récupérer le statut des commissions d'un collecteur V2
   */
  async getStatutCommissions(collecteurId) {
    try {
      console.log('📱 API V2: GET /commission-remuneration/collecteur/:id/statut');
      const response = await this.axios.get(`/v2/commission-remuneration/collecteur/${collecteurId}/statut`);
      return this.formatResponse(response, 'Statut récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur récupération statut V2');
    }
  }
}

export default new AdminCommissionService();