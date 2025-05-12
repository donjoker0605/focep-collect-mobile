// src/services/SyncService.js
import { Platform } from 'react-native';
import { Subject } from 'rxjs';
import uuid from 'react-native-uuid';

// Constantes pour les statuts de synchronisation
export const SYNC_STATUS = {
  SYNCED: 'synced',         // Tout est synchronisé
  PENDING: 'pending',       // Modifications locales en attente de synchronisation
  SYNCING: 'syncing',       // Synchronisation en cours
  ERROR: 'error',           // Erreur de synchronisation
  OFFLINE: 'offline'        // Mode hors ligne
};

// Clés de stockage des données
const STORAGE_KEYS = {
  PENDING_TRANSACTIONS: 'focep_pending_transactions',
  PENDING_CLIENTS: 'focep_pending_clients',
  LAST_SYNC: 'focep_last_sync',
  OFFLINE_CACHE: 'focep_offline_cache',
};

// Intervalle de synchronisation automatique (en ms)
const AUTO_SYNC_INTERVAL = 60000; // 1 minute

class SyncServiceClass {
  constructor() {
    // Subjects pour communiquer avec les composants
    this.statusChange = new Subject();
    this.pendingCountChange = new Subject();
    
    // État interne
    this._currentStatus = SYNC_STATUS.SYNCED;
    this._pendingCount = 0;
    this._isOnline = true;
    this._autoSyncInterval = null;
    this._isSyncing = false;
    
    // Initialiser seulement sur l'appareil mobile, pas en environnement web
    if (Platform.OS !== 'web') {
      this._init();
    }
  }
  
  // Initialisation
  async _init() {
    try {
      // Importer les modules nécessaires uniquement sur l'appareil
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const NetInfo = (await import('@react-native-community/netinfo')).default;
      
      // Vérifier l'état de la connexion
      const netInfo = await NetInfo.fetch();
      this._isOnline = netInfo?.isConnected || true;
      
      // Configurer l'écouteur de connexion
      NetInfo.addEventListener(state => {
        const wasOffline = !this._isOnline;
        this._isOnline = state?.isConnected || true;
        
        // Si on vient de se reconnecter, lancer une synchronisation
        if (wasOffline && this._isOnline) {
          setTimeout(() => this.sync(), 2000); // Attendre 2 secondes pour stabiliser la connexion
        }
        
        // Mettre à jour le statut s'il est en mode hors ligne
        if (!this._isOnline && this._currentStatus !== SYNC_STATUS.OFFLINE) {
          this._updateStatus(SYNC_STATUS.OFFLINE);
        } else if (this._isOnline && this._currentStatus === SYNC_STATUS.OFFLINE) {
          // Vérifier s'il y a des éléments en attente
          this._checkPendingItems();
        }
      });
      
      // Vérifier les éléments en attente
      await this._checkPendingItems();
      
      // Configurer la synchronisation automatique
      this._setupAutoSync();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du SyncService:', error);
    }
  }
  
  // Mettre à jour le statut
  _updateStatus(status) {
    this._currentStatus = status;
    this.statusChange.next(status);
  }
  
