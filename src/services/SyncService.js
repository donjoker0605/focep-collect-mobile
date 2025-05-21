// src/services/syncService.js
import { Platform } from 'react-native';
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
    // Initialiser les Subjects RxJS
    this.statusChange = new Subject();
    this.pendingCountChange = new Subject();
    
    // Initialiser les autres propriétés
    this.lastSync = null;
    this.pendingCount = 0;
    this.isInitialized = false;
    
    // Déterminer si nous sommes dans un environnement SSR
    this.isSSR = typeof window === 'undefined';
    
    // Ne pas tenter l'initialisation en SSR
    if (!this.isSSR) {
      // Initialisation asynchrone
      this._init();
    } else {
      // En SSR, envoyer un état par défaut
      this.statusChange.next(SYNC_STATUS.IDLE);
      this.pendingCountChange.next(0);
    }
  }
  
  async _init() {
    try {
      // Import dynamique pour éviter les problèmes en SSR
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Récupérer la dernière synchronisation
      try {
        const lastSyncString = await AsyncStorage.getItem('focep_last_sync');
        if (lastSyncString) {
          this.lastSync = new Date(lastSyncString);
        }
      } catch (storageError) {
        console.warn('Erreur lors de la récupération de la dernière synchronisation:', storageError);
      }
      
      // Configuration de l'écouteur de connexion uniquement sur les plateformes supportées
      if (Platform.OS !== 'web') {
        try {
          const NetInfo = (await import('@react-native-community/netinfo')).default;
          
          NetInfo.addEventListener(state => {
            if (state.isConnected && this.pendingCount > 0) {
              // Auto-synchronisation si connexion et opérations en attente
              this.syncNow();
            }
          });
        } catch (netInfoError) {
          console.warn('NetInfo non disponible:', netInfoError);
        }
      }
      
      // Mettre à jour le nombre d'opérations en attente
      await this.updatePendingCount();
      
      // Indiquer que l'initialisation est terminée
      this.isInitialized = true;
      
      // Émettre l'état initial
      this.statusChange.next(SYNC_STATUS.IDLE);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de synchronisation:', error);
      
      // Émettre l'état d'erreur
      this.statusChange.next(SYNC_STATUS.ERROR);
    }
  }
  
  // Mettre à jour le nombre d'opérations en attente
  async updatePendingCount() {
    if (this.isSSR) {
      this.pendingCount = 0;
      this.pendingCountChange.next(0);
      return 0;
    }
    
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const queuedData = await AsyncStorage.getItem('focep_offline_data');
      const queuedOperations = queuedData ? JSON.parse(queuedData) : [];
      
      this.pendingCount = queuedOperations.length;
      this.pendingCountChange.next(this.pendingCount);
      
      return this.pendingCount;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nombre d\'opérations en attente:', error);
      
      this.pendingCount = 0;
      this.pendingCountChange.next(0);
      
      return 0;
    }
  }
  
  // Lancer une synchronisation
  async syncNow() {
    // Ne pas synchroniser en SSR
    if (this.isSSR) {
      return {
        success: false,
        message: 'Synchronisation non disponible dans cet environnement'
      };
    }
    
    let isOnline = true;
    
    // Vérifier l'état de la connexion si possible
    if (Platform.OS !== 'web') {
      try {
        const NetInfo = (await import('@react-native-community/netinfo')).default;
        const netInfo = await NetInfo.fetch();
        isOnline = netInfo.isConnected;
      } catch (error) {
        console.warn('Impossible de vérifier l\'état de la connexion:', error);
      }
    }
    
    if (!isOnline) {
      this.statusChange.next(SYNC_STATUS.OFFLINE);
      return {
        success: false,
        message: 'Appareil hors ligne, impossible de synchroniser'
      };
    }
    
    // Empêcher les synchronisations simultanées
    const currentStatus = this.getCurrentStatus();
    if (currentStatus === SYNC_STATUS.SYNCING) {
      return {
        success: false,
        message: 'Synchronisation déjà en cours'
      };
    }
    
    // Démarrer la synchronisation
    this.statusChange.next(SYNC_STATUS.SYNCING);
    
    try {
      // Import dynamique d'ApiService
      const ApiService = (await import('./api')).default;
      
      // Traiter les opérations en file d'attente
      const result = await ApiService.processQueuedOperations();
      
      // Mettre à jour la date de dernière synchronisation
      this.lastSync = new Date();
      
      // Stocker la nouvelle date si possible
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('focep_last_sync', this.lastSync.toISOString());
      } catch (storageError) {
        console.warn('Impossible de stocker la date de synchronisation:', storageError);
      }
      
      // Mettre à jour le nombre d'opérations en attente
      await this.updatePendingCount();
      
      // Mettre à jour l'état
      this.statusChange.next(SYNC_STATUS.COMPLETED);
      
      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      
      this.statusChange.next(SYNC_STATUS.ERROR);
      
      return {
        success: false,
        message: error.message || 'Erreur lors de la synchronisation'
      };
    }
  }
  
  // Récupérer l'état actuel
  getCurrentStatus() {
    // En SSR, toujours retourner IDLE
    if (this.isSSR) return SYNC_STATUS.IDLE;
    
    // Obtenir la dernière valeur émise si disponible
    const value = this.statusChange?.value;
    return value || SYNC_STATUS.IDLE;
  }
  
  // Récupérer toutes les données d'état
  getStatus() {
    return {
      status: this.getCurrentStatus(),
      lastSync: this.lastSync,
      pendingCount: this.pendingCount
    };
  }
  
  // Nettoyer les données
  async clearSyncData() {
    if (this.isSSR) {
      return {
        success: false,
        message: 'Non disponible dans cet environnement'
      };
    }
    
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      await AsyncStorage.removeItem('focep_offline_data');
      await AsyncStorage.removeItem('focep_last_sync');
      
      this.lastSync = null;
      this.pendingCount = 0;
      this.pendingCountChange.next(0);
      this.statusChange.next(SYNC_STATUS.IDLE);
      
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

// Créer une instance unique
const instance = new SyncService();

export default instance;