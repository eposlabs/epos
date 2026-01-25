import { preact } from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'vite'
import { rebundle, type RolldownOptions } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  if (mode !== 'development' && mode !== 'production' && mode !== 'preview') throw new Error('Invalid mode')
  const env = mode === 'development' ? 'development' : 'production'

  const defineLayersJs = await paralayer({
    input: './src/units',
    output: './src/layers',
    watch: mode !== 'production',
    globalLayerName: 'gl',
  })

  const bundle = (name: string, forceMode?: 'development' | 'production'): RolldownOptions => ({
    input: {
      transform: {
        define: {
          'BUNDLE': JSON.stringify(name),
          'process.env.NODE_ENV': forceMode ? JSON.stringify(forceMode) : JSON.stringify(env),
        },
      },
    },
    output: {
      banner: `(async () => {\n${defineLayersJs}\n`,
      footer: '})()',
      minify: (forceMode ?? mode) !== 'development',
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
        'os': bundle('os'),
        'pm': bundle('pm'),
        'sw': bundle('sw'),
        'vw': bundle('vw'),
        'exd': bundle('ex', 'development'),
        'exp': bundle('ex', 'production'),
        'exd-mini': bundle('ex-mini', 'development'),
        'exp-mini': bundle('ex-mini', 'production'),
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      minify: false,
      reportCompressedSize: false,
      rolldownOptions: {
        input: {
          'cs': './src/cs.ts', // Content Script
          'os': './src/os.ts', // Offscreen
          'pm': './src/pm.ts', // Permission
          'sw': './src/sw.ts', // Service Worker
          'vw': './src/vw.ts', // View
          'exd': './src/ex.ts', // Execution with forced NODE_ENV=development
          'exp': './src/ex.ts', // Execution with forced NODE_ENV=production
          'exd-mini': './src/ex.ts', // Execution without React, with forced NODE_ENV=development
          'exp-mini': './src/ex.ts', // Execution without React, with forced NODE_ENV=production
        },
        output: {
          sourcemap: false,
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          strictExecutionOrder: true,
        },
      },
    },
  }
})
