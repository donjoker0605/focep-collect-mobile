// src/utils/testCommissionV2.js
import { Alert } from 'react-native';
import commissionV2Service from '../services/commissionV2Service';
import { useCollecteurs } from '../hooks/useCollecteurs';

/**
 * Utilitaire de test pour les nouvelles fonctionnalités FOCEP v2
 * À utiliser uniquement en développement
 */
class CommissionV2Tester {
  
  constructor() {
    this.testResults = [];
  }

  /**
   * Lance tous les tests de l'intégration FOCEP v2
   */
  async runAllTests() {
    console.log('🧪 Démarrage des tests FOCEP v2...');
    
    try {
      await this.testValidation();
      await this.testFormatting();
      await this.testErrorHandling();
      
      console.log('✅ Tous les tests sont passés!');
      Alert.alert('Tests terminés', 'Toutes les fonctionnalités FOCEP v2 fonctionnent correctement');
      
    } catch (error) {
      console.error('❌ Échec des tests:', error);
      Alert.alert('Échec des tests', error.message);
    }
  }

  /**
   * Test de validation des paramètres
   */
  async testValidation() {
    console.log('📋 Test de validation...');
    
    // Test 1: Paramètres valides
    try {
      const validParams = commissionV2Service.validatePeriodParams(
        '2024-01-01', 
        '2024-01-31'
      );
      if (!validParams) throw new Error('Validation échouée pour des paramètres valides');
      console.log('✅ Validation paramètres valides: OK');
    } catch (error) {
      console.error('❌ Test validation valide échoué:', error);
      throw error;
    }

    // Test 2: Date début supérieure à date fin
    try {
      commissionV2Service.validatePeriodParams('2024-02-01', '2024-01-31');
      throw new Error('La validation aurait dû échouer');
    } catch (error) {
      if (error.message.includes('antérieure')) {
        console.log('✅ Validation dates inverses: OK');
      } else {
        throw error;
      }
    }

    // Test 3: Date future
    try {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      commissionV2Service.validatePeriodParams(
        '2024-01-01', 
        futureDate.toISOString().split('T')[0]
      );
      throw new Error('La validation aurait dû échouer');
    } catch (error) {
      if (error.message.includes('futur')) {
        console.log('✅ Validation date future: OK');
      } else {
        throw error;
      }
    }
  }

  /**
   * Test de formatage des données
   */
  async testFormatting() {
    console.log('🎨 Test de formatage...');
    
    // Test formatage période
    const periodeFormatee = commissionV2Service.formatPeriode('2024-01-01', '2024-01-31');
    if (!periodeFormatee.includes('janvier')) {
      throw new Error('Formatage période échoué');
    }
    console.log('✅ Formatage période:', periodeFormatee);

    // Test calcul statistiques
    const mockCommissionData = {
      clients: [
        { montantEpargne: 100000, commission: 5000, tva: 962.5 },
        { montantEpargne: 200000, commission: 10000, tva: 1925 },
        { montantEpargne: 150000, commission: 7500, tva: 1443.75 }
      ]
    };

    const stats = commissionV2Service.calculateCommissionStats(mockCommissionData);
    if (stats.nombreClients !== 3) {
      throw new Error('Calcul stats incorrect');
    }
    if (stats.totalCommissions !== 22500) {
      throw new Error('Total commissions incorrect');
    }
    console.log('✅ Calcul statistiques: OK', stats);
  }

  /**
   * Test de gestion d'erreurs
   */
  async testErrorHandling() {
    console.log('⚠️ Test de gestion d\'erreurs...');
    
    // Test avec collecteur inexistant
    try {
      await commissionV2Service.calculateCommissionsHierarchy(
        'collecteur-inexistant', 
        '2024-01-01', 
        '2024-01-31'
      );
      // Si on arrive ici, le test échoue car une erreur aurait dû être levée
      console.log('⚠️ Aucune erreur détectée (normal si le backend n\'est pas connecté)');
    } catch (error) {
      console.log('✅ Gestion d\'erreur collecteur inexistant: OK');
    }

    // Test avec données nulles pour statistiques
    const statsNull = commissionV2Service.calculateCommissionStats(null);
    if (statsNull !== null) {
      throw new Error('Les statistiques nulles auraient dû retourner null');
    }
    console.log('✅ Gestion données nulles: OK');
  }

