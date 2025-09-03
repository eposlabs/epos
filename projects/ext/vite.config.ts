import { defineConfig } from 'rolldown-vite'
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
    minify: mode === 'development' ? false : 'terser',
    sourcemap: mode === 'development',
    terserOptions: { keep_classnames: true },
    rollupOptions: {
      input: {
        'ex': './src/entry/entry.ex.ts',
        'cs': './src/entry/entry.cs.ts',
        'os': './src/entry/entry.os.ts',
        'sw': './src/entry/entry.sw.ts',
        'vw': './src/entry/entry.vw.ts',
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

    paralayer({
      input: './src/app',
      output: './src/layers',
    }),

    rebundle(async () => {
      const setup = await fs.readFile('./src/layers/setup.js', 'utf-8')
      return {
        'ex': {
          keepNames: true,
          sourcemap: false,
          banner: { js: setup },
          define: define({ BUNDLE: 'ex', EX_MINI: false }),
        },
        'cs': {
          keepNames: true,
          banner: { js: setup },
          define: define({ BUNDLE: 'cs' }),
        },
        'os': {
          keepNames: true,
          banner: { js: setup },
          define: define({ BUNDLE: 'os' }),
        },
        'sw': {
          keepNames: true,
          banner: { js: setup },
          define: define({ BUNDLE: 'sw' }),
        },
        'vw': {
          keepNames: true,
          banner: { js: setup },
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
