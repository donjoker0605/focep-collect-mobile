module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'dotenv-import',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
        },
      ],
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            'src': './src',
          },
        },
      ],
      'react-native-reanimated/plugin', // ⚠️ Toujours en dernier
    ],
  };
};
