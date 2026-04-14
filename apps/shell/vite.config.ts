import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'vite'
import { rebundle } from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const env = mode === 'development' ? 'development' : 'production'

  const layers = await paralayer({
    watch: mode !== 'production',
    default: 'gl',
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
          keepNames: true,
        },
      }),
    ],

    build: {
      watch: mode === 'production' ? null : {},
      minify: false,
      copyPublicDir: false,
      reportCompressedSize: false,
      rolldownOptions: {
        input: {
          gl: './src/gl.tsx',
        },
        output: {
          keepNames: true,
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          strictExecutionOrder: true,
        },
      },
    },
  }
})
