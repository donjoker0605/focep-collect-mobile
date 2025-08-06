// src/utils/fileDownloader.js
import { Platform, Alert, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

class FileDownloader {
  
  /**
   * Télécharge et partage un fichier Excel
   * @param {Blob} blob - Le fichier blob
   * @param {string} fileName - Le nom du fichier
   * @returns {Promise<Object>} Résultat du téléchargement
   */
  async downloadExcelFile(blob, fileName) {
    try {
      console.log('📱 Téléchargement Excel:', fileName);

      // Convertir le Blob en base64
      const base64Data = await this.blobToBase64(blob);
      
      // Chemin temporaire du fichier
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Écrire le fichier
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Partager le fichier selon la plateforme
      if (Platform.OS === 'ios') {
        return await this.shareFileIOS(fileUri, fileName);
      } else {
        return await this.shareFileAndroid(fileUri, fileName);
      }

    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      throw new Error(`Impossible de télécharger le fichier: ${error.message}`);
    }
  }

  /**
   * Convertit un Blob en base64
   * @param {Blob} blob 
   * @returns {Promise<string>}
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Retirer le préfixe data:application/octet-stream;base64,
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Partage le fichier sur iOS
   * @param {string} fileUri 
   * @param {string} fileName 
   * @returns {Promise<Object>}
   */
  async shareFileIOS(fileUri, fileName) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('Le partage de fichiers n\'est pas disponible');
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Partager ${fileName}`,
        UTI: 'com.microsoft.excel.xlsx'
      });

      return {
        success: true,
        message: 'Fichier partagé avec succès',
        fileName,
        path: fileUri
      };

    } catch (error) {
      console.error('❌ Erreur partage iOS:', error);
      throw error;
    }
  }

  /**
   * Partage et sauvegarde le fichier sur Android
   * @param {string} fileUri 
   * @param {string} fileName 
   * @returns {Promise<Object>}
   */
  async shareFileAndroid(fileUri, fileName) {
    try {
      // Demander les permissions de stockage
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        // Fallback: partager sans sauvegarder
        return await this.shareFileOnly(fileUri, fileName);
      }

      // Sauvegarder dans les téléchargements
      try {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        const album = await MediaLibrary.getAlbumAsync('Download');
        
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (saveError) {
        console.warn('⚠️ Impossible de sauvegarder, partage seulement:', saveError);
      }

      // Partager le fichier
      return await this.shareFileOnly(fileUri, fileName);

    } catch (error) {
      console.error('❌ Erreur partage Android:', error);
      throw error;
    }
  }

  /**
   * Partage le fichier uniquement (sans sauvegarde)
   * @param {string} fileUri 
   * @param {string} fileName 
   * @returns {Promise<Object>}
   */
  async shareFileOnly(fileUri, fileName) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('Le partage de fichiers n\'est pas disponible');
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Partager ${fileName}`
      });

      return {
        success: true,
        message: 'Fichier partagé avec succès',
        fileName,
        path: fileUri
      };

    } catch (error) {
      console.error('❌ Erreur partage simple:', error);
      throw error;
    }
  }

  /**
   * Affiche une alerte avec les options d'action
   * @param {Object} result 
   */
  showDownloadAlert(result) {
    Alert.alert(
      'Fichier téléchargé',
      `${result.fileName} est prêt à être utilisé`,
      [
        {
          text: 'OK',
          style: 'default'
        },
        {
          text: 'Ouvrir',
          onPress: () => this.openFile(result.path)
        }
      ]
    );
  }

  /**
   * Ouvre le fichier avec l'application par défaut
   * @param {string} filePath 
   */
  async openFile(filePath) {
    try {
      const canOpen = await Linking.canOpenURL(filePath);
      if (canOpen) {
        await Linking.openURL(filePath);
      } else {
        Alert.alert(
          'Impossible d\'ouvrir',
          'Aucune application compatible trouvée pour ouvrir ce fichier'
        );
      }
    } catch (error) {
      console.error('❌ Erreur ouverture fichier:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir le fichier'
      );
    }
  }

  /**
   * Nettoie les fichiers temporaires
   */
  async cleanupTempFiles() {
    try {
      const documentDir = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(documentDir);
      
      // Supprimer les fichiers Excel de plus de 24h
      const cutoffDate = Date.now() - (24 * 60 * 60 * 1000);
      
      for (const file of files) {
        if (file.endsWith('.xlsx')) {
          const filePath = `${documentDir}${file}`;
          const info = await FileSystem.getInfoAsync(filePath);
          
          if (info.exists && info.modificationTime < cutoffDate) {
            await FileSystem.deleteAsync(filePath);
            console.log('🗑️ Fichier temporaire supprimé:', file);
          }
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Erreur nettoyage fichiers temporaires:', error);
    }
  }
}

export default new FileDownloader();