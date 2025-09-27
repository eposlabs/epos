import { preact } from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { paralayer } from 'paralayer/ts'
import { defineConfig } from 'rolldown-vite'
import { rebundle, type RolldownOptions } from 'vite-plugin-rebundle/ts'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(async ({ mode }) => {
  const env = mode === 'development' ? 'development' : 'production'

  const jsSetupLayers = await paralayer({
    input: './src/app',
    output: './src/layers',
    watch: mode !== 'production',
  })

  const bundle = (name: string, forceDev = false): RolldownOptions => ({
    input: {
      keepNames: true,
      define: {
        'BUNDLE': json(name),
        'process.env.NODE_ENV': forceDev ? json('development') : json(env),
      },
    },
    output: {
      banner: jsSetupLayers,
      minify: mode !== 'development',
    },
  })

  return {
    plugins: [
      tailwindcss(),
      preact({ reactAliasesEnabled: false }),
      viteStaticCopy({ targets: [{ src: './public/*', dest: './' }] }),
      rebundle({
        'cs': bundle('cs'),
        'ex-mini.dev': bundle('ex-mini', true),
        'ex-mini': bundle('ex-mini'),
        'ex.dev': bundle('ex', true),
        'ex': bundle('ex'),
        'os': bundle('os'),
        'sm': bundle('sm'),
        'sw': bundle('sw'),
        'vw': bundle('vw'),
      }),
    ],

    define: {
      'import.meta.env.DEV': json(mode === 'development'),
      'import.meta.env.PROD': json(mode !== 'development'),
      'process.env.NODE_ENV': 'process.env.NODE_ENV',
    },

    build: {
      watch: mode === 'production' ? null : {},
      rolldownOptions: {
        input: {
          'cs': './src/entry/entry.cs.ts', // content script
          'ex-mini.dev': './src/entry/entry.ex.ts', // ex-mini with forced NODE_ENV=development
          'ex-mini': './src/entry/entry.ex.ts', // ex without react
          'ex.dev': './src/entry/entry.ex.ts', // ex with forced NODE_ENV=development
          'ex': './src/entry/entry.ex.ts', // execution
          'os': './src/entry/entry.os.ts', // offscreen
          'sm': './src/entry/entry.sm.ts', // system
          'sw': './src/entry/entry.sw.ts', // service worker
          'vw': './src/entry/entry.vw.ts', // view
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
