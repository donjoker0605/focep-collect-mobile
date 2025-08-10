// src/services/seniorityService.js - SERVICE D'ANCIENNETÉ COLLECTEURS
import BaseApiService from './base/BaseApiService';

/**
 * Service pour la gestion de l'ancienneté des collecteurs
 * 🎯 INTÉGRATION RÈGLES MÉTIER: Système d'ancienneté automatique
 */
class SeniorityService extends BaseApiService {
  constructor() {
    super();
    this.cache = new Map();
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  }

  // ================================
  // 📈 MÉTHODES PRINCIPALES ANCIENNETÉ
  // ================================

  /**
   * Récupère les informations d'ancienneté d'un collecteur
   */
  async getCollecteurSeniority(collecteurId) {
    try {
      console.log(`📈 API: GET /collecteurs/${collecteurId}/seniority`);
      
      // Vérifier le cache d'abord
      const cacheKey = `seniority-${collecteurId}`;
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('📈 Ancienneté récupérée depuis cache');
        return cached;
      }

      const response = await this.axios.get(`/collecteurs/${collecteurId}/seniority`);
      const result = this.formatResponse(response, 'Ancienneté récupérée');
      
      // Mettre en cache
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la récupération de l\'ancienneté');
    }
  }

  /**
   * Met à jour l'ancienneté de tous les collecteurs (Admin uniquement)
   */
  async updateAllCollecteursSeniority() {
    try {
      console.log('🔄 API: POST /collecteurs/update-all-seniority');
      const response = await this.axios.post('/collecteurs/update-all-seniority');
      
      // Vider le cache après mise à jour
      this.invalidateCache('seniority');
      
      return this.formatResponse(response, 'Ancienneté mise à jour');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la mise à jour de l\'ancienneté');
    }
  }

  /**
   * Récupère le rapport d'ancienneté complet (Admin uniquement)
   */
  async getSeniorityReport() {
    try {
      console.log('📊 API: GET /collecteurs/seniority-report');
      const response = await this.axios.get('/collecteurs/seniority-report');
      return this.formatResponse(response, 'Rapport d\'ancienneté généré');
    } catch (error) {
      throw this.handleError(error, 'Erreur lors de la génération du rapport');
    }
  }

  // ================================
  // 💰 CALCULS DE COMMISSION AVEC ANCIENNETÉ
  // ================================

  /**
   * Calcule la commission d'un collecteur en tenant compte de son ancienneté
   */
  async calculateCommissionWithSeniority(collecteurId, baseCommission, period = 'MENSUELLE') {
    try {
      console.log('💰 Calcul commission avec ancienneté:', { collecteurId, baseCommission, period });
      
      // Récupérer les données d'ancienneté
      const seniorityData = await this.getCollecteurSeniority(collecteurId);
      
      if (!seniorityData.success) {
        throw new Error('Impossible de récupérer les données d\'ancienneté');
      }

      const seniority = seniorityData.data;
      const coefficient = seniority.coefficientAnciennete || 1.0;
      const adjustedCommission = baseCommission * coefficient;
      
      const result = {
        collecteurId,
        baseCommission,
        seniorityLevel: seniority.niveauAnciennete,
        coefficient,
        adjustedCommission,
        bonus: adjustedCommission - baseCommission,
        period,
        calculatedAt: new Date().toISOString(),
        seniorityInfo: {
          ancienneteEnMois: seniority.ancienneteEnMois,
          ancienneteSummary: seniority.ancienneteSummary,
          isNouveauCollecteur: seniority.isNouveauCollecteur,
          eligibleForPromotion: seniority.eligibleForPromotion
        }
      };
      
      console.log('✅ Commission calculée avec ancienneté:', result);
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ Erreur calcul commission avec ancienneté:', error);
      throw this.handleError(error, 'Erreur lors du calcul de commission avec ancienneté');
    }
  }

  // ================================
  // 🏆 MÉTHODES UTILITAIRES ANCIENNETÉ
  // ================================

  /**
   * Formate les niveaux d'ancienneté pour l'affichage
   */
  getSeniorityDisplayInfo(niveau) {
    const levels = {
      'NOUVEAU': {
        label: 'Nouveau',
        color: '#3B82F6', // Bleu
        icon: 'person-add',
        description: 'Moins d\'1 mois d\'expérience',
        coefficient: '1.0x'
      },
      'JUNIOR': {
        label: 'Junior',
        color: '#10B981', // Vert clair
        icon: 'school',
        description: '1-3 mois d\'expérience',
        coefficient: '1.05x (+5%)'
      },
      'CONFIRMÉ': {
        label: 'Confirmé',
        color: '#F59E0B', // Orange
        icon: 'checkmark-circle',
        description: '3-12 mois d\'expérience',
        coefficient: '1.10x (+10%)'
      },
      'SENIOR': {
        label: 'Senior',
        color: '#8B5CF6', // Violet
        icon: 'ribbon',
        description: '1-2 ans d\'expérience',
        coefficient: '1.15x (+15%)'
      },
      'EXPERT': {
        label: 'Expert',
        color: '#F43F5E', // Rouge/Rose
        icon: 'star',
        description: 'Plus de 2 ans d\'expérience',
        coefficient: '1.20x (+20%)'
      }
    };
    
    return levels[niveau] || levels['NOUVEAU'];
  }

  /**
   * Valide si un collecteur est éligible pour une promotion
   */
  checkPromotionEligibility(seniorityData) {
    return {
      isEligible: seniorityData.eligibleForPromotion || false,
      currentLevel: seniorityData.niveauAnciennete,
      nextLevel: this.getNextLevel(seniorityData.niveauAnciennete),
      monthsToNextLevel: this.getMonthsToNextLevel(seniorityData.ancienneteEnMois),
      benefits: this.getPromotionBenefits(seniorityData.niveauAnciennete)
    };
  }

  /**
   * Détermine le niveau suivant
   */
  getNextLevel(currentLevel) {
    const progression = {
      'NOUVEAU': 'JUNIOR',
      'JUNIOR': 'CONFIRMÉ',
      'CONFIRMÉ': 'SENIOR',
      'SENIOR': 'EXPERT',
      'EXPERT': null // Niveau maximum
    };
    return progression[currentLevel];
  }

  /**
   * Calcule les mois jusqu'au niveau suivant
   */
  getMonthsToNextLevel(currentMonths) {
    if (currentMonths < 1) return 1 - currentMonths;
    if (currentMonths < 3) return 3 - currentMonths;
    if (currentMonths < 12) return 12 - currentMonths;
    if (currentMonths < 24) return 24 - currentMonths;
    return 0; // Niveau maximum atteint
  }

  /**
   * Décrit les avantages d'une promotion
   */
  getPromotionBenefits(currentLevel) {
    const nextLevel = this.getNextLevel(currentLevel);
    if (!nextLevel) return null;
    
    const nextInfo = this.getSeniorityDisplayInfo(nextLevel);
    return {
      newCoefficient: nextInfo.coefficient,
      description: nextInfo.description,
      estimatedBonus: 'Augmentation des commissions selon le nouveau coefficient'
    };
  }

  // ================================
  // 📊 MÉTHODES DE RAPPORT ET ANALYSE
  // ================================

  /**
   * Analyse les données d'ancienneté pour les graphiques
   */
  analyzeSeniorityData(seniorityReport) {
    if (!seniorityReport.success || !seniorityReport.data) {
      return null;
    }

    const data = seniorityReport.data;
    const distribution = data.distributionParNiveau || {};
    
    return {
      totalCollecteurs: data.totalCollecteurs,
      moyenneAnciennete: data.moyenneAncienneteMois,
      distribution: {
        labels: Object.keys(distribution),
        values: Object.values(distribution),
        colors: Object.keys(distribution).map(niveau => 
          this.getSeniorityDisplayInfo(niveau).color
        )
      },
      topCollecteurs: data.top5PlusAnciens || [],
      insights: this.generateInsights(data)
    };
  }

  /**
   * Génère des insights sur les données d'ancienneté
   */
  generateInsights(data) {
    const insights = [];
    const distribution = data.distributionParNiveau || {};
    const total = data.totalCollecteurs || 0;
    
    // Analyse de la distribution
    const nouveaux = distribution.NOUVEAU || 0;
    const experts = distribution.EXPERT || 0;
    
    if (nouveaux > total * 0.3) {
      insights.push({
        type: 'warning',
        title: 'Beaucoup de nouveaux collecteurs',
        message: `${((nouveaux / total) * 100).toFixed(1)}% des collecteurs sont nouveaux`
      });
    }
    
    if (experts > total * 0.2) {
      insights.push({
        type: 'success',
        title: 'Équipe expérimentée',
        message: `${((experts / total) * 100).toFixed(1)}% des collecteurs sont experts`
      });
    }
    
    // Analyse de la moyenne
    const moyenne = data.moyenneAncienneteMois || 0;
    if (moyenne > 12) {
      insights.push({
        type: 'info',
        title: 'Ancienneté élevée',
        message: `Ancienneté moyenne: ${moyenne.toFixed(1)} mois`
      });
    }
    
    return insights;
  }

  // ================================
  // 🗄️ GESTION DU CACHE
  // ================================

  getCacheKey(prefix, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}-${paramStr}`;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = (Date.now() - cached.timestamp) > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  invalidateCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // ================================
  // 🧪 MÉTHODES DE TEST
  // ================================

  /**
   * Teste la connectivité des endpoints d'ancienneté
   */
  async testSeniorityEndpoints() {
    const results = {};
    
    try {
      // Test rapport général
      const reportResponse = await this.axios.get('/collecteurs/seniority-report');
      results.reportEndpoint = {
        status: reportResponse.status,
        available: true
      };
    } catch (error) {
      results.reportEndpoint = {
        status: error.response?.status || 'ERROR',
        available: false,
        error: error.message
      };
    }
    
    console.log('🧪 Tests endpoints ancienneté:', results);
    return results;
  }
}

export default new SeniorityService();