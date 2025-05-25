// src/services/SyncService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Subject } from 'rxjs';

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
    
    // Initialiser
    this.init();
  }

  async init() {
    try {
      // Charger les opérations en attente depuis le stockage
      const storedOperations = await AsyncStorage.getItem('sync_pending_operations');
      this.pendingOperations = storedOperations ? JSON.parse(storedOperations) : [];
      
      // Notifier le nombre d'opérations en attente
      this.pendingCountChange.next(this.pendingOperations.length);
      
      // Écouter les changements de connexion
      NetInfo.addEventListener(state => {
        if (state.isConnected && this.pendingOperations.length > 0) {
          this.syncNow();
        }
      });
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
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
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
    if (this.currentStatus === SYNC_STATUS.SYNCING) {
      return { success: false, message: 'Synchronisation déjà en cours' };
    }

    try {
      this.setStatus(SYNC_STATUS.SYNCING);
      
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
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
    const { type, data, endpoint } = operation;
    
    // Ici tu peux importer tes services selon le type d'opération
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

  // Méthodes utilitaires pour les hooks
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
      // Retourner depuis le cache si disponible
      const cachedData = await AsyncStorage.getItem('cached_collecteurs');
      return cachedData ? JSON.parse(cachedData) : [];
    }
  }

  async isSynced() {
    return this.pendingOperations.length === 0;
  }

  async clearPendingData() {
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