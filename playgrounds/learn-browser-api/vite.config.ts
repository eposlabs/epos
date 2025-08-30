import { defineConfig } from 'vite'
import epos from 'epos/vite'
import fs from 'node:fs/promises'
import paralayer from 'paralayer/vite'
import rebundle from 'vite-plugin-rebundle'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  esbuild: {
    jsx: 'automatic',
    keepNames: true,
  },

  build: {
    watch: mode === 'production' ? null : {},
    minify: mode !== 'development',
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        'fg': './src/entry/entry.fg.tsx',
        'bg': './src/entry/entry.bg.ts',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },

  plugins: [
    epos(),
    tailwindcss(),

    paralayer({
      input: './src/app',
      output: './src/layers',
    }),

    rebundle(async () => {
      const setup = await fs.readFile('./src/layers/setup.js', 'utf-8')
      return {
        'fg': { banner: { js: setup } },
        'bg': { banner: { js: setup } },
      }
    }),
  ],
}))
