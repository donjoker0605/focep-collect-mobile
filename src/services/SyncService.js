// src/services/SyncService.js - ✅ COMPATIBLE WEB
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Subject } from 'rxjs';
import { Platform } from 'react-native';

export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  OFFLINE: 'offline'
};

class SyncService {
  constructor() {
    this.statusChange = new Subject();
    this.pendingCountChange = new Subject();
    this.currentStatus = SYNC_STATUS.IDLE;
    this.pendingOperations = [];
    this.lastSyncTime = null;
    
    // ✅ CORRECTION WEB: Vérifier l'environnement
    this.isWeb = Platform.OS === 'web';
    this.canUseAsyncStorage = this.checkAsyncStorageAvailability();
    
    // Initialiser seulement si AsyncStorage est disponible
    if (this.canUseAsyncStorage) {
      this.init();
    } else {
      console.warn('SyncService: AsyncStorage non disponible, désactivation de la synchronisation');
    }
  }

  // ✅ VÉRIFIER LA DISPONIBILITÉ D'ASYNCSTORAGE
  checkAsyncStorageAvailability() {
    try {
      // Sur web, AsyncStorage peut ne pas être disponible
      if (this.isWeb && typeof window !== 'undefined') {
        // Vérifier si AsyncStorage est réellement disponible
        return AsyncStorage && typeof AsyncStorage.getItem === 'function';
      }
      return true; // Sur mobile, AsyncStorage est toujours disponible
    } catch (error) {
      console.warn('AsyncStorage check failed:', error);
      return false;
    }
  }

