import tailwindcss from '@tailwindcss/vite'
import epos from 'epos/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import rebundle from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const setup = await paralayer({
    input: './src/app',
    output: './src/layers',
    watch: mode !== 'production',
  })

  return {
    build: {
      watch: mode === 'production' ? null : {},
      sourcemap: mode === 'development',
      minify: false,
      rolldownOptions: {
        input: {
          'fg': './src/entry/entry.fg.tsx',
          'bg': './src/entry/entry.bg.ts',
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

    plugins: [
      epos(),
      tailwindcss(),

      viteStaticCopy({
        targets: [
          {
            src: './public/*',
            dest: './dist',
          },
        ],
      }),

      rebundle({
        'fg': {
          keepNames: true,
          minify: mode !== 'development',
          banner: { js: setup },
        },
        'bg': {
          keepNames: true,
          minify: mode !== 'development',
          banner: { js: setup },
        },
      }),
    ],
  }
})
