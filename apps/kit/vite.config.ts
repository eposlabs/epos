import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite/ts'
import { paralayer } from 'paralayer/ts'
import { defineConfig } from 'rolldown-vite'
import { rebundle } from 'vite-plugin-rebundle/ts'

export default defineConfig(async ({ mode }) => {
  const setupLayersJs = await paralayer({
    input: './src/units',
    output: './src/layers',
    watch: mode !== 'production',
    defaultLayerName: 'gl',
  })

  return {
    plugins: [
      epos(),
      tailwindcss(),
      rebundle({
        output: {
          minify: mode !== 'development',
          banner: `let cn;\n${setupLayersJs}`,
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
