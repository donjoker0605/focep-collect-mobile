// src/utils/platformUtils.js - Utilitaires pour la compatibilité multiplateforme
import { Platform, Dimensions } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';

// Dimensions adaptatives
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Styles adaptatifs pour le web
export const getWebStyles = (mobileStyles) => {
  if (!isWeb) return mobileStyles;
  
  return {
    ...mobileStyles,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    ...(getScreenDimensions().width > 768 && {
      paddingHorizontal: 32
    })
  };
};

// Navigation adaptée pour le web
export const getNavigationOptions = (options = {}) => {
  return {
    ...options,
    ...(isWeb && {
      presentation: 'card',
      animationTypeForReplace: 'push',
      gestureEnabled: false,
      headerShown: false
    })
  };
};

// Gestion des événements tactiles pour le web
export const getTouchProps = (onPress) => {
  if (isWeb) {
    return {
      onClick: onPress,
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onPress();
        }
      },
      tabIndex: 0,
      role: 'button'
    };
  }
  return { onPress };
};

// Styles de conteneur principal adaptés
export const getContainerStyles = () => ({
  flex: 1,
  ...(isWeb && {
    width: '100vw',
    height: '100vh',
    maxWidth: '100%',
    maxHeight: '100%',
    overflow: 'hidden'
  })
});

// Styles pour les écrans pleine hauteur
export const getFullScreenStyles = () => ({
  flex: 1,
  ...(isWeb && {
    minHeight: '100vh',
    width: '100vw'
  })
});