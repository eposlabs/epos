import tailwindcss from '@tailwindcss/vite'
import epos from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import rebundle, { type BuildOptions } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const setupLayersJs = await paralayer({
    input: './src/app',
    output: './src/layers',
    watch: mode !== 'production',
  })

  const bundle = (options: BuildOptions = {}): BuildOptions => ({
    format: 'esm',
    keepNames: true,
    minify: mode !== 'development',
    banner: { js: setupLayersJs },
    ...options,
  })

  return {
    plugins: [epos(), tailwindcss(), rebundle({ gl: bundle() })],
    build: {
      watch: mode === 'production' ? null : {},
      sourcemap: false,
      minify: false,
      rolldownOptions: {
        input: {
          gl: './src/entry/entry.gl.tsx',
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
