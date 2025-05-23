// src/components/ApiDiagnosticTool.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { API_CONFIG } from '../config/apiConfig';
import NetInfo from '@react-native-community/netinfo';
import useSyncStatus from '../hooks/useSyncStatus';
import AsyncStorage from '../utils/storage';
import { authService } from '../../services';

export default function ApiDiagnosticTool() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [authStatus, setAuthStatus] = useState('checking');
  const [deviceInfo, setDeviceInfo] = useState({});
  const { status, pendingCount, isOnline } = useSyncStatus();
  const [storageInfo, setStorageInfo] = useState({});

  useEffect(() => {
    checkConnection();
    checkBackend();
    checkAuth();
    getDeviceInfo();
    getStorageInfo();
  }, []);

  const checkConnection = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      setConnectionStatus(netInfo.isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('error');
      console.error('Erreur lors de la vérification de la connexion:', error);
    }
  };

  const checkBackend = async () => {
    try {
      setBackendStatus('checking');
      const response = await authService.ping();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('error');
      console.error('Erreur lors de la vérification du backend:', error);
    }
  };

  const checkAuth = async () => {
    try {
      setAuthStatus('checking');
      const isAuthenticated = await authService.isAuthenticated();
      setAuthStatus(isAuthenticated ? 'authenticated' : 'not-authenticated');
    } catch (error) {
      setAuthStatus('error');
      console.error('Erreur lors de la vérification de l\'authentification:', error);
    }
  };

  const getDeviceInfo = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      setDeviceInfo({
        type: netInfo.type,
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        details: netInfo.details,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des informations du périphérique:', error);
    }
  };

  const getStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = {};
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          // Pour les valeurs JSON, essayer de les analyser
          try {
            result[key] = JSON.parse(value);
          } catch {
            // Si ce n'est pas un JSON valide, stocker la chaîne brute
            result[key] = value;
          }
        } catch (error) {
          result[key] = `[Erreur de lecture: ${error.message}]`;
        }
      }
      
      setStorageInfo(result);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de stockage:', error);
    }
  };

  const clearStorage = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment effacer toutes les données stockées ? Cela entraînera la déconnexion.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Succès', 'Toutes les données ont été effacées.');
              getStorageInfo();
            } catch (error) {
              Alert.alert('Erreur', `Impossible d'effacer les données: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return '#4CAF50';
      case 'disconnected':
      case 'not-authenticated':
        return '#FF9800';
      case 'error':
        return '#F44336';
      case 'checking':
      default:
        return '#9E9E9E';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Outil de diagnostic API</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État de la connexion</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Réseau:</Text>
          <Text style={[styles.value, { color: getStatusColor(connectionStatus) }]}>
            {connectionStatus === 'connected' ? 'Connecté' : 
             connectionStatus === 'disconnected' ? 'Déconnecté' : 
             connectionStatus === 'error' ? 'Erreur' : 'Vérification...'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Backend:</Text>
          <Text style={[styles.value, { color: getStatusColor(backendStatus) }]}>
            {backendStatus === 'connected' ? 'Connecté' : 
             backendStatus === 'error' ? 'Erreur' : 'Vérification...'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Authentification:</Text>
          <Text style={[styles.value, { color: getStatusColor(authStatus) }]}>
            {authStatus === 'authenticated' ? 'Authentifié' : 
             authStatus === 'not-authenticated' ? 'Non authentifié' : 
             authStatus === 'error' ? 'Erreur' : 'Vérification...'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => {
            checkConnection();
            checkBackend();
            checkAuth();
          }}
        >
          <Text style={styles.buttonText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations de l'API</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>URL:</Text>
          <Text style={styles.value}>{API_CONFIG.baseURL}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Timeout:</Text>
          <Text style={styles.value}>{API_CONFIG.timeout}ms</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronisation</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>État:</Text>
          <Text style={styles.value}>{status}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>En ligne:</Text>
          <Text style={[styles.value, { color: isOnline ? '#4CAF50' : '#F44336' }]}>
            {isOnline ? 'Oui' : 'Non'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Opérations en attente:</Text>
          <Text style={styles.value}>{pendingCount}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stockage</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={clearStorage}>
          <Text style={styles.buttonText}>Effacer toutes les données</Text>
        </TouchableOpacity>
        
        <Text style={styles.subsectionTitle}>Données stockées:</Text>
        {Object.keys(storageInfo).map((key) => (
          <View key={key} style={styles.storageItem}>
            <Text style={styles.storageKey}>{key}:</Text>
            <Text style={styles.storageValue}>
              {typeof storageInfo[key] === 'object' 
                ? JSON.stringify(storageInfo[key], null, 2) 
                : String(storageInfo[key])}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 5,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: '500',
    width: 120,
  },
  value: {
    flex: 1,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  dangerButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  storageItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#EEEEEE',
    borderRadius: 5,
  },
  storageKey: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  storageValue: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});