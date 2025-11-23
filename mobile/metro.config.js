// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(__dirname, '../../gnokey-mobile/mobile/modules/gnonative-ui') // adjust path

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

config.resolver.unstable_enablePackageExports = true
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')]

// Block node_modules inside the UI library to prevent bundling conflicts
config.resolver.blockList = [...Array.from(config.resolver.blockList ?? []), new RegExp(`${workspaceRoot}/node_modules/.*`)]

// Optional but recommended if using TypeScript
config.resolver.sourceExts.push('cjs')

config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  expo: path.resolve(projectRoot, 'node_modules/expo')
  // Add other critical shared dependencies here if you encounter similar issues later
}

module.exports = config
