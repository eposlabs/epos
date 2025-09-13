import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'vite'
import rebundle from 'vite-plugin-rebundle'
import { viteStaticCopy } from 'vite-plugin-static-copy'

import type { BuildOptions } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const env = mode === 'development' ? 'development' : 'production'
  const defineDevNodeEnv = { 'process.env.NODE_ENV': json('development') }

  const setup = await paralayer({
    input: './src/app',
    output: './src/layers',
    watch: mode !== 'production',
    globalize: mode === 'development',
  })

  const bundle = (name: string, options: BuildOptions = {}) => ({
    minify: mode !== 'development',
    keepNames: true,
    banner: { js: setup },
    ...options,
    define: {
      'BUNDLE': json(name),
      'process.env.NODE_ENV': json(env),
      ...options.define,
    },
  })

  return {
    define: {
      'import.meta.env.DEV': json(mode === 'development'),
      'import.meta.env.PROD': json(mode !== 'development'),
      'process.env.NODE_ENV': 'process.env.NODE_ENV',
    },

    build: {
      watch: mode === 'production' ? null : {},
      sourcemap: mode === 'development',
      minify: false,
      rollupOptions: {
        input: {
          'cs': './src/entry/entry.cs.ts', // content script
          'ex': './src/entry/entry.ex.ts', // execution
          'ex-dev': './src/entry/entry.ex.ts', // ex with forced NODE_ENV=development
          'ex-mini': './src/entry/entry.ex.ts', // ex without react
          'ex-mini-dev': './src/entry/entry.ex.ts', // ex-mini with forced NODE_ENV=development
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
      tailwindcss(),
      preact({ reactAliasesEnabled: false }),
      viteStaticCopy({ targets: [{ src: './public/*', dest: './' }] }),
      rebundle({
        'cs': bundle('cs'),
        'ex': bundle('ex', { sourcemap: false }),
        'ex-dev': bundle('ex', { sourcemap: false, define: defineDevNodeEnv }),
        'ex-mini': bundle('ex-mini', { sourcemap: false }),
        'ex-mini-dev': bundle('ex-mini', { sourcemap: false, define: defineDevNodeEnv }),
        'os': bundle('os'),
        'sm': bundle('sm'),
        'sw': bundle('sw'),
        'vw': bundle('vw'),
      }),
    ],
  }
})

function json(value: unknown) {
  return JSON.stringify(value)
}
