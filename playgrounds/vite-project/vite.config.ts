// TODO: test tailwindcss with build mode
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { postBuildPlugin } from './post-build-plugin'

export default defineConfig({
  plugins: [
    react({}),
    postBuildPlugin({
      // TODO:
      // define: {},
      // banner: { js: [], css: [] },
      // footer: {},
      // bundles: {
      //   fg: {
      //     define,banner,footer
      //   }
      // }
      // + any esbuild options
      define: {
        default: {
          DATA: 'default-data',
        },
        fg: {
          BUNDLE: 'fg-bundle',
        },
        bg: {
          BUNDLE: 'bg-bundle',
        },
      },
    }),
  ],
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
  build: {
    watch: {},
    minify: false,
    sourcemap: true,
    outDir: 'a',
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
})
