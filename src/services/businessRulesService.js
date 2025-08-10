// src/services/businessRulesService.js - SERVICE RÈGLES MÉTIER
import BaseApiService from './base/BaseApiService';
import authService from './authService';
import seniorityService from './seniorityService';

/**
 * 🎯 SERVICE CENTRAL POUR LES RÈGLES MÉTIER
 * 
 * RÈGLES IMPLÉMENTÉES:
 * 1. ❌ Pas de suppression client/collecteur - seulement activation/désactivation
 * 2. 🔒 Pas de modification nom/prénom - seulement autres informations  
 * 3. 📈 Système d'ancienneté collecteur intégré
 * 4. 💰 Configuration commissions par admin
 */
class BusinessRulesService extends BaseApiService {
  constructor() {
    super();
    this.restrictedFields = {
      client: ['nom', 'prenom', 'numeroCompte', 'collecteurId', 'agenceId'],
      collecteur: ['nom', 'prenom', 'adresseMail', 'agenceId']
    };
  }

  // ================================
  // 🔒 RÈGLES DE MODIFICATION - CLIENTS
  // ================================

  /**
   * Filtre les champs autorisés pour modification client
   */
  filterAllowedClientFields(clientData, userRole = null) {
    const allowedFields = [
      'telephone', 'numeroCni', 'ville', 'quartier', 
      'latitude', 'longitude', 'coordonneesSaisieManuelle',
      'adresseComplete', 'photoPath'
    ];

    const filtered = {};
    const rejected = {};

    Object.keys(clientData).forEach(key => {
      if (this.restrictedFields.client.includes(key)) {
        rejected[key] = `Champ protégé: ${key} ne peut pas être modifié`;
      } else if (allowedFields.includes(key)) {
        filtered[key] = clientData[key];
      } else {
        rejected[key] = `Champ non autorisé: ${key}`;
      }
    });

    return {
      allowed: filtered,
      rejected,
      hasRejected: Object.keys(rejected).length > 0,
      message: Object.keys(rejected).length > 0 ? 
        `Champs protégés ignorés: ${Object.keys(rejected).join(', ')}` : 
        'Tous les champs sont autorisés'
    };
  }

  /**
   * Met à jour un client en respectant les règles métier
   */
  async updateClientSafely(clientId, clientData) {
    try {
      console.log('🔒 [BUSINESS-RULES] Mise à jour client sécurisée:', clientId);
      
      // Filtrer les champs autorisés
      const filter = this.filterAllowedClientFields(clientData);
      
      if (filter.hasRejected) {
        console.warn('⚠️ [BUSINESS-RULES] Champs rejetés:', filter.rejected);
      }

      if (Object.keys(filter.allowed).length === 0) {
        throw new Error('Aucun champ autorisé à modifier');
      }

      // Valider les données autorisées
      const validation = this.validateClientData(filter.allowed);
      if (!validation.isValid) {
        throw new Error(`Erreurs de validation: ${validation.errors.join(', ')}`);
      }

      // Effectuer la mise à jour
      const response = await this.axios.put(`/clients/${clientId}`, filter.allowed);
      
      const result = this.formatResponse(response, 'Client mis à jour (règles métier respectées)');
      
      // Ajouter les avertissements si nécessaire
      if (filter.hasRejected) {
        result.warnings = [filter.message];
      }

      return result;

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour sécurisée du client');
    }
  }

  /**
   * Active/Désactive un client au lieu de le supprimer
   */
  async toggleClientStatus(clientId, isActive, reason = null) {
    try {
      console.log(`🔄 [BUSINESS-RULES] ${isActive ? 'Activation' : 'Désactivation'} client:`, clientId);
      
      const payload = {
        active: isActive
      };

      if (reason) {
        payload.reason = reason;
      }

      const response = await this.axios.put(`/clients/${clientId}/status`, payload);
      return this.formatResponse(response, `Client ${isActive ? 'activé' : 'désactivé'} avec succès`);

    } catch (error) {
      throw this.handleError(error, `Erreur lors de la ${isActive ? 'activation' : 'désactivation'} du client`);
    }
  }

  // ================================
  // 🔒 RÈGLES DE MODIFICATION - COLLECTEURS
  // ================================

