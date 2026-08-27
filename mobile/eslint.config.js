const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['.expo/**', 'dist/**'],
    rules: {
      // These effects initialize state from native storage, route parameters, or a
      // controller. React Native does not have a server-rendered state to derive it from.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/components/puzzle-viewer/**/*.tsx'],
    rules: {
      // react-three-fiber JSX elements deliberately use Three.js properties.
      'react/no-unknown-property': 'off',
    },
  },
]);
