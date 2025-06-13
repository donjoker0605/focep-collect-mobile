// src/hooks/useErrorHandler.js 
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export const useErrorHandler = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorSeverity, setErrorSeverity] = useState('error');

  const handleError = useCallback(async (error, options = {}) => {
    console.error('🚨 Error Handler:', error);
    
    let message = 'Une erreur est survenue';
    
    // Déterminer le message d'erreur approprié
    if (error?.message) {
      message = error.message;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    // Mettre à jour l'état local
    setErrorMessage(message);
    setErrorSeverity(options.severity || 'error');
    
    // Afficher une alerte si nécessaire
    if (options.showAlert !== false) {
      Alert.alert('Erreur', message);
    }
    
    return message;
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setErrorSeverity('error');
  }, []);

  return {
    errorMessage,
    errorSeverity,
    handleError,
    clearError,
  };
};