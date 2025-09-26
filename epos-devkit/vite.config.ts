import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import { rebundle } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const setupLayersJs = await paralayer({
    input: './src/app',
    output: './src/layers',
    watch: mode !== 'production',
    defaultLayerName: 'gl',
  })

  return {
    plugins: [
      epos(),
      tailwindcss(),
      rebundle({
        gl: {
          input: {
            keepNames: true,
          },
          output: {
            minify: false, // mode !== 'development',
            banner: setupLayersJs,
          },
        },
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      sourcemap: mode === 'development',
      minify: false,
      rolldownOptions: {
        input: {
          gl: './src/entry/index.tsx',
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
