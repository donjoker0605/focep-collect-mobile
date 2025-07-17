// src/services/versementService.js - VERSION CORRIGÉE ALIGNÉE BACKEND
import BaseApiService from './base/BaseApiService';

/**
 * 💰 Service pour la gestion des versements et clôtures de journaux
 * VERSION CORRIGÉE avec support du compte agence et nouvelle logique métier
 */
class VersementService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * 📋 Obtenir un aperçu avant clôture (incluant compte agence)
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
   * 💰 Effectuer le versement et clôturer le journal (nouvelle logique métier)
   */
  async effectuerVersementEtCloture(versementData) {
    try {
      console.log('💰 API: POST /admin/versements/cloture');
      console.log('🎯 Données versement:', {
        ...versementData,
        cas: this.determinerCasVersement(versementData.montantCollecte, versementData.montantVerse)
      });

      const response = await this.axios.post('/admin/versements/cloture', versementData);
      
      // Analyser le résultat pour fournir un feedback approprié
      const result = this.formatResponse(response, 'Versement effectué et journal clôturé');
      
      if (result.data) {
        result.casDetecte = this.determinerCasVersement(
          result.data.montantCollecte, 
          result.data.montantVerse
        );
        result.needsAttention = result.data.manquant > 0;
      }
      
      return result;
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du versement et de la clôture');
    }
  }

  /**
   * 📊 Récupérer TOUS les comptes d'un collecteur (incluant agence)
   */
  async getCollecteurComptes(collecteurId) {
    try {
      console.log('📊 API: GET /admin/versements/collecteur/comptes (NOUVELLE VERSION)');
      const response = await this.axios.get(`/admin/versements/collecteur/${collecteurId}/comptes`);
      return this.formatResponse(response, 'Comptes complets récupérés avec succès');
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
   * 🏥 Diagnostic des comptes agence (admin seulement)
   */
  async diagnosticComptesAgence() {
    try {
      console.log('🏥 API: GET /admin/versements/diagnostic/comptes-agence');
      const response = await this.axios.get('/admin/versements/diagnostic/comptes-agence');
      return this.formatResponse(response, 'Diagnostic effectué');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du diagnostic');
    }
  }

  /**
   * 📊 Statistiques globales des versements par agence
   */
  async getStatsVersementsAgences() {
    try {
      console.log('📊 API: GET /admin/versements/stats/agences');
      const response = await this.axios.get('/admin/versements/stats/agences');
      return this.formatResponse(response, 'Statistiques agences récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques agences');
    }
  }

  // =====================================
  // 🔥 NOUVELLES MÉTHODES UTILITAIRES
  // =====================================

  /**
   * 🎯 Détermine le cas de versement selon la nouvelle logique métier
   */
  determinerCasVersement(montantCollecte, montantVerse) {
    if (!montantCollecte || !montantVerse) return 'INDETERMINE';
    
    const difference = montantVerse - montantCollecte;
    
    if (Math.abs(difference) < 0.01) { // Tolérance pour les arrondis
      return 'NORMAL';
    } else if (difference > 0) {
      return 'EXCEDENT';
    } else {
      return 'MANQUANT';
    }
  }

  /**
   * 🔧 Valide les données de versement selon la nouvelle logique
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

    // Validation spécifique pour manquant important
    if (data.montantCollecte && data.montantVerse) {
      const cas = this.determinerCasVersement(data.montantCollecte, data.montantVerse);
      if (cas === 'MANQUANT') {
        const manquant = data.montantCollecte - data.montantVerse;
        if (manquant > data.montantCollecte * 0.1) { // Plus de 10% de manquant
          errors.push(`Manquant important détecté: ${this.formatCurrency(manquant)}. Justification requise.`);
        }
      }
    }

    if (data.commentaire && data.commentaire.length > 500) {
      errors.push('Le commentaire ne peut pas dépasser 500 caractères');
    }

    return {
      isValid: errors.length === 0,
      errors,
      cas: data.montantCollecte && data.montantVerse ? 
           this.determinerCasVersement(data.montantCollecte, data.montantVerse) : null
    };
  }

  /**
   * 💡 Analyse l'état des comptes et fournit des recommandations
   */
  analyserEtatComptes(comptes) {
    const analysis = {
      statut: 'BON',
      alertes: [],
      recommandations: [],
      indicateurs: {}
    };

    // Analyse du compte service
    if (comptes.compteServiceSolde <= 0) {
      analysis.alertes.push('Aucun montant à verser (compte service vide)');
      analysis.statut = 'ATTENTION';
    }

    // Analyse du compte manquant
    if (comptes.compteManquantSolde < 0) {
      const manquantAbs = Math.abs(comptes.compteManquantSolde);
      analysis.alertes.push(`Dette de ${this.formatCurrency(manquantAbs)} détectée`);
      
      if (manquantAbs > 50000) {
        analysis.statut = 'CRITIQUE';
        analysis.recommandations.push('Contact agence recommandé pour régularisation');
      } else {
        analysis.statut = 'ATTENTION';
      }
    }

    // Analyse du compte agence (nouvelle logique)
    if (comptes.compteAgenceSolde > 0) {
      analysis.alertes.push('Compte agence en état anormal (solde positif)');
      analysis.recommandations.push('Vérifier les mouvements de versement');
    }

    // Calcul des indicateurs
    analysis.indicateurs = {
      soldeNet: comptes.soldeNet || 0,
      totalVerseAgence: comptes.totalVerseAgence || 0,
      tauxManquant: comptes.compteServiceSolde > 0 ? 
                    (Math.abs(comptes.compteManquantSolde) / comptes.compteServiceSolde) * 100 : 0,
      peutVerser: comptes.peutVerser || false
    };

    return analysis;
  }

  /**
   * 🎫 Génère un aperçu du ticket d'autorisation
   */
  generateTicketPreview(versementData) {
    const cas = this.determinerCasVersement(versementData.montantCollecte, versementData.montantVerse);
    
    return {
      date: versementData.date,
      collecteur: versementData.collecteurNom,
      montantVerse: versementData.montantVerse,
      cas: cas,
      message: this.getMessageByCas(cas, versementData),
      urgence: cas === 'MANQUANT' ? 'HAUTE' : cas === 'EXCEDENT' ? 'MOYENNE' : 'NORMALE'
    };
  }

  /**
   * 📝 Retourne le message approprié selon le cas
   */
  getMessageByCas(cas, data) {
    switch (cas) {
      case 'NORMAL':
        return '✅ Versement normal - Montant exact';
      case 'EXCEDENT':
        const excedent = data.montantVerse - data.montantCollecte;
        return `💰 Excédent de ${this.formatCurrency(excedent)} détecté - Sera crédité`;
      case 'MANQUANT':
        const manquant = data.montantCollecte - data.montantVerse;
        return `⚠️ Manquant de ${this.formatCurrency(manquant)} - Justification requise`;
      default:
        return '❓ Cas indéterminé';
    }
  }

  /**
   * 🔧 Utilitaire : Calcule la différence de versement (mise à jour)
   */
  calculateDifference(montantCollecte, montantVerse) {
    const difference = montantVerse - montantCollecte;
    const cas = this.determinerCasVersement(montantCollecte, montantVerse);
    
    return {
      difference,
      cas,
      montant: Math.abs(difference),
      isExcedent: cas === 'EXCEDENT',
      isManquant: cas === 'MANQUANT',
      isEquilibre: cas === 'NORMAL',
      severity: this.getSeverity(cas, Math.abs(difference), montantCollecte)
    };
  }

  /**
   * ⚠️ Détermine la gravité de l'écart
   */
  getSeverity(cas, montantEcart, montantCollecte) {
    if (cas === 'NORMAL') return 'NONE';
    
    const pourcentage = montantCollecte > 0 ? (montantEcart / montantCollecte) * 100 : 0;
    
    if (pourcentage > 20) return 'CRITICAL';
    if (pourcentage > 10) return 'HIGH';
    if (pourcentage > 5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 🔧 Utilitaire : Formater un montant en devise
   */
  formatCurrency(amount) {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  }

  // =====================================
  // 🧪 MÉTHODES DE TEST ET DEBUG
  // =====================================

  /**
   * 🎯 Données de test pour les 3 cas
   */
  getMockDataForTesting() {
    return {
      casNormal: {
        collecteurId: 1,
        date: '2025-07-17',
        montantCollecte: 100000,
        montantVerse: 100000,
        commentaire: 'Test cas normal'
      },
      casExcedent: {
        collecteurId: 1,
        date: '2025-07-17',
        montantCollecte: 100000,
        montantVerse: 105000,
        commentaire: 'Test cas excédent'
      },
      casManquant: {
        collecteurId: 1,
        date: '2025-07-17',
        montantCollecte: 100000,
        montantVerse: 95000,
        commentaire: 'Test cas manquant'
      }
    };
  }

  /**
   * 🧪 Test de validation pour tous les cas
   */
  testValidationLogic() {
    console.log('🧪 Test de la logique de validation...');
    
    const testCases = this.getMockDataForTesting();
    
    Object.entries(testCases).forEach(([casName, data]) => {
      const validation = this.validateVersementData(data);
      const analysis = this.calculateDifference(data.montantCollecte, data.montantVerse);
      
      console.log(`📊 ${casName}:`, {
        validation: validation.isValid,
        cas: validation.cas,
        difference: analysis,
        message: this.getMessageByCas(analysis.cas, data)
      });
    });
  }
}

export default new VersementService();