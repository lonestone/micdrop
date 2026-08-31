import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/web.ts',
    './src/node.ts',
    './src/react-native.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['onnxruntime-react-native'],
})
