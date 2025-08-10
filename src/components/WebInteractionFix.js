// src/components/WebInteractionFix.js
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

const WebInteractionFix = ({ children }) => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Fonction pour forcer les interactions sur tous les éléments
    const forceInteractions = () => {
      // Sélectionner tous les éléments potentiellement problématiques
      const elements = document.querySelectorAll('div, button, input, textarea, select, a');
      
      elements.forEach(element => {
        // Forcer pointer-events
        if (element.style.pointerEvents === 'none' || !element.style.pointerEvents) {
          element.style.pointerEvents = 'auto';
        }
        
        // Forcer touch-action
        if (element.style.touchAction === 'none' || !element.style.touchAction) {
          element.style.touchAction = 'auto';
        }
        
        // Ajouter les attributs de navigation clavier
        if (['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
          if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
          }
        }
        
        // Ajouter des gestionnaires d'événements pour débloquer
        if (element.role === 'button' || element.tagName === 'BUTTON') {
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              element.click();
            }
          });
        }
      });
    };

    // Forcer immédiatement
    forceInteractions();

    // Observer les changements DOM et réappliquer
    const observer = new MutationObserver((mutations) => {
      let shouldReapply = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldReapply = true;
        }
      });
      
      if (shouldReapply) {
        setTimeout(forceInteractions, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    // Fonction de nettoyage
    return () => {
      observer.disconnect();
    };
  }, []);

  // Styles inline critiques pour le conteneur
  const webStyles = Platform.OS === 'web' ? {
    pointerEvents: 'auto',
    touchAction: 'auto',
    userSelect: 'auto',
    height: '100%',
    width: '100%',
    overflow: 'auto'
  } : {};

  return React.cloneElement(children, {
    style: [children.props.style, webStyles],
    pointerEvents: Platform.OS === 'web' ? 'auto' : children.props.pointerEvents
  });
};

export default WebInteractionFix;