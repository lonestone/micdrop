import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts', './src/silero.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react-native',
    'react-native-audio-api',
    'onnxruntime-react-native',
  ],
})
