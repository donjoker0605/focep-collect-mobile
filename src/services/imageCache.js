// src/services/imageCache.js
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

class ImageCacheService {
 constructor() {
   this.cacheDir = `${FileSystem.cacheDirectory}images/`;
   this.pending = {};
   this.initialized = this._initCacheDirectory();
 }

 // Initialiser le répertoire de cache
 async _initCacheDirectory() {
   try {
     const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
     if (!dirInfo.exists) {
       await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
     }
     return true;
   } catch (error) {
     console.error('Erreur lors de l\'initialisation du cache d\'images:', error);
     return false;
   }
 }

 // Générer une clé de cache pour une URL
 async _getCacheKey(url) {
   // Pour les URLs où l'extension de fichier est évidente, l'extraire
   const extension = url.split('.').pop().split('?')[0]; // Ignorer les paramètres après ?
   const validExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension.toLowerCase()) 
     ? extension.toLowerCase() 
     : 'jpg';
   
   // Hacher l'URL pour créer un nom de fichier unique
   const hashedUrl = await Crypto.digestStringAsync(
     Crypto.CryptoDigestAlgorithm.SHA256,
     url
   );
   
   return `${hashedUrl}.${validExtension}`;
 }

 // Récupérer le chemin de l'image en cache ou la télécharger
 async getCachedImage(url) {
   // S'assurer que le répertoire de cache existe
   await this.initialized;
   
   if (!url) {
     return null;
   }
   
   try {
     // Générer la clé de cache pour cette URL
     const cacheKey = await this._getCacheKey(url);
     const imagePath = `${this.cacheDir}${cacheKey}`;
     
     // Vérifier si l'image est déjà en cache
     const imageInfo = await FileSystem.getInfoAsync(imagePath);
     
     if (imageInfo.exists) {
       // Renvoyer le chemin de l'image en cache
       return imagePath;
     }
     
     // Si l'image est en cours de téléchargement, attendre
     if (this.pending[cacheKey]) {
       return this.pending[cacheKey];
     }
     
     // Télécharger l'image
     this.pending[cacheKey] = this._downloadImage(url, imagePath);
     const cachedPath = await this.pending[cacheKey];
     delete this.pending[cacheKey];
     
     return cachedPath;
   } catch (error) {
     console.error('Erreur lors de la récupération de l\'image en cache:', error);
     // En cas d'erreur, renvoyer l'URL originale
     return url;
   }
 }

 // Télécharger une image et la stocker en cache
 async _downloadImage(url, imagePath) {
   try {
     // Télécharger l'image
     const downloadResult = await FileSystem.downloadAsync(url, imagePath);
     
     if (downloadResult.status === 200) {
       return imagePath;
     } else {
       throw new Error(`Téléchargement échoué avec le statut ${downloadResult.status}`);
     }
   } catch (error) {
     console.error('Erreur lors du téléchargement de l\'image:', error);
     // En cas d'erreur, renvoyer l'URL originale
     return url;
   }
 }

 // Vider le cache d'images
 async clearCache() {
   try {
     // Supprimer le répertoire de cache
     await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
     
     // Recréer le répertoire
     await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
     
     return true;
   } catch (error) {
     console.error('Erreur lors du nettoyage du cache d\'images:', error);
     return false;
   }
 }

 // Obtenir la taille du cache d'images
 async getCacheSize() {
   try {
     const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
     
     if (!dirInfo.exists) {
       return 0;
     }
     
     const result = await FileSystem.readDirectoryAsync(this.cacheDir);
     let totalSize = 0;
     
     // Additionner la taille de tous les fichiers
     await Promise.all(
       result.map(async (fileName) => {
         const fileInfo = await FileSystem.getInfoAsync(`${this.cacheDir}${fileName}`);
         if (fileInfo.exists && fileInfo.size) {
           totalSize += fileInfo.size;
         }
       })
     );
     
     return totalSize;
   } catch (error) {
     console.error('Erreur lors du calcul de la taille du cache:', error);
     return 0;
   }
 }

 // Nettoyer les images anciennes (plus de X jours)
 async cleanOldCache(maxAgeInDays = 7) {
   try {
     const result = await FileSystem.readDirectoryAsync(this.cacheDir);
     const now = new Date();
     
     await Promise.all(
       result.map(async (fileName) => {
         const filePath = `${this.cacheDir}${fileName}`;
         const fileInfo = await FileSystem.getInfoAsync(filePath, { md5: false }); // md5: false pour optimiser
         
         if (fileInfo.exists) {
           const fileTimestamp = fileInfo.modificationTime || 0;
           const fileDate = new Date(fileTimestamp * 1000); // Convertir en millisecondes
           const ageInDays = (now - fileDate) / (1000 * 60 * 60 * 24);
           
           if (ageInDays > maxAgeInDays) {
             await FileSystem.deleteAsync(filePath, { idempotent: true });
           }
         }
       })
     );
     
     return true;
   } catch (error) {
     console.error('Erreur lors du nettoyage du cache ancien:', error);
     return false;
   }
 }
}

export default new ImageCacheService();