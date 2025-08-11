import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [], // No JS/TS output needed - Docusaurus handles its own build
  clean: true,
  dts: false,
  format: [],
  skipNodeModulesBundle: true,
})