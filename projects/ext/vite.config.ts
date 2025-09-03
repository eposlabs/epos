import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { paralayer } from 'paralayer'
import { defineConfig } from 'rolldown-vite'
import copy from 'rollup-plugin-copy'
import rebundle from 'vite-plugin-rebundle'

export default defineConfig(async ({ mode }) => {
  const setup = await paralayer({
    input: './src/app',
    output: './src/layers',
    watch: mode !== 'production',
  })

  return {
    define: {
      'import.meta.env.DEV': JSON.stringify(mode === 'development'),
      'import.meta.env.PROD': JSON.stringify(mode !== 'development'),
    },

    build: {
      watch: mode === 'production' ? null : {},
      sourcemap: mode === 'development',
      minify: false,
      rollupOptions: {
        input: {
          'ex': './src/entry/entry.ex.ts', // execution
          'ex-mini': './src/entry/entry.ex.ts', // execution without react
          'cs': './src/entry/entry.cs.ts', // content script
          'os': './src/entry/entry.os.ts', // offscreen
          'sm': './src/entry/entry.sm.ts', // system
          'sw': './src/entry/entry.sw.ts', // service worker
          'vw': './src/entry/entry.vw.ts', // view
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
      preact(),
      tailwindcss(),

      copy({
        targets: [
          {
            src: './public/*',
            dest: './dist',
          },
        ],
      }),

      rebundle({
        'ex': {
          minify: mode !== 'development',
          keepNames: true,
          sourcemap: false,
          banner: { js: setup },
          define: { BUNDLE: JSON.stringify('ex'), esbuildRequire: 'require' },
        },
        'ex-mini': {
          minify: mode !== 'development',
          keepNames: true,
          sourcemap: false,
          banner: { js: setup },
          define: { BUNDLE: JSON.stringify('ex-mini'), esbuildRequire: 'require' },
        },
        'cs': {
          minify: mode !== 'development',
          keepNames: true,
          banner: { js: setup },
          define: { BUNDLE: JSON.stringify('cs') },
        },
        'os': {
          minify: mode !== 'development',
          keepNames: true,
          banner: { js: setup },
          define: { BUNDLE: JSON.stringify('os') },
        },
        'sm': {
          minify: mode !== 'development',
          keepNames: true,
          banner: { js: setup },
          define: { BUNDLE: JSON.stringify('sm') },
        },
        'sw': {
          minify: mode !== 'development',
          keepNames: true,
          banner: { js: setup },
          define: { BUNDLE: JSON.stringify('sw') },
        },
        'vw': {
          minify: mode !== 'development',
          keepNames: true,
          banner: { js: setup },
          define: { BUNDLE: JSON.stringify('vw') },
        },
      }),
    ],
  }
})