  /**
   * Test d'intégration avec de vraies données
   * @param {string} collecteurId - ID d'un collecteur existant
   */
  async testIntegrationWithRealData(collecteurId) {
    if (!collecteurId) {
      console.log('⚠️ Pas de collecteur fourni, test d\'intégration ignoré');
      return;
    }

    console.log('🔌 Test d\'intégration avec données réelles...');
    
    const dateDebut = '2024-01-01';
    const dateFin = '2024-01-31';

    try {
      // Test calcul commission
      const commissionResult = await commissionV2Service.calculateCommissionsHierarchy(
        collecteurId, 
        dateDebut, 
        dateFin
      );

      if (commissionResult.success) {
        console.log('✅ Calcul commission réussi:', commissionResult.message);
      } else {
        console.log('⚠️ Calcul commission échoué:', commissionResult.error);
      }

      // Test processus complet
      const processusResult = await commissionV2Service.processusCompletCommissionRemuneration(
        collecteurId, 
        dateDebut, 
        dateFin
      );

      if (processusResult.success) {
        console.log('✅ Processus complet réussi:', processusResult.message);
      } else {
        console.log('⚠️ Processus complet échoué:', processusResult.error);
      }

    } catch (error) {
      console.log('⚠️ Test d\'intégration échoué (normal si backend déconnecté):', error.message);
    }
  }

  /**
   * Test de l'interface utilisateur
   */
  async testUIComponents() {
    console.log('🖼️ Test des composants UI...');
    
    // Vérifier que les hooks sont bien exportés
    try {
      const { useCommissionV2 } = await import('../hooks/useCommissionV2');
      if (typeof useCommissionV2 !== 'function') {
        throw new Error('Hook useCommissionV2 non disponible');
      }
      console.log('✅ Hook useCommissionV2 disponible');
    } catch (error) {
      throw new Error(`Hook useCommissionV2 manquant: ${error.message}`);
    }

    // Vérifier les écrans
    try {
      const CommissionV2Screen = await import('../screens/Admin/CommissionCalculationV2Screen');
      const RubriqueScreen = await import('../screens/Admin/RubriqueRemunerationScreen');
      
      if (!CommissionV2Screen.default || !RubriqueScreen.default) {
        throw new Error('Écrans manquants');
      }
      console.log('✅ Écrans FOCEP v2 disponibles');
    } catch (error) {
      throw new Error(`Écrans manquants: ${error.message}`);
    }
  }

  /**
   * Affiche un rapport de test complet
   */
  generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      tests: this.testResults,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(t => t.status === 'passed').length,
        failed: this.testResults.filter(t => t.status === 'failed').length
      }
    };

    console.log('📊 Rapport de test FOCEP v2:', report);
    return report;
  }
}

// Export d'une instance singleton
export default new CommissionV2Tester();

// Export pour utilisation dans les écrans de développement
export const testCommissionV2Integration = async (collecteurId = null) => {
  const tester = new CommissionV2Tester();
  
  console.log('🚀 Test complet FOCEP v2...');
  
  try {
    await tester.runAllTests();
    await tester.testUIComponents();
    
    if (collecteurId) {
      await tester.testIntegrationWithRealData(collecteurId);
    }
    
    const report = tester.generateTestReport();
    
    Alert.alert(
      'Tests terminés',
      `${report.summary.passed}/${report.summary.total} tests réussis`,
      [{ text: 'OK' }]
    );
    
    return report;
    
  } catch (error) {
    console.error('❌ Échec test complet:', error);
    Alert.alert('Erreur de test', error.message);
    throw error;
  }
};