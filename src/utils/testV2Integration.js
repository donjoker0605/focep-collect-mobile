// src/utils/testV2Integration.js
import adminCommissionService from '../services/adminCommissionService';
import { formatters } from './formatters';

/**
 * Test de l'intégration V2 complète
 */
export const testV2Integration = {
  /**
   * Test rapide des API V2
   */
  async quickTest(collecteurId = 4) {
    console.log('🚀 Début des tests V2...');
    
    const dateDebut = '2024-01-01';
    const dateFin = '2024-12-31';
    
    try {
      // Test 1: Calcul commission V2
      console.log('📊 Test calcul commission V2...');
      const commission = await adminCommissionService.calculateCommissionsV2(
        collecteurId, dateDebut, dateFin
      );
      console.log('✅ Commission V2:', commission.success ? 'OK' : 'FAILED');
      
      // Test 2: Processus complet V2
      console.log('⚡ Test processus complet V2...');
      const processus = await adminCommissionService.processComplet(
        collecteurId, dateDebut, dateFin
      );
      console.log('✅ Processus complet V2:', processus.success ? 'OK' : 'FAILED');
      
      // Test 3: Rubriques V2
      console.log('📋 Test rubriques V2...');
      const rubriques = await adminCommissionService.getRubriquesByCollecteur(collecteurId);
      console.log('✅ Rubriques V2:', rubriques.success ? 'OK' : 'FAILED');
      
      // Test 4: Toutes rubriques V2
      console.log('📄 Test toutes rubriques V2...');
      const allRubriques = await adminCommissionService.getAllRubriques();
      console.log('✅ Toutes rubriques V2:', allRubriques.success ? 'OK' : 'FAILED');
      
      console.log('🎉 Tests V2 terminés!');
      return {
        success: true,
        results: {
          commission: commission.success,
          processus: processus.success,
          rubriques: rubriques.success,
          allRubriques: allRubriques.success
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur tests V2:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Test détaillé avec logs
   */
  async detailedTest(collecteurId = 4) {
    console.log('🔍 Tests détaillés V2...');
    
    const results = [];
    const dateDebut = '2024-08-01';
    const dateFin = '2024-08-31';
    
    // Test chaque API individuellement
    const tests = [
      {
        name: 'Calcul Commission V2',
        fn: () => adminCommissionService.calculateCommissionsV2(collecteurId, dateDebut, dateFin)
      },
      {
        name: 'Processus Complet V2',
        fn: () => adminCommissionService.processComplet(collecteurId, dateDebut, dateFin)
      },
      {
        name: 'Génération Rapport Commission V2',
        fn: () => adminCommissionService.generateCommissionReport(collecteurId, dateDebut, dateFin)
      },
      {
        name: 'Génération Rapport Rémunération V2',
        fn: () => adminCommissionService.generateRemunerationReport(collecteurId, dateDebut, dateFin)
      },
      {
        name: 'Rubriques Collecteur V2',
        fn: () => adminCommissionService.getRubriquesByCollecteur(collecteurId)
      },
      {
        name: 'Toutes Rubriques V2',
        fn: () => adminCommissionService.getAllRubriques()
      },
      {
        name: 'Statut Commissions V2',
        fn: () => adminCommissionService.getStatutCommissions(collecteurId)
      }
    ];
    
    for (const test of tests) {
      console.log(`⏳ ${test.name}...`);
      try {
        const startTime = Date.now();
        const result = await test.fn();
        const duration = Date.now() - startTime;
        
        results.push({
          name: test.name,
          success: result.success,
          duration,
          message: result.message,
          dataSize: result.data ? JSON.stringify(result.data).length : 0
        });
        
        console.log(`✅ ${test.name}: ${result.success ? 'OK' : 'FAILED'} (${duration}ms)`);
        
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          error: error.message
        });
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    // Résumé
    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Résumé: ${successCount}/${results.length} tests réussis`);
    
    return {
      success: successCount === results.length,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: results.length - successCount
      }
    };
  },

  /**
   * Test de création d'une rubrique V2
   */
  async testCreateRubrique(collecteurId = 4) {
    console.log('➕ Test création rubrique V2...');
    
    const rubriqueTest = {
      nom: `Test Rubrique V2 ${Date.now()}`,
      type: 'PERCENTAGE',
      valeur: 2.5,
      dateApplication: new Date().toISOString().split('T')[0],
      delaiJours: 30,
      collecteurIds: [collecteurId],
      active: true
    };
    
    try {
      const result = await adminCommissionService.createRubrique(rubriqueTest);
      console.log('✅ Création rubrique V2:', result.success ? 'OK' : 'FAILED');
      
      if (result.success) {
        console.log('📝 Rubrique créée:', result.data?.nom);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur création rubrique:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Test de performance V2
   */
  async performanceTest(collecteurId = 4, iterations = 3) {
    console.log(`⚡ Test de performance V2 (${iterations} itérations)...`);
    
    const tests = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        await adminCommissionService.calculateCommissionsV2(
          collecteurId, 
          '2024-08-01', 
          '2024-08-31'
        );
        
        const duration = Date.now() - startTime;
        tests.push({ success: true, duration });
        console.log(`✅ Itération ${i + 1}: ${duration}ms`);
        
      } catch (error) {
        tests.push({ success: false, duration: Date.now() - startTime });
        console.error(`❌ Itération ${i + 1}: ${error.message}`);
      }
    }
    
    const successfulTests = tests.filter(t => t.success);
    const avgDuration = successfulTests.length > 0 
      ? successfulTests.reduce((sum, t) => sum + t.duration, 0) / successfulTests.length 
      : 0;
    
    console.log(`📊 Performance moyenne: ${avgDuration.toFixed(0)}ms`);
    
    return {
      iterations,
      successful: successfulTests.length,
      averageDuration: avgDuration,
      tests
    };
  }
};

export default testV2Integration;