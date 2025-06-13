// metro.config.js - Ajoutez ce fichier à la racine du projet
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Résoudre les conflits de module avec React hooks
config.resolver.alias = {
  'react': require.resolve('react'),
  'react-native': require.resolve('react-native'),
};

// Éviter les doublons de React
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Exclure les fichiers de test du bundle
config.resolver.blockList = [
  /.*\/__tests__\/.*/,
  /.*\.test\.(js|jsx|ts|tsx)$/,
  /.*\.spec\.(js|jsx|ts|tsx)$/,
];

module.exports = config;