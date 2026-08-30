// Metro has to look outside this folder: the packages live in the monorepo and
// pnpm keeps their dependencies in the store rather than next to them.
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]
// Hierarchical lookup stays on: pnpm links each package's dependencies next to
// it in the store, and that is how Metro finds them.

module.exports = config
