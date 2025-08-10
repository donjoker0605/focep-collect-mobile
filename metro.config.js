// metro.config.js - Configuration Metro pour React Native et Web
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Résoudre les conflits de module avec React hooks
config.resolver.alias = {
  'react': path.resolve(__dirname, 'node_modules/react'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
};

// Plateformes supportées (web en premier pour la priorité)
config.resolver.platforms = ['web', 'native', 'android', 'ios'];

// Extensions de fichiers supportées
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.ts',
  'web.tsx',
  'web.js',
  'web.jsx'
];

// Exclure les fichiers de test du bundle
config.resolver.blockList = [
  /.*\/__tests__\/.*/,
  /.*\.test\.(js|jsx|ts|tsx)$/,
  /.*\.spec\.(js|jsx|ts|tsx)$/,
];

// Configuration pour web et mobile
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;