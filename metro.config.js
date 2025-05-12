const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = config.resolver.sourceExts.concat('cjs');
config.resolver.extraNodeModules = {
  '@': __dirname,
  'src': path.resolve(__dirname, 'src')
};

config.watchFolders = [
  path.resolve(__dirname, 'src')
];

module.exports = config;