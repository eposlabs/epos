import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { defineConfig } from 'vite'
import { rebundle } from 'vite-plugin-rebundle'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    epos(),
    tailwindcss(),
    rebundle({
      output: {
        minify: mode !== 'development',
      },
    }),
  ],

  build: {
    watch: mode === 'production' ? null : {},
    minify: false,
    reportCompressedSize: false,
    rolldownOptions: {
      input: {
        app: './src/app.tsx',
        background: './src/background.ts',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        strictExecutionOrder: true,
      },
    },
  },
}))
