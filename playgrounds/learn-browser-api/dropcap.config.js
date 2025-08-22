import { defineConfig } from 'dropcap'
import { epos } from 'epos/plugin-esbuild'
import fs from 'node:fs/promises'

export default defineConfig({
  name: 'test-browser-api',
  tailwind: {
    input: './src/entry/entry.css',
    output: './dist/app.css',
  },
  layers: {
    default: 'gl',
    input: './src/app',
    output: './src/layers',
  },
  build: {
    plugins: [epos()],
    jsx: 'automatic',
    keepNames: true,
    bundles: [
      {
        outfile: './dist/app.js',
        entryPoints: ['./src/entry/entry.tsx'],
        banner: { js: './src/layers/define.js' },
      },
    ],
  },
})
