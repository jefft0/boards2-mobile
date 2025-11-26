// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
// Allow overriding the local UI module path via an environment variable. If not set,
// fall back to the default relative path. If the folder doesn't exist, skip wiring
// it into Metro so the project works without the local module.
const fs = require('fs')
const workspaceEnv = process.env.GNONATIVE_UI_PATH
const defaultWorkspace = path.resolve(__dirname, '../../gnokey-mobile/mobile/modules/gnonative-ui') // adjust path
const workspaceRoot = workspaceEnv ? path.resolve(workspaceEnv) : defaultWorkspace
const hasWorkspace = fs.existsSync(workspaceRoot)

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

config.resolver.unstable_enablePackageExports = true
if (hasWorkspace) {
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
} else {
  // Local UI module not present. Metro will use the installed package from node_modules.
  console.log(`Local gnonative-ui module not found at ${workspaceRoot}. Skipping workspace wiring.`)
}

module.exports = config
