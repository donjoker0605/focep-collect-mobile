// src/services/cacheService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

class CacheService {
  constructor() {
    this.prefix = 'cache_';
    this.metadataPrefix = 'meta_';
    this.defaultMaxAge = 24 * 60 * 60 * 1000; // 24 heures par défaut
    this.memoryCache = new Map();
  }

  // Générer une clé de cache unique pour une requête
  async _generateCacheKey(endpoint, params = {}) {
    const sortedParams = params ? JSON.stringify(Object.fromEntries(
      Object.entries(params).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    )) : '';
    
    const keyInput = `${endpoint}:${sortedParams}`;
    
    // Hacher la clé pour éviter les problèmes de caractères spéciaux
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyInput
    );
    
    return `${this.prefix}${hash}`;
  }

  // Générer une clé pour les métadonnées
  _getMetadataKey(cacheKey) {
    return `${this.metadataPrefix}${cacheKey}`;
  }

  // Mettre en cache une réponse avec métadonnées
  async set(endpoint, params, data, maxAge = this.defaultMaxAge) {
    try {
      const cacheKey = await this._generateCacheKey(endpoint, params);
      const metadataKey = this._getMetadataKey(cacheKey);
      
      // Préparer les métadonnées
      const metadata = {
        timestamp: Date.now(),
        maxAge,
        endpoint,
        paramsHash: JSON.stringify(params || {}),
      };
      
      // Stocker également en mémoire pour un accès plus rapide
      this.memoryCache.set(cacheKey, {
        data,
        metadata,
      });
      
      // Stocker dans AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(cacheKey, JSON.stringify(data)),
        AsyncStorage.setItem(metadataKey, JSON.stringify(metadata)),
      ]);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise en cache:', error);
      return false;
    }
  }

  // Récupérer une réponse du cache
  async get(endpoint, params = {}, options = {}) {
    try {
      const {
        checkExpiry = true,
        forceRefresh = false,
        maxAge = this.defaultMaxAge,
      } = options;
      
      // Si forcé à rafraîchir, ignorer le cache
      if (forceRefresh) {
        return null;
      }
      
      const cacheKey = await this._generateCacheKey(endpoint, params);
      
      // Essayer d'abord de récupérer depuis la mémoire (plus rapide)
      const memoryResult = this.memoryCache.get(cacheKey);
      
      if (memoryResult) {
        // Vérifier l'expiration si demandé
        if (checkExpiry) {
          const { metadata } = memoryResult;
          const age = Date.now() - metadata.timestamp;
          
          if (age > (metadata.maxAge || maxAge)) {
            // Expiré, supprimer du cache mémoire
            this.memoryCache.delete(cacheKey);
            return null;
          }
        }
        
        return memoryResult.data;
      }
      
      // Si pas en mémoire, essayer depuis AsyncStorage
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      // Récupérer les métadonnées
      const metadataKey = this._getMetadataKey(cacheKey);
      const metadataString = await AsyncStorage.getItem(metadataKey);
      const metadata = metadataString ? JSON.parse(metadataString) : null;
      
      // Vérifier l'expiration si demandé
      if (checkExpiry && metadata) {
        const age = Date.now() - metadata.timestamp;
        
        if (age > (metadata.maxAge || maxAge)) {
          // Expiré, supprimer du cache
          await this._removeItem(cacheKey);
          return null;
        }
      }
      
      // Stocker en mémoire pour un accès plus rapide la prochaine fois
      const data = JSON.parse(cachedData);
      
      this.memoryCache.set(cacheKey, {
        data,
        metadata: metadata || {
          timestamp: Date.now(),
          maxAge,
          endpoint,
          paramsHash: JSON.stringify(params || {}),
        },
      });
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  // Supprimer un élément du cache
  async _removeItem(cacheKey) {
    try {
      const metadataKey = this._getMetadataKey(cacheKey);
      
      // Supprimer du cache mémoire
      this.memoryCache.delete(cacheKey);
      
      // Supprimer de AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem(cacheKey),
        AsyncStorage.removeItem(metadataKey),
      ]);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du cache:', error);
      return false;
    }
  }

  // Invalider un élément spécifique du cache
  async invalidate(endpoint, params = {}) {
    try {
      const cacheKey = await this._generateCacheKey(endpoint, params);
      return await this._removeItem(cacheKey);
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du cache:', error);
      return false;
    }
  }

  // Vider tout le cache
  async clear() {
    try {
      // Vider le cache mémoire
      this.memoryCache.clear();
      
      // Récupérer toutes les clés
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filtrer les clés du cache
      const cacheKeys = allKeys.filter(key => 
        key.startsWith(this.prefix) || key.startsWith(this.metadataPrefix)
      );
      
      // Supprimer toutes les clés du cache
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache:', error);
      return false;
    }
  }

  // Nettoyer le cache expiré
  async cleanup() {
    try {
      // Récupérer toutes les clés
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filtrer les clés de métadonnées
      const metadataKeys = allKeys.filter(key => key.startsWith(this.metadataPrefix));
      
      const keysToRemove = [];
      const now = Date.now();
      
      // Vérifier chaque élément
      await Promise.all(
        metadataKeys.map(async (metadataKey) => {
          try {
            const metadataString = await AsyncStorage.getItem(metadataKey);
            
            if (!metadataString) {
              // Métadonnées manquantes, supprimer
              keysToRemove.push(metadataKey);
              return;
            }
            
            const metadata = JSON.parse(metadataString);
            const age = now - metadata.timestamp;
            
            if (age > (metadata.maxAge || this.defaultMaxAge)) {
              // Expiré, ajouter à la liste à supprimer
              const cacheKey = metadataKey.replace(this.metadataPrefix, this.prefix);
              keysToRemove.push(metadataKey, cacheKey);
              
              // Supprimer également du cache mémoire
              this.memoryCache.delete(cacheKey);
            }
          } catch (e) {
            // En cas d'erreur, supprimer l'entrée
            keysToRemove.push(metadataKey);
          }
        })
      );
      
      // Supprimer les clés expirées
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      
      return keysToRemove.length;
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache expiré:', error);
      return 0;
    }
  }

  // Obtenir des statistiques sur le cache
  async getStats() {
    try {
      // Récupérer toutes les clés
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filtrer les clés du cache
      const cacheKeys = allKeys.filter(key => key.startsWith(this.prefix));
      const metadataKeys = allKeys.filter(key => key.startsWith(this.metadataPrefix));
      
      // Compteurs
      const totalItems = cacheKeys.length;
      const memoryItems = this.memoryCache.size;
      
      // Calculer l'âge moyen des éléments en cache
      let totalAge = 0;
      let validItems = 0;
      const now = Date.now();
      
      await Promise.all(
        metadataKeys.map(async (metadataKey) => {
          try {
            const metadataString = await AsyncStorage.getItem(metadataKey);
            
            if (metadataString) {
              const metadata = JSON.parse(metadataString);
              totalAge += (now - metadata.timestamp);
              validItems++;
            }
          } catch (e) {
            // Ignorer les erreurs
          }
        })
      );
      
      const averageAgeMs = validItems > 0 ? totalAge / validItems : 0;
      
      return {
        totalItems,
        memoryItems,
        averageAgeMs,
        averageAgeMinutes: Math.round(averageAgeMs / (60 * 1000)),
        averageAgeHours: Math.round(averageAgeMs / (60 * 60 * 1000)),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du cache:', error);
      return {
        totalItems: 0,
        memoryItems: this.memoryCache.size,
        averageAgeMs: 0,
        averageAgeMinutes: 0,
        averageAgeHours: 0,
      };
    }
  }
}

export default new CacheService();