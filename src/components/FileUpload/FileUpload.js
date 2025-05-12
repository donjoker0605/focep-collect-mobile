// src/components/FileUpload/FileUpload.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const FileUpload = ({
  label,
  onFileSelect,
  fileTypes = ['image/*', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  maxSize = 5, // En MB
  style,
  error,
  value, // Peut être une URL ou un objet de fichier local
  placeholder = "Choisir un fichier",
  required = false,
  allowCamera = true,
  showPreview = true,
  disabled = false,
  multiple = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(value || null);
  
  // Permissions pour la caméra
  const checkCameraPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Désolé, nous avons besoin des permissions de la caméra pour cette fonctionnalité.'
        );
        return false;
      }
    }
    return true;
  };
  
  // Sélection via la bibliothèque de documents
  const handlePickDocument = async () => {
    if (disabled) return;
    
    try {
      setIsLoading(true);
      
      let result;
      if (multiple) {
        result = await DocumentPicker.getDocumentAsync({
          type: fileTypes,
          multiple: true,
          copyToCacheDirectory: true
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: fileTypes,
          copyToCacheDirectory: true
        });
      }
      
      if (result.canceled) {
        setIsLoading(false);
        return;
      }
      
      // Traiter un ou plusieurs fichiers
      const files = multiple ? result.assets : [result.assets[0]];
      
      // Vérifier la taille du/des fichier(s)
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        const fileSizeInMB = fileInfo.size / 1024 / 1024;
        
        if (fileSizeInMB > maxSize) {
          setIsLoading(false);
          Alert.alert(
            'Fichier trop volumineux',
            `La taille du fichier dépasse la limite autorisée de ${maxSize}MB.`
          );
          return;
        }
      }
      
      // Mettre à jour l'état et informer le parent
      if (multiple) {
        setSelectedFile(files);
        onFileSelect && onFileSelect(files);
      } else {
        setSelectedFile(files[0]);
        onFileSelect && onFileSelect(files[0]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      setIsLoading(false);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection du fichier.');
    }
  };
  
  // Prise de photo avec la caméra
  const handleTakePhoto = async () => {
    if (disabled) return;
    
    const hasPermission = await checkCameraPermissions();
    if (!hasPermission) return;
    
    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (result.canceled) {
        setIsLoading(false);
        return;
      }
      
      const photo = result.assets[0];
      
      // Vérifier la taille de l'image
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      const fileSizeInMB = fileInfo.size / 1024 / 1024;
      
      if (fileSizeInMB > maxSize) {
        setIsLoading(false);
        Alert.alert(
          'Image trop volumineuse',
          `La taille de l'image dépasse la limite autorisée de ${maxSize}MB.`
        );
        return;
      }
      
      // Créer un objet compatible avec le format de fichier
      const file = {
        uri: photo.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: fileInfo.size,
      };
      
      setSelectedFile(file);
      onFileSelect && onFileSelect(file);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      setIsLoading(false);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la prise de photo.');
    }
  };
  
  // Supprimer le fichier sélectionné
  const handleRemoveFile = () => {
    if (disabled) return;
    
    setSelectedFile(null);
    onFileSelect && onFileSelect(null);
  };
  
  // Formater le nom du fichier pour l'affichage
  const formatFileName = (file) => {
    if (!file) return '';
    
    // Si c'est une URL, extraire le nom du fichier
    if (typeof file === 'string') {
      const parts = file.split('/');
      return parts[parts.length - 1];
    }
    
    // Si c'est un objet avec un nom
    if (file.name) {
      // Limiter la longueur du nom si nécessaire
      if (file.name.length > 20) {
        const ext = file.name.split('.').pop();
        return `${file.name.substring(0, 15)}...${ext ? `.${ext}` : ''}`;
      }
      return file.name;
    }
    
    // Par défaut
    return 'Fichier sélectionné';
  };
  
  // Vérifier si c'est une image
  const isImage = (file) => {
    if (!file) return false;
    
    if (typeof file === 'string') {
      return file.match(/\.(jpeg|jpg|gif|png)$/i) !== null;
    }
    
    return file.type && file.type.startsWith('image/');
  };
  
  // Obtenir l'URI du fichier
  const getFileUri = (file) => {
    if (!file) return null;
    
    if (typeof file === 'string') {
      return file;
    }
    
    return file.uri;
  };
  
  // Obtenir l'icône en fonction du type de fichier
  const getFileIcon = (file) => {
    if (!file) return 'document-outline';
    
    if (isImage(file)) {
      return 'image-outline';
    }
    
    const fileName = typeof file === 'string' ? file : file.name || '';
    
    if (fileName.endsWith('.pdf')) {
      return 'document-text-outline';
    }
    
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return 'grid-outline';
    }
    
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return 'create-outline';
    }
    
    return 'document-outline';
  };
  
  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.requiredAsterisk}>*</Text>}
          </Text>
        </View>
      )}
      
      <View style={[
        styles.uploadContainer,
        error && styles.errorContainer,
        disabled && styles.disabledContainer,
      ]}>
        {selectedFile ? (
          <View style={styles.fileContainer}>
            {showPreview && isImage(selectedFile) ? (
              <Image
                source={{ uri: getFileUri(selectedFile) }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fileIconContainer}>
                <Ionicons
                  name={getFileIcon(selectedFile)}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
            )}
            
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {formatFileName(selectedFile)}
              </Text>
              {!disabled && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemoveFile}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.gray} />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {!disabled && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.documentButton]}
            onPress={handlePickDocument}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="document-outline" size={18} color={theme.colors.white} />
                <Text style={styles.buttonText}>
                  {multiple ? 'Sélectionner des fichiers' : 'Sélectionner un fichier'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          {allowCamera && (
            <TouchableOpacity
              style={[styles.button, styles.cameraButton]}
              onPress={handleTakePhoto}
              disabled={isLoading}
            >
              <Ionicons name="camera-outline" size={18} color={theme.colors.white} />
              <Text style={styles.buttonText}>Prendre une photo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  requiredAsterisk: {
    color: theme.colors.error,
    marginLeft: 2,
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: theme.colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    backgroundColor: `${theme.colors.lightGray}50`,
  },
  errorContainer: {
    borderColor: theme.colors.error,
  },
  disabledContainer: {
    opacity: 0.7,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imagePreview: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileName: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
  },
  documentButton: {
    backgroundColor: theme.colors.primary,
    marginRight: 8,
  },
  cameraButton: {
    backgroundColor: theme.colors.info,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default FileUpload;