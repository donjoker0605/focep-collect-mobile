// src/services/versementService.js - VERSION FINALE CORRIGÉE ET ALIGNÉE
import BaseApiService from './base/BaseApiService';

/**
 * 💰 Service pour la gestion des versements et clôtures de journaux
 * ✅ VERSION ALIGNÉE AVEC BACKEND REFACTORISÉ ET CORRECTIONS FRONTEND
 * 🔥 CORRECTION CRITIQUE : Gestion de la valeur absolue du solde compte service
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
      const result = this.formatResponse(response, 'Aperçu généré avec succès');
      
      // 🔥 ENRICHISSEMENT POST-RÉPONSE : Ajouter les calculs corrigés
      if (result.success && result.data) {
        result.data.montantDuCalcule = Math.abs(result.data.soldeCompteService || 0);
        result.data.calculPreavis = this.calculerDifferenceAvecPreview(result.data);
      }
      
      return result;
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération de l\'aperçu');
    }
  }

  /**
   * 💰 Effectuer le versement et clôturer le journal
   * ✅ UTILISE LA NOUVELLE LOGIQUE REFACTORISÉE ET CORRIGÉE
   */
  async effectuerVersementEtCloture(versementData) {
    try {
      console.log('💰 API: POST /admin/versements/cloture - VERSION CORRIGÉE');
      console.log('🎯 Données versement avec logique corrigée:', {
        collecteurId: versementData.collecteurId,
        date: versementData.date,
        montantVerse: versementData.montantVerse,
        commentaire: versementData.commentaire
      });

      // 🔥 VALIDATION CÔTÉ CLIENT AVEC LOGIQUE CORRIGÉE
      const validation = this.validateVersementDataCorrige(versementData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const response = await this.axios.post('/admin/versements/cloture', {
        collecteurId: versementData.collecteurId,
        date: versementData.date,
        montantVerse: versementData.montantVerse,
        commentaire: versementData.commentaire || null
      });
      
      const result = this.formatResponse(response, 'Versement effectué et journal clôturé avec succès');
      
      // 🔥 ENRICHIR LA RÉPONSE AVEC LA LOGIQUE CORRIGÉE
      if (result.data) {
        // Utiliser la valeur absolue pour le calcul du cas
        const montantDuCorrige = Math.abs(result.data.montantCollecte || 0);
        result.casDetecte = this.determinerCasVersementCorrige(
          montantDuCorrige, 
          result.data.montantVerse
        );
        result.needsAttention = result.data.manquant > 0;
        result.isSuccess = result.success;
        
        // Message personnalisé selon le cas avec logique corrigée
        result.messageDetail = this.getMessageByCasCorrige(result.casDetecte, {
          ...result.data,
          montantCollecteCorrige: montantDuCorrige
        });
      }
      
      // Déclencher le rafraîchissement du dashboard et du journal après clôture réussie
      if (result.success) {
        try {
          const { default: collecteurService } = await import('./collecteurService');
          const { default: journalActiviteService } = await import('./journalActiviteService');
          
          // Rafraîchir en arrière-plan sans bloquer la réponse
          Promise.all([
            collecteurService.getCollecteurDashboard(versementData.collecteurId),
            journalActiviteService.refreshAfterClosure(versementData.collecteurId)
          ]).catch(error => {
            console.warn('⚠️ Erreur rafraîchissement après clôture:', error.message);
          });
          
          console.log('🔄 Rafraîchissement dashboard et journal déclenché après clôture');
        } catch (error) {
          console.warn('⚠️ Impossible de déclencher le rafraîchissement après clôture:', error.message);
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur versement avec logique corrigée:', error);
      throw this.handleError(error, 'Erreur lors du versement et de la clôture');
    }
  }

  /**
   * 📊 Récupérer TOUS les comptes d'un collecteur (incluant agence)
   */
  async getCollecteurComptes(collecteurId) {
    try {
      console.log('📊 API: GET /admin/versements/collecteur/comptes');
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

  // =====================================
  // 🔥 MÉTHODES CORRIGÉES POUR FRONTEND
  // =====================================

  /**
   * 🔧 MÉTHODE CORRIGÉE : Calcule la différence avec les données d'aperçu
   * ✅ ALIGNÉE AVEC JournalClotureScreen.calculerDifferenceCorrigee()
   */
  calculerDifferenceAvecPreview(previewData, montantVerse = null) {
    if (!previewData || (!montantVerse && montantVerse !== 0)) return null;
    
    // 🔥 CORRECTION CRITIQUE : Utiliser la valeur absolue du solde du compte service
    const montantDu = Math.abs(previewData.soldeCompteService || 0);
    const montantSaisi = parseFloat(montantVerse) || 0;
    const difference = montantSaisi - montantDu;
    
    console.log('🔧 CALCUL CORRIGÉ SERVICE:', {
      soldeCompteService: previewData.soldeCompteService,
      montantDu,
      montantSaisi,
      difference,
      type: difference > 0 ? 'excedent' : difference < 0 ? 'manquant' : 'equilibre'
    });
    
    return {
      difference,
      type: difference > 0 ? 'excedent' : difference < 0 ? 'manquant' : 'equilibre',
      montant: Math.abs(difference),
      montantDu: montantDu,
      montantSaisi: montantSaisi,
      isExcedent: difference > 0,
      isManquant: difference < 0,
      isEquilibre: Math.abs(difference) < 0.01,
      severity: this.getSeverityCorrige(difference, montantDu)
    };
  }

  /**
   * 🎯 MÉTHODE CORRIGÉE : Détermine le cas de versement avec valeur absolue
   * ✅ ALIGNÉE AVEC LA LOGIQUE BACKEND CORRIGÉE
   */
  determinerCasVersementCorrige(montantDu, montantVerse) {
    if (!montantDu && montantDu !== 0 || !montantVerse && montantVerse !== 0) return 'INDETERMINE';
    
    // 🔥 CORRECTION : S'assurer que montantDu est la valeur absolue
    const montantDuAbsolue = Math.abs(montantDu);
    const difference = montantVerse - montantDuAbsolue;
    
    console.log('🎯 Détermination cas avec logique corrigée:', {
      montantDuOriginal: montantDu,
      montantDuAbsolue,
      montantVerse,
      difference
    });
    
    if (Math.abs(difference) < 0.01) { // Tolérance pour les arrondis
      return 'NORMAL';
    } else if (difference > 0) {
      return 'EXCEDENT';
    } else {
      return 'MANQUANT';
    }
  }

  /**
   * 🔧 MÉTHODE CORRIGÉE : Validation avec logique corrigée
   */
  validateVersementDataCorrige(data) {
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

    // 🔥 CAS SPÉCIAL : Si on a les données d'aperçu, calculer le cas avec la logique corrigée
    let casCalcule = null;
    if (data.previewData && data.previewData.soldeCompteService !== undefined) {
      const montantDu = Math.abs(data.previewData.soldeCompteService);
      casCalcule = this.determinerCasVersementCorrige(montantDu, data.montantVerse);
    }

    return {
      isValid: errors.length === 0,
      errors,
      casCalcule,
      montantDuCorrige: data.previewData ? Math.abs(data.previewData.soldeCompteService || 0) : null
    };
  }

  /**
   * 📝 MÉTHODE CORRIGÉE : Messages avec logique corrigée
   */
  getMessageByCasCorrige(cas, data) {
    switch (cas) {
      case 'NORMAL':
        return '✅ Versement normal - Montant exact';
      case 'EXCEDENT':
        // 🔥 CORRECTION : Utiliser montantCollecteCorrige si disponible
        const montantCollecte = data.montantCollecteCorrige || Math.abs(data.montantCollecte || 0);
        const excedent = data.montantVerse - montantCollecte;
        return `💰 Excédent de ${this.formatCurrency(excedent)} détecté - Sera crédité au compte manquant`;
      case 'MANQUANT':
        // 🔥 CORRECTION : Utiliser montantCollecteCorrige si disponible
        const montantCollecteManquant = data.montantCollecteCorrige || Math.abs(data.montantCollecte || 0);
        const manquant = montantCollecteManquant - data.montantVerse;
        return `⚠️ Manquant de ${this.formatCurrency(manquant)} - Dette ajoutée au compte manquant`;
      default:
        return '❓ Cas indéterminé';
    }
  }

  /**
   * 🔧 MÉTHODE CORRIGÉE : Calcule la différence avec logique corrigée
   */
  calculateDifferenceCorrige(soldeCompteService, montantVerse) {
    // 🔥 CORRECTION CRITIQUE : Utiliser la valeur absolue du solde
    const montantDu = Math.abs(soldeCompteService || 0);
    const difference = montantVerse - montantDu;
    const cas = this.determinerCasVersementCorrige(montantDu, montantVerse);
    
    return {
      difference,
      cas,
      montant: Math.abs(difference),
      montantDu,
      montantVerse,
      isExcedent: cas === 'EXCEDENT',
      isManquant: cas === 'MANQUANT',
      isEquilibre: cas === 'NORMAL',
      severity: this.getSeverityCorrige(difference, montantDu)
    };
  }

  /**
   * ⚠️ MÉTHODE CORRIGÉE : Détermine la gravité avec logique corrigée
   */
  getSeverityCorrige(difference, montantDu) {
    if (Math.abs(difference) < 0.01) return 'NONE';
    
    const pourcentage = montantDu > 0 ? (Math.abs(difference) / montantDu) * 100 : 0;
    
    if (pourcentage > 20) return 'CRITICAL';
    if (pourcentage > 10) return 'HIGH';
    if (pourcentage > 5) return 'MEDIUM';
    return 'LOW';
  }

  // =====================================
  // 🔄 MÉTHODES ANCIENNES CONSERVÉES POUR COMPATIBILITÉ
  // =====================================

  /**
   * 🎯 Détermine le cas de versement selon la logique métier refactorisée
   * ⚠️ CONSERVÉE POUR COMPATIBILITÉ - UTILISER determinerCasVersementCorrige()
   */
  determinerCasVersement(montantCollecte, montantVerse) {
    console.warn('⚠️ Méthode dépréciée - Utiliser determinerCasVersementCorrige()');
    return this.determinerCasVersementCorrige(montantCollecte, montantVerse);
  }

  /**
   * 🔧 Utilitaire : Calcule la différence de versement (refactorisé)
   * ⚠️ CONSERVÉE POUR COMPATIBILITÉ - UTILISER calculateDifferenceCorrige()
   */
  calculateDifference(montantCollecte, montantVerse) {
    console.warn('⚠️ Méthode dépréciée - Utiliser calculateDifferenceCorrige()');
    const difference = montantVerse - montantCollecte;
    const cas = this.determinerCasVersementCorrige(montantCollecte, montantVerse);
    
    return {
      difference,
      cas,
      montant: Math.abs(difference),
      isExcedent: cas === 'EXCEDENT',
      isManquant: cas === 'MANQUANT',
      isEquilibre: cas === 'NORMAL',
      severity: this.getSeverityCorrige(difference, montantCollecte)
    };
  }

  // =====================================
  // 🔄 MÉTHODES INCHANGÉES
  // =====================================

  /**
   * 💡 Analyse l'état des comptes et fournit des recommandations (refactorisé)
   */
  analyserEtatComptes(comptes) {
    const analysis = {
      statut: 'BON',
      alertes: [],
      recommandations: [],
      indicateurs: {}
    };

    // Analyse du compte service avec logique corrigée
    const soldeServiceAbsolu = Math.abs(comptes.compteServiceSolde || 0);
    if (soldeServiceAbsolu <= 0) {
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

    // Analyse du compte agence (logique refactorisée)
    if (comptes.compteAgenceSolde > 0) {
      analysis.alertes.push('Compte agence en état anormal (solde positif)');
      analysis.recommandations.push('Vérifier les mouvements de versement');
    }

    analysis.indicateurs = {
      soldeNet: comptes.soldeNet || 0,
      totalVerseAgence: comptes.totalVerseAgence || 0,
      tauxManquant: soldeServiceAbsolu > 0 ? 
                    (Math.abs(comptes.compteManquantSolde) / soldeServiceAbsolu) * 100 : 0,
      peutVerser: comptes.peutVerser || false
    };

    return analysis;
  }

  /**
   * 🔧 Valide les données de versement selon la logique refactorisée
   * ⚠️ CONSERVÉE POUR COMPATIBILITÉ - UTILISER validateVersementDataCorrige()
   */
  validateVersementData(data) {
    console.warn('⚠️ Méthode dépréciée - Utiliser validateVersementDataCorrige()');
    return this.validateVersementDataCorrige(data);
  }

  /**
   * 🎫 Génère un aperçu du ticket d'autorisation (refactorisé)
   */
  generateTicketPreview(versementData) {
    const montantDu = Math.abs(versementData.montantCollecte || 0);
    const cas = this.determinerCasVersementCorrige(montantDu, versementData.montantVerse);
    
    return {
      date: versementData.date,
      collecteur: versementData.collecteurNom,
      montantVerse: versementData.montantVerse,
      montantDu,
      cas: cas,
      message: this.getMessageByCasCorrige(cas, { ...versementData, montantCollecteCorrige: montantDu }),
      urgence: cas === 'MANQUANT' ? 'HAUTE' : cas === 'EXCEDENT' ? 'MOYENNE' : 'NORMALE',
      numeroAutorisation: versementData.numeroAutorisation || 'En cours...'
    };
  }

  /**
   * 📝 Retourne le message approprié selon le cas (refactorisé)
   * ⚠️ CONSERVÉE POUR COMPATIBILITÉ - UTILISER getMessageByCasCorrige()
   */
  getMessageByCas(cas, data) {
    console.warn('⚠️ Méthode dépréciée - Utiliser getMessageByCasCorrige()');
    return this.getMessageByCasCorrige(cas, data);
  }

  /**
   * ⚠️ Détermine la gravité de l'écart
   * ⚠️ CONSERVÉE POUR COMPATIBILITÉ - UTILISER getSeverityCorrige()
   */
  getSeverity(cas, montantEcart, montantCollecte) {
    console.warn('⚠️ Méthode dépréciée - Utiliser getSeverityCorrige()');
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
  // 🧪 MÉTHODES DE TEST CORRIGÉES
  // =====================================

  /**
   * 🎯 Données de test pour les 3 cas (avec logique corrigée)
   */
  getMockDataForTestingCorrige() {
    return {
      casNormal: {
        collecteurId: 1,
        date: '2025-07-18',
        soldeCompteService: -100000,  // Dette du collecteur
        montantVerse: 100000,         // Montant exact
        commentaire: 'Test cas normal corrigé'
      },
      casExcedent: {
        collecteurId: 1,
        date: '2025-07-18',
        soldeCompteService: -100000,  // Dette du collecteur
        montantVerse: 105000,         // Montant supérieur
        commentaire: 'Test cas excédent corrigé'
      },
      casManquant: {
        collecteurId: 1,
        date: '2025-07-18',
        soldeCompteService: -100000,  // Dette du collecteur
        montantVerse: 95000,          // Montant inférieur
        commentaire: 'Test cas manquant corrigé'
      },
      casProblematique: {
        collecteurId: 4,
        date: '2025-07-18',
        soldeCompteService: -2104900, // Le cas qui échouait avant
        montantVerse: 2004900,        // Montant versé
        commentaire: 'Test cas qui échouait avant correction'
      }
    };
  }

  /**
   * 🧪 Test de validation pour tous les cas (avec logique corrigée)
   */
  testValidationLogicCorrigee() {
    console.log('🧪 Test de la logique de validation CORRIGÉE...');
    
    const testCases = this.getMockDataForTestingCorrige();
    
    Object.entries(testCases).forEach(([casName, data]) => {
      const analysis = this.calculateDifferenceCorrige(data.soldeCompteService, data.montantVerse);
      const validation = this.validateVersementDataCorrige({
        ...data,
        previewData: { soldeCompteService: data.soldeCompteService }
      });
      
      console.log(`📊 ${casName} (CORRIGÉ):`, {
        soldeCompteServiceOriginal: data.soldeCompteService,
        montantDuCalcule: analysis.montantDu,
        montantVerse: data.montantVerse,
        difference: analysis.difference,
        cas: analysis.cas,
        validation: validation.isValid,
        message: this.getMessageByCasCorrige(analysis.cas, {
          montantCollecteCorrige: analysis.montantDu,
          montantVerse: data.montantVerse
        })
      });
    });
  }

  /**
   * ✅ Test de connectivité avec le backend refactorisé et corrigé
   */
  async testConnectiviteBackendCorrige() {
    try {
      console.log('🧪 Test connectivité backend avec logique corrigée...');
      
      // Test de l'aperçu avec le cas problématique
      const testData = this.getMockDataForTestingCorrige().casProblematique;
      const preview = await this.getCloturePreview(testData.collecteurId, testData.date);
      
      if (preview.success && preview.data) {
        // Test du calcul corrigé
        const calculCorrige = this.calculerDifferenceAvecPreview(preview.data, testData.montantVerse);
        
        console.log('✅ Connectivité backend avec logique corrigée OK:', {
          success: preview.success,
          hasData: !!preview.data,
          soldeCompteService: preview.data.soldeCompteService,
          montantDuCalcule: preview.data.montantDuCalcule,
          calculCorrige,
          casTest: 'preview avec logique corrigée'
        });
      }
      
      return {
        success: true,
        message: 'Backend avec logique corrigée accessible',
        testResults: preview
      };
      
    } catch (error) {
      console.error('❌ Erreur connectivité backend corrigé:', error);
      return {
        success: false,
        message: 'Erreur de connectivité avec le backend corrigé',
        error: error.message
      };
    }
  }

  // =====================================
  // 🔄 MÉTHODES ANCIENNES CONSERVÉES
  // =====================================

  /**
   * 🎯 Données de test pour les 3 cas (refactorisé)
   * ⚠️ CONSERVÉE POUR COMPATIBILITÉ - UTILISER getMockDataForTestingCorrige()
   */
  getMockDataForTesting() {
    console.warn('⚠️ Méthode dépréciée - Utiliser getMockDataForTestingCorrige()');
    return {
      casNormal: {
        collecteurId: 1,
        date: '2025-07-18',
        montantCollecte: 100000,
        montantVerse: 100000,
        commentaire: 'Test cas normal refactorisé'
      },
      casExcedent: {
        collecteurId: 1,
        date: '2025-07-18',
        montantCollecte: 100000,
        montantVerse: 105000,
        commentaire: 'Test cas excédent refactorisé'
      },
      casManquant: {
        collecteurId: 1,
        date: '2025-07-18',
        montantCollecte: 100000,
        montantVerse: 95000,
        commentaire: 'Test cas manquant refactorisé'
      }
    };
  }

  /**
   * 🧪 Test de validation pour tous les cas (refactorisé)
   * ⚠️ CONSERVÉE POUR COMPATIBILITÉ - UTILISER testValidationLogicCorrigee()
   */
  testValidationLogic() {
    console.warn('⚠️ Méthode dépréciée - Utiliser testValidationLogicCorrigee()');
    this.testValidationLogicCorrigee();
  }

  /**
   * ✅ Test de connectivité avec le backend refactorisé
   * ⚠️ CONSERVÉE POUR COMPATIBILITÉ - UTILISER testConnectiviteBackendCorrige()
   */
  async testConnectiviteBackendRefactorise() {
    console.warn('⚠️ Méthode dépréciée - Utiliser testConnectiviteBackendCorrige()');
    return await this.testConnectiviteBackendCorrige();
  }
}

export default new VersementService();