// src/services/commissionV2Service.js
import BaseApiService from './base/BaseApiService';
import * as commissionV2API from '../api/commissionV2';

class CommissionV2Service extends BaseApiService {
  constructor() {
    super();
    this.apiV2 = commissionV2API;
  }

  /**
   * CALCUL DE COMMISSION SELON SPEC FOCEP
   */

  /**
   * Lance le calcul de commission avec hiérarchie (client → collecteur → agence)
   */
  async calculateCommissionsHierarchy(collecteurId, dateDebut, dateFin) {
    try {
      console.log('🚀 Commission V2: Calcul hiérarchique', { collecteurId, dateDebut, dateFin });
      
      const result = await this.apiV2.calculateCommissionsV2({
        collecteurId,
        dateDebut,
        dateFin
      });

      // Formatage pour l'UI mobile
      const formattedData = this.apiV2.formatCommissionDataForMobile(result);
      
      return this.formatResponse(
        { data: formattedData, originalData: result },
        `Commission calculée: ${formattedData?.totalCommissions} FCFA pour ${formattedData?.nombreClients} clients`
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur calcul commission hiérarchique');
    }
  }

  /**
   * Lance la rémunération avec système Vi vs S
   */
  async processRemuneration(collecteurId, montantS) {
    try {
      console.log('💰 Rémunération V2: Processus Vi vs S', { collecteurId, montantS });
      
      const result = await this.apiV2.processRemuneration({
        collecteurId,
        montantS
      });

      // Formatage pour l'UI mobile
      const formattedData = this.apiV2.formatRemunerationDataForMobile(result);
      
      return this.formatResponse(
        { data: formattedData, originalData: result },
        `Rémunération: Vi=${formattedData?.totalRubriquesVi} FCFA, EMF=${formattedData?.montantEMF} FCFA`
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur processus rémunération');
    }
  }

  /**
   * Processus complet automatisé
   */
  async processusCompletCommissionRemuneration(collecteurId, dateDebut, dateFin) {
    try {
      console.log('🎯 Processus complet FOCEP', { collecteurId, dateDebut, dateFin });
      
      const result = await this.apiV2.processusComplet({
        collecteurId,
        dateDebut,
        dateFin
      });

      // Extraction des données pour l'UI
      const commissionData = this.apiV2.formatCommissionDataForMobile(result.commissionResult);
      const remunerationData = this.apiV2.formatRemunerationDataForMobile(result.remunerationResult);
      
      return this.formatResponse(
        {
          periode: result.periode,
          commission: commissionData,
          remuneration: remunerationData,
          success: result.success,
          originalData: result
        },
        'Processus complet terminé avec succès'
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur processus complet');
    }
  }

  /**
   * GÉNÉRATION DE RAPPORTS EXCEL RÉELS
   */

  /**
   * Génère le rapport Excel de commission
   */
  async generateCommissionExcelReport(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📊 Génération rapport Excel commission', { collecteurId, dateDebut, dateFin });
      
      const blob = await this.apiV2.generateCommissionExcelReport({
        collecteurId,
        dateDebut,
        dateFin
      });

      const fileName = `rapport_commission_${collecteurId}_${dateDebut}_${dateFin}.xlsx`;
      
      // Télécharger et partager le fichier
      const downloadResult = await this.apiV2.downloadExcelFile(blob, fileName);
      
      return this.formatResponse(
        {
          fileName,
          size: blob.size,
          downloadResult
        },
        `Rapport Excel généré: ${fileName}`
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur génération rapport Excel commission');
    }
  }

  /**
   * Génère le rapport Excel de rémunération
   */
  async generateRemunerationExcelReport(collecteurId, dateDebut, dateFin) {
    try {
      console.log('📊 Génération rapport Excel rémunération', { collecteurId, dateDebut, dateFin });
      
      const blob = await this.apiV2.generateRemunerationExcelReport({
        collecteurId,
        dateDebut,
        dateFin
      });

      const fileName = `rapport_remuneration_${collecteurId}_${dateDebut}_${dateFin}.xlsx`;
      const downloadResult = await this.apiV2.downloadExcelFile(blob, fileName);
      
      return this.formatResponse(
        {
          fileName,
          size: blob.size,
          downloadResult
        },
        `Rapport Excel rémunération généré: ${fileName}`
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur génération rapport Excel rémunération');
    }
  }

  /**
   * GESTION DES RUBRIQUES DE RÉMUNÉRATION
   */

  /**
   * Récupère les rubriques d'un collecteur
   */
  async getRubriquesCollecteur(collecteurId) {
    try {
      console.log('📋 Récupération rubriques collecteur', { collecteurId });
      
      const result = await this.apiV2.getRubriquesRemuneration({ collecteurId });
      
      return this.formatResponse(
        result,
        `${result.length} rubriques récupérées`
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur récupération rubriques');
    }
  }

  /**
   * Crée une nouvelle rubrique
   */
  async createRubrique(rubriqueData) {
    try {
      console.log('➕ Création rubrique', rubriqueData);
      
      const result = await this.apiV2.createRubriqueRemuneration(rubriqueData);
      
      return this.formatResponse(
        result,
        `Rubrique "${result.nom}" créée`
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur création rubrique');
    }
  }

  /**
   * Met à jour une rubrique
   */
  async updateRubrique(rubriqueId, rubriqueData) {
    try {
      console.log('✏️ Mise à jour rubrique', { rubriqueId, rubriqueData });
      
      const result = await this.apiV2.updateRubriqueRemuneration({
        rubriqueId,
        rubrique: rubriqueData
      });
      
      return this.formatResponse(
        result,
        `Rubrique "${result.nom}" mise à jour`
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur mise à jour rubrique');
    }
  }

  /**
   * Désactive une rubrique
   */
  async deactivateRubrique(rubriqueId) {
    try {
      console.log('❌ Désactivation rubrique', { rubriqueId });
      
      const result = await this.apiV2.deactivateRubriqueRemuneration({ rubriqueId });
      
      return this.formatResponse(
        result,
        'Rubrique désactivée'
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur désactivation rubrique');
    }
  }

  /**
   * MÉTHODES UTILITAIRES
   */

  /**
   * Récupère le statut d'un collecteur
   */
  async getCollecteurStatus(collecteurId) {
    try {
      console.log('ℹ️ Statut collecteur', { collecteurId });
      
      const result = await this.apiV2.getCollecteurCommissionStatus({ collecteurId });
      
      return this.formatResponse(
        result,
        'Statut collecteur récupéré'
      );
    } catch (error) {
      throw this.handleError(error, 'Erreur récupération statut');
    }
  }

  /**
   * Valide les paramètres de période
   */
  validatePeriodParams(dateDebut, dateFin) {
    if (!dateDebut || !dateFin) {
      throw new Error('Les dates de début et fin sont requises');
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (debut > fin) {
      throw new Error('La date de début doit être antérieure à la date de fin');
    }

    if (fin > new Date()) {
      throw new Error('La date de fin ne peut pas être dans le futur');
    }

    return true;
  }

  /**
   * Formate une période pour l'affichage
   */
  formatPeriode(dateDebut, dateFin) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const debut = new Date(dateDebut).toLocaleDateString('fr-FR', options);
    const fin = new Date(dateFin).toLocaleDateString('fr-FR', options);
    
    return `${debut} → ${fin}`;
  }

  /**
   * Calcule les statistiques rapides d'une commission
   */
  calculateCommissionStats(commissionData) {
    if (!commissionData || !commissionData.clients) {
      return null;
    }

    const clients = commissionData.clients;
    const stats = {
      nombreClients: clients.length,
      totalEpargne: clients.reduce((sum, client) => sum + (client.montantEpargne || 0), 0),
      totalCommissions: clients.reduce((sum, client) => sum + (client.commission || 0), 0),
      totalTVA: clients.reduce((sum, client) => sum + (client.tva || 0), 0),
      commissionMoyenne: 0,
      clientLePlusActif: null
    };

    stats.commissionMoyenne = stats.nombreClients > 0 
      ? stats.totalCommissions / stats.nombreClients 
      : 0;

    stats.clientLePlusActif = clients.reduce((max, client) => 
      (client.montantEpargne > (max?.montantEpargne || 0)) ? client : max, null);

    return stats;
  }
}

export default new CommissionV2Service();