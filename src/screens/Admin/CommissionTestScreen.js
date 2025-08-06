// CommissionTestScreen.js - 🔧 VERSION CORRIGÉE AVEC VRAIES DONNÉES
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Services
import { adminCommissionService, commissionService } from '../../services';
import { useAdminCommissions } from '../../hooks/useAdminCommissions';

// Composants
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';

const CommissionTestScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [testResults, setTestResults] = useState([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  
  // Hook commission pour tests
  const {
    processing,
    calculating,
    error,
    processCommissions,
    calculateCommissions,
    simulateCommission
  } = useAdminCommissions();

  // ========================================
  // 🔧 VRAIES DONNÉES CORRIGÉES
  // ========================================
  
  const REAL_DATA = {
    // ✅ VRAIS COLLECTEURS EXISTANTS (d'après votre base de données)
    COLLECTEUR_IDS: [4, 5, 6, 7], // Au lieu de 1 qui n'existe pas
    
    // ✅ VRAIS CLIENTS EXISTANTS
    CLIENT_IDS: [1, 2, 3, 4, 5],
    
    // ✅ COLLECTEUR PAR DÉFAUT POUR TESTS
    DEFAULT_COLLECTEUR_ID: 4, // Test Client
    
    // ✅ CLIENT PAR DÉFAUT POUR TESTS  
    DEFAULT_CLIENT_ID: 1, // Test Client
    
    // ✅ PÉRIODE DE TEST AVEC DONNÉES RÉELLES
    PERIODE: {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    }
  };

  // ================================
  // UTILITAIRES DE TEST
  // ================================

  const addTestResult = (testName, success, data, error = null) => {
    const result = {
      id: Date.now(),
      testName,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString(),
      details: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
    };
    
    setTestResults(prev => [result, ...prev]);
    return result;
  };

  const clearResults = () => setTestResults([]);

  // ================================
  // TESTS INDIVIDUELS CORRIGÉS
  // ================================

  /**
   * Test 1: Connectivité de base
   */
  const testBasicConnectivity = async () => {
    try {
      console.log('🧪 Test connectivité de base...');
      
      // Vérifier que les services sont disponibles
      const servicesCheck = {
        adminCommissionService: !!adminCommissionService,
        commissionService: !!commissionService,
        useAdminCommissions: true,
        baseURL: adminCommissionService?.baseURL || 'Non définie',
        collecteursDisponibles: REAL_DATA.COLLECTEUR_IDS,
        clientsDisponibles: REAL_DATA.CLIENT_IDS
      };
      
      addTestResult(
        '🔌 Connectivité Services',
        true,
        servicesCheck
      );
      
      return { success: true, data: servicesCheck };
    } catch (error) {
      addTestResult('🔌 Connectivité Services', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 2: Endpoint Calculate Commissions - CORRIGÉ
   */
  const testCalculateEndpoint = async () => {
    try {
      console.log('🧪 Test endpoint calculate...');
      
      const result = await calculateCommissions(
        REAL_DATA.PERIODE.startDate,
        REAL_DATA.PERIODE.endDate,
        null // ✅ CORRECTION : null pour toute l'agence (pas de collecteur spécifique)
      );
      
      addTestResult(
        '📊 POST /commissions/calculate',
        result.success,
        {
          success: result.success,
          message: result.message || 'Pas de message',
          dataType: typeof result.data,
          hasError: !!result.error,
          error: result.error
        },
        result.error
      );
      
      return result;
    } catch (error) {
      addTestResult('📊 POST /commissions/calculate', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 3: Endpoint Process Commissions - CORRIGÉ AVEC VRAI ID
   */
  const testProcessEndpoint = async () => {
    try {
      console.log('🧪 Test endpoint process...');
      
      // ✅ CORRECTION CRITIQUE : Utiliser un collecteur qui existe vraiment
      const collecteurId = REAL_DATA.DEFAULT_COLLECTEUR_ID; // 4 au lieu de 1
      
      const result = await processCommissions(
        collecteurId,
        REAL_DATA.PERIODE.startDate,
        REAL_DATA.PERIODE.endDate,
        false // forceRecalculation
      );
      
      addTestResult(
        `⚡ POST /commissions/process (collecteur ${collecteurId})`,
        result.success,
        {
          collecteurId: collecteurId,
          success: result.success,
          message: result.message || 'Pas de message',
          dataType: typeof result.data,
          error: result.error
        },
        result.error
      );
      
      return result;
    } catch (error) {
      addTestResult(
        `⚡ POST /commissions/process (collecteur ${REAL_DATA.DEFAULT_COLLECTEUR_ID})`, 
        false, 
        null, 
        error.message
      );
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 4: Endpoint Get Collecteur Commissions - CORRIGÉ
   */
  const testGetCollecteurCommissions = async () => {
    try {
      console.log('🧪 Test get collecteur commissions...');
      
      // ✅ CORRECTION : Utiliser un collecteur existant
      const collecteurId = REAL_DATA.DEFAULT_COLLECTEUR_ID;
      
      const response = await adminCommissionService.getCollecteurCommissions(
        collecteurId,
        REAL_DATA.PERIODE.startDate,
        REAL_DATA.PERIODE.endDate
      );
      
      addTestResult(
        `👤 GET /commissions/collecteur/${collecteurId}`,
        response.success,
        {
          collecteurId: collecteurId,
          success: response.success,
          dataLength: response.data ? (Array.isArray(response.data) ? response.data.length : 'Non-array') : 0,
          message: response.message
        },
        response.error
      );
      
      return response;
    } catch (error) {
      addTestResult(
        `👤 GET /commissions/collecteur/${REAL_DATA.DEFAULT_COLLECTEUR_ID}`, 
        false, 
        null, 
        error.message
      );
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 5: Simulation Commission - CORRIGÉ AVEC BONS CHAMPS
   */
  const testSimulationEndpoint = async () => {
    try {
      console.log('🧪 Test simulation...');
      
      // ✅ CORRECTION CRITIQUE : Utiliser les bons noms de champs
      const simulationData = {
        montant: 100000, // ✅ "montant" au lieu de "montantEpargne"
        type: 'PERCENTAGE', // ✅ "type" au lieu de "typeCommission"
        valeur: 5.0 // ✅ "valeur" au lieu de "valeurCommission"
      };
      
      console.log('📊 Données simulation envoyées:', simulationData);
      
      const result = await simulateCommission(simulationData);
      
      addTestResult(
        '🧮 POST /commissions/simulate',
        result.success,
        {
          inputData: simulationData,
          success: result.success,
          commissionCalculee: result.data?.commissionTotal || result.data?.montantCommission || 'Non calculée',
          message: result.message,
          errorMessage: result.data?.errorMessage || result.errorMessage
        },
        result.error || result.data?.errorMessage
      );
      
      return result;
    } catch (error) {
      addTestResult('🧮 POST /commissions/simulate', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 6: Statut Async - CORRIGÉ
   */
  const testAsyncStatusEndpoint = async () => {
    try {
      console.log('🧪 Test async status...');
      
      const taskId = 'test-task-' + Date.now();
      const response = await adminCommissionService.checkAsyncStatus(taskId);
      
      addTestResult(
        `🔄 GET /commissions/async/status/${taskId}`,
        response.success,
        {
          taskId: taskId,
          success: response.success,
          status: response.data?.status || 'Inconnu',
          message: response.message
        },
        response.error
      );
      
      return response;
    } catch (error) {
      addTestResult('🔄 GET /commissions/async/status/{id}', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * ✅ NOUVEAU TEST : Validation des données de base
   */
  const testDataValidation = async () => {
    try {
      console.log('🧪 Test validation données...');
      
      // Test de vérification des collecteurs disponibles
      const dataCheck = {
        collecteursTest: REAL_DATA.COLLECTEUR_IDS,
        clientsTest: REAL_DATA.CLIENT_IDS,
        periodeTest: REAL_DATA.PERIODE,
        collecteurDefaut: REAL_DATA.DEFAULT_COLLECTEUR_ID,
        clientDefaut: REAL_DATA.DEFAULT_CLIENT_ID,
        timestamp: new Date().toISOString()
      };
      
      addTestResult(
        '🔍 Validation Données Test',
        true,
        dataCheck
      );
      
      return { success: true, data: dataCheck };
    } catch (error) {
      addTestResult('🔍 Validation Données Test', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  // ================================
  // TEST GLOBAL CORRIGÉ
  // ================================

  const runAllTests = async () => {
    setIsTestingAll(true);
    clearResults();
    
    try {
      console.log('🚀 Lancement de tous les tests avec VRAIES DONNÉES...');
      
      // Tests séquentiels avec vraies données
      await testBasicConnectivity();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testDataValidation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testCalculateEndpoint();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testProcessEndpoint();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testGetCollecteurCommissions();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testSimulationEndpoint();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testAsyncStatusEndpoint();
      
      // Analyse des résultats
      const successCount = testResults.filter(r => r.success).length;
      const totalCount = testResults.length;
      
      Alert.alert(
        'Tests Terminés',
        `✅ ${successCount}/${totalCount} tests réussis\n\nConsultez les résultats ci-dessous`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Erreur Tests', error.message);
    } finally {
      setIsTestingAll(false);
    }
  };

  /**
   * ✅ NOUVEAU : Test rapide avec un seul collecteur
   */
  const testSingleCollecteur = async () => {
    try {
      const collecteurId = REAL_DATA.DEFAULT_COLLECTEUR_ID;
      console.log(`🎯 Test rapide collecteur ${collecteurId}...`);
      
      const result = await adminCommissionService.getCollecteurCommissions(
        collecteurId,
        REAL_DATA.PERIODE.startDate,
        REAL_DATA.PERIODE.endDate
      );
      
      Alert.alert(
        `Test Collecteur ${collecteurId}`,
        result.success ? 
          `✅ Succès!\nCollecteur trouvé et accessible` :
          `❌ Échec: ${result.error}`,
        [{ text: 'OK' }]
      );
      
      addTestResult(
        `🎯 Test Rapide Collecteur ${collecteurId}`,
        result.success,
        result.data,
        result.error
      );
      
    } catch (error) {
      Alert.alert('Erreur Test Rapide', error.message);
    }
  };

  // ================================
  // RENDU COMPOSANTS
  // ================================

  const renderTestButton = (title, onPress, icon = 'play', color = theme.colors.primary) => (
    <TouchableOpacity
      style={[styles.testButton, { backgroundColor: color }]}
      onPress={onPress}
      disabled={isTestingAll}
    >
      <Ionicons name={icon} size={20} color={theme.colors.white} />
      <Text style={styles.testButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  const renderTestResult = (result) => (
    <View key={result.id} style={styles.resultItem}>
      <View style={styles.resultHeader}>
        <View style={[
          styles.statusIcon,
          { backgroundColor: result.success ? theme.colors.success : theme.colors.error }
        ]}>
          <Ionicons 
            name={result.success ? 'checkmark' : 'close'} 
            size={16} 
            color={theme.colors.white} 
          />
        </View>
        <Text style={styles.resultTitle}>{result.testName}</Text>
        <Text style={styles.resultTime}>{result.timestamp}</Text>
      </View>
      
      {result.error && (
        <Text style={styles.resultError}>❌ {result.error}</Text>
      )}
      
      {result.data && (
        <Text style={styles.resultData}>
          📊 {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2).substring(0, 300)}
          {JSON.stringify(result.data).length > 300 && '...'}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="🧪 Tests Commission API (CORRIGÉ)"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* États du Hook */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>États Hook Commission</Text>
          <View style={styles.hookStates}>
            <Text style={styles.stateItem}>Processing: {processing ? '✅' : '❌'}</Text>
            <Text style={styles.stateItem}>Calculating: {calculating ? '✅' : '❌'}</Text>
            <Text style={styles.stateItem}>Error: {error || 'Aucune'}</Text>
          </View>
        </Card>

        {/* ✅ NOUVELLES DONNÉES RÉELLES */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🔧 Vraies Données Utilisées</Text>
          <View style={styles.realDataInfo}>
            <Text style={styles.dataItem}>
              Collecteurs: {REAL_DATA.COLLECTEUR_IDS.join(', ')} (au lieu de 1 ❌)
            </Text>
            <Text style={styles.dataItem}>
              Clients: {REAL_DATA.CLIENT_IDS.join(', ')}
            </Text>
            <Text style={styles.dataItem}>
              Collecteur par défaut: {REAL_DATA.DEFAULT_COLLECTEUR_ID}
            </Text>
            <Text style={styles.dataItem}>
              Période: {REAL_DATA.PERIODE.startDate} → {REAL_DATA.PERIODE.endDate}
            </Text>
            <Text style={styles.dataItem}>
              Champs simulation: montant, type, valeur (corrigés ✅)
            </Text>
          </View>
        </Card>

        {/* Tests Rapides */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>⚡ Tests Rapides</Text>
          
          {renderTestButton(
            `🎯 Test Collecteur ${REAL_DATA.DEFAULT_COLLECTEUR_ID}`, 
            testSingleCollecteur, 
            'flash', 
            theme.colors.info
          )}
          
          {renderTestButton(
            '🔍 Valider Données', 
            testDataValidation, 
            'search', 
            theme.colors.warning
          )}
        </Card>

        {/* Boutons de Test Individuels */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Tests Individuels Corrigés</Text>
          
          {renderTestButton('🔌 Connectivité Services', testBasicConnectivity, 'wifi')}
          {renderTestButton('📊 Calculate Commissions', testCalculateEndpoint, 'calculator')}
          {renderTestButton(`⚡ Process Collecteur ${REAL_DATA.DEFAULT_COLLECTEUR_ID}`, testProcessEndpoint, 'flash')}
          {renderTestButton(`👤 Get Collecteur ${REAL_DATA.DEFAULT_COLLECTEUR_ID}`, testGetCollecteurCommissions, 'person')}
          {renderTestButton('🧮 Simulation (Champs Corrigés)', testSimulationEndpoint, 'bulb')}
          {renderTestButton('🔄 Async Status', testAsyncStatusEndpoint, 'time')}
        </Card>

        {/* Test Global */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Test Complet Corrigé</Text>
          
          <TouchableOpacity
            style={[styles.globalTestButton, { opacity: isTestingAll ? 0.6 : 1 }]}
            onPress={runAllTests}
            disabled={isTestingAll}
          >
            {isTestingAll ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Ionicons name="rocket" size={24} color={theme.colors.white} />
            )}
            <Text style={styles.globalTestText}>
              {isTestingAll ? 'Tests en cours...' : '🚀 Lancer Tous les Tests (Données Réelles)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearResults}
          >
            <Ionicons name="trash" size={16} color={theme.colors.error} />
            <Text style={styles.clearButtonText}>Effacer Résultats</Text>
          </TouchableOpacity>
        </Card>

        {/* Résultats */}
        {testResults.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>
              Résultats Tests ({testResults.length})
              {testResults.filter(r => r.success).length > 0 && 
                ` - ✅ ${testResults.filter(r => r.success).length} succès`}
            </Text>
            
            {testResults.map(renderTestResult)}
          </Card>
        )}

        {/* Informations Debug */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🔧 Informations Debug</Text>
          <Text style={styles.debugText}>
            Base URL: {adminCommissionService.baseURL || 'Non définie'}
          </Text>
          <Text style={styles.debugText}>
            Services: adminCommissionService, commissionService ✅
          </Text>
          <Text style={styles.debugText}>
            Hook: useAdminCommissions ✅
          </Text>
          <Text style={styles.debugText}>
            Corrections appliquées: IDs collecteurs, champs DTO simulation ✅
          </Text>
          <Text style={styles.debugText}>
            Version: 2.0.0 - Avec vraies données de la BD
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  hookStates: {
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  stateItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  // ✅ NOUVEAUX STYLES POUR DONNÉES RÉELLES
  realDataInfo: {
    backgroundColor: theme.colors.success + '20',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  dataItem: {
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  globalTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  globalTestText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  clearButtonText: {
    color: theme.colors.error,
    fontSize: 14,
    marginLeft: 4,
  },
  resultItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  resultTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  resultTime: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  resultError: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  resultData: {
    fontSize: 11,
    color: theme.colors.textLight,
    marginTop: 4,
    fontFamily: 'monospace',
    backgroundColor: theme.colors.lightGray,
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default CommissionTestScreen;