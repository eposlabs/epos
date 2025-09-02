import { defineConfig } from 'vite'
import epos from 'epos/vite'
import fs from 'node:fs/promises'
import paralayer from 'paralayer/vite'
import rebundle from 'vite-plugin-rebundle'
import tailwind from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  oxc: {
    jsx: {},
    keepNames: true,
  },

  build: {
    watch: mode === 'production' ? null : {},
    minify: mode !== 'development',
    sourcemap: false,
    rollupOptions: {
      input: {
        'fg': './src/entry/entry.fg.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },

  plugins: [
    epos(),
    tailwind(),
    paralayer({
      input: './src/app',
      output: './src/layers',
    }),
    rebundle(async () => {
      const setup = await fs.readFile('./src/layers/setup.js', 'utf-8')
      return { fg: { banner: { js: setup } } }
    }),
  ],
}))
