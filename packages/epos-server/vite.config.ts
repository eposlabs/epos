import { defineConfig } from 'vite'
import layers from 'vite-plugin-layers'

export default defineConfig({
  plugins: [
    layers({
      default: 'gl',
      input: './src/app',
      output: './src/layers',
      globalize: true,
    }),
  ],
})
