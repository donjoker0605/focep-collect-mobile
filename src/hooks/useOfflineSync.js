// src/hooks/useOfflineSync.js - VERSION SIMPLIFIÉE ET FONCTIONNELLE
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import clientService from '../services/clientService'; 

// États de synchronisation simples
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error'
};

export const useOfflineSync = () => {
  // États initialisés
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState(null);
  
  // Détection de la connexion réseau
  useEffect(() => {
    let netInfoUnsubscribe = () => {};
    
    const setupNetworkListener = async () => {
      try {
        if (Platform.OS !== 'web') {
          const NetInfo = (await import('@react-native-community/netinfo')).default;
          
          // État initial
          const netState = await NetInfo.fetch();
          const connected = netState?.isConnected && netState?.isInternetReachable;
          setIsOnline(connected);
          
          // Écouter les changements
          netInfoUnsubscribe = NetInfo.addEventListener(state => {
            const nowConnected = state?.isConnected && state?.isInternetReachable;
            const wasOffline = !isOnline;
            
            setIsOnline(nowConnected);
            
            // Si on vient de se reconnecter, synchroniser
            if (wasOffline && nowConnected) {
              syncPendingOperations();
            }
          });
        } else {
          // Sur web, considérer comme toujours en ligne
          setIsOnline(true);
        }
      } catch (error) {
        console.warn('NetInfo non disponible:', error);
        setIsOnline(true); // Par défaut en ligne
      }
    };
    
    setupNetworkListener();
    loadPendingCount();
    
    return () => {
      if (netInfoUnsubscribe) {
        netInfoUnsubscribe();
      }
    };
  }, []);

  // Charger le nombre d'opérations en attente
  const loadPendingCount = async () => {
    try {
      const pending = await AsyncStorage.getItem('pendingOperations');
      const operations = pending ? JSON.parse(pending) : [];
      setPendingCount(operations.length);
    } catch (error) {
      console.error('Erreur chargement pending count:', error);
      setPendingCount(0);
    }
  };

  // Sauvegarder une opération en attente
  const savePendingOperation = async (operation) => {
    try {
      const existing = await AsyncStorage.getItem('pendingOperations');
      const operations = existing ? JSON.parse(existing) : [];
      
      const newOperation = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...operation
      };
      
      operations.push(newOperation);
      
      await AsyncStorage.setItem('pendingOperations', JSON.stringify(operations));
      setPendingCount(operations.length);
      
      return newOperation;
    } catch (error) {
      console.error('Erreur sauvegarde opération:', error);
      throw error;
    }
  };

  // Supprimer une opération en attente
  const removePendingOperation = async (operationId) => {
    try {
      const existing = await AsyncStorage.getItem('pendingOperations');
      const operations = existing ? JSON.parse(existing) : [];
      
      const filtered = operations.filter(op => op.id !== operationId);
      
      await AsyncStorage.setItem('pendingOperations', JSON.stringify(filtered));
      setPendingCount(filtered.length);
    } catch (error) {
      console.error('Erreur suppression opération:', error);
    }
  };

  const saveClient = useCallback(async (clientData, isEdit = false) => {
    console.log('💾 useOfflineSync.saveClient:', { clientData, isEdit, isOnline });
    
    try {
      // Validation des données d'abord
      if (!clientData.nom || !clientData.prenom || !clientData.numeroCni) {
        return {
          success: false,
          error: 'Données client incomplètes',
          validationErrors: {
            nom: !clientData.nom ? 'Le nom est requis' : null,
            prenom: !clientData.prenom ? 'Le prénom est requis' : null,
            numeroCni: !clientData.numeroCni ? 'Le numéro CNI est requis' : null
          }
        };
      }

      // Si en ligne, essayer la sauvegarde directe
      if (isOnline) {
        setSyncStatus(SYNC_STATUS.SYNCING);
        
        try {
          let result;
          
          if (isEdit && clientData.id) {
            result = await clientService.updateClient(clientData.id, clientData);
          } else {
            result = await clientService.createClient(clientData);
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
          if (onlineError.message?.includes('validation') || onlineError.message?.includes('400')) {
            throw onlineError; // Relancer les erreurs de validation
          }
        }
      }

      // Mode hors ligne ou fallback après échec en ligne
      console.log('📱 Sauvegarde en mode hors ligne');
      
      const operation = {
        type: isEdit ? 'UPDATE_CLIENT' : 'CREATE_CLIENT',
        data: { ...clientData, tempId: clientData.id || Date.now() },
        status: 'PENDING'
      };

      await savePendingOperation(operation);
      
      // Sauvegarder localement aussi pour usage immédiat
      await saveClientLocally(operation.data);

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

  // Sauvegarder localement pour usage immédiat
  const saveClientLocally = async (clientData) => {
    try {
      const localClients = await AsyncStorage.getItem('localClients');
      const clients = localClients ? JSON.parse(localClients) : [];
      
      const clientToSave = {
        ...clientData,
        lastModified: new Date().toISOString(),
        isLocal: true
      };
      
      if (clientData.id || clientData.tempId) {
        // Mise à jour
        const index = clients.findIndex(c => 
          c.id === clientData.id || c.tempId === clientData.tempId
        );
        if (index >= 0) {
          clients[index] = clientToSave;
        } else {
          clients.push(clientToSave);
        }
      } else {
        // Création
        clientToSave.tempId = Date.now();
        clients.push(clientToSave);
      }
      
      await AsyncStorage.setItem('localClients', JSON.stringify(clients));
      console.log('💾 Client sauvegardé localement');
    } catch (error) {
      console.error('❌ Erreur sauvegarde locale:', error);
    }
  };

  // Synchroniser les opérations en attente
  const syncPendingOperations = async () => {
    try {
      const pending = await AsyncStorage.getItem('pendingOperations');
      const operations = pending ? JSON.parse(pending) : [];
      
      if (operations.length === 0) return;
      
      console.log(`🔄 Synchronisation de ${operations.length} opérations...`);
      setSyncStatus(SYNC_STATUS.SYNCING);

      for (const operation of operations) {
        try {
          let result;
          
          switch (operation.type) {
            case 'CREATE_CLIENT':
              result = await clientService.createClient(operation.data);
              break;
            case 'UPDATE_CLIENT':
              result = await clientService.updateClient(operation.data.id, operation.data);
              break;
            default:
              console.warn('⚠️ Type d\'opération non supporté:', operation.type);
              continue;
          }

          if (result && (result.success !== false)) {
            console.log('✅ Opération synchronisée:', operation.id);
            await removePendingOperation(operation.id);
          }

        } catch (error) {
          console.error('❌ Erreur sync opération:', operation.id, error.message);
          // Continuer avec les autres opérations
        }
      }
      
      setSyncStatus(SYNC_STATUS.SUCCESS);
      setLastSyncDate(new Date());
      
    } catch (error) {
      console.error('❌ Erreur synchronisation globale:', error);
      setSyncStatus(SYNC_STATUS.ERROR);
    }
  };

  // Synchronisation manuelle
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      return { success: false, message: 'Aucune connexion réseau' };
    }
    
    try {
      await syncPendingOperations();
      return { success: true, message: 'Synchronisation terminée' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [isOnline]);

  // Nettoyer les données en attente (à utiliser avec précaution)
  const clearPendingData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('pendingOperations');
      await AsyncStorage.removeItem('localClients');
      setPendingCount(0);
      return { success: true, message: 'Données nettoyées' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  return {
    // États
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncDate,
    
    // Actions principales
    saveClient,
    syncNow,
    clearPendingData
  };
};

export default useOfflineSync;