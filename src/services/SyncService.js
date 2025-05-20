// src/services/syncService.js
import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/apiConfig';
import NetInfo from '@react-native-community/netinfo';
import { Subject } from 'rxjs';

// États de synchronisation
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  COMPLETED: 'completed',
  ERROR: 'error',
  OFFLINE: 'offline'
};

class SyncService {
  constructor() {
    this.syncStatus = new Subject();
    this.lastSync = null;
    this.pendingCount = 0;
    this.isInitialized = false;
    
    // Initialisation
    this._init();
  }
  
  async _init() {
    try {
      // Récupérer la dernière synchronisation
      const lastSyncString = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSyncString) {
        this.lastSync = new Date(lastSyncString);
      }
      
      // Configurer l'écouteur de connexion
      NetInfo.addEventListener(state => {
        if (state.isConnected && this.pendingCount > 0) {
          // Auto-synchronisation si on récupère la connexion et qu'il y a des opérations en attente
          this.syncNow();
        }
      });
      
      // Mettre à jour le nombre d'opérations en attente
      await this.updatePendingCount();
      
      this.isInitialized = true;
      this.syncStatus.next(SYNC_STATUS.IDLE);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de synchronisation:', error);
    }
  }
  
  // Mettre à jour le nombre d'opérations en attente
  // src/services/syncService.js (suite)
  async updatePendingCount() {
    try {
      const queuedData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
      const queuedOperations = queuedData ? JSON.parse(queuedData) : [];
      this.pendingCount = queuedOperations.length;
      return this.pendingCount;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nombre d\'opérations en attente:', error);
      this.pendingCount = 0;
      return 0;
    }
  }
  
  // Lancer une synchronisation
  async syncNow() {
    // Vérifier l'état de la connexion
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      this.syncStatus.next(SYNC_STATUS.OFFLINE);
      return {
        success: false,
        message: 'Appareil hors ligne, impossible de synchroniser'
      };
    }
    
    // Si une synchronisation est déjà en cours, ne pas en démarrer une autre
    if (this.syncStatus.value === SYNC_STATUS.SYNCING) {
      return {
        success: false,
        message: 'Synchronisation déjà en cours'
      };
    }
    
    // Démarrer la synchronisation
    this.syncStatus.next(SYNC_STATUS.SYNCING);
    
    try {
      // Traiter les opérations en file d'attente
      const result = await ApiService.processQueuedOperations();
      
      // Mettre à jour la date de dernière synchronisation
      this.lastSync = new Date();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSync.toISOString());
      
      // Mettre à jour le nombre d'opérations en attente
      await this.updatePendingCount();
      
      // Mettre à jour l'état
      this.syncStatus.next(SYNC_STATUS.COMPLETED);
      
      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      this.syncStatus.next(SYNC_STATUS.ERROR);
      
      return {
        success: false,
        message: error.message || 'Erreur lors de la synchronisation'
      };
    }
  }
  
  // Récupérer l'état actuel
  getStatus() {
    return {
      status: this.syncStatus.value || SYNC_STATUS.IDLE,
      lastSync: this.lastSync,
      pendingCount: this.pendingCount
    };
  }
  
  // S'abonner aux changements d'état
  subscribe(callback) {
    return this.syncStatus.subscribe(callback);
  }
  
  // Nettoyer les données
  async clearSyncData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      this.lastSync = null;
      this.pendingCount = 0;
      this.syncStatus.next(SYNC_STATUS.IDLE);
      
      return {
        success: true,
        message: 'Données de synchronisation nettoyées avec succès'
      };
    } catch (error) {
      console.error('Erreur lors du nettoyage des données de synchronisation:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du nettoyage des données'
      };
    }
  }
}

export default new SyncService();