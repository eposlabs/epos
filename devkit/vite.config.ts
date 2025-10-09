import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import { rebundle, type RolldownOptions } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const setupLayersJs = await paralayer({
    input: ['./src/app', './src/learn-app'],
    output: './src/layers',
    watch: mode !== 'production',
  })

  const bundle = (): RolldownOptions => ({
    output: {
      minify: mode !== 'development',
      banner: setupLayersJs,
    },
  })

  return {
    plugins: [
      epos(),
      tailwindcss(),
      rebundle({
        gl: bundle(),
        ln: bundle(),
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      minify: false,
      rolldownOptions: {
        input: {
          gl: './src/gl.tsx',
          ln: './src/ln.tsx',
          tw: './src/tw.css',
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
