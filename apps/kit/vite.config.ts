import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite/ts'
import { resolve } from 'node:path'
import { paralayer } from 'paralayer/ts'
import { defineConfig } from 'rolldown-vite'
import { rebundle } from 'vite-plugin-rebundle/ts'

export default defineConfig(async ({ mode }) => {
  const env = mode === 'development' ? 'development' : 'production'

  const defineLayersJs = await paralayer({
    input: './src/units',
    output: './src/layers',
    watch: mode !== 'production',
    defaultLayerName: 'gl',
  })

  return {
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, './src/shadcn'),
      },
    },

    define: {
      'DEV': JSON.stringify(mode === 'development'),
      'PROD': JSON.stringify(mode !== 'development'),
      'process.env.NODE_ENV': JSON.stringify(env),
    },

    plugins: [
      epos(),
      tailwindcss(),
      rebundle({
        output: {
          minify: mode !== 'development',
          banner: defineLayersJs,
        },
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      minify: false,
      reportCompressedSize: false,
      rolldownOptions: {
        input: {
          gl: './src/gl.tsx',
        },
        output: {
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
