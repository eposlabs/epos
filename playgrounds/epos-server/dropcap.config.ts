import { defineConfig } from 'dropcap'

export default defineConfig({
  name: '🌐 epos-server',
  copy: {
    'src/layers/define.js': './dist/layers',
  },
  layers: {
    default: 'gl',
    globalize: true,
    input: './src/app',
    output: './src/layers',
  },
})
