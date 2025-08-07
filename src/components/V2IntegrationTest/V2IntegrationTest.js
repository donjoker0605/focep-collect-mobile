// src/components/V2IntegrationTest/V2IntegrationTest.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import testV2Integration from '../../utils/testV2Integration';
import colors from '../../theme/colors';

/**
 * Composant pour tester l'intégration V2 en mode debug
 */
const V2IntegrationTest = ({ collecteurId = 4 }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const runQuickTest = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      const result = await testV2Integration.quickTest(collecteurId);
      setResults(result);
      
      if (result.success) {
        Alert.alert('✅ Tests V2', 'Tous les tests sont passés avec succès!');
      } else {
        Alert.alert('❌ Tests V2', `Erreur: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('❌ Erreur', error.message);
      setResults({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const runDetailedTest = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      const result = await testV2Integration.detailedTest(collecteurId);
      setResults(result);
      setExpanded(true);
    } catch (error) {
      Alert.alert('❌ Erreur', error.message);
    } finally {
      setTesting(false);
    }
  };

  const runPerformanceTest = async () => {
    setTesting(true);
    
    try {
      const result = await testV2Integration.performanceTest(collecteurId, 3);
      Alert.alert(
        '⚡ Performance V2',
        `Moyenne: ${result.averageDuration.toFixed(0)}ms\\n` +
        `Réussis: ${result.successful}/${result.iterations}`
      );
    } catch (error) {
      Alert.alert('❌ Erreur', error.message);
    } finally {
      setTesting(false);
    }
  };

  const testCreateRubrique = async () => {
    setTesting(true);
    
    try {
      const result = await testV2Integration.testCreateRubrique(collecteurId);
      
      if (result.success) {
        Alert.alert('✅ Rubrique créée', `${result.data?.nom} créée avec succès`);
      } else {
        Alert.alert('❌ Erreur création', result.error);
      }
    } catch (error) {
      Alert.alert('❌ Erreur', error.message);
    } finally {
      setTesting(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <View style={styles.resultsContainer}>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.resultsTitle}>
            📊 Résultats des Tests V2
          </Text>
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={colors.primary} 
          />
        </TouchableOpacity>

        {expanded && (
          <ScrollView style={styles.resultsContent}>
            {results.success ? (
              <Text style={styles.successText}>✅ Tous les tests sont passés!</Text>
            ) : (
              <Text style={styles.errorText}>❌ Certains tests ont échoué</Text>
            )}

            {results.summary && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>
                  📈 Résumé: {results.summary.success}/{results.summary.total} réussis
                </Text>
              </View>
            )}

            {results.results && Array.isArray(results.results) && (
              <View style={styles.testsList}>
                {results.results.map((test, index) => (
                  <View key={index} style={styles.testItem}>
                    <View style={styles.testHeader}>
                      <Text style={test.success ? styles.testSuccess : styles.testError}>
                        {test.success ? '✅' : '❌'} {test.name}
                      </Text>
                      {test.duration && (
                        <Text style={styles.duration}>{test.duration}ms</Text>
                      )}
                    </View>
                    
                    {test.message && (
                      <Text style={styles.testMessage}>{test.message}</Text>
                    )}
                    
                    {test.error && (
                      <Text style={styles.testErrorMessage}>{test.error}</Text>
                    )}

                    {test.dataSize > 0 && (
                      <Text style={styles.dataSize}>
                        📊 Données: {(test.dataSize / 1024).toFixed(1)} KB
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {results.error && (
              <Text style={styles.errorText}>
                ❌ Erreur globale: {results.error}
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Tests d'Intégration V2</Text>
      <Text style={styles.subtitle}>Collecteur ID: {collecteurId}</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runQuickTest}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="flash" size={16} color="white" />
              <Text style={styles.buttonText}>Test Rapide</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={runDetailedTest}
          disabled={testing}
        >
          <Ionicons name="analytics" size={16} color={colors.primary} />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test Détaillé</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={runPerformanceTest}
          disabled={testing}
        >
          <Ionicons name="speedometer" size={16} color="white" />
          <Text style={styles.buttonText}>Performance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={testCreateRubrique}
          disabled={testing}
        >
          <Ionicons name="add-circle" size={16} color="white" />
          <Text style={styles.buttonText}>Test Rubrique</Text>
        </TouchableOpacity>
      </View>

      {renderResults()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    minWidth: 80,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  warningButton: {
    backgroundColor: colors.warning,
  },
  infoButton: {
    backgroundColor: colors.info,
  },
  resultsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  resultsContent: {
    maxHeight: 300,
  },
  successText: {
    color: colors.success,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: colors.error,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryContainer: {
    backgroundColor: colors.background.light,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  testsList: {
    gap: 8,
  },
  testItem: {
    backgroundColor: colors.background.light,
    padding: 8,
    borderRadius: 6,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testSuccess: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  testError: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  testMessage: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
  },
  testErrorMessage: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  dataSize: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
  },
});

export default V2IntegrationTest;