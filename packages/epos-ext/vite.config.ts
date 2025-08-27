import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import { defineConfig } from 'vite'
import rebundle from 'vite-plugin-rebundle'

const layers = await fs.readFile('./src/layers/define.js', 'utf-8')
const globals = await fs.readFile('./src/app/boot/boot-globals.ex.js', 'utf-8')

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },

    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    },

    define: define({
      'import.meta.env.DROPCAP_PORT': 3033,
      'import.meta.env.EPOS_DEV_WS': 'ws://localhost:2093',
      'import.meta.env.EPOS_DEV_HUB': 'http://localhost:2093',
      'import.meta.env.EPOS_PROD_HUB': 'https://epos.dev',
    }),

    build: {
      watch: mode === 'development' ? {} : undefined,
      minify: false,
      sourcemap: true,
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
      react(),
      tailwindcss(),

      rebundle({
        'ex': {
          keepNames: true,
          sourcemap: false,
          define: define({ BUNDLE: 'ex', EX_MINI: false }),
          banner: { js: [layers, globals].join('\n') },
        },
        'cs': {
          keepNames: false, // why?
          define: define({ BUNDLE: 'cs' }),
          banner: { js: layers },
        },
        'os': {
          keepNames: true,
          define: define({ BUNDLE: 'os' }),
          banner: { js: layers },
        },
        'sw': {
          keepNames: true,
          define: define({ BUNDLE: 'sw' }),
          banner: { js: layers },
        },
        'vw': {
          keepNames: true,
          define: define({ BUNDLE: 'vw' }),
          banner: { js: layers },
        },
      }),
    ],
  }
})

function define(env: Record<string, any>) {
  const result: Record<string, string> = {}
  for (const key in env) result[key] = JSON.stringify(env[key])
  return result
}
