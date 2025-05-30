// src/hooks/useErrorHandler.js
import { useState, useCallback } from 'react';
import errorService, { ERROR_TYPES, ERROR_SEVERITY } from '../services/errorService';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRoute } from '@react-navigation/native';

export const useErrorHandler = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorSeverity, setErrorSeverity] = useState('error');
  const netInfo = useNetInfo();
  const route = useRoute();

  const handleError = useCallback(async (error, options = {}) => {
    // Enrichir le contexte avec les informations de navigation
    const context = {
      ...options.context,
      route: route?.name || 'unknown',
    };
    
   // Détecter automatiquement le type d'erreur si non spécifié
   let type = options.type;
   if (!type) {
     if (!netInfo.isConnected) {
       type = ERROR_TYPES.NETWORK;
     } else if (error.status === 401 || error.status === 403) {
       type = ERROR_TYPES.AUTH;
     } else if (error.status === 400 && error.data?.validationErrors) {
       type = ERROR_TYPES.VALIDATION;
     } else if (error.status >= 500) {
       type = ERROR_TYPES.API;
     } else if (error.name === 'SyntaxError' || error.name === 'TypeError') {
       type = ERROR_TYPES.RUNTIME;
     } else {
       type = ERROR_TYPES.UNEXPECTED;
     }
   }

   // Traiter l'erreur via le service
   const result = await errorService.handleError(error, {
     ...options,
     type,
     context,
   });

   // Mettre à jour l'état local pour l'affichage dans le composant
   if (result.show) {
     setErrorMessage(result.message);
     setErrorSeverity(result.severity);
   }

   return result.message;
 }, [netInfo.isConnected, route]);

 // Effacer le message d'erreur
 const clearError = useCallback(() => {
   setErrorMessage(null);
 }, []);

 return {
   errorMessage,
   errorSeverity,
   handleError,
   clearError,
 };
};