  // Mettre à jour le nombre d'éléments en attente
  async _updatePendingCount() {
    try {
      if (Platform.OS === 'web') {
        this._pendingCount = 0;
        this.pendingCountChange.next(0);
        return;
      }
      
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const pendingTransactions = await this._getPendingTransactions(AsyncStorage);
      const pendingClients = await this._getPendingClients(AsyncStorage);
      
      const total = pendingTransactions.length + pendingClients.length;
      this._pendingCount = total;
      this.pendingCountChange.next(total);
      
      // Mettre à jour le statut en fonction du nombre d'éléments en attente
      if (this._isOnline) {
        if (total > 0 && this._currentStatus !== SYNC_STATUS.SYNCING) {
          this._updateStatus(SYNC_STATUS.PENDING);
        } else if (total === 0 && this._currentStatus !== SYNC_STATUS.SYNCING) {
          this._updateStatus(SYNC_STATUS.SYNCED);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nombre d\'éléments en attente:', error);
    }
  }
  
  // Vérifier s'il y a des éléments en attente
  async _checkPendingItems() {
    if (Platform.OS !== 'web') {
      await this._updatePendingCount();
    }
  }
  
  // Configurer la synchronisation automatique
  _setupAutoSync() {
    // Nettoyer l'intervalle existant s'il y en a un
    if (this._autoSyncInterval) {
      clearInterval(this._autoSyncInterval);
    }
    
    // Créer un nouvel intervalle
    this._autoSyncInterval = setInterval(() => {
      if (this._isOnline && this._pendingCount > 0 && !this._isSyncing) {
        this.sync();
      }
    }, AUTO_SYNC_INTERVAL);
  }
  
  // Récupérer les transactions en attente
  async _getPendingTransactions(AsyncStorage) {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_TRANSACTIONS);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions en attente:', error);
      return [];
    }
  }
  
  // Enregistrer les transactions en attente
  async _savePendingTransactions(transactions) {
    try {
      if (Platform.OS === 'web') return;
      
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TRANSACTIONS, JSON.stringify(transactions));
      await this._updatePendingCount();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des transactions en attente:', error);
    }
  }
  
  // Récupérer les clients en attente
  async _getPendingClients(AsyncStorage) {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CLIENTS);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des clients en attente:', error);
      return [];
    }
  }
  
  // Enregistrer les clients en attente
  async _savePendingClients(clients) {
    try {
      if (Platform.OS === 'web') return;
      
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CLIENTS, JSON.stringify(clients));
      await this._updatePendingCount();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des clients en attente:', error);
    }
  }
  
  // Sauvegarder dans le cache hors ligne
  async _saveToOfflineCache(key, data) {
    try {
      if (Platform.OS === 'web') return;
      
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      // Récupérer le cache existant
      const cacheDataStr = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CACHE);
      const cacheData = cacheDataStr ? JSON.parse(cacheDataStr) : {};
      
      // Mettre à jour le cache
      cacheData[key] = {
        data,
        timestamp: Date.now()
      };
      
      // Sauvegarder le cache mis à jour
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_CACHE, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans le cache hors ligne:', error);
    }
  }
  
  // Récupérer du cache hors ligne
  async _getFromOfflineCache(key, maxAge = 86400000) { // Par défaut: 24 heures
    try {
      if (Platform.OS === 'web') return null;
      
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cacheDataStr = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CACHE);
      if (!cacheDataStr) return null;
      
      const cacheData = JSON.parse(cacheDataStr);
      const cachedItem = cacheData[key];
      
      if (!cachedItem) return null;
      
      // Vérifier si les données sont encore valides
      const now = Date.now();
      if (now - cachedItem.timestamp > maxAge) {
        return null; // Les données sont trop anciennes
      }
      
      return cachedItem.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du cache hors ligne:', error);
      return null;
    }
  }
  
  // ------------- MÉTHODES PUBLIQUES -------------
  
  // Enregistrer une transaction (online ou offline)
  async saveTransaction(transactionData) {
    // Si en ligne, essayer d'envoyer directement
    if (this._isOnline) {
      try {
        const result = await this._mockApiCall('saveTransaction', transactionData);
        return result;
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la transaction en ligne:', error);
        // Si erreur, sauvegarder en mode hors ligne
      }
    }
    
    if (Platform.OS === 'web') {
      // Simuler une réponse en mode web
      return {
        ...transactionData,
        id: 'web-' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        status: 'COMPLETED'
      };
    }
    
    // Sauvegarder en mode hors ligne
    const offlineTransaction = {
      ...transactionData,
      id: uuid.v4(), // Générer un ID temporaire
      tempId: uuid.v4(), // ID pour identifier cette transaction localement
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      offlineCreated: true
    };
    
    // Ajouter à la liste des transactions en attente
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const pendingTransactions = await this._getPendingTransactions(AsyncStorage);
    pendingTransactions.push(offlineTransaction);
    await this._savePendingTransactions(pendingTransactions);
    
    // Mettre à jour le statut
    this._updateStatus(SYNC_STATUS.PENDING);
    
    return offlineTransaction;
  }
  
  // Créer ou mettre à jour un client (online ou offline)
  async saveClient(clientData, isUpdate = false) {
    // Si en ligne, essayer d'envoyer directement
    if (this._isOnline) {
      try {
        const result = isUpdate 
          ? await this._mockApiCall('updateClient', clientData)
          : await this._mockApiCall('createClient', clientData);
        return result;
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du client en ligne:', error);
        // Si erreur, sauvegarder en mode hors ligne
      }
    }
    
    if (Platform.OS === 'web') {
      // Simuler une réponse en mode web
      return {
        ...clientData,
        id: isUpdate ? clientData.id : 'web-' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
    }
    
    // Sauvegarder en mode hors ligne
    const offlineClient = {
      ...clientData,
      tempId: uuid.v4(), // ID pour identifier ce client localement
      createdAt: new Date().toISOString(),
      isUpdate: isUpdate,
      offlineCreated: true
    };
    
    // Si c'est une création, générer un ID temporaire
    if (!isUpdate) {
      offlineClient.id = uuid.v4();
    }
    
    // Ajouter à la liste des clients en attente
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const pendingClients = await this._getPendingClients(AsyncStorage);
    pendingClients.push(offlineClient);
    await this._savePendingClients(pendingClients);
    
    // Mettre à jour le statut
    this._updateStatus(SYNC_STATUS.PENDING);
    
    return offlineClient;
  }
  
  // Récupérer les collecteurs (avec gestion offline)
  async getCollecteurs() {
    // Si en ligne, récupérer depuis l'API et mettre en cache
    if (this._isOnline) {
      try {
        const collecteurs = await this._mockApiCall('getCollecteurs');
        
        if (Platform.OS !== 'web') {
          await this._saveToOfflineCache('collecteurs', collecteurs);
        }
        
        return collecteurs;
      } catch (error) {
        console.error('Erreur lors de la récupération des collecteurs:', error);
        // Si erreur, essayer de récupérer depuis le cache
      }
    }
    
    if (Platform.OS === 'web') {
      // Données fictives pour le web
      return [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@example.com',
          telephone: '+237 655 123 456',
          agence: { id: 1, nom: 'Agence Centrale' },
          montantMaxRetrait: 150000,
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Sophie',
          email: 'sophie.martin@example.com',
          telephone: '+237 677 234 567',
          agence: { id: 1, nom: 'Agence Centrale' },
          montantMaxRetrait: 200000,
        }
      ];
    }
    
    // Récupérer depuis le cache
    const cachedCollecteurs = await this._getFromOfflineCache('collecteurs');
    if (cachedCollecteurs) {
      return cachedCollecteurs;
    }
    
    // Si pas de cache, retourner un tableau vide
    return [];
  }
  
  // Forcer une synchronisation
  async forceSyncing() {
    if (!this._isOnline) {
      console.log('Impossible de synchroniser: hors ligne');
      return false;
    }
    
    if (this._isSyncing) {
      console.log('Synchronisation déjà en cours');
      return false;
    }
    
    return this.sync();
  }
  
  // Synchroniser les données
  async sync() {
    if (!this._isOnline || this._isSyncing || Platform.OS === 'web') {
      return false;
    }
    
    this._isSyncing = true;
    this._updateStatus(SYNC_STATUS.SYNCING);
    
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const pendingTransactions = await this._getPendingTransactions(AsyncStorage);
      const pendingClients = await this._getPendingClients(AsyncStorage);
      
      if (pendingTransactions.length === 0 && pendingClients.length === 0) {
        this._isSyncing = false;
        this._updateStatus(SYNC_STATUS.SYNCED);
        return true;
      }
      
      // Synchroniser les clients d'abord (ils peuvent être référencés par des transactions)
      let failedClients = [];
      for (const client of pendingClients) {
        try {
          const apiMethod = client.isUpdate ? 'updateClient' : 'createClient';
          // Supprimer les propriétés temporaires
          const { tempId, isUpdate, offlineCreated, ...clientData } = client;
          await this._mockApiCall(apiMethod, clientData);
        } catch (error) {
          console.error('Erreur lors de la synchronisation du client:', error);
          failedClients.push(client);
        }
      }
      
      // Synchroniser les transactions
      let failedTransactions = [];
      for (const transaction of pendingTransactions) {
        try {
          // Supprimer les propriétés temporaires
          const { tempId, offlineCreated, ...transactionData } = transaction;
          await this._mockApiCall('saveTransaction', transactionData);
        } catch (error) {
          console.error('Erreur lors de la synchronisation de la transaction:', error);
          failedTransactions.push(transaction);
        }
      }
      
      // Mettre à jour les listes d'éléments en attente
      await this._savePendingClients(failedClients);
      await this._savePendingTransactions(failedTransactions);
      
      // Mettre à jour la date de dernière synchronisation
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      
      // Mettre à jour le statut
      if (failedClients.length > 0 || failedTransactions.length > 0) {
        this._updateStatus(SYNC_STATUS.ERROR);
      } else {
        this._updateStatus(SYNC_STATUS.SYNCED);
      }
      
      return failedClients.length === 0 && failedTransactions.length === 0;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      this._updateStatus(SYNC_STATUS.ERROR);
      return false;
    } finally {
      this._isSyncing = false;
    }
  }
  
  // Vérifier si les données sont synchronisées
  async isSynced() {
    if (Platform.OS === 'web') return true;
    
    await this._checkPendingItems();
    return this._pendingCount === 0;
  }
  
  // Nettoyer toutes les données en attente (ATTENTION: perte de données)
  async clearPendingData() {
    try {
      if (Platform.OS === 'web') return true;
      
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_TRANSACTIONS);
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_CLIENTS);
      await this._updatePendingCount();
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage des données en attente:', error);
      return false;
    }
  }
  
  // Simuler des appels API pour le développement
  async _mockApiCall(method, data) {
    // Simuler un délai de réseau
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    // Simuler différentes réponses selon la méthode
    switch (method) {
      case 'saveTransaction':
        return {
          ...data,
          id: data.id || `tx-${Math.random().toString(36).substring(2, 9)}`,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
        };
      
      case 'createClient':
        return {
          ...data,
          id: data.id || `client-${Math.random().toString(36).substring(2, 9)}`,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      
      case 'updateClient':
        return {
          ...data,
          updatedAt: new Date().toISOString(),
        };
      
      case 'getCollecteurs':
        return [
          {
            id: 1,
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@example.com',
            telephone: '+237 655 123 456',
            agence: { id: 1, nom: 'Agence Centrale' },
            montantMaxRetrait: 150000,
          },
          {
            id: 2,
            nom: 'Martin',
            prenom: 'Sophie',
            email: 'sophie.martin@example.com',
            telephone: '+237 677 234 567',
            agence: { id: 1, nom: 'Agence Centrale' },
            montantMaxRetrait: 200000,
          }
        ];
      
      default:
        throw new Error(`Méthode API non implémentée: ${method}`);
    }
  }
}

// Exporter une instance unique (singleton)
export const SyncService = new SyncServiceClass();