// src/hooks/useOfflineSync.js
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import SyncService, { SYNC_STATUS } from '../services/SyncService';

export const useOfflineSync = () => {
  // États initiaux
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState(null);
  
  // Détection de l'environnement SSR
  const isSSR = typeof window === 'undefined';

  // Surveillance de la connexion
  useEffect(() => {
    // Ne pas exécuter en SSR
    if (isSSR) return;
    
    let netInfoUnsubscribe = () => {};
    
    const setupNetworkListener = async () => {
      // Utiliser uniquement sur les plateformes natives ou web avec window
      if (Platform.OS !== 'web' || (typeof window !== 'undefined')) {
        try {
          const NetInfo = (await import('@react-native-community/netinfo')).default;
          
          // État initial
          const netState = await NetInfo.fetch();
          setIsOnline(!!netState?.isConnected);
          
          // Écouter les changements
          netInfoUnsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(!!state?.isConnected);
          });
        } catch (error) {
          console.warn('NetInfo non disponible:', error);
        }
      }
    };
    
    setupNetworkListener();
    
    return () => {
      netInfoUnsubscribe();
    };
  }, [isSSR]);
  
  // Surveillance de l'état de synchronisation
  useEffect(() => {
    // Ne pas exécuter en SSR
    if (isSSR) return;
    
    // Vérifier si SyncService est correctement initialisé
    if (!SyncService.statusChange || !SyncService.pendingCountChange) {
      console.warn('SyncService n\'est pas correctement initialisé');
      return () => {}; // Retourner une fonction de nettoyage vide
    }
    
    const statusSubscription = SyncService.statusChange.subscribe(status => {
      setSyncStatus(status);
    });
    
    const pendingSubscription = SyncService.pendingCountChange.subscribe(count => {
      setPendingCount(count);
    });
    
    return () => {
      if (statusSubscription && typeof statusSubscription.unsubscribe === 'function') {
        statusSubscription.unsubscribe();
      }
      
      if (pendingSubscription && typeof pendingSubscription.unsubscribe === 'function') {
        pendingSubscription.unsubscribe();
      }
    };
  }, [isSSR]);
  
  // Fonction de synchronisation
  const syncNow = useCallback(async () => {
    if (isSSR) {
      return { success: false, message: 'Non disponible dans cet environnement' };
    }
    
    try {
      const result = await SyncService.syncNow();
      if (result && result.success) {
        setLastSyncDate(new Date());
      }
      return result;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return { success: false, message: error.message || 'Erreur inconnue' };
    }
  }, [isSSR]);
  
  // Enregistrer une transaction (en ligne ou hors ligne)
  const saveTransaction = useCallback(async (transactionData) => {
    if (isSSR) {
      return { success: false, message: 'Non disponible dans cet environnement' };
    }
    
    try {
      const result = await SyncService.saveTransaction(transactionData);
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la transaction:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }, [isSSR]);
  
  // Enregistrer un client (en ligne ou hors ligne)
  const saveClient = useCallback(async (clientData, isUpdate = false) => {
    if (isSSR) {
      return { success: false, message: 'Non disponible dans cet environnement' };
    }
    
    try {
      const result = await SyncService.saveClient(clientData, isUpdate);
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du client:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }, [isSSR]);
  
  // Obtenir les collecteurs (en ligne ou depuis le cache)
  const getCollecteurs = useCallback(async () => {
    if (isSSR) {
      return { success: false, message: 'Non disponible dans cet environnement' };
    }
    
    try {
      const collecteurs = await SyncService.getCollecteurs();
      return { success: true, data: collecteurs };
    } catch (error) {
      console.error('Erreur lors de la récupération des collecteurs:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }, [isSSR]);
  
  // Vérifier si tout est synchronisé
  const checkIfSynced = useCallback(async () => {
    if (isSSR) {
      return false;
    }
    
    try {
      return await SyncService.isSynced();
    } catch (error) {
      console.error('Erreur lors de la vérification de la synchronisation:', error);
      return false;
    }
  }, [isSSR]);
  
  // Nettoyer les données en attente (DANGER: perte de données)
  const clearPendingData = useCallback(async () => {
    if (isSSR) {
      return { success: false, message: 'Non disponible dans cet environnement' };
    }
    
    try {
      const result = await SyncService.clearPendingData();
      return { success: result, message: result ? 'Données nettoyées' : 'Erreur lors du nettoyage' };
    } catch (error) {
      console.error('Erreur lors du nettoyage des données:', error);
      return { success: false, message: error.message || 'Erreur inconnue' };
    }
  }, [isSSR]);
  
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