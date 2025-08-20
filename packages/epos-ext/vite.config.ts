// TODO: test tailwindcss with build mode
import react from '@vitejs/plugin-react'
import livereload from 'rollup-plugin-livereload'
import { defineConfig } from 'vite'
import rebundle from '../../playgrounds/vite-project/vite-plugin-rebundle'

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    },
    plugins: [
      react({}),
      rebundle({
        keepNames: true,
        define: {
          'DROPCAP_DEV': true,
          'DROPCAP_PROD': false,
          'env_DROPCAP_PORT': '3033',
          'env_NODE_ENV': 'development',
          'env_EPOS_DEV_WS': 'ws://localhost:2093',
          'env_EPOS_DEV_HUB': 'http://localhost:2093',
          'env_EPOS_PROD_HUB': 'https://epos.dev',
        },
        banner: {
          js: ['./src/layers/define.js'],
        },
        bundles: {
          'ex': {
            sourcemap: false,
            define: { EX_MINI: false },
            banner: {
              js: ['./src/app/boot/boot-globals.ex.js'],
            },
          },
          // 'ex-mini': {
          //   sourcemap: false,
          //   define: { EX_MINI: true },
          //   banner: {
          //     js: [, './src/app/boot/boot-globals.ex.js'],
          //   },
          // },
          'cs': { keepNames: false },
          'os': {},
          'sw': {},
          'vw': {},
        },
      }),
      // livereload({ port: 3033 }),
      // mode === 'development' && livereload({ port: 3033 }),
    ],
    build: {
      watch: mode === 'development' ? {} : undefined,
      minify: false,
      sourcemap: true,
      rollupOptions: {
        input: {
          'ex': './src/entry/entry.ex.ts',
          // 'ex-mini': './src/entry/entry.ex.ts',
          'cs': './src/entry/entry.cs.ts',
          'os': './src/entry/entry.os.ts',
          'sw': './src/entry/entry.sw.ts',
          'vw': './src/entry/entry.vw.ts',
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },
  }
})
