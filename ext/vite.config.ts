import { preact } from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import { rebundle, type RolldownOptions } from 'vite-plugin-rebundle'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(async ({ mode }) => {
  const env = mode === 'development' ? 'development' : 'production'

  const setupLayersJs = await paralayer({
    input: './src/app',
    output: './src/layers',
    watch: mode !== 'production',
    globalLayerName: 'gl',
  })

  const bundle = (name: string, forceDev = false): RolldownOptions => ({
    input: {
      define: {
        'BUNDLE': json(name),
        'process.env.NODE_ENV': forceDev ? json('development') : json(env),
      },
    },
    output: {
      banner: `(async () => {${setupLayersJs}`,
      footer: '})()',
      minify: mode !== 'development',
    },
  })

  return {
    define: {
      'import.meta.env.DEV': json(mode === 'development'),
      'import.meta.env.PROD': json(mode !== 'development'),
      'process.env.NODE_ENV': 'process.env.NODE_ENV',
    },

    plugins: [
      tailwindcss(),
      preact({ reactAliasesEnabled: false }),
      viteStaticCopy({ targets: [{ src: './public/*', dest: './' }] }),
      rebundle(null, {
        'cs': bundle('cs'),
        'ex': bundle('ex'),
        'ex.dev': bundle('ex', true),
        'ex-mini': bundle('ex-mini'),
        'ex-mini.dev': bundle('ex-mini', true),
        'os': bundle('os'),
        'sm': bundle('sm'),
        'sw': bundle('sw'),
        'vw': bundle('vw'),
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      rolldownOptions: {
        input: {
          'cs': './src/cs.ts', // Content Script
          'ex': './src/ex.ts', // Execution
          'ex.dev': './src/ex.ts', // Execution with forced NODE_ENV=development
          'ex-mini': './src/ex.ts', // Execution without React
          'ex-mini.dev': './src/ex.ts', // Execution without React, with forced NODE_ENV=development
          'os': './src/os.ts', // Offscreen
          'sm': './src/sm.ts', // System
          'sw': './src/sw.ts', // Service Worker
          'vw': './src/vw.ts', // View
        },
        output: {
          minify: false,
          sourcemap: false,
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
        experimental: {
          strictExecutionOrder: true,
        },
      },
    },
  }
})

function json(value: unknown) {
  return JSON.stringify(value)
}
