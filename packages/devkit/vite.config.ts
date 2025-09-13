import tailwindcss from '@tailwindcss/vite'
import epos from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'vite'
import rebundle, { type BuildOptions } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const setupLayersJs = await paralayer({
    input: './src/app',
    output: './src/layers',
    default: 'gl',
    watch: mode !== 'production',
  })

  const esbuildOptions: BuildOptions = {
    keepNames: true,
    minify: mode !== 'development',
    banner: { js: setupLayersJs },
  }

  return {
    build: {
      watch: mode === 'production' ? null : {},
      sourcemap: mode === 'development',
      minify: false,
      rollupOptions: {
        input: {
          gl: './src/entry/entry.tsx',
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },

    plugins: [epos(), tailwindcss(), rebundle({ gl: esbuildOptions })],
  }
})
