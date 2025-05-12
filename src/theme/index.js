// src/theme/index.js
import colors from './colors';
import fonts from './fonts';
import spacing from './spacing';

// Définir des tailles de bordures arrondies
const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Définir les styles d'ombre avec boxShadow pour le web
const shadows = {
  none: {
    boxShadow: 'none',
    elevation: 0,
  },
  small: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  medium: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  large: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
};

const theme = {
  colors,
  fonts,
  spacing,
  borderRadius,
  shadows,
};

export default theme;