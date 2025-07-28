module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './app',
            '@/shared': './app/shared',
            '@/components': './app/shared/components',
            '@/hooks': './app/shared/hooks',
            '@/lib': './app/shared/lib',
            '@/types': './app/shared/types',
            '@/utils': './app/shared/utils',
            '@/services': './app/shared/services',
            '@/stores': './app/shared/stores',
            '@/contexts': './app/shared/contexts',
            '@/config': './app/shared/config',
            '@/constants': './app/shared/constants',
          },
        },
      ],
    ],
  };
}; 