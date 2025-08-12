// src/hooks/useTransferLogic.js
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { transferService } from '../services';
import * as HapticsCompat from '../utils/haptics';

/**
 * Hook personnalisé pour la logique de transfert de clients
 * Encapsule toute la logique métier du transfert
 */
export const useTransferLogic = () => {
  const [transferring, setTransferring] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);

  // Valider les données de transfert
  const validateTransferData = useCallback((sourceId, destId, clientIds) => {
    if (!sourceId) {
      return { valid: false, error: 'Collecteur source requis' };
    }
    
    if (!destId) {
      return { valid: false, error: 'Collecteur destination requis' };
    }
    
    if (sourceId === destId) {
      return { valid: false, error: 'Les collecteurs source et destination ne peuvent pas être identiques' };
    }
    
    if (!clientIds || clientIds.length === 0) {
      return { valid: false, error: 'Au moins un client doit être sélectionné' };
    }

    return { valid: true };
  }, []);

  // Préparer le transfert (validation + aperçu)
  const prepareTransfer = useCallback((sourceId, destId, clientIds) => {
    const validation = validateTransferData(sourceId, destId, clientIds);
    
    if (!validation.valid) {
      setError(validation.error);
      HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Error);
      return false;
    }

    setError(null);
    setShowPreview(true);
    HapticsCompat.impactAsync(HapticsCompat.ImpactFeedbackStyle.Light);
    return true;
  }, [validateTransferData]);

  // Exécuter le transfert
  const executeTransfer = useCallback(async (transferData, forceConfirm = false) => {
    try {
      setTransferring(true);
      setError(null);
      setShowPreview(false);

      const requestData = {
        ...transferData,
        forceConfirm: forceConfirm ? "true" : undefined
      };

      const response = await transferService.transferComptes(requestData);

      if (response.success) {
        HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Success);
        
        // Message de succès
        Alert.alert(
          'Transfert réussi',
          response.message || 'Les clients ont été transférés avec succès.',
          [{ text: 'OK' }]
        );

        return { success: true, data: response.data };
      } else {
        throw new Error(response.error || 'Erreur lors du transfert');
      }
    } catch (error) {
      console.error('Erreur lors du transfert:', error);
      
      // Gestion des erreurs spéciales
      if (error.response?.status === 202) {
        // Nécessite confirmation
        const errorData = error.response.data?.data || {};
        if (errorData.requiresConfirmation) {
          return {
            success: false,
            needsConfirmation: true,
            validation: errorData.validation,
            message: error.response.data?.message || 'Confirmation requise'
          };
        }
      }

      const errorMessage = error.message || 'Erreur lors du transfert';
      setError(errorMessage);
      
      HapticsCompat.notificationAsync(HapticsCompat.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Erreur de transfert',
        errorMessage,
        [{ text: 'OK' }]
      );

      return { success: false, error: errorMessage };
    } finally {
      setTransferring(false);
    }
  }, []);

  // Annuler le transfert (fermer l'aperçu)
  const cancelTransfer = useCallback(() => {
    setShowPreview(false);
    setError(null);
  }, []);

  // Reset de l'état
  const resetTransferState = useCallback(() => {
    setTransferring(false);
    setShowPreview(false);
    setError(null);
  }, []);

  return {
    // États
    transferring,
    showPreview,
    error,
    
    // Actions
    prepareTransfer,
    executeTransfer,
    cancelTransfer,
    resetTransferState,
    setError,
    
    // Utilitaires
    validateTransferData
  };
};

export default useTransferLogic;