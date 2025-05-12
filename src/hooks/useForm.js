import { useForm as useReactHookForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';

/**
 * Hook personnalisé pour gérer les formulaires avec validation Yup et gestion des erreurs API.
 * 
 * @param {Object} schema - Le schéma de validation Yup
 * @param {Object} defaultValues - Les valeurs par défaut du formulaire
 * @param {Function} onSubmit - La fonction à exécuter lors de la soumission du formulaire
 * @param {Object} options - Options supplémentaires pour useForm
 * @returns {Object} - Les propriétés et méthodes pour gérer le formulaire
 */
export const useForm = (schema, defaultValues = {}, onSubmit, options = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Configuration de react-hook-form avec validation Yup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
    setValue,
    getValues,
    watch,
    ...rest
  } = useReactHookForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
    mode: options.mode || 'onBlur',
    ...options
  });

  // Fonction d'enveloppement pour la soumission du formulaire
  const submitHandler = async (data) => {
    // Réinitialiser les états
    setIsSubmitting(true);
    setServerError(null);
    setServerFieldErrors({});
    setSubmitSuccess(false);

    try {
      const result = await onSubmit(data);
      setSubmitSuccess(true);
      
      // Exécuter la fonction de succès si elle est fournie
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      // Réinitialiser le formulaire si nécessaire
      if (options.resetOnSuccess) {
        reset(options.resetValues || defaultValues);
      }
      
      return result;
    } catch (error) {
      setServerError(error.message || 'Une erreur est survenue');
      
      // Gérer les erreurs de validation côté serveur
      if (error.validationErrors) {
        const fieldErrors = {};
        
        // Convertir les erreurs de validation en format compatible avec react-hook-form
        Object.entries(error.validationErrors).forEach(([field, errorMsg]) => {
          fieldErrors[field] = {
            type: 'server',
            message: Array.isArray(errorMsg) ? errorMsg[0] : errorMsg
          };
        });
        
        setServerFieldErrors(fieldErrors);
      }
      
      // Exécuter la fonction d'erreur si elle est fournie
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Méthode pour effacer les erreurs serveur
  const clearServerErrors = () => {
    setServerError(null);
    setServerFieldErrors({});
  };

  // Fusionner les erreurs du client et du serveur
  const mergedErrors = {
    ...errors,
    ...serverFieldErrors
  };

  return {
    control,
    handleSubmit: handleSubmit(submitHandler),
    reset,
    errors: mergedErrors,
    isValid,
    isDirty,
    setValue,
    getValues,
    watch,
    isSubmitting,
    serverError,
    submitSuccess,
    clearServerErrors,
    ...rest
  };
};

export default useForm;