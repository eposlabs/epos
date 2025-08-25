import { defineConfig } from 'dropcap'
import epos from 'epos/plugin-esbuild'

export default defineConfig({
  tailwind: {
    input: 'src/web-fs.css',
    output: 'dist/web-fs.css',
  },
  build: {
    bundles: [
      {
        outfile: 'dist/web-fs.js',
        entryPoints: ['./src/web-fs.tsx'],
        format: 'esm',
        plugins: [epos()],
      },
      {
        outfile: 'dist/bg.js',
        entryPoints: ['./src/bg.ts'],
        format: 'esm',
      },
    ],
  },
})
