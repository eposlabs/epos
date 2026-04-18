import tailwindcss from '@tailwindcss/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'vite'
import { rebundle, type RolldownOptions } from 'vite-plugin-rebundle'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export type Env = 'development' | 'production'
export type Define = Record<string, string>

export default defineConfig(async ({ mode }) => {
  const modeOk = mode === 'development' || mode === 'production' || mode === 'preview'
  if (!modeOk) throw new Error('Invalid mode')

  const layers = await paralayer({
    watch: mode !== 'production',
    extend: 'gl',
  })

  const bundle = (name: string, params: { env?: Env; define?: Define } = {}): RolldownOptions => {
    const env = params.env ?? (mode === 'development' ? 'development' : 'production')
    return {
      input: {
        transform: {
          define: {
            'BUNDLE': JSON.stringify(name),
            'import.meta.env.DEV': JSON.stringify(env === 'development'),
            'import.meta.env.PROD': JSON.stringify(env === 'production'),
            ...params.define,
          },
        },
      },
      output: {
        keepNames: true,
        banner: `(async () => {\n${layers}\n`,
        footer: '})()',
        minify: env === 'production',
      },
    }
  }

  return {
    plugins: [
      tailwindcss(),
      viteStaticCopy({
        targets: [
          {
            src: 'public/*',
            dest: './',
            rename: { stripBase: 1 },
          },
        ],
      }),
      rebundle(null, {
        'cs': bundle('cs'),
        'os': bundle('os'),
        'pm': bundle('pm'),
        'sw': bundle('sw'),
        'vw': bundle('vw'),
        'exd': bundle('ex', { env: 'development', define: { EX_MINI: 'false' } }),
        'exp': bundle('ex', { env: 'production', define: { EX_MINI: 'false' } }),
        'exd-mini': bundle('ex', { env: 'development', define: { EX_MINI: 'true' } }),
        'exp-mini': bundle('ex', { env: 'production', define: { EX_MINI: 'true' } }),
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      minify: false,
      reportCompressedSize: false,
      rolldownOptions: {
        input: {
          'cs': './src/cs.ts', // Content script
          'os': './src/os.ts', // Offscreen
          'pm': './src/pm.ts', // Permission
          'sw': './src/sw.ts', // Service worker
          'vw': './src/vw.ts', // View
          'exd': './src/ex.ts', // Execution with forced 'development' environment
          'exp': './src/ex.ts', // Execution with forced 'production' environment
          'exd-mini': './src/ex.ts', // Execution without React, with forced 'development' environment
          'exp-mini': './src/ex.ts', // Execution without React, with forced 'production' environment
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          keepNames: true,
          strictExecutionOrder: true,
        },
      },
    },
  }
})
