const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Supprimer les références à Expo Router
config.resolver.sourceExts = config.resolver.sourceExts || [];
config.resolver.sourceExts.push('cjs');

module.exports = config;