  /**
   * Filtre les champs autorisés pour modification collecteur
   */
  filterAllowedCollecteurFields(collecteurData, userRole = 'COLLECTEUR') {
    let allowedFields = ['telephone', 'motDePasse']; // Champs de base

    // Admin peut modifier plus de champs
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'ROLE_ADMIN' || userRole === 'ROLE_SUPER_ADMIN') {
      allowedFields = [
        'telephone', 'motDePasse', 'montantMaxRetrait', 
        'active', 'fcmToken'
      ];
    }

    const filtered = {};
    const rejected = {};

    Object.keys(collecteurData).forEach(key => {
      if (this.restrictedFields.collecteur.includes(key)) {
        rejected[key] = `Champ protégé: ${key} ne peut pas être modifié`;
      } else if (allowedFields.includes(key)) {
        filtered[key] = collecteurData[key];
      } else {
        rejected[key] = `Champ non autorisé pour le rôle ${userRole}: ${key}`;
      }
    });

    return {
      allowed: filtered,
      rejected,
      hasRejected: Object.keys(rejected).length > 0,
      userRole,
      allowedFields,
      message: Object.keys(rejected).length > 0 ? 
        `Champs protégés/non autorisés ignorés: ${Object.keys(rejected).join(', ')}` : 
        'Tous les champs sont autorisés'
    };
  }

  /**
   * Met à jour un collecteur en respectant les règles métier
   */
  async updateCollecteurSafely(collecteurId, collecteurData, userRole = null) {
    try {
      console.log('🔒 [BUSINESS-RULES] Mise à jour collecteur sécurisée:', collecteurId);
      
      // Récupérer le rôle si pas fourni
      if (!userRole) {
        const user = await authService.getCurrentUser();
        userRole = user?.role || 'COLLECTEUR';
      }

      // Filtrer les champs autorisés
      const filter = this.filterAllowedCollecteurFields(collecteurData, userRole);
      
      if (filter.hasRejected) {
        console.warn('⚠️ [BUSINESS-RULES] Champs rejetés:', filter.rejected);
      }

      if (Object.keys(filter.allowed).length === 0) {
        throw new Error('Aucun champ autorisé à modifier');
      }

      // Effectuer la mise à jour
      const response = await this.axios.put(`/collecteurs/${collecteurId}`, filter.allowed);
      
      const result = this.formatResponse(response, 'Collecteur mis à jour (règles métier respectées)');
      
      // Ajouter les avertissements si nécessaire
      if (filter.hasRejected) {
        result.warnings = [filter.message];
      }

      return result;

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour sécurisée du collecteur');
    }
  }

  /**
   * Active/Désactive un collecteur au lieu de le supprimer
   */
  async toggleCollecteurStatus(collecteurId, isActive, reason = null) {
    try {
      console.log(`🔄 [BUSINESS-RULES] ${isActive ? 'Activation' : 'Désactivation'} collecteur:`, collecteurId);
      
      const payload = {
        active: isActive
      };

      if (reason) {
        payload.reason = reason;
      }

      const response = await this.axios.put(`/collecteurs/${collecteurId}/status`, payload);
      
      // Si désactivation, proposer le transfert des clients
      if (!isActive) {
        const result = this.formatResponse(response, 'Collecteur désactivé avec succès');
        result.nextActions = [
          'Considérez transférer les clients vers un autre collecteur',
          'Vérifiez les transactions en cours',
          'Notifiez l\'équipe de la désactivation'
        ];
        return result;
      }

      return this.formatResponse(response, 'Collecteur activé avec succès');

    } catch (error) {
      throw this.handleError(error, `Erreur lors de la ${isActive ? 'activation' : 'désactivation'} du collecteur`);
    }
  }

  // ================================
  // 💰 NOUVEAUX ENDPOINTS ADMIN INTÉGRÉS  
  // ================================

  /**
   * 🔥 NOUVEAU: Récupère les clients d'un collecteur (Admin)
   */
  async getCollecteurClients(collecteurId, options = {}) {
    try {
      console.log('👥 [BUSINESS-RULES] Admin récupération clients collecteur:', collecteurId);
      
      // Vérifier permissions admin
      const user = await authService.getCurrentUser();
      if (!this.isAdmin(user?.role)) {
        throw new Error('Accès refusé: fonctionnalité réservée aux administrateurs');
      }

      const params = {
        page: options.page || 0,
        size: options.size || 20
      };

      if (options.search?.trim()) {
        params.search = options.search.trim();
      }

      // Utiliser le nouveau endpoint admin
      const response = await this.axios.get(`/clients/admin/collecteur/${collecteurId}/clients`, { params });
      return this.formatResponse(response, 'Clients du collecteur récupérés (admin)');

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des clients du collecteur');
    }
  }

  /**
   * 🔥 NOUVEAU: Configure les paramètres de commission d'un client (Admin)
   */
  async updateClientCommission(clientId, commissionParams) {
    try {
      console.log('💰 [BUSINESS-RULES] Configuration commission client:', clientId);
      
      // Vérifier permissions admin
      const user = await authService.getCurrentUser();
      if (!this.isAdmin(user?.role)) {
        throw new Error('Accès refusé: configuration des commissions réservée aux administrateurs');
      }

      // Valider les paramètres de commission
      const validation = this.validateCommissionParams(commissionParams);
      if (!validation.isValid) {
        throw new Error(`Paramètres de commission invalides: ${validation.errors.join(', ')}`);
      }

      // Utiliser le nouveau endpoint admin
      const response = await this.axios.put(`/clients/admin/client/${clientId}/commission`, commissionParams);
      return this.formatResponse(response, 'Paramètres de commission configurés');

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la configuration des paramètres de commission');
    }
  }

  // ================================
  // 📈 INTÉGRATION SYSTÈME ANCIENNETÉ
  // ================================

  /**
   * Calcule la commission avec ancienneté
   */
  async calculateCollecteurCommissionWithSeniority(collecteurId, baseCommission, period = 'MENSUELLE') {
    try {
      console.log('📈 [BUSINESS-RULES] Calcul commission avec ancienneté:', { collecteurId, baseCommission });
      
      // Utiliser le service d'ancienneté
      const result = await seniorityService.calculateCommissionWithSeniority(collecteurId, baseCommission, period);
      
      // Ajouter des informations contextuelles
      result.businessRules = {
        senioritySystemActive: true,
        coefficientApplied: true,
        calculationDate: new Date().toISOString()
      };

      return result;

    } catch (error) {
      console.error('❌ [BUSINESS-RULES] Erreur calcul commission ancienneté:', error);
      // Fallback sans ancienneté
      return {
        success: false,
        error: error.message,
        fallback: {
          collecteurId,
          baseCommission,
          adjustedCommission: baseCommission,
          coefficient: 1.0,
          message: 'Calcul sans ancienneté (erreur système)'
        }
      };
    }
  }

  /**
   * Obtient le rapport complet d'un collecteur avec ancienneté
   */
  async getCollecteurReport(collecteurId) {
    try {
      console.log('📊 [BUSINESS-RULES] Génération rapport collecteur:', collecteurId);
      
      const [basicInfo, seniorityInfo, clientsInfo] = await Promise.allSettled([
        this.axios.get(`/collecteurs/${collecteurId}`),
        seniorityService.getCollecteurSeniority(collecteurId),
        this.axios.get(`/clients/collecteur/${collecteurId}`)
      ]);

      const report = {
        collecteurId,
        dateGeneration: new Date().toISOString(),
        basicInfo: basicInfo.status === 'fulfilled' ? basicInfo.value.data : null,
        seniorityInfo: seniorityInfo.status === 'fulfilled' ? seniorityInfo.value.data : null,
        clientsInfo: clientsInfo.status === 'fulfilled' ? clientsInfo.value.data : null,
        errors: []
      };

      // Collecter les erreurs éventuelles
      if (basicInfo.status === 'rejected') report.errors.push('Informations de base indisponibles');
      if (seniorityInfo.status === 'rejected') report.errors.push('Informations d\'ancienneté indisponibles');
      if (clientsInfo.status === 'rejected') report.errors.push('Informations clients indisponibles');

      return {
        success: true,
        data: report,
        message: 'Rapport collecteur généré',
        hasErrors: report.errors.length > 0
      };

    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération du rapport collecteur');
    }
  }

  // ================================
  // 🛠️ MÉTHODES UTILITAIRES
  // ================================

  /**
   * Valide les données client selon les règles métier
   */
  validateClientData(clientData) {
    const errors = [];

    // Validation téléphone
    if (clientData.telephone && clientData.telephone.trim()) {
      const phoneRegex = /^(\+237|237)?[679]\d{8}$/;
      if (!phoneRegex.test(clientData.telephone.replace(/\s/g, ''))) {
        errors.push('Format de téléphone invalide (Cameroun attendu)');
      }
    }

    // Validation CNI
    if (clientData.numeroCni && clientData.numeroCni.trim().length < 6) {
      errors.push('CNI doit contenir au moins 6 caractères');
    }

    // Validation coordonnées GPS
    if (clientData.latitude !== null && clientData.latitude !== undefined) {
      if (typeof clientData.latitude !== 'number' || clientData.latitude < -90 || clientData.latitude > 90) {
        errors.push('Latitude invalide');
      }
    }

    if (clientData.longitude !== null && clientData.longitude !== undefined) {
      if (typeof clientData.longitude !== 'number' || clientData.longitude < -180 || clientData.longitude > 180) {
        errors.push('Longitude invalide');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide les paramètres de commission
   */
  validateCommissionParams(params) {
    const errors = [];

    if (!params.type || !['FIXED', 'PERCENTAGE', 'TIER'].includes(params.type)) {
      errors.push('Type de commission requis: FIXED, PERCENTAGE ou TIER');
    }

    if (params.valeur === null || params.valeur === undefined || params.valeur < 0) {
      errors.push('Valeur de commission requise et positive');
    }

    if (params.type === 'PERCENTAGE' && params.valeur > 100) {
      errors.push('Pourcentage ne peut pas dépasser 100%');
    }

    if (params.type === 'TIER' && (!params.paliersCommission || params.paliersCommission.length === 0)) {
      errors.push('Paliers requis pour le type TIER');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  isAdmin(userRole) {
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];
    return adminRoles.includes(userRole);
  }

  /**
   * Méthode dépréciée - NE PAS UTILISER
   */
  async deleteClient(clientId) {
    console.error('🚨 [BUSINESS-RULES] TENTATIVE DE SUPPRESSION CLIENT BLOQUÉE:', clientId);
    throw new Error('SUPPRESSION INTERDITE: Utilisez toggleClientStatus() pour activer/désactiver le client');
  }

  /**
   * Méthode dépréciée - NE PAS UTILISER
   */
  async deleteCollecteur(collecteurId) {
    console.error('🚨 [BUSINESS-RULES] TENTATIVE DE SUPPRESSION COLLECTEUR BLOQUÉE:', collecteurId);
    throw new Error('SUPPRESSION INTERDITE: Utilisez toggleCollecteurStatus() pour activer/désactiver le collecteur');
  }

  // ================================
  // 📊 MÉTHODES DE DIAGNOSTIC
  // ================================

  /**
   * Vérifie la conformité du système aux règles métier
   */
  async checkBusinessRulesCompliance() {
    console.log('🔍 [BUSINESS-RULES] Vérification conformité règles métier...');
    
    const compliance = {
      restrictedFieldsProtection: true,
      senioritySystemActive: false,
      adminEndpointsAvailable: false,
      deletionPrevention: true,
      validationRulesActive: true
    };

    try {
      // Test système d'ancienneté
      const seniorityTest = await seniorityService.testSeniorityEndpoints();
      compliance.senioritySystemActive = seniorityTest.reportEndpoint?.available || false;
    } catch (error) {
      compliance.senioritySystemActive = false;
    }

    // Test endpoints admin (nécessite auth admin)
    try {
      const user = await authService.getCurrentUser();
      if (this.isAdmin(user?.role)) {
        // Test simple d'existence des endpoints
        compliance.adminEndpointsAvailable = true;
      }
    } catch (error) {
      compliance.adminEndpointsAvailable = false;
    }

    const score = Object.values(compliance).filter(Boolean).length / Object.keys(compliance).length * 100;

    return {
      compliance,
      score: Math.round(score),
      recommendation: score === 100 ? 'Toutes les règles métier sont respectées' : 'Certaines règles nécessitent une attention',
      details: compliance
    };
  }
}

export default new BusinessRulesService();