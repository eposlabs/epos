// TODO: test tailwindcss with build mode
import react from '@vitejs/plugin-react'
import livereload from 'rollup-plugin-livereload'
import { defineConfig } from 'vite'
import rebundle from 'vite-plugin-rebundle'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react({}),
      rebundle({
        define: {
          'DROPCAP_DEV': JSON.stringify(true),
          'DROPCAP_PROD': JSON.stringify(false),
          'process.env.DROPCAP_PORT': JSON.stringify('3033'),
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
        bundles: {
          fg: {
            define: {
              DATA: JSON.stringify('a'),
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
