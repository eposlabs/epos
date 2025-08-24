import { defineConfig } from 'dropcap'
import { epos } from 'epos/plugin-esbuild'
import fs from 'node:fs/promises'

export default defineConfig({
  name: 'learn-browser-api',
  tailwind: {
    input: './src/entry/entry.fg.css',
    output: './dist/fg.css',
  },
  layers: {
    input: './src/app',
    output: './src/layers',
  },
  build: {
    plugins: [epos()],
    jsx: 'automatic',
    keepNames: true,
    bundles: [
      {
        outfile: './dist/fg.js',
        entryPoints: ['./src/entry/entry.fg.tsx'],
        banner: { js: './src/layers/define.js' },
      },
      {
        outfile: './dist/bg.js',
        entryPoints: ['./src/entry/entry.bg.ts'],
        banner: { js: './src/layers/define.js' },
      },
    ],
  },
})
