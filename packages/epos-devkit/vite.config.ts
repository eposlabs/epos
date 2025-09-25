import tailwindcss from '@tailwindcss/vite'
import epos from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import rebundle, { type BuildOptions } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const setupLayersJs = await paralayer({
    input: './src/app',
    output: './src/layers',
    default: 'gl',
    watch: mode !== 'production',
  })

  const esbuildOptions: BuildOptions = {
    format: 'esm',
    keepNames: true,
    minify: false, // mode !== 'development',
    banner: { js: setupLayersJs },
  }

  return {
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

    plugins: [epos(), tailwindcss(), rebundle({ gl: esbuildOptions })],
  }
})
