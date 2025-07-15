// src/hooks/useOfflineSync.js - VERSION CORRIGÉE POUR GÉOLOCALISATION UNIFIÉE
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import clientService from '../services/clientService';
import { mouvementService } from '../services';

// Constantes pour les statuts de synchronisation
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  OFFLINE: 'offline'
};

// Clés pour le stockage local
const STORAGE_KEYS = {
  PENDING_OPERATIONS: 'pendingOperations',
  LOCAL_CLIENTS: 'localClients',
  SYNC_STATUS: 'syncStatus',
  LAST_SYNC: 'lastSyncDate'
};

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [lastSyncDate, setLastSyncDate] = useState(null);
  const [pendingOperations, setPendingOperations] = useState([]);

  // ============================================
  // INITIALISATION ET ÉTAT RÉSEAU
  // ============================================

  useEffect(() => {
    initializeSync();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      const isCurrentlyOnline = state.isConnected;
      
      setIsOnline(isCurrentlyOnline);
      
      // Si on vient de se reconnecter, synchroniser automatiquement
      if (!wasOnline && isCurrentlyOnline) {
        console.log('📶 Reconnexion détectée, synchronisation automatique...');
        syncPendingOperations();
      }
    });

    return () => unsubscribe();
  }, []);

  const initializeSync = async () => {
    try {
      // Charger les opérations en attente
      const savedOperations = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
      if (savedOperations) {
        setPendingOperations(JSON.parse(savedOperations));
      }

      // Charger la date de dernière synchronisation
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSync) {
        setLastSyncDate(new Date(lastSync));
      }

      // Vérifier l'état réseau initial
      const netInfo = await NetInfo.fetch();
      setIsOnline(netInfo.isConnected);

    } catch (error) {
      console.error('❌ Erreur initialisation sync:', error);
    }
  };

  // ============================================
  // SAUVEGARDE CLIENT UNIFIÉE (AVEC GÉOLOCALISATION)
  // ============================================

  const saveClient = useCallback(async (clientData, isEdit = false) => {
    console.log('💾 useOfflineSync.saveClient:', { clientData, isEdit, isOnline });

    try {
      // Validation des données
      if (!clientData || typeof clientData !== 'object') {
        return {
          success: false,
          error: 'Données client invalides'
        };
      }

      // Validation locale basique
      const requiredFields = isEdit 
        ? ['numeroCni', 'telephone'] 
        : ['nom', 'prenom', 'numeroCni', 'telephone'];
        
      const missingFields = requiredFields.filter(field => !clientData[field]);
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Champs requis manquants: ${missingFields.join(', ')}`,
          validation: {
            isValid: false,
            errors: missingFields.map(field => `${field} est requis`)
          }
        };
      }

      // 🔥 NOUVELLE APPROCHE: SAUVEGARDE UNIFIÉE AVEC GÉOLOCALISATION
      if (isOnline) {
        setSyncStatus(SYNC_STATUS.SYNCING);
        
        try {
          let result;
          
          // 🔥 CORRECTION: Intégrer la géolocalisation directement dans l'objet client
          const clientDataWithLocation = {
            ...clientData,
            // Les coordonnées sont déjà intégrées dans clientData depuis ClientAddEditScreen
            // Plus besoin de sauvegarde séparée
          };
          
          if (isEdit && clientData.id) {
            result = await clientService.updateClient(clientData.id, clientDataWithLocation);
          } else {
            result = await clientService.createClient(clientDataWithLocation);
          }

          setSyncStatus(SYNC_STATUS.SUCCESS);
          setLastSyncDate(new Date());
          
          console.log('✅ Client sauvegardé en ligne:', result);
          
          return {
            success: true,
            data: result.data || result,
            message: result.message || 'Client sauvegardé avec succès'
          };
          
        } catch (onlineError) {
          console.warn('⚠️ Échec sauvegarde en ligne:', onlineError.message);
          setSyncStatus(SYNC_STATUS.ERROR);
          
          // Continuer en mode hors ligne si l'erreur n'est pas de validation
          if (onlineError.message?.includes('validation') || 
              onlineError.message?.includes('400') ||
              onlineError.response?.status === 400) {
            throw onlineError; // Relancer les erreurs de validation
          }
          
          // Pour les autres erreurs, continuer en mode hors ligne
          console.log('📱 Basculement vers mode hors ligne...');
        }
      }

      // 🔥 MODE HORS LIGNE OU FALLBACK
      console.log('📱 Sauvegarde en mode hors ligne');
      
      // Générer un ID temporaire pour les nouveaux clients
      const tempId = clientData.id || Date.now();
      
      const operation = {
        id: tempId,
        type: isEdit ? 'UPDATE_CLIENT' : 'CREATE_CLIENT',
        data: { 
          ...clientData, 
          tempId: tempId,
          // 🔥 GÉOLOCALISATION INCLUSE: Plus besoin de sauvegarde séparée
          offlineTimestamp: new Date().toISOString()
        },
        status: 'PENDING',
        timestamp: new Date().toISOString()
      };

      await savePendingOperation(operation);
      
      // Sauvegarder localement pour usage immédiat
      await saveClientLocally(operation.data);

      setSyncStatus(SYNC_STATUS.OFFLINE);

      return {
        success: true,
        data: operation.data,
        message: 'Client sauvegardé localement (sera synchronisé une fois en ligne)',
        isOffline: true
      };

    } catch (error) {
      console.error('❌ Erreur saveClient:', error);
      setSyncStatus(SYNC_STATUS.ERROR);
      
      return {
        success: false,
        error: error.message || 'Erreur lors de la sauvegarde du client'
      };
    }
  }, [isOnline]);

  // ============================================
  // GESTION DES OPÉRATIONS EN ATTENTE
  // ============================================

  const savePendingOperation = async (operation) => {
    try {
      const existingOperations = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
      const operations = existingOperations ? JSON.parse(existingOperations) : [];
      
      // Éviter les doublons pour le même client
      const filteredOperations = operations.filter(op => 
        !(op.type === operation.type && op.data.tempId === operation.data.tempId)
      );
      
      filteredOperations.push(operation);
      
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(filteredOperations));
      setPendingOperations(filteredOperations);
      
      console.log('💾 Opération sauvegardée localement:', operation.type);
    } catch (error) {
      console.error('❌ Erreur sauvegarde opération en attente:', error);
    }
  };

  const saveClientLocally = async (clientData) => {
    try {
      const localClients = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_CLIENTS);
      const clients = localClients ? JSON.parse(localClients) : [];
      
      // Éviter les doublons
      const filteredClients = clients.filter(c => c.tempId !== clientData.tempId);
      filteredClients.push(clientData);
      
      await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_CLIENTS, JSON.stringify(filteredClients));
      console.log('💾 Client sauvegardé localement');
    } catch (error) {
      console.error('❌ Erreur sauvegarde client local:', error);
    }
  };

  // ============================================
  // SYNCHRONISATION DES OPÉRATIONS EN ATTENTE
  // ============================================

  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || pendingOperations.length === 0) {
      console.log('📱 Aucune synchronisation nécessaire:', { isOnline, pendingCount: pendingOperations.length });
      return;
    }

    setSyncStatus(SYNC_STATUS.SYNCING);
    console.log('🔄 Début synchronisation:', pendingOperations.length, 'opérations');

    const syncResults = {
      success: 0,
      errors: 0,
      details: []
    };

    for (const operation of pendingOperations) {
      try {
        console.log('🔄 Synchronisation:', operation.type, operation.data.tempId);
        
        let result;
        
        switch (operation.type) {
          case 'CREATE_CLIENT':
            // 🔥 SUPPRESSION DU CHAMP tempId pour la création
            const { tempId, offlineTimestamp, ...clientDataForCreation } = operation.data;
            result = await clientService.createClient(clientDataForCreation);
            break;
            
          case 'UPDATE_CLIENT':
            if (operation.data.id) {
              const { tempId: tempId2, offlineTimestamp: offlineTimestamp2, ...clientDataForUpdate } = operation.data;
              result = await clientService.updateClient(operation.data.id, clientDataForUpdate);
            } else {
              throw new Error('ID client manquant pour la mise à jour');
            }
            break;
            
          default:
            throw new Error(`Type d'opération non supporté: ${operation.type}`);
        }

        if (result.success) {
          syncResults.success++;
          syncResults.details.push({
            operation: operation.type,
            tempId: operation.data.tempId,
            realId: result.data?.id,
            status: 'success'
          });
        } else {
          throw new Error(result.error || 'Erreur inconnue');
        }

      } catch (error) {
        console.error('❌ Erreur sync opération:', operation.type, error);
        syncResults.errors++;
        syncResults.details.push({
          operation: operation.type,
          tempId: operation.data.tempId,
          status: 'error',
          error: error.message
        });
      }
    }

    // Nettoyer les opérations synchronisées avec succès
    if (syncResults.success > 0) {
      const successfulTempIds = syncResults.details
        .filter(d => d.status === 'success')
        .map(d => d.tempId);
        
      const remainingOperations = pendingOperations.filter(op => 
        !successfulTempIds.includes(op.data.tempId)
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(remainingOperations));
      setPendingOperations(remainingOperations);
    }

    setSyncStatus(SYNC_STATUS.SUCCESS);
    setLastSyncDate(new Date());
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    console.log('✅ Synchronisation terminée:', syncResults);
    
    return syncResults;
  }, [isOnline, pendingOperations]);

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================

  const clearLocalData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PENDING_OPERATIONS,
        STORAGE_KEYS.LOCAL_CLIENTS,
        STORAGE_KEYS.SYNC_STATUS,
        STORAGE_KEYS.LAST_SYNC
      ]);
      
      setPendingOperations([]);
      setLastSyncDate(null);
      setSyncStatus(SYNC_STATUS.IDLE);
      
      console.log('🧹 Données locales nettoyées');
    } catch (error) {
      console.error('❌ Erreur nettoyage données locales:', error);
    }
  };

  const getSyncStats = () => {
    return {
      isOnline,
      syncStatus,
      lastSyncDate,
      pendingOperationsCount: pendingOperations.length,
      pendingOperations: pendingOperations.map(op => ({
        type: op.type,
        tempId: op.data.tempId,
        timestamp: op.timestamp
      }))
    };
  };

  const forceSyncNow = async () => {
    if (!isOnline) {
      throw new Error('Synchronisation impossible: pas de connexion réseau');
    }
    
    return await syncPendingOperations();
  };

  // ============================================
  // RETOUR DU HOOK
  // ============================================

  return {
    // États
    isOnline,
    syncStatus,
    lastSyncDate,
    pendingOperationsCount: pendingOperations.length,
    
    // Fonctions principales
    saveClient,
    syncPendingOperations,
    
    // Fonctions utilitaires
    clearLocalData,
    getSyncStats,
    forceSyncNow,
    
    // Constantes
    SYNC_STATUS
  };
};