import { layerer } from '@eposlabs/layerer'
import { preact } from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { rebundle, type RolldownOptions } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  if (mode !== 'development' && mode !== 'production' && mode !== 'preview') throw new Error('Invalid mode')
  const env = mode === 'development' ? 'development' : 'production'

  const defineLayersJs = await layerer({
    input: './src/units',
    output: './src/layers',
    watch: mode !== 'production',
    globalLayerName: 'gl',
  })

  const bundle = (
    name: string,
    forceMode?: 'development' | 'production',
    define: Record<string, string> = {},
  ): RolldownOptions => ({
    input: {
      transform: {
        define: {
          'BUNDLE': JSON.stringify(name),
          'process.env.NODE_ENV': forceMode ? JSON.stringify(forceMode) : JSON.stringify(env),
          ...define,
        },
      },
    },
    output: {
      keepNames: true,
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
        'exd': bundle('ex', 'development', { EX_MINI: 'false' }),
        'exp': bundle('ex', 'production', { EX_MINI: 'false' }),
        'exd-mini': bundle('ex', 'development', { EX_MINI: 'true' }),
        'exp-mini': bundle('ex', 'production', { EX_MINI: 'true' }),
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
          keepNames: true,
          sourcemap: false,
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          strictExecutionOrder: true,
        },
      },
    },
  }
})
