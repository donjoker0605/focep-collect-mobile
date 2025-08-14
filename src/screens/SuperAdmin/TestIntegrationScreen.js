// src/screens/SuperAdmin/TestIntegrationScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import theme from '../../theme';
import superAdminService from '../../services/superAdminService';

const TestIntegrationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const endTime = Date.now();
      
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: result.success,
          message: result.message || result.error,
          data: result.data,
          duration: endTime - startTime,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          message: error.message,
          duration: 0,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'testStatus',
      label: 'Test Status API',
      icon: 'checkmark-circle',
      test: () => superAdminService.testStatus()
    },
    {
      name: 'getDashboard',
      label: 'Dashboard SuperAdmin',
      icon: 'analytics',
      test: () => superAdminService.getDashboardStats()
    },
    {
      name: 'getAgences',
      label: 'Liste des Agences',
      icon: 'business',
      test: () => superAdminService.getAllAgences()
    },
    {
      name: 'getTypesOperation',
      label: 'Types d\'Opération',
      icon: 'list',
      test: () => superAdminService.getTypesOperation()
    },
    {
      name: 'getParametresCommission',
      label: 'Paramètres Commission',
      icon: 'cash',
      test: () => superAdminService.getAllParametresCommission()
    },
    {
      name: 'calculerCommission',
      label: 'Calcul Commission',
      icon: 'calculator',
      test: () => superAdminService.calculerCommission(1, 'DEPOT', 10000)
    }
  ];

  const runAllTests = async () => {
    setResults({});
    for (const test of tests) {
      await runTest(test.name, test.test);
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    Alert.alert('Tests terminés', 'Tous les tests ont été exécutés');
  };

  const renderTestResult = (test) => {
    const result = results[test.name];
    if (!result) return null;

    return (
      <Card key={test.name} style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={styles.resultInfo}>
            <Ionicons 
              name={test.icon} 
              size={20} 
              color={result.success ? theme.colors.success : theme.colors.error} 
            />
            <Text style={styles.resultLabel}>{test.label}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: result.success ? theme.colors.success : theme.colors.error }
          ]}>
            <Text style={styles.statusText}>
              {result.success ? 'OK' : 'ERREUR'}
            </Text>
          </View>
        </View>
        
        <View style={styles.resultDetails}>
          <Text style={styles.resultMessage}>{result.message}</Text>
          <View style={styles.resultMeta}>
            <Text style={styles.metaText}>Durée: {result.duration}ms</Text>
            <Text style={styles.metaText}>Heure: {result.timestamp}</Text>
          </View>
          {result.data && (
            <View style={styles.dataPreview}>
              <Text style={styles.dataTitle}>Données reçues:</Text>
              <Text style={styles.dataText} numberOfLines={3}>
                {JSON.stringify(result.data, null, 2)}
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const getSuccessCount = () => {
    return Object.values(results).filter(r => r.success).length;
  };

  const getTotalCount = () => {
    return Object.keys(results).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Test d'Intégration"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={runAllTests}
            disabled={loading}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={loading ? theme.colors.gray : theme.colors.white} 
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content}>
        {/* Résumé global */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={24} color={theme.colors.primary} />
            <Text style={styles.summaryTitle}>Résumé des Tests</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getSuccessCount()}</Text>
              <Text style={styles.statLabel}>Réussis</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getTotalCount() - getSuccessCount()}</Text>
              <Text style={styles.statLabel}>Échoués</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getTotalCount()}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Card>

        {/* Tests individuels */}
        <Card style={styles.testsCard}>
          <Text style={styles.sectionTitle}>Tests Disponibles</Text>
          {tests.map(test => (
            <TouchableOpacity
              key={test.name}
              style={styles.testButton}
              onPress={() => runTest(test.name, test.test)}
              disabled={loading}
            >
              <View style={styles.testInfo}>
                <Ionicons name={test.icon} size={20} color={theme.colors.primary} />
                <Text style={styles.testLabel}>{test.label}</Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="play" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.runAllButton}
            onPress={runAllTests}
            disabled={loading}
          >
            <Ionicons name="play-circle" size={24} color={theme.colors.white} />
            <Text style={styles.runAllText}>
              {loading ? 'Tests en cours...' : 'Lancer tous les tests'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Résultats des tests */}
        {Object.keys(results).length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Résultats des Tests</Text>
            {tests.map(renderTestResult)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  refreshButton: {
    padding: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  testsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 8,
  },
  runAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  runAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: 8,
  },
  resultsSection: {
    marginBottom: 16,
  },
  resultCard: {
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  resultDetails: {
    gap: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: theme.colors.text,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  dataPreview: {
    backgroundColor: theme.colors.backgroundLight,
    padding: 8,
    borderRadius: 4,
  },
  dataTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  dataText: {
    fontSize: 11,
    color: theme.colors.textLight,
    fontFamily: 'monospace',
  },
});

export default TestIntegrationScreen;