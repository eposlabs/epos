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
      const globals = await fs.readFile('./src/app/boot/boot-globals.ex.js', 'utf-8')
      return {
        'ex': {
          sourcemap: false,
          define: define({ BUNDLE: 'ex', EX_MINI: false }),
          banner: { js: [setup, globals].join('\n') },
        },
        'cs': {
          define: define({ BUNDLE: 'cs' }),
          banner: { js: setup },
        },
        'os': {
          define: define({ BUNDLE: 'os' }),
          banner: { js: setup },
        },
        'sw': {
          define: define({ BUNDLE: 'sw' }),
          banner: { js: setup },
        },
        'vw': {
          define: define({ BUNDLE: 'vw' }),
          banner: { js: setup },
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
