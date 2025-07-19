import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  ActivityIndicator,
  Surface,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import TestService from '../services/testService';
import { theme } from '../theme/theme';

export const TestScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      const results = await TestService.runFullTest();
      setTestResults(results);
      
      // Afficher un résumé dans une alerte
      const report = TestService.formatTestResults(results);
      Alert.alert('Test Results', report);
    } catch (error) {
      Alert.alert('Test Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnectivityOnly = async () => {
    setIsLoading(true);
    
    try {
      const result = await TestService.testConnectivity();
      
      if (result.success) {
        Alert.alert('Connectivité', '✅ Connexion au backend réussie');
      } else {
        Alert.alert('Erreur de connectivité', `❌ ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResult = (title, result) => {
    if (!result) return null;
    
    const isSuccess = result.success;
    const icon = isSuccess ? 'check-circle' : 'alert-circle';
    const color = isSuccess ? 'green' : 'red';
    
    return (
      <List.Item
        title={title}
        description={isSuccess ? 'Succès' : result.error}
        left={() => <List.Icon icon={icon} color={color} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Tests de Connectivité Backend</Title>
            <Text style={styles.description}>
              Vérifiez la connexion avec le backend Spring Boot et testez l'authentification.
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={testConnectivityOnly}
                disabled={isLoading}
                style={styles.button}
                icon="wifi"
              >
                Test Connectivité
              </Button>
              
              <Button
                mode="contained"
                onPress={runTests}
                disabled={isLoading}
                style={styles.button}
                icon="play"
              >
                Test Complet
              </Button>
            </View>
          </Card.Content>
        </Card>

        {isLoading && (
          <Surface style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Tests en cours...</Text>
          </Surface>
        )}

        {testResults && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Résultats des Tests</Title>
              <Text style={styles.timestamp}>
                {new Date(testResults.timestamp).toLocaleString()}
              </Text>
              
              {renderTestResult('Backend Connectivité', testResults.connectivity)}
              
              {testResults.authentication && (
                <>
                  <List.Subheader>Tests d'Authentification</List.Subheader>
                  {Object.entries(testResults.authentication).map(([role, result]) => 
                    renderTestResult(`Login ${role}`, result)
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Title>Configuration Backend</Title>
            <Text style={styles.configText}>URL: http://192.168.89.76:8080</Text>
            <Text style={styles.configText}>Endpoints testés:</Text>
            <Text style={styles.configText}>• GET /api/public/ping</Text>
            <Text style={styles.configText}>• POST /api/auth/login</Text>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  description: {
    marginVertical: 12,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  loadingCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.onSurface,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.6,
    marginBottom: 12,
  },
  configText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.8,
    marginVertical: 2,
  },
  bottomSpace: {
    height: 20,
  },
});