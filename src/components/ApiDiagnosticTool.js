// src/components/ApiDiagnosticTool.js - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { API_CONFIG } from '../config/apiConfig';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ IMPORT CORRECT

// ✅ IMPORTS CORRIGÉS - Un seul niveau up car nous sommes dans src/components/
import { authService } from '../services'; // ✅ CHEMIN CORRIGÉ
// Import du hook de sync si il existe, sinon on le crée ou l'ignore
// import useSyncStatus from '../hooks/useSyncStatus'; // ✅ À DÉCOMMENTER SI LE HOOK EXISTE

export default function ApiDiagnosticTool() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [authStatus, setAuthStatus] = useState('checking');
  const [deviceInfo, setDeviceInfo] = useState({});
  const [storageInfo, setStorageInfo] = useState({});
  
  // ✅ GESTION CONDITIONNELLE DU HOOK DE SYNC
  // Si le hook useSyncStatus n'existe pas, utiliser des valeurs par défaut
  const syncStatus = {
    status: 'idle',
    pendingCount: 0,
    isOnline: true
  };
  // Décommentez la ligne ci-dessous si le hook existe :
  // const { status, pendingCount, isOnline } = useSyncStatus();
  const { status, pendingCount, isOnline } = syncStatus;

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
      
      // ✅ UTILISATION CORRECTE DU SERVICE D'AUTH POUR PING
      // Si authService n'a pas de méthode ping, on peut utiliser une requête directe
      try {
        const response = await authService.getCurrentUser(); // Test indirect du backend
        setBackendStatus('connected');
      } catch (error) {
        // Essayer une autre méthode si getCurrentUser ne fonctionne pas
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
      console.error('Erreur lors de la vérification du backend:', error);
    }
  };

  const checkAuth = async () => {
    try {
      setAuthStatus('checking');
      const authResult = await authService.isAuthenticated();
      // ✅ ADAPTATION À LA STRUCTURE DE RÉPONSE DE authService
      const isAuthenticated = authResult?.token && authResult?.userData;
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
      setDeviceInfo({
        type: 'unknown',
        isConnected: false,
        isInternetReachable: false,
        details: {}
      });
    }
  };

  const getStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = {};
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value === null) {
            result[key] = '[null]';
            continue;
          }
          
          // Pour les valeurs JSON, essayer de les analyser
          try {
            const parsedValue = JSON.parse(value);
            // Limiter l'affichage pour éviter de surcharger l'interface
            if (typeof parsedValue === 'object') {
              result[key] = `[Object] ${Object.keys(parsedValue).length} clés`;
            } else {
              result[key] = parsedValue;
            }
          } catch {
            // Si ce n'est pas un JSON valide, limiter la longueur
            result[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
          }
        } catch (error) {
          result[key] = `[Erreur de lecture: ${error.message}]`;
        }
      }
      
      setStorageInfo(result);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de stockage:', error);
      setStorageInfo({ error: 'Impossible de lire le stockage' });
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
              // Forcer la vérification de l'auth après nettoyage
              checkAuth();
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

  // ✅ FONCTION POUR TESTER L'API DIRECTEMENT
  const testApiConnection = async () => {
    try {
      // Test simple d'appel API
      const response = await fetch(`${API_CONFIG.baseURL}/public/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: API_CONFIG.timeout,
      });
      
      if (response.ok) {
        Alert.alert('Succès', 'Connexion API réussie !');
        setBackendStatus('connected');
      } else {
        Alert.alert('Erreur', `Status HTTP: ${response.status}`);
        setBackendStatus('error');
      }
    } catch (error) {
      Alert.alert('Erreur', `Connexion échouée: ${error.message}`);
      setBackendStatus('error');
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
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSmall]}
            onPress={() => {
              checkConnection();
              checkBackend();
              checkAuth();
            }}
          >
            <Text style={styles.buttonText}>Actualiser</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.buttonSmall, styles.testButton]}
            onPress={testApiConnection}
          >
            <Text style={styles.buttonText}>Test API</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration API</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>URL:</Text>
          <Text style={[styles.value, styles.urlText]} numberOfLines={2}>
            {API_CONFIG.baseURL}
          </Text>
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
        <Text style={styles.sectionTitle}>Informations appareil</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Type réseau:</Text>
          <Text style={styles.value}>{deviceInfo.type || 'Inconnu'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Internet accessible:</Text>
          <Text style={[styles.value, { color: deviceInfo.isInternetReachable ? '#4CAF50' : '#F44336' }]}>
            {deviceInfo.isInternetReachable ? 'Oui' : 'Non'}
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stockage local</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nombre de clés:</Text>
          <Text style={styles.value}>{Object.keys(storageInfo).length}</Text>
        </View>
        
        <TouchableOpacity style={styles.dangerButton} onPress={clearStorage}>
          <Text style={styles.buttonText}>⚠️ Effacer toutes les données</Text>
        </TouchableOpacity>
        
        <Text style={styles.subsectionTitle}>Aperçu des données:</Text>
        {Object.keys(storageInfo).length === 0 ? (
          <Text style={styles.emptyStorage}>Aucune donnée stockée</Text>
        ) : (
          Object.keys(storageInfo).slice(0, 10).map((key) => ( // Limiter à 10 pour les performances
            <View key={key} style={styles.storageItem}>
              <Text style={styles.storageKey}>{key}</Text>
              <Text style={styles.storageValue} numberOfLines={3}>
                {String(storageInfo[key])}
              </Text>
            </View>
          ))
        )}
        
        {Object.keys(storageInfo).length > 10 && (
          <Text style={styles.moreItemsText}>
            ... et {Object.keys(storageInfo).length - 10} autres éléments
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
    color: '#333',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#555',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  label: {
    fontWeight: '600',
    width: 120,
    color: '#666',
  },
  value: {
    flex: 1,
    color: '#333',
  },
  urlText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonSmall: {
    flex: 0.48,
    paddingVertical: 10,
  },
  testButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  storageItem: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  storageKey: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  storageValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyStorage: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#999',
    padding: 20,
  },
  moreItemsText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    marginTop: 10,
  },
});