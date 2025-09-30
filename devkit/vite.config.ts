import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import { rebundle } from 'vite-plugin-rebundle/ts'

export default defineConfig(async ({ mode }) => {
  const minify = mode !== 'development'

  const mainLayersJs = await paralayer({
    input: './src/app',
    output: './src/layers',
    watch: mode !== 'production',
    defaultLayerName: 'gl',
  })

  const learnLayersJs = await paralayer({
    input: './src/learn/app',
    output: './src/learn/layers',
    watch: mode !== 'production',
  })

  return {
    resolve: {
      conditions: ['source'],
    },

    plugins: [
      epos(),
      tailwindcss(),
      rebundle({
        gl: { output: { minify, banner: mainLayersJs } },
        fg: { output: { minify, banner: learnLayersJs } },
        bg: { output: { minify, banner: learnLayersJs } },
        exp: { output: { minify } },
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      minify: false,
      rolldownOptions: {
        input: {
          gl: './src/gl.tsx',
          tw: './src/tw.css',
          fg: './src/learn/fg.tsx',
          bg: './src/learn/bg.ts',
          exp: './src/exp/exp.tsx',
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
