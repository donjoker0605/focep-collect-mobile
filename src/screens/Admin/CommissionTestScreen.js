// CommissionTestScreen.js - COMPOSANT TEMPORAIRE POUR TESTS CONNECTIVITÉ
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
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestResults(prev => [result, ...prev]);
    return result;
  };

  const clearResults = () => setTestResults([]);

  // ================================
  // TESTS INDIVIDUELS
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
        useAdminCommissions: true
      };
      
      addTestResult(
        'Connectivité Services',
        true,
        servicesCheck
      );
      
      return { success: true, data: servicesCheck };
    } catch (error) {
      addTestResult('Connectivité Services', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 2: Endpoint Calculate Commissions
   */
  const testCalculateEndpoint = async () => {
    try {
      console.log('🧪 Test endpoint calculate...');
      
      const result = await calculateCommissions(
        '2024-01-01',
        '2024-01-31',
        null // Tous les collecteurs
      );
      
      addTestResult(
        'POST /commissions/calculate',
        result.success,
        result.data,
        result.error
      );
      
      return result;
    } catch (error) {
      addTestResult('POST /commissions/calculate', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 3: Endpoint Process Commissions
   */
  const testProcessEndpoint = async () => {
    try {
      console.log('🧪 Test endpoint process...');
      
      // Test avec collecteur ID = 1 (ajuster selon vos données)
      const result = await processCommissions(
        1, // collecteurId
        '2024-01-01',
        '2024-01-31',
        false // forceRecalculation
      );
      
      addTestResult(
        'POST /commissions/process',
        result.success,
        result.data,
        result.error
      );
      
      return result;
    } catch (error) {
      addTestResult('POST /commissions/process', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 4: Endpoint Get Collecteur Commissions
   */
  const testGetCollecteurCommissions = async () => {
    try {
      console.log('🧪 Test get collecteur commissions...');
      
      const response = await adminCommissionService.getCommissionsByCollecteur(
        1, // collecteurId
        '2024-01-01',
        '2024-01-31'
      );
      
      addTestResult(
        'GET /commissions/collecteur/{id}',
        response.success,
        response.data,
        response.error
      );
      
      return response;
    } catch (error) {
      addTestResult('GET /commissions/collecteur/{id}', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 5: Simulation Commission
   */
  const testSimulationEndpoint = async () => {
    try {
      console.log('🧪 Test simulation...');
      
      const simulationData = {
        clientId: 1,
        montantEpargne: 100000,
        typeCommission: 'PERCENTAGE',
        valeurCommission: 5.0
      };
      
      const result = await simulateCommission(simulationData);
      
      addTestResult(
        'POST /commissions/simulate',
        result.success,
        result.data,
        result.error
      );
      
      return result;
    } catch (error) {
      addTestResult('POST /commissions/simulate', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Test 6: Statut Async
   */
  const testAsyncStatusEndpoint = async () => {
    try {
      console.log('🧪 Test async status...');
      
      const response = await adminCommissionService.checkAsyncStatus('test-task-id');
      
      addTestResult(
        'GET /commissions/async/status/{id}',
        response.success,
        response.data,
        response.error
      );
      
      return response;
    } catch (error) {
      addTestResult('GET /commissions/async/status/{id}', false, null, error.message);
      return { success: false, error: error.message };
    }
  };

  // ================================
  // TEST GLOBAL
  // ================================

  const runAllTests = async () => {
    setIsTestingAll(true);
    clearResults();
    
    try {
      console.log('🚀 Lancement de tous les tests...');
      
      // Tests séquentiels
      await testBasicConnectivity();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause entre tests
      
      await testCalculateEndpoint();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testProcessEndpoint();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testGetCollecteurCommissions();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testSimulationEndpoint();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testAsyncStatusEndpoint();
      
      Alert.alert(
        'Tests Terminés',
        'Consultez les résultats ci-dessous',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Erreur Tests', error.message);
    } finally {
      setIsTestingAll(false);
    }
  };

  // ================================
  // RENDU COMPOSANTS
  // ================================

  const renderTestButton = (title, onPress, icon = 'play') => (
    <TouchableOpacity
      style={styles.testButton}
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
          📊 {JSON.stringify(result.data, null, 2).substring(0, 200)}
          {JSON.stringify(result.data).length > 200 && '...'}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="🧪 Tests Commission API"
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

        {/* Boutons de Test */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Tests Individuels</Text>
          
          {renderTestButton('🔌 Connectivité Services', testBasicConnectivity, 'wifi')}
          {renderTestButton('📊 Calculate Commissions', testCalculateEndpoint, 'calculator')}
          {renderTestButton('⚡ Process Commissions', testProcessEndpoint, 'flash')}
          {renderTestButton('👤 Get Collecteur', testGetCollecteurCommissions, 'person')}
          {renderTestButton('🧮 Simulation', testSimulationEndpoint, 'bulb')}
          {renderTestButton('🔄 Async Status', testAsyncStatusEndpoint, 'time')}
        </Card>

        {/* Test Global */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Test Complet</Text>
          
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
              {isTestingAll ? 'Tests en cours...' : '🚀 Lancer Tous les Tests'}
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
            Services disponibles: adminCommissionService, commissionService
          </Text>
          <Text style={styles.debugText}>
            Hook: useAdminCommissions
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