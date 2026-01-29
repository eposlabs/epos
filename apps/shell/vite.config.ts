import { layerer } from '@eposlabs/layerer'
import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { defineConfig } from 'vite'
import { rebundle } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const env = mode === 'development' ? 'development' : 'production'

  const layers = await layerer({
    input: './src/units',
    output: './src/layers',
    watch: mode !== 'production',
    defaultLayer: 'gl',
  })

  return {
    resolve: {
      tsconfigPaths: true,
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
          banner: layers,
        },
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      reportCompressedSize: false,
      rolldownOptions: {
        input: {
          gl: './src/gl.tsx',
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
