import { defineConfig } from 'vite'
import copy from 'rollup-plugin-copy'
import epos from 'epos/vite'
import fs from 'node:fs/promises'
import paralayer from 'paralayer/vite'
import rebundle from 'vite-plugin-rebundle'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
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

    copy({
      targets: [
        {
          src: './public/*',
          dest: './dist',
        },
      ],
    }),

    paralayer({
      input: './src/app',
      output: './src/layers',
    }),

    rebundle(async () => {
      const setup = await fs.readFile('./src/layers/setup.js', 'utf-8')
      return {
        'fg': {
          keepNames: true,
          banner: { js: setup },
        },
        'bg': {
          keepNames: true,
          banner: { js: setup },
        },
      }
    }),
  ],
}))
