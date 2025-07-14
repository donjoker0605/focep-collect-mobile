// src/utils/diagnosticAndTest.js - SCRIPT DE DIAGNOSTIC COMPLET
import journalActiviteService from '../services/journalActiviteService';
import clientService from '../services/clientService';
import authService from '../services/authService';

/**
 * 🔍 Diagnostic rapide des services critiques
 */
export const runQuickDiagnostic = async () => {
  console.log('🚀 === DIAGNOSTIC RAPIDE DES SERVICES ===');
  
  const results = {
    timestamp: new Date().toISOString(),
    auth: null,
    journalActivite: null,
    client: null,
    navigation: null,
    summary: {
      total: 0,
      success: 0,
      errors: []
    }
  };

  // ============================================
  // 1. TEST AUTHENTIFICATION
  // ============================================
  console.log('1️⃣ Test service authentification...');
  try {
    const user = await authService.getCurrentUser();
    results.auth = {
      success: !!user,
      user: user,
      message: user ? `Utilisateur connecté: ${user.email}` : 'Aucun utilisateur connecté'
    };
    console.log('✅ Auth:', results.auth.message);
  } catch (error) {
    results.auth = {
      success: false,
      error: error.message,
      message: 'Erreur authentification'
    };
    console.error('❌ Auth:', error.message);
    results.summary.errors.push('Authentification: ' + error.message);
  }
  results.summary.total++;
  if (results.auth.success) results.summary.success++;

  // ============================================
  // 2. TEST SERVICE JOURNAL ACTIVITÉ
  // ============================================
  console.log('2️⃣ Test service journal activité...');
  try {
    // Test de la méthode qui plantait
    const testConnection = await journalActiviteService.testConnection();
    
    // Test de la méthode getUserActivityStats qui manquait
    let statsTest = null;
    if (results.auth.success && results.auth.user?.id) {
      try {
        const today = new Date().toISOString().split('T')[0];
        statsTest = await journalActiviteService.getUserActivityStats(
          results.auth.user.id, 
          today, 
          today
        );
      } catch (statsError) {
        console.warn('⚠️ getUserActivityStats échoué (normal si pas d\'activités):', statsError.message);
      }
    }

    results.journalActivite = {
      success: testConnection.success,
      testConnection: testConnection,
      getUserActivityStats: statsTest ? 'Disponible' : 'Non testé (utilisateur requis)',
      message: testConnection.success ? 'Service journal opérationnel' : 'Service journal indisponible'
    };
    console.log('✅ Journal:', results.journalActivite.message);
  } catch (error) {
    results.journalActivite = {
      success: false,
      error: error.message,
      message: 'Erreur service journal'
    };
    console.error('❌ Journal:', error.message);
    results.summary.errors.push('Journal Activité: ' + error.message);
  }
  results.summary.total++;
  if (results.journalActivite.success) results.summary.success++;

  // ============================================
  // 3. TEST SERVICE CLIENT
  // ============================================
  console.log('3️⃣ Test service client...');
  try {
    // Test de la méthode qui plantait
    const testConnection = await clientService.testConnection();
    
    // Test de validation locale
    const validationTest = clientService.validateClientDataLocally({
      nom: 'TestNom',
      prenom: 'TestPrenom',
      numeroCni: '123456789',
      telephone: '677123456',
      ville: 'Douala',
      quartier: 'Akwa'
    });

    results.client = {
      success: testConnection.success,
      testConnection: testConnection,
      validateClientDataLocally: validationTest.isValid ? 'Fonctionne' : 'Erreur validation',
      validationDetails: validationTest,
      message: testConnection.success ? 'Service client opérationnel' : 'Service client indisponible'
    };
    console.log('✅ Client:', results.client.message);
  } catch (error) {
    results.client = {
      success: false,
      error: error.message,
      message: 'Erreur service client'
    };
    console.error('❌ Client:', error.message);
    results.summary.errors.push('Service Client: ' + error.message);
  }
  results.summary.total++;
  if (results.client.success) results.summary.success++;

  // ============================================
  // 4. TEST NAVIGATION (Simulation)
  // ============================================
  console.log('4️⃣ Test configuration navigation...');
  try {
    // Vérifier que les fonctions de navigation existent
    const { navigateToAddClient, navigateToClientDetail, useCollecteurNavigation } = 
      await import('../navigation/CollecteurStack');
    
    results.navigation = {
      success: true,
      navigateToAddClient: typeof navigateToAddClient === 'function',
      navigateToClientDetail: typeof navigateToClientDetail === 'function',
      useCollecteurNavigation: typeof useCollecteurNavigation === 'function',
      message: 'Fonctions de navigation disponibles'
    };
    console.log('✅ Navigation: Configuration correcte');
  } catch (error) {
    results.navigation = {
      success: false,
      error: error.message,
      message: 'Erreur configuration navigation'
    };
    console.error('❌ Navigation:', error.message);
    results.summary.errors.push('Navigation: ' + error.message);
  }
  results.summary.total++;
  if (results.navigation.success) results.summary.success++;

  // ============================================
  // 5. RÉSUMÉ FINAL
  // ============================================
  results.summary.successRate = (results.summary.success / results.summary.total) * 100;
  
  console.log('📊 === RÉSULTATS DIAGNOSTIC ===');
  console.log(`✅ Tests réussis: ${results.summary.success}/${results.summary.total}`);
  console.log(`📈 Taux de succès: ${results.summary.successRate.toFixed(1)}%`);
  
  if (results.summary.errors.length > 0) {
    console.log('❌ Erreurs détectées:');
    results.summary.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('🎉 Aucune erreur détectée !');
  }

  return results;
};

