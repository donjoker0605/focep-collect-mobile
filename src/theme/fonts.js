// src/theme/fonts.js

// Définition des polices de caractères
const fonts = {
  // Familles de polices
  family: {
    // Utiliser des polices système par défaut ou les polices personnalisées chargées
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  
  // Tailles de police
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Poids de police
  weight: {
    thin: '100',
    extraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  },
  
  // Hauteurs de ligne
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Styles prédéfinis
  style: {
    h1: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 1.25,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 1.25,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.25,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.25,
    },
    h5: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.25,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.5,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 1.5,
    },
  },
};

export default fonts;