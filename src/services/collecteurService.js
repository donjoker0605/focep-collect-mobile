// src/services/collecteurService.js - VERSION CORRIGÉE ET COMPLÈTE
import BaseApiService from './base/BaseApiService';

class CollecteurService extends BaseApiService {
  constructor() {
    super();
  }

  // Méthode principale pour récupérer les collecteurs
  async getCollecteurs({ page = 0, size = 20, search = '' } = {}) {
    try {
      console.log('📱 API: GET /collecteurs');
      const params = { page, size };
      if (search?.trim()) params.search = search.trim();
      
      const response = await this.axios.get('/collecteurs', { params });
      return this.formatResponse(response, 'Collecteurs récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs');
    }
  }

  // Alias pour compatibilité avec le code existant
  async getAllCollecteurs(params = {}) {
    return this.getCollecteurs(params);
  }

  // Méthode de recherche
  async searchCollecteurs(searchQuery) {
    return this.getCollecteurs({ search: searchQuery });
  }

  async getCollecteurById(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}`);
      return this.formatResponse(response, 'Collecteur récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du collecteur');
    }
  }

  async createCollecteur(collecteurData) {
    try {
      console.log('📱 API: POST /collecteurs');
      console.log('🔑 Données envoyées:', {
        ...collecteurData,
        password: collecteurData.password ? '[FOURNI]' : '[MANQUANT]'
      });

      // 🔥 VALIDATION CRITIQUE: S'assurer que le mot de passe est présent
      if (!collecteurData.password || collecteurData.password.trim() === '') {
        throw new Error('Le mot de passe est obligatoire pour créer un collecteur');
      }

      // Ne pas envoyer l'agenceId depuis le frontend - elle sera assignée automatiquement côté backend
      const { agenceId, ...dataToSend } = collecteurData;
      
      const response = await this.axios.post('/collecteurs', dataToSend);
      return this.formatResponse(response, 'Collecteur créé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la création du collecteur');
    }
  }

  async updateCollecteur(collecteurId, collecteurData) {
    try {
      console.log('📱 API: PUT /collecteurs/', collecteurId);
      console.log('🔑 Données mise à jour:', {
        ...collecteurData,
        newPassword: collecteurData.newPassword ? '[FOURNI]' : '[AUCUN]'
      });

      // Ne pas permettre la modification de l'agenceId
      const { agenceId, ...dataToSend } = collecteurData;
      
      const response = await this.axios.put(`/collecteurs/${collecteurId}`, dataToSend);
      return this.formatResponse(response, 'Collecteur mis à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour');
    }
  }

  // 🔥 NOUVELLE MÉTHODE: Réinitialisation de mot de passe par l'admin
  async resetPassword(collecteurId, passwordData) {
    try {
      console.log('🔑 API: POST /collecteurs/reset-password/', collecteurId);
      
      // Validation des données
      if (!passwordData.newPassword || passwordData.newPassword.trim() === '') {
        throw new Error('Le nouveau mot de passe est obligatoire');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('Le mot de passe doit avoir au moins 6 caractères');
      }

      const response = await this.axios.post(`/collecteurs/${collecteurId}/reset-password`, {
        newPassword: passwordData.newPassword,
        reason: passwordData.reason || 'Réinitialisation par admin'
      });

      return this.formatResponse(response, 'Mot de passe réinitialisé avec succès');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la réinitialisation du mot de passe');
    }
  }

  async toggleStatus(collecteurId, newStatus) {
    try {
      console.log('📱 API: PATCH /collecteurs/toggle-status/', collecteurId);
      const response = await this.axios.patch(`/collecteurs/${collecteurId}/toggle-status`, {
        active: newStatus
      });
      return this.formatResponse(response, 'Statut modifié');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors du changement de statut');
    }
  }

  async getCollecteurStatistics(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/statistics/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}/statistics`);
      return this.formatResponse(response, 'Statistiques récupérées');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }

  async getCollecteurDashboard(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/dashboard/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}/dashboard`);
      return this.formatResponse(response, 'Dashboard récupéré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération du dashboard');
    }
  }

  /**
   * Récupérer les soldes des comptes du collecteur
   */
  async getCollecteurAccountBalances(collecteurId) {
    try {
      console.log('📱 API: GET /collecteurs/account-balances/', collecteurId);
      const response = await this.axios.get(`/collecteurs/${collecteurId}/account-balances`);
      return this.formatResponse(response, 'Soldes des comptes récupérés');
    } catch (error) {
      // Fallback vers méthodes individuelles si endpoint unifié pas disponible
      if (error.response?.status === 404) {
        console.warn('⚠️ Fallback vers récupération manuelle des soldes');
        return await this.getCollecteurAccountBalancesFallback(collecteurId);
      }
      throw this.handleError(error, 'Erreur lors de la récupération des soldes');
    }
  }

  /**
   * Fallback - Récupérer les soldes individuellement
   */
  async getCollecteurAccountBalancesFallback(collecteurId) {
    try {
      console.log('🔄 Fallback récupération soldes collecteur:', collecteurId);
      
      const [salaireBalance, manquantBalance] = await Promise.allSettled([
        this.getCompteSalaireBalance(collecteurId),
        this.getCompteManquantBalance(collecteurId)
      ]);

      const balances = {
        soldeSalaire: salaireBalance.status === 'fulfilled' ? salaireBalance.value?.data || 0 : 0,
        soldeManquant: manquantBalance.status === 'fulfilled' ? manquantBalance.value?.data || 0 : 0,
        hasError: salaireBalance.status === 'rejected' || manquantBalance.status === 'rejected'
      };

      return this.formatResponse({ data: balances }, 'Soldes récupérés (fallback)');
    } catch (error) {
      console.error('❌ Erreur fallback soldes:', error);
      return this.formatResponse({ 
        data: { soldeSalaire: 0, soldeManquant: 0, hasError: true } 
      }, 'Soldes par défaut');
    }
  }

  /**
   * Récupérer le solde du compte salaire
   */
  async getCompteSalaireBalance(collecteurId) {
    try {
      console.log('💰 API: GET compte salaire balance pour collecteur:', collecteurId);
      const response = await this.axios.get(`/comptes/collecteur/${collecteurId}/salaire/solde`);
      return this.formatResponse(response, 'Solde compte salaire récupéré');
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer le solde compte salaire:', error.message);
      return this.formatResponse({ data: 0 }, 'Solde par défaut');
    }
  }

  /**
   * Récupérer le solde du compte manquant
   */
  async getCompteManquantBalance(collecteurId) {
    try {
      console.log('💰 API: GET compte manquant balance pour collecteur:', collecteurId);
      const response = await this.axios.get(`/comptes/collecteur/${collecteurId}/manquant/solde`);
      return this.formatResponse(response, 'Solde compte manquant récupéré');
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer le solde compte manquant:', error.message);
      return this.formatResponse({ data: 0 }, 'Solde par défaut');
    }
  }

  // Méthode pour récupérer les collecteurs d'une agence
  async getCollecteursByAgence(agenceId, params = {}) {
    try {
      console.log('📱 API: GET /agences/collecteurs/', agenceId);
      const response = await this.axios.get(`/agences/${agenceId}/collecteurs`, { params });
      return this.formatResponse(response, 'Collecteurs de l\'agence récupérés');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération des collecteurs de l\'agence');
    }
  }

  // 🔥 NOUVELLES MÉTHODES UTILITAIRES

  /**
   * Génère un mot de passe temporaire sécurisé
   */
  generateSecurePassword(length = 8) {
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%&*';
    
    const allChars = upperCase + lowerCase + numbers + special;
    
    let password = '';
    // Assurer au moins un caractère de chaque type
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Compléter avec des caractères aléatoires
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Valide un mot de passe selon les critères de sécurité
   */
  validatePassword(password) {
    const errors = [];
    
    if (!password || password.length < 6) {
      errors.push('Le mot de passe doit avoir au moins 6 caractères');
    }
    
    if (password && password.length > 128) {
      errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
    }
    
    if (password && !/[a-zA-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Propose un mot de passe sécurisé à l'utilisateur
   */
  suggestSecurePassword() {
    const suggestions = [
      this.generateSecurePassword(8),
      this.generateSecurePassword(10),
      this.generateSecurePassword(12)
    ];
    
    return suggestions;
  }

  // 🔥 MÉTHODES DE DIAGNOSTIC ET TEST

  /**
   * Test de création d'un collecteur avec toutes les validations
   */
  async testCollecteurCreation(testData = null) {
    const defaultTestData = {
      nom: 'Test',
      prenom: 'Collecteur',
      adresseMail: `test.collecteur.${Date.now()}@collectfocep.com`,
      telephone: '600000000',
      numeroCni: '1234567890123',
      password: this.generateSecurePassword(),
      montantMaxRetrait: 100000,
      active: true
    };

    const dataToTest = testData || defaultTestData;
    
    console.log('🧪 Test création collecteur avec données:', {
      ...dataToTest,
      password: '[GÉNÉRÉ AUTOMATIQUEMENT]'
    });

    try {
      const result = await this.createCollecteur(dataToTest);
      console.log('✅ Test création réussi:', result);
      return result;
    } catch (error) {
      console.error('❌ Test création échoué:', error);
      throw error;
    }
  }

  /**
   * Test de réinitialisation de mot de passe
   */
  async testPasswordReset(collecteurId) {
    const newPassword = this.generateSecurePassword();
    
    console.log('🧪 Test réinitialisation mot de passe pour collecteur:', collecteurId);
    
    try {
      const result = await this.resetPassword(collecteurId, {
        newPassword,
        reason: 'Test automatique'
      });
      
      console.log('✅ Test réinitialisation réussi. Nouveau mot de passe:', newPassword);
      return { ...result, newPassword };
    } catch (error) {
      console.error('❌ Test réinitialisation échoué:', error);
      throw error;
    }
  }

  /**
   * Diagnostic complet du service collecteur
   */
  async diagnoseService() {
    console.log('🔍 Diagnostic du service collecteur...');
    
    const diagnostics = {
      connectivity: false,
      authentication: false,
      permissions: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Test de connectivité
      const connectivityTest = await this.axios.get('/collecteurs', { 
        params: { page: 0, size: 1 } 
      });
      diagnostics.connectivity = connectivityTest.status === 200;
      console.log('✅ Connectivité API OK');

      if (diagnostics.connectivity) {
        // Test des permissions
        try {
          const permissionTest = await this.axios.get('/collecteurs/1');
          diagnostics.permissions = true;
          console.log('✅ Permissions OK');
        } catch (permError) {
          if (permError.response?.status === 403) {
            diagnostics.permissions = false;
            console.log('❌ Permissions insuffisantes');
          } else if (permError.response?.status === 404) {
            diagnostics.permissions = true; // 404 signifie que l'API fonctionne
            console.log('✅ Permissions OK (collecteur inexistant)');
          }
        }
      }

    } catch (error) {
      console.error('❌ Diagnostic échoué:', error);
      diagnostics.error = error.message;
    }

    console.log('📊 Résultats diagnostic:', diagnostics);
    return diagnostics;
  }
}

export default new CollecteurService();