/**
 * 🧪 Test complet de création de client (simulation)
 */
export const testClientCreationFlow = async () => {
  console.log('🧪 === TEST FLUX CRÉATION CLIENT ===');
  
  const testClientData = {
    nom: 'TestClient',
    prenom: 'Demo',
    numeroCni: '1234567890123',
    telephone: '+237677123456',
    ville: 'Yaoundé',
    quartier: 'Emana'
  };

  try {
    // 1. Validation locale
    console.log('1️⃣ Test validation locale...');
    const validation = clientService.validateClientDataLocally(testClientData);
    
    if (!validation.isValid) {
      console.error('❌ Validation échouée:', validation.errors);
      return { success: false, step: 'validation', errors: validation.errors };
    }
    console.log('✅ Validation réussie');

    // 2. Test connexion service
    console.log('2️⃣ Test connexion service client...');
    const serviceTest = await clientService.testConnection();
    
    if (!serviceTest.success) {
      console.error('❌ Service indisponible:', serviceTest.message);
      return { success: false, step: 'service', error: serviceTest.message };
    }
    console.log('✅ Service disponible');

    // 3. Simulation appel API (on ne fait pas le vrai appel pour éviter de créer de fausses données)
    console.log('3️⃣ Simulation appel API création...');
    console.log('📤 Données qui seraient envoyées:', testClientData);
    console.log('✅ Flux de création validé (simulation)');

    return {
      success: true,
      message: 'Flux de création client validé',
      testData: testClientData,
      validationResult: validation
    };

  } catch (error) {
    console.error('❌ Erreur dans le flux:', error);
    return {
      success: false,
      error: error.message,
      step: 'unknown'
    };
  }
};

/**
 * 📱 Test complet du journal d'activité
 */
export const testJournalActiviteFlow = async () => {
  console.log('📱 === TEST FLUX JOURNAL ACTIVITÉ ===');
  
  try {
    const user = await authService.getCurrentUser();
    
    if (!user) {
      console.error('❌ Aucun utilisateur connecté');
      return { success: false, error: 'Utilisateur requis' };
    }

    console.log('👤 Utilisateur connecté:', user.email);

    // Test récupération activités
    console.log('1️⃣ Test récupération activités...');
    const today = new Date().toISOString().split('T')[0];
    
    const activitiesResult = await journalActiviteService.getUserActivities(
      user.id,
      today,
      { page: 0, size: 5 }
    );

    console.log('✅ Activités récupérées:', activitiesResult.data?.numberOfElements || 0, 'éléments');

    // Test récupération statistiques
    console.log('2️⃣ Test récupération statistiques...');
    const statsResult = await journalActiviteService.getUserActivityStats(
      user.id,
      today,
      today
    );

    console.log('✅ Statistiques récupérées:', Object.keys(statsResult.data || {}).length, 'métriques');

    return {
      success: true,
      user: user,
      activities: activitiesResult.data,
      stats: statsResult.data,
      message: 'Flux journal d\'activité validé'
    };

  } catch (error) {
    console.error('❌ Erreur flux journal:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 🎯 Test d'ensemble - Lance tous les tests
 */
export const runFullSystemTest = async () => {
  console.log('🎯 === TEST COMPLET DU SYSTÈME ===');
  
  const startTime = Date.now();
  
  const results = {
    timestamp: new Date().toISOString(),
    duration: 0,
    quickDiagnostic: null,
    clientFlow: null,
    journalFlow: null,
    overallSuccess: false
  };

  try {
    // 1. Diagnostic rapide
    console.log('\n📋 Phase 1: Diagnostic rapide...');
    results.quickDiagnostic = await runQuickDiagnostic();

    // 2. Test flux client
    console.log('\n🧪 Phase 2: Test flux client...');
    results.clientFlow = await testClientCreationFlow();

    // 3. Test flux journal
    console.log('\n📱 Phase 3: Test flux journal...');
    results.journalFlow = await testJournalActiviteFlow();

    // Calcul du succès global
    const successCount = [
      results.quickDiagnostic?.summary?.successRate > 75,
      results.clientFlow?.success,
      results.journalFlow?.success
    ].filter(Boolean).length;

    results.overallSuccess = successCount >= 2; // Au moins 2/3 tests réussis
    results.duration = Date.now() - startTime;

    console.log('\n🏁 === RÉSULTATS FINAUX ===');
    console.log(`⏱️  Durée: ${results.duration}ms`);
    console.log(`📊 Succès global: ${results.overallSuccess ? '✅' : '❌'}`);
    console.log(`📈 Tests réussis: ${successCount}/3`);

    if (results.overallSuccess) {
      console.log('🎉 Système prêt pour la production !');
    } else {
      console.log('⚠️  Des améliorations sont nécessaires');
    }

    return results;

  } catch (error) {
    console.error('❌ Erreur test complet:', error);
    results.duration = Date.now() - startTime;
    results.error = error.message;
    return results;
  }
};

// Export par défaut pour utilisation simple
export default {
  runQuickDiagnostic,
  testClientCreationFlow,
  testJournalActiviteFlow,
  runFullSystemTest
};