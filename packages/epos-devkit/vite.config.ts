import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
  return {
    plugins: [dts({ tsconfigPath: './tsconfig-src.json' }), epos(), tailwindcss()],
    resolve: {
      tsconfigPaths: true,
    },
    build: {
      watch: mode === 'production' ? null : {},
      sourcemap: true,
      reportCompressedSize: false,
      lib: {
        entry: { devkit: './src/devkit.tsx' },
        formats: ['es'],
      },
      rolldownOptions: {
        external: Object.keys(pkg.dependencies),
      },
    },
  }
})
