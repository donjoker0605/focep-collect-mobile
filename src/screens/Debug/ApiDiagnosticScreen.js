// src/screens/Debug/ApiDiagnosticScreen.js - ÉCRAN DE DIAGNOSTIC
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { testAllEndpoints, testEndpoint } from '../../utils/apiTest';
import theme from '../../theme';

const ApiDiagnosticScreen = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [individualTests, setIndividualTests] = useState({});

  const runAllTests = async () => {
    if (!user?.id) {
      alert('Utilisateur non connecté');
      return;
    }

    setTesting(true);
    try {
      const testResults = await testAllEndpoints(user.id);
      setResults(testResults);
    } catch (error) {
      console.error('Erreur lors des tests:', error);
    } finally {
      setTesting(false);
    }
  };

  const runIndividualTest = async (endpointName) => {
    if (!user?.id) {
      alert('Utilisateur non connecté');
      return;
    }

    setIndividualTests(prev => ({ ...prev, [endpointName]: true }));
    
    try {
      const result = await testEndpoint(endpointName, user.id);
      console.log(`Test ${endpointName} result:`, result);
      alert(`Test ${endpointName}: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
    } catch (error) {
      console.error(`Test ${endpointName} failed:`, error);
      alert(`Test ${endpointName}: ÉCHEC - ${error.message}`);
    } finally {
      setIndividualTests(prev => ({ ...prev, [endpointName]: false }));
    }
  };

  const renderTestResult = (name, result) => {
    if (!result) return null;

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{name}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: result.success ? theme.colors.success : theme.colors.error }
          ]}>
            <Text style={styles.statusText}>
              {result.success ? 'SUCCÈS' : 'ÉCHEC'}
            </Text>
          </View>
        </View>
        
        {result.success ? (
          <View style={styles.successInfo}>
            {result.count !== undefined && (
              <Text style={styles.infoText}>Éléments: {result.count}</Text>
            )}
            {result.data && typeof result.data === 'object' && (
              <Text style={styles.infoText}>
                Données: {JSON.stringify(result.data, null, 2).substring(0, 100)}...
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.errorInfo}>
            <Text style={styles.errorText}>
              Erreur: {result.error || 'Erreur inconnue'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diagnostic API</Text>
        <Text style={styles.subtitle}>
          Utilisateur: {user?.prenom} {user?.nom} (ID: {user?.id})
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={runAllTests}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Tester tous les endpoints</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tests individuels</Text>
        
        {['clients', 'transactions', 'dashboard', 'notifications'].map(endpoint => (
          <TouchableOpacity
            key={endpoint}
            style={[styles.button, styles.secondaryButton]}
            onPress={() => runIndividualTest(endpoint)}
            disabled={individualTests[endpoint]}
          >
            {individualTests[endpoint] ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Tester {endpoint}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {results && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats des tests</Text>
          {renderTestResult('Clients', results.clients)}
          {renderTestResult('Transactions', results.transactions)}
          {renderTestResult('Dashboard', results.dashboard)}
          {renderTestResult('Notifications', results.notifications)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  successInfo: {
    marginTop: 8,
  },
  errorInfo: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
  },
});

export default ApiDiagnosticScreen;