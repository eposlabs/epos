import { layerer } from '@eposlabs/layerer'
import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { defineConfig } from 'vite'
import { rebundle } from 'vite-plugin-rebundle'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const defineLayersJs = await layerer({
    input: './src/units',
    output: './src/layers',
    watch: mode !== 'production',
    globalLayerName: 'gl',
  })

  return {
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
          bg: './src/bg.ts',
          fg: './src/fg.tsx',
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          strictExecutionOrder: true,
        },
      },
    },
  }
})
