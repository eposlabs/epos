import { defineConfig } from 'dropcap'
import epos from 'epos/plugin-esbuild'

export default defineConfig({
  name: '⚙️ web-fs',
  tailwind: {
    input: 'src/entry/entry.fg.css',
    output: 'dist/fg.css',
  },
  layers: {
    input: './src/app',
    output: './src/layers',
  },
  build: {
    keepNames: true,
    bundles: [
      {
        outfile: 'dist/fg.js',
        entryPoints: ['./src/entry/entry.fg.tsx'],
        format: 'esm',
        plugins: [epos()],
        banner: { js: './src/layers/define.js' },
      },
    ],
  },
})
