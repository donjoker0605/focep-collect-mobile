// src/hooks/useLazyLoad.js
import { useState, useEffect, useCallback } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Hook pour gérer le chargement paresseux des données et des composants
 * Particulièrement utile pour les écrans complexes où le chargement immédiat
 * pourrait causer des problèmes de performance
 */
export const useLazyLoad = (options = {}) => {
  const {
    loadDelay = 300,        // Délai avant de commencer à charger
    loadingPlaceholder = true, // Afficher un placeholder pendant le chargement
    priorityLoad = false,   // Priorité élevée pour le chargement (saute la file d'attente)
    dependencies = [],      // Dépendances pour recharger les données
  } = options;

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour déclencher le chargement paresseux
  const triggerLoad = useCallback((callback) => {
    setIsLoading(true);
    
    // Utiliser InteractionManager pour attendre que les animations soient terminées
    const task = InteractionManager.runAfterInteractions(() => {
      // Ajouter un délai supplémentaire si nécessaire
      setTimeout(() => {
        if (callback && typeof callback === 'function') {
          callback();
        }
        setIsReady(true);
        setIsLoading(false);
      }, loadDelay);
    });
    
    // Fonction de nettoyage pour annuler la tâche si le composant est démonté
    return () => task.cancel();
  }, [loadDelay]);

  // Fonction pour charger immédiatement (sans attendre les animations)
  const loadImmediately = useCallback((callback) => {
    setIsLoading(true);
    
    setTimeout(() => {
      if (callback && typeof callback === 'function') {
        callback();
      }
      setIsReady(true);
      setIsLoading(false);
    }, 0);
  }, []);

  // Déclencher le chargement au montage du composant ou quand les dépendances changent
  useEffect(() => {
    setIsReady(false);
    setIsLoading(true);
    
    let cleanup;
    
    if (priorityLoad) {
      cleanup = loadImmediately();
    } else {
      cleanup = triggerLoad();
    }
    
    return cleanup;
  }, dependencies);

  return {
    isReady,
    isLoading,
    triggerLoad,
    loadImmediately,
  };
};

export default useLazyLoad;