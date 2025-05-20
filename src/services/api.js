// src/services/api.js
import axiosInstance, { handleApiError } from '../api/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  async get(endpoint, params = {}, cacheOptions = { useCache: true, maxAge: 60 * 60 * 1000 }) {
    try {
      // Vérifier si on est en ligne
      const isOnline = await this.isConnected();
      
      // Si on est hors ligne et que le cache est activé
      if (!isOnline && cacheOptions.useCache) {
        return this._getFromCache(endpoint, params);
      }
      
      // Requête en ligne
      const response = await axiosInstance.get(endpoint, { params });
      
      // Mise en cache si nécessaire
      if (cacheOptions.useCache) {
        await this._saveToCache(endpoint, params, response.data);
      }
      
      return response.data;
    } catch (error) {
      // Si hors ligne, tenter de récupérer depuis le cache
      if (error.offline && cacheOptions.useCache) {
        return this._getFromCache(endpoint, params);
      }
      
      throw handleApiError(error);
    }
  }

  // Envoyer des données avec gestion hors ligne
  async post(endpoint, data = {}, offlineOptions = { canQueue: false }) {
    try {
      const response = await axiosInstance.post(endpoint, data);
      return response.data;
    } catch (error) {
      // Si hors ligne et la file d'attente est activée
      if (error.offline && offlineOptions.canQueue) {
        await this._queueOperation('POST', endpoint, data);
        return { queued: true, message: 'Opération mise en file d\'attente' };
      }
      
      throw handleApiError(error);
    }
  }

  // Mettre à jour des données avec gestion hors ligne
  async put(endpoint, data = {}, offlineOptions = { canQueue: false }) {
    try {
      const response = await axiosInstance.put(endpoint, data);
      return response.data;
    } catch (error) {
      // Si hors ligne et la file d'attente est activée
      if (error.offline && offlineOptions.canQueue) {
        await this._queueOperation('PUT', endpoint, data);
        return { queued: true, message: 'Opération mise en file d\'attente' };
      }
      
      throw handleApiError(error);
    }
  }

  // Supprimer des données 
  async delete(endpoint, offlineOptions = { canQueue: false }) {
    try {
      const response = await axiosInstance.delete(endpoint);
      return response.data;
    } catch (error) {
      // Si hors ligne et la file d'attente est activée
      if (error.offline && offlineOptions.canQueue) {
        await this._queueOperation('DELETE', endpoint);
        return { queued: true, message: 'Opération mise en file d\'attente' };
      }
      
      throw handleApiError(error);
    }
  }

  // Méthodes privées pour la gestion du cache et des opérations hors ligne
  
  // Récupérer depuis le cache
  async _getFromCache(endpoint, params) {
    try {
      const cacheKey = this._generateCacheKey(endpoint, params);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        throw new Error('Données non disponibles en mode hors ligne');
      }
      
      const { data, timestamp } = JSON.parse(cachedData);
      
      return data;
    } catch (error) {
      throw {
        message: 'Données non disponibles en mode hors ligne',
        isOfflineError: true
      };
    }
  }

  // Sauvegarder dans le cache
  async _saveToCache(endpoint, params, data) {
    try {
      const cacheKey = this._generateCacheKey(endpoint, params);
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erreur lors de la mise en cache:', error);
    }
  }

  // Ajouter une opération à la file d'attente
  async _queueOperation(method, endpoint, data = null) {
    try {
      const queuedOperations = await this._getQueuedOperations();
      
      queuedOperations.push({
        id: uuid.v4(),
        method,
        endpoint,
        data,
        timestamp: Date.now()
      });
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_DATA, 
        JSON.stringify(queuedOperations)
      );
    } catch (error) {
      console.error('Erreur lors de la mise en file d\'attente de l\'opération:', error);
      throw {
        message: 'Impossible de mettre l\'opération en file d\'attente',
        isOfflineError: true
      };
    }
  }

  // Récupérer les opérations en file d'attente
  async _getQueuedOperations() {
    try {
      const queuedData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
      return queuedData ? JSON.parse(queuedData) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des opérations en file d\'attente:', error);
      return [];
    }
  }

  // Traiter les opérations en file d'attente
  async processQueuedOperations() {
    const isOnline = await this.isConnected();
    if (!isOnline) {
      return { success: false, message: 'Hors ligne, impossible de traiter la file d\'attente' };
    }
    
    const queuedOperations = await this._getQueuedOperations();
    
    if (queuedOperations.length === 0) {
      return { success: true, message: 'Aucune opération en file d\'attente' };
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // Traiter les opérations dans l'ordre d'ajout
    for (const operation of queuedOperations) {
      try {
        switch (operation.method) {
          case 'POST':
            await axiosInstance.post(operation.endpoint, operation.data);
            results.success.push(operation.id);
            break;
          case 'PUT':
            await axiosInstance.put(operation.endpoint, operation.data);
            results.success.push(operation.id);
            break;
          case 'DELETE':
            await axiosInstance.delete(operation.endpoint);
            results.success.push(operation.id);
            break;
          default:
            console.warn(`Méthode non prise en charge: ${operation.method}`);
            results.failed.push(operation.id);
        }
      } catch (error) {
        console.error(`Erreur lors du traitement de l'opération ${operation.id}:`, error);
        results.failed.push(operation.id);
      }
    }
    
    // Supprimer les opérations réussies
    const remainingOperations = queuedOperations.filter(
      op => !results.success.includes(op.id)
    );
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_DATA, 
      JSON.stringify(remainingOperations)
    );
    
    return {
      success: true,
      processed: results.success.length,
      failed: results.failed.length,
      remaining: remainingOperations.length
    };
  }

  // Générer une clé de cache
  _generateCacheKey(endpoint, params) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `cache_${endpoint}${paramString ? '_' + paramString : ''}`;
  }
}

export default new ApiService();