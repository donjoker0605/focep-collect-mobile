// src/hooks/useOfflineSync.js
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { SyncService, SYNC_STATUS } from '../services/SyncService';

/**
 * Hook personnalisé pour gérer les opérations avec synchronisation hors ligne
 */
export const useOfflineSync = () => {
  // États
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.SYNCED);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState(null);
  
  // Surveillance de l'état de la connexion
  useEffect(() => {
    let netInfoUnsubscribe = () => {};
    
    const setupNetworkListener = async () => {
      // Importer NetInfo seulement dans un environnement natif
      if (Platform.OS !== 'web') {
        try {
          const NetInfo = (await import('@react-native-community/netinfo')).default;
          
          // Vérifier l'état initial de la connexion
          const netState = await NetInfo.fetch();
          setIsOnline(!!netState?.isConnected);
          
          // Configurer un écouteur pour les changements d'état
          netInfoUnsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(!!state?.isConnected);
          });
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du NetInfo:', error);
        }
      }
    };
    
    setupNetworkListener();
    
    return () => {
      netInfoUnsubscribe();
    };
  }, []);
  
  // Surveillance de l'état de synchronisation
  useEffect(() => {
    const statusSubscription = SyncService.statusChange.subscribe(status => {
      setSyncStatus(status);
    });
    
    const pendingSubscription = SyncService.pendingCountChange.subscribe(count => {
      setPendingCount(count);
    });
    
    return () => {
      statusSubscription.unsubscribe();
      pendingSubscription.unsubscribe();
    };
  }, []);
  
  // Synchroniser maintenant
  const syncNow = useCallback(async () => {
    if (!isOnline && Platform.OS !== 'web') {
      return { success: false, message: 'Pas de connexion internet' };
    }
    
    try {
      const result = await SyncService.forceSyncing();
      if (result) {
        setLastSyncDate(new Date());
        return { success: true, message: 'Synchronisation réussie' };
      } else {
        return { success: false, message: 'Erreur lors de la synchronisation' };
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return { success: false, message: error.message || 'Erreur inconnue' };
    }
  }, [isOnline]);
  
  // Enregistrer une transaction (en ligne ou hors ligne)
  const saveTransaction = useCallback(async (transactionData) => {
    try {
      const result = await SyncService.saveTransaction(transactionData);
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la transaction:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }, []);
  
  // Enregistrer un client (en ligne ou hors ligne)
  const saveClient = useCallback(async (clientData, isUpdate = false) => {
    try {
      const result = await SyncService.saveClient(clientData, isUpdate);
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du client:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }, []);
  
  // Obtenir les collecteurs (en ligne ou depuis le cache)
  const getCollecteurs = useCallback(async () => {
    try {
      const collecteurs = await SyncService.getCollecteurs();
      return { success: true, data: collecteurs };
    } catch (error) {
      console.error('Erreur lors de la récupération des collecteurs:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }, []);
  
  // Vérifier si tout est synchronisé
  const checkIfSynced = useCallback(async () => {
    try {
      return await SyncService.isSynced();
    } catch (error) {
      console.error('Erreur lors de la vérification de la synchronisation:', error);
      return false;
    }
  }, []);
  
  // Nettoyer les données en attente (DANGER: perte de données)
  const clearPendingData = useCallback(async () => {
    try {
      const result = await SyncService.clearPendingData();
      return { success: result, message: result ? 'Données nettoyées' : 'Erreur lors du nettoyage' };
    } catch (error) {
      console.error('Erreur lors du nettoyage des données:', error);
      return { success: false, message: error.message || 'Erreur inconnue' };
    }
  }, []);
  
  return {
    // États
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncDate,
    
    // Actions
    syncNow,
    saveTransaction,
    saveClient,
    getCollecteurs,
    checkIfSynced,
    clearPendingData
  };
};

export default useOfflineSync;