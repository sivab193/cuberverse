const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The website and Expo app deliberately share the pure TypeScript puzzle and
// algorithm core. Watching the repository root keeps edits live in both apps.
config.watchFolders = [path.resolve(__dirname, '..')];

module.exports = config;
