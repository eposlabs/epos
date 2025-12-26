import { preact } from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import { rebundle, type RolldownOptions } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const env = mode === 'development' ? 'development' : 'production'

  const defineLayersJs = await paralayer({
    input: './src/units',
    output: './src/layers',
    watch: mode !== 'production',
    globalLayerName: 'gl',
  })

  const bundle = (name: string, forceDev = false): RolldownOptions => ({
    input: {
      transform: {
        define: {
          'BUNDLE': JSON.stringify(name),
          'process.env.NODE_ENV': forceDev ? JSON.stringify('development') : JSON.stringify(env),
        },
      },
    },
    output: {
      banner: `(async () => {\n${defineLayersJs}\n`,
      footer: '})()',
      minify: mode !== 'development',
    },
  })

  return {
    define: {
      'DEV': JSON.stringify(mode === 'development'),
      'PROD': JSON.stringify(mode !== 'development'),
      'process.env.NODE_ENV': 'process.env.NODE_ENV',
    },

    plugins: [
      tailwindcss(),
      preact({ reactAliasesEnabled: false }),
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
      minify: false,
      reportCompressedSize: false,
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
