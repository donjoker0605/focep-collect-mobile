// src/components/ConnectionTest.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { authService } from '../api/auth';
import { API_CONFIG } from '../config/apiConfig';

export default function ConnectionTest() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);

  const testConnection = async () => {
    setStatus('testing');
    setResult(null);
    
    try {
      const response = await authService.ping();
      setStatus('success');
      setResult({
        success: true,
        data: response,
        url: API_CONFIG.baseURL,
      });
    } catch (error) {
      setStatus('error');
      setResult({
        success: false,
        error: error.message,
        details: error.details,
        url: API_CONFIG.baseURL,
      });
    }
  };

  const testAuth = async () => {
    setStatus('testing');
    
    try {
      const response = await authService.login({
        email: 'admin@collectfocep.com',
        password: 'password'
      });
      
      Alert.alert(
        'Test d\'authentification',
        'Connexion réussie !',
        [{ text: 'OK' }]
      );
      
      setResult({
        success: true,
        data: response,
      });
    } catch (error) {
      Alert.alert(
        'Erreur d\'authentification',
        error.message,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'testing': return '#FF9800';
      default: return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test de connectivité Backend</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>URL Backend:</Text>
        <Text style={styles.urlText}>{API_CONFIG.baseURL}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: getStatusColor() }]}
        onPress={testConnection}
        disabled={status === 'testing'}
      >
        <Text style={styles.buttonText}>
          {status === 'testing' ? 'Test en cours...' : 'Tester la connexion'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.authButton]}
        onPress={testAuth}
        disabled={status === 'testing'}
      >
        <Text style={styles.buttonText}>
          Tester l'authentification
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Résultat:</Text>
          <Text style={[
            styles.resultText,
            { color: result.success ? '#4CAF50' : '#F44336' }
          ]}>
            {result.success ? '✓ Connexion établie' : '✗ Connexion échouée'}
          </Text>
          {!result.success && result.error && (
            <Text style={styles.errorText}>{result.error}</Text>
          )}
          {result.data && (
            <Text style={styles.dataText}>
              {JSON.stringify(result.data, null, 2)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  urlText: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  authButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 10,
  },
  dataText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
