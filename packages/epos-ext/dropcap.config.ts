import { defineConfig } from 'dropcap'
import fs from 'node:fs/promises'
import path from 'node:path'

export default defineConfig({
  name: '🧩 epos-ext',

  tailwind: {
    input: './src/app/app.vw.css',
    output: './dist/css/vw.css',
  },

  layers: {
    global: false,
    input: './src/app',
    output: './src/layers',
  },

  build: {
    keepNames: true,
    define: {
      'process.env.EPOS_DEV_WS': 'ws://localhost:2093',
      'process.env.EPOS_DEV_HUB': 'http://localhost:2093',
      'process.env.EPOS_PROD_HUB': 'https://epos.dev',
    },
    bundles: [
      // Execution (ex)
      {
        outfile: './dist/js/ex.js',
        entryPoints: ['./src/entry/entry.ex.ts'],
        sourcemap: false,
        define: { EX_MINI: false },
        banner: { js: ['./src/layers/define.js', './src/app/boot/boot-globals.ex.js'] },
      },

      // Execution without React (ex-mini)
      {
        outfile: './dist/js/ex-mini.js',
        entryPoints: ['./src/entry/entry.ex.ts'],
        sourcemap: false,
        define: { EX_MINI: true },
        banner: { js: ['./src/layers/define.js', './src/app/boot/boot-globals.ex.js'] },
      },

      // Content Script (cs)
      {
        outfile: './dist/js/cs.js',
        entryPoints: ['./src/entry/entry.cs.ts'],
        keepNames: false,
        banner: { js: './src/layers/define.js' },
      },

      // Offscreen (os)
      {
        outfile: './dist/js/os.js',
        entryPoints: ['./src/entry/entry.os.ts'],
        banner: { js: './src/layers/define.js' },
      },

      // View (vw)
      {
        outfile: './dist/js/vw.js',
        entryPoints: ['./src/entry/entry.vw.ts'],
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        alias: { 'react': 'preact/compat', 'react-dom': 'preact/compat' },
        banner: { js: './src/layers/define.js' },
      },

      // Service Worker (sw)
      {
        outfile: './dist/js/sw.js',
        entryPoints: ['./src/entry/entry.sw.ts'],
        banner: { js: './src/layers/define.js' },
      },
    ],
  },
})
