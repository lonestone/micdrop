import { raw } from 'esbuild-raw-plugin'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  esbuildPlugins: [raw()],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
})
