// src/hooks/useAutoRefresh.js
import { useCallback } from 'react';

/**
 * Hook pour gérer le rechargement automatique après les opérations
 * 
 * @param {Function} refreshFunction - Fonction à appeler pour recharger
 * @param {number} delay - Délai en ms avant rechargement (défaut: 500ms)
 * @returns {Function} - Fonction à appeler après une opération
 */
export const useAutoRefresh = (refreshFunction, delay = 500) => {
  const triggerRefresh = useCallback((showAlert = false, alertMessage = 'Opération réussie') => {
    // Optionnel: Afficher une alerte de succès
    if (showAlert && alertMessage) {
      // Pour React Native Web et mobile
      if (typeof Alert !== 'undefined') {
        Alert.alert('Succès', alertMessage);
      } else if (typeof window !== 'undefined' && window.alert) {
        window.alert(alertMessage);
      }
    }

    // Recharger après un délai
    setTimeout(() => {
      if (refreshFunction && typeof refreshFunction === 'function') {
        console.log('🔄 Rechargement automatique déclenché');
        refreshFunction();
      }
    }, delay);
  }, [refreshFunction, delay]);

  return triggerRefresh;
};

/**
 * Hook pour créer une fonction de rechargement groupé
 * Utile quand on veut recharger plusieurs composants en même temps
 * 
 * @param {Array<Function>} refreshFunctions - Tableau de fonctions de rechargement
 * @returns {Function} - Fonction de rechargement groupé
 */
export const useGroupedRefresh = (refreshFunctions = []) => {
  const refreshAll = useCallback(async () => {
    console.log('🔄 Rechargement groupé - fonctions:', refreshFunctions.length);
    
    // Exécuter toutes les fonctions de rechargement en parallèle
    const promises = refreshFunctions
      .filter(fn => typeof fn === 'function')
      .map(fn => {
        try {
          return Promise.resolve(fn());
        } catch (error) {
          console.warn('Erreur lors du rechargement:', error);
          return Promise.resolve();
        }
      });

    await Promise.allSettled(promises);
    console.log('✅ Rechargement groupé terminé');
  }, [refreshFunctions]);

  return refreshAll;
};

export default useAutoRefresh;