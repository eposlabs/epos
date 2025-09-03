import { defineConfig } from 'rolldown-vite'
import copy from 'rollup-plugin-copy'
import fs from 'node:fs/promises'
import paralayer from 'paralayer/vite'
import preact from '@preact/preset-vite'
import rebundle from 'vite-plugin-rebundle'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  define: define({
    'import.meta.env.DEV': mode === 'development',
    'import.meta.env.PROD': mode !== 'development',
  }),

  build: {
    watch: mode === 'production' ? null : {},
    sourcemap: mode === 'development',
    minify: false,
    rollupOptions: {
      input: {
        'ex': './src/entry/entry.ex.ts', // execution
        'ex-mini': './src/entry/entry.ex.ts', // execution without react
        'cs': './src/entry/entry.cs.ts', // content script
        'os': './src/entry/entry.os.ts', // offscreen
        'sm': './src/entry/entry.sm.ts', // system
        'sw': './src/entry/entry.sw.ts', // service worker
        'vw': './src/entry/entry.vw.ts', // view
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },

  plugins: [
    preact(),
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
      const options = {
        minify: mode !== 'development',
        keepNames: true,
        banner: { js: setup },
      }

      return {
        'ex': {
          ...options,
          sourcemap: false,
          define: define({ BUNDLE: 'ex' }),
        },
        'ex-mini': {
          ...options,
          sourcemap: false,
          define: define({ BUNDLE: 'ex-mini' }),
        },
        'cs': {
          ...options,
          define: define({ BUNDLE: 'cs' }),
        },
        'os': {
          ...options,
          define: define({ BUNDLE: 'os' }),
        },
        'sm': {
          ...options,
          define: define({ BUNDLE: 'sm' }),
        },
        'sw': {
          ...options,
          define: define({ BUNDLE: 'sw' }),
        },
        'vw': {
          ...options,
          define: define({ BUNDLE: 'vw' }),
        },
      }
    }),
  ],
}))

function define(env: Record<string, any>) {
  const result: Record<string, string> = {}
  for (const key in env) result[key] = JSON.stringify(env[key])
  return result
}
