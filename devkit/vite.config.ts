import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import { rebundle } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
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
    plugins: [
      epos(),
      tailwindcss(),
      rebundle({
        gl: {
          input: { keepNames: true },
          output: { minify: mode !== 'development', banner: mainLayersJs },
        },
        fg: {
          input: { keepNames: true },
          output: { minify: mode !== 'development', banner: learnLayersJs },
        },
        bg: {
          input: { keepNames: true },
          output: { minify: mode !== 'development', banner: learnLayersJs },
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
          fg: './src/learn/entry/entry.fg.tsx',
          bg: './src/learn/entry/entry.bg.ts',
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