  async init() {
    if (!this.canUseAsyncStorage) {
      console.warn('SyncService: init() abandonné, AsyncStorage non disponible');
      return;
    }

    try {
      // Charger les opérations en attente depuis le stockage
      const storedOperations = await AsyncStorage.getItem('sync_pending_operations');
      this.pendingOperations = storedOperations ? JSON.parse(storedOperations) : [];
      
      // Notifier le nombre d'opérations en attente
      this.pendingCountChange.next(this.pendingOperations.length);
      
      // ✅ CORRECTION: Utiliser import dynamique pour NetInfo sur web
      if (!this.isWeb) {
        try {
          const NetInfo = await import('@react-native-community/netinfo');
          // Écouter les changements de connexion
          NetInfo.default.addEventListener(state => {
            if (state.isConnected && this.pendingOperations.length > 0) {
              this.syncNow();
            }
          });
        } catch (netInfoError) {
          console.warn('NetInfo non disponible:', netInfoError);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du SyncService:', error);
    }
  }

  // Changer le statut et notifier les observateurs
  setStatus(status) {
    this.currentStatus = status;
    this.statusChange.next(status);
  }

  // Obtenir le statut actuel
  getStatus() {
    return {
      status: this.currentStatus,
      lastSync: this.lastSyncTime,
      pendingCount: this.pendingOperations.length
    };
  }

  // S'abonner aux changements de statut
  subscribe(callback) {
    const subscription = this.statusChange.subscribe(callback);
    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }

  // Ajouter une opération à la file d'attente
  async queueOperation(operation) {
    if (!this.canUseAsyncStorage) {
      console.warn('SyncService: queueOperation abandonné, AsyncStorage non disponible');
      return null;
    }

    try {
      const operationWithId = {
        ...operation,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        retryCount: 0
      };

      this.pendingOperations.push(operationWithId);
      
      // Sauvegarder dans le stockage
      await AsyncStorage.setItem('sync_pending_operations', JSON.stringify(this.pendingOperations));
      
      // Notifier le changement
      this.pendingCountChange.next(this.pendingOperations.length);
      
      // Essayer de synchroniser immédiatement si en ligne
      if (!this.isWeb) {
        try {
          const NetInfo = await import('@react-native-community/netinfo');
          const netInfo = await NetInfo.default.fetch();
          if (netInfo.isConnected) {
            await this.syncNow();
          }
        } catch (netInfoError) {
          console.warn('NetInfo non disponible pour la vérification de connexion');
        }
      } else {
        // Sur web, supposer qu'on est en ligne
        await this.syncNow();
      }
      
      return operationWithId;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'opération en file:', error);
      throw error;
    }
  }

  // Synchroniser maintenant
  async syncNow() {
    if (!this.canUseAsyncStorage) {
      return { success: false, message: 'AsyncStorage non disponible' };
    }

    if (this.currentStatus === SYNC_STATUS.SYNCING) {
      return { success: false, message: 'Synchronisation déjà en cours' };
    }

    try {
      this.setStatus(SYNC_STATUS.SYNCING);
      
      // Sur web, supposer qu'on est en ligne
      let isConnected = true;
      if (!this.isWeb) {
        try {
          const NetInfo = await import('@react-native-community/netinfo');
          const netInfo = await NetInfo.default.fetch();
          isConnected = netInfo.isConnected;
        } catch (netInfoError) {
          console.warn('Impossible de vérifier la connectivité, supposer connecté');
        }
      }

      if (!isConnected) {
        this.setStatus(SYNC_STATUS.OFFLINE);
        return { success: false, message: 'Pas de connexion internet' };
      }

      const results = [];
      const failedOperations = [];

      // Traiter chaque opération en attente
      for (const operation of [...this.pendingOperations]) {
        try {
          await this.processOperation(operation);
          results.push({ id: operation.id, success: true });
          
          // Supprimer l'opération réussie
          this.pendingOperations = this.pendingOperations.filter(op => op.id !== operation.id);
        } catch (error) {
          console.error(`Erreur lors du traitement de l'opération ${operation.id}:`, error);
          operation.retryCount = (operation.retryCount || 0) + 1;
          
          // Si trop d'échecs, abandonner
          if (operation.retryCount >= 3) {
            console.warn(`Abandon de l'opération ${operation.id} après 3 tentatives`);
            this.pendingOperations = this.pendingOperations.filter(op => op.id !== operation.id);
          } else {
            failedOperations.push(operation);
          }
          
          results.push({ id: operation.id, success: false, error: error.message });
        }
      }

      // Sauvegarder les opérations restantes
      await AsyncStorage.setItem('sync_pending_operations', JSON.stringify(this.pendingOperations));
      
      // Notifier les changements
      this.pendingCountChange.next(this.pendingOperations.length);
      
      this.lastSyncTime = new Date();
      this.setStatus(this.pendingOperations.length === 0 ? SYNC_STATUS.SUCCESS : SYNC_STATUS.ERROR);
      
      return {
        success: true,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: failedOperations.length,
        remaining: this.pendingOperations.length
      };
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      this.setStatus(SYNC_STATUS.ERROR);
      return { success: false, message: error.message };
    }
  }

  // Traiter une opération spécifique
  async processOperation(operation) {
    const { type, data } = operation;
    
    switch (type) {
      case 'CREATE_CLIENT':
        const { clientService } = await import('./index');
        return await clientService.createClient(data);
        
      case 'UPDATE_CLIENT':
        const { clientService: updateClientService } = await import('./index');
        return await updateClientService.updateClient(data.id, data);
        
      case 'CREATE_TRANSACTION':
        const { transactionService } = await import('./index');
        return await transactionService.enregistrerEpargne(data);
        
      case 'WITHDRAWAL':
        const { transactionService: withdrawalService } = await import('./index');
        return await transactionService.effectuerRetrait(data);
        
      default:
        throw new Error(`Type d'opération non supporté: ${type}`);
    }
  }

  // Méthodes utilitaires
  async saveTransaction(transactionData) {
    return await this.queueOperation({
      type: 'CREATE_TRANSACTION',
      data: transactionData
    });
  }

  async saveClient(clientData, isUpdate = false) {
    return await this.queueOperation({
      type: isUpdate ? 'UPDATE_CLIENT' : 'CREATE_CLIENT',
      data: clientData
    });
  }

  async getCollecteurs() {
    try {
      const { collecteurService } = await import('./index');
      const result = await collecteurService.getCollecteurs();
      return result.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des collecteurs:', error);
      // Retourner depuis le cache si disponible et AsyncStorage disponible
      if (this.canUseAsyncStorage) {
        try {
          const cachedData = await AsyncStorage.getItem('cached_collecteurs');
          return cachedData ? JSON.parse(cachedData) : [];
        } catch (cacheError) {
          console.error('Erreur lecture cache:', cacheError);
          return [];
        }
      }
      return [];
    }
  }

  async isSynced() {
    return this.pendingOperations.length === 0;
  }

  async clearPendingData() {
    if (!this.canUseAsyncStorage) {
      return true; // Considérer comme nettoyé si AsyncStorage non disponible
    }

    try {
      this.pendingOperations = [];
      await AsyncStorage.removeItem('sync_pending_operations');
      this.pendingCountChange.next(0);
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      return false;
    }
  }

  async updatePendingCount() {
    this.pendingCountChange.next(this.pendingOperations.length);
    return this.pendingOperations.length;
  }
}

export default new SyncService();