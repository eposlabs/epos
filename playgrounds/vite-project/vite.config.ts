// TODO: test tailwindcss with build mode
import react from '@vitejs/plugin-react'
import livereload from 'rollup-plugin-livereload'
import { defineConfig } from 'vite'
import rebundle from './vite-plugin-rebundle'

export default defineConfig(({ mode }) => {
  // resolve: {
  //   alias: {
  //     react: 'preact/compat',
  //     'react-dom': 'preact/compat',
  //   },
  // },
  //  esbuild: {
  //   jsxFactory: 'h',
  //   jsxFragment: 'Fragment',
  // },

  return {
    plugins: [
      react({}),
      rebundle({
        define: {
          SHARED: 'data',
        },
        bundles: {
          fg: {
            define: {
              DATA: 'a',
            },
          },
        },
      }),
      mode === 'development' && livereload({ port: 3033 }),
    ],
    build: {
      watch: mode === 'development' ? {} : undefined,
      minify: false,
      sourcemap: true,
      rollupOptions: {
        input: {
          fg: 'src/main.fg.tsx',
          bg: 'src/main.bg.tsx',
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
  }
})
