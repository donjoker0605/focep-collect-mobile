// src/services/api.js (mise à jour)
import axiosInstance, { handleApiError } from '../api/axiosConfig';
import cacheService from './cacheService';
import NetInfo from '@react-native-community/netinfo';
import { STORAGE_KEYS } from '../config/apiConfig';
import uuid from 'react-native-uuid';

class ApiService {
  // Vérifier la connectivité
  async isConnected() {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable;
  }

  // Récupérer un endpoint avec gestion de cache
  async get(endpoint, params = {}, cacheOptions = {}) {
    try {
      const {
        useCache = true,
        maxAge = 60 * 60 * 1000,
        forceRefresh = false,
        retryCount = 1,
      } = cacheOptions;
      
      // Vérifier si on est en ligne
      const isOnline = await this.isConnected();
      
      // Si le cache est activé, essayer d'abord de récupérer depuis le cache
      if (useCache && !forceRefresh) {
        const cachedData = await cacheService.get(endpoint, params, {
          maxAge,
          // Si hors ligne, ne pas vérifier l'expiration pour assurer la disponibilité des données
          checkExpiry: isOnline,
        });
        
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Si hors ligne et rien en cache, rejeter
      if (!isOnline) {
        throw {
          offline: true,
          message: 'Appareil hors-ligne. Données non disponibles en mode hors ligne.',
        };
      }
      
      // Requête en ligne
      const response = await axiosInstance.get(endpoint, { params });
      
      // Mise en cache si nécessaire
      if (useCache) {
        await cacheService.set(endpoint, params, response.data, maxAge);
      }
      
      return response.data;
    } catch (error) {
      // Si les options de cache le permettent, essayer à nouveau avec une durée d'expiration plus longue
      if (error.offline && cacheOptions.useCache) {
        // Essayer à nouveau avec une durée de vie plus longue
        const extendedCachedData = await cacheService.get(endpoint, params, {
          checkExpiry: false, // Ignorer l'expiration en mode hors ligne
        });
        
        if (extendedCachedData) {
          return extendedCachedData;
        }
      }
      
      // Si c'est une erreur réseau et que nous avons encore des tentatives
      if (error.code === 'ECONNABORTED' && cacheOptions.retryCount > 0) {
        // Attendre un court délai et réessayer
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return this.get(endpoint, params, {
          ...cacheOptions,
          retryCount: cacheOptions.retryCount - 1,
        });
      }
      
      throw handleApiError(error);
    }
	
	// Envoyer des données avec gestion hors ligne
 async post(endpoint, data = {}, options = {}) {
   const {
     canQueue = false,
     invalidateCache = [],
     retryCount = 1,
   } = options;
   
   try {
     const response = await axiosInstance.post(endpoint, data);
     
     // Invalider le cache si nécessaire
     if (invalidateCache && invalidateCache.length > 0) {
       await Promise.all(invalidateCache.map(cacheInfo => 
         cacheService.invalidate(cacheInfo.endpoint, cacheInfo.params)
       ));
     }
     
     return response.data;
   } catch (error) {
     // Si hors ligne et la file d'attente est activée
     if (error.offline && canQueue) {
       await this._queueOperation('POST', endpoint, data, options);
       return { queued: true, message: 'Opération mise en file d\'attente' };
     }
     
     // Si c'est une erreur réseau et que nous avons encore des tentatives
     if (error.code === 'ECONNABORTED' && retryCount > 0) {
       // Attendre un court délai et réessayer
       await new Promise(resolve => setTimeout(resolve, 1000));
       
       return this.post(endpoint, data, {
         ...options,
         retryCount: retryCount - 1,
       });
     }
     
     throw handleApiError(error);
   }
 }

 // Mettre à jour des données avec gestion hors ligne
 async put(endpoint, data = {}, options = {}) {
   const {
     canQueue = false,
     invalidateCache = [],
     retryCount = 1,
   } = options;
   
   try {
     const response = await axiosInstance.put(endpoint, data);
     
     // Invalider le cache si nécessaire
     if (invalidateCache && invalidateCache.length > 0) {
       await Promise.all(invalidateCache.map(cacheInfo => 
         cacheService.invalidate(cacheInfo.endpoint, cacheInfo.params)
       ));
     }
     
     return response.data;
   } catch (error) {
     // Si hors ligne et la file d'attente est activée
     if (error.offline && canQueue) {
       await this._queueOperation('PUT', endpoint, data, options);
       return { queued: true, message: 'Opération mise en file d\'attente' };
     }
     
     // Si c'est une erreur réseau et que nous avons encore des tentatives
     if (error.code === 'ECONNABORTED' && retryCount > 0) {
       // Attendre un court délai et réessayer
       await new Promise(resolve => setTimeout(resolve, 1000));
       
       return this.put(endpoint, data, {
         ...options,
         retryCount: retryCount - 1,
       });
     }
     
     throw handleApiError(error);
   }
 }

 // Supprimer des données 
 async delete(endpoint, options = {}) {
   const {
     canQueue = false,
     invalidateCache = [],
     retryCount = 1,
   } = options;
   
   try {
     const response = await axiosInstance.delete(endpoint);
     
     // Invalider le cache si nécessaire
     if (invalidateCache && invalidateCache.length > 0) {
       await Promise.all(invalidateCache.map(cacheInfo => 
         cacheService.invalidate(cacheInfo.endpoint, cacheInfo.params)
       ));
     }
     
     return response.data;
   } catch (error) {
     // Si hors ligne et la file d'attente est activée
     if (error.offline && canQueue) {
       await this._queueOperation('DELETE', endpoint, null, options);
       return { queued: true, message: 'Opération mise en file d\'attente' };
     }
     
     // Si c'est une erreur réseau et que nous avons encore des tentatives
     if (error.code === 'ECONNABORTED' && retryCount > 0) {
       // Attendre un court délai et réessayer
       await new Promise(resolve => setTimeout(resolve, 1000));
       
       return this.delete(endpoint, {
         ...options,
         retryCount: retryCount - 1,
       });
     }
     
     throw handleApiError(error);
   }
 }

 // Ajouter une opération à la file d'attente
 async _queueOperation(method, endpoint, data = null, options = {}) {
   try {
     // Récupérer la file d'attente actuelle
     const queuedOperationsStr = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
     const queuedOperations = queuedOperationsStr ? JSON.parse(queuedOperationsStr) : [];
     
     // Créer une nouvelle opération
     const operation = {
       id: uuid.v4(),
       method,
       endpoint,
       data,
       options: {
         ...options,
         // Ne pas conserver la fonction de rappel
         onSuccess: undefined,
         onError: undefined,
       },
       timestamp: Date.now(),
       attemptCount: 0,
     };
     
     // Ajouter à la file d'attente
     queuedOperations.push(operation);
     
     // Sauvegarder la file d'attente mise à jour
     await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(queuedOperations));
     
     // Émettre un événement pour notifier l'utilisateur
     if (global.syncEventEmitter) {
       global.syncEventEmitter.emit('OPERATION_QUEUED', {
         count: queuedOperations.length,
         operation,
       });
     }
   } catch (error) {
     console.error('Erreur lors de la mise en file d\'attente de l\'opération:', error);
     throw {
       message: 'Impossible de mettre l\'opération en file d\'attente',
       isOfflineError: true,
       originalError: error,
     };
   }
 }

 // Récupérer les opérations en file d'attente
 async getQueuedOperations() {
   try {
     const queuedOperationsStr = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
     return queuedOperationsStr ? JSON.parse(queuedOperationsStr) : [];
   } catch (error) {
     console.error('Erreur lors de la récupération des opérations en file d\'attente:', error);
     return [];
   }
 }

 // Traiter les opérations en file d'attente
 async processQueuedOperations() {
   const isOnline = await this.isConnected();
   if (!isOnline) {
     return { 
       success: false, 
       message: 'Hors ligne, impossible de traiter la file d\'attente',
       processed: 0,
       failed: 0,
       remaining: 0,
     };
   }
   
   const queuedOperations = await this.getQueuedOperations();
   
   if (queuedOperations.length === 0) {
     return { 
       success: true, 
       message: 'Aucune opération en file d\'attente', 
       processed: 0,
       failed: 0,
       remaining: 0,
     };
   }
   
   const results = {
     success: [],
     failed: [],
   };
   
   // Traiter les opérations dans l'ordre d'ajout
   for (const operation of queuedOperations) {
     try {
       // Incrémenter le compteur de tentatives
       operation.attemptCount += 1;
       
       switch (operation.method) {
         case 'POST':
           // Exclure l'option canQueue pour éviter une boucle
           const postOptions = { ...operation.options, canQueue: false };
           await this.post(operation.endpoint, operation.data, postOptions);
           results.success.push(operation.id);
           break;
         case 'PUT':
           const putOptions = { ...operation.options, canQueue: false };
           await this.put(operation.endpoint, operation.data, putOptions);
           results.success.push(operation.id);
           break;
         case 'DELETE':
           const deleteOptions = { ...operation.options, canQueue: false };
           await this.delete(operation.endpoint, deleteOptions);
           results.success.push(operation.id);
           break;
         default:
           console.warn(`Méthode non prise en charge: ${operation.method}`);
           results.failed.push(operation.id);
       }
     } catch (error) {
       console.error(`Erreur lors du traitement de l'opération ${operation.id}:`, error);
       
       // Ne considérer comme échouée que si nous avons dépassé le nombre maximum de tentatives
       if (operation.attemptCount >= 3) { // Maximum 3 tentatives
         results.failed.push(operation.id);
       }
     }
   }
   
   // Filtrer les opérations restantes
   const remainingOperations = queuedOperations.filter(op => 
     !results.success.includes(op.id) && !results.failed.includes(op.id)
   );
   
   // Conserver les opérations échouées pour réessayer plus tard
   const failedOperations = queuedOperations.filter(op => 
     results.failed.includes(op.id)
   );
   
   // Conserver les opérations n'ayant pas atteint le nombre maximum de tentatives
   const operationsToKeep = [...remainingOperations, ...failedOperations];
   
   // Mettre à jour la file d'attente
   await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(operationsToKeep));
   
   // Mettre à jour la date de dernière synchronisation
   await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
   
   return {
     success: true,
     processed: results.success.length,
     failed: results.failed.length,
     remaining: operationsToKeep.length,
   };
 }

 // Invalider le cache pour un point de terminaison spécifique
 async invalidateCache(endpoint, params = {}) {
   return await cacheService.invalidate(endpoint, params);
 }

 // Vider complètement le cache
 async clearCache() {
   return await cacheService.clear();
 }

 // Obtenir des statistiques sur le cache
 async getCacheStats() {
   return await cacheService.getStats();
 }

 // Nettoyer le cache expiré
 async cleanupCache() {
   return await cacheService.cleanup();
 }
}

export default new ApiService();