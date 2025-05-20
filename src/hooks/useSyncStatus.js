// src/hooks/useSyncStatus.js
import { useState, useEffect } from 'react';
import SyncService, { SYNC_STATUS } from '../services/syncService';
import NetInfo from '@react-native-community/netinfo';

export default function useSyncStatus() {
  const [status, setStatus] = useState(SYNC_STATUS.IDLE);
  const [lastSync, setLastSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // S'abonner aux changements d'état
  useEffect(() => {
    // Initialiser avec l'état actuel
    const currentStatus = SyncService.getStatus();
    setStatus(currentStatus.status);
    setLastSync(currentStatus.lastSync);
    setPendingCount(currentStatus.pendingCount);
    
    // S'abonner aux changements
    const subscription = SyncService.subscribe(newStatus => {
      setStatus(newStatus);
    });
    
    // S'abonner aux changements de connexion
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    
    // Vérifier l'état initial de la connexion
    NetInfo.fetch().then(state => {
      setIsOnline(!!state.isConnected);
    });
    
    // Mettre à jour le nombre d'opérations en attente
    const updatePendingCount = () => {
      SyncService.updatePendingCount().then(count => {
        setPendingCount(count);
      });
    };
    
    // Mettre à jour régulièrement le nombre d'opérations en attente
    const interval = setInterval(updatePendingCount, 10000);
    
    return () => {
      subscription.unsubscribe();
      unsubscribeNetInfo();
      clearInterval(interval);
    };
  }, []);

  // Fonction pour déclencher une synchronisation
  const syncNow = async () => {
    const result = await SyncService.syncNow();
    
    // Mettre à jour le nombre d'opérations en attente
    const count = await SyncService.updatePendingCount();
    setPendingCount(count);
    
    // Mettre à jour la date de dernière synchronisation
    const currentStatus = SyncService.getStatus();
    setLastSync(currentStatus.lastSync);
    
    return result;
  };

  return {
    status,
    lastSync,
    pendingCount,
    isOnline,
    syncNow
  };
}