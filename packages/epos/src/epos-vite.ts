import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const libs: Record<string, string> = {
  'react': resolve(import.meta.dirname, './epos-vite-react.js'),
  'react/jsx-runtime': resolve(import.meta.dirname, './epos-vite-react-jsx-runtime.js'),
  'react-dom': resolve(import.meta.dirname, './epos-vite-react-dom.js'),
  'react-dom/client': resolve(import.meta.dirname, './epos-vite-react-dom-client.js'),
  'mobx': resolve(import.meta.dirname, './epos-vite-mobx.js'),
  'mobx-react-lite': resolve(import.meta.dirname, './epos-vite-mobx-react-lite.js'),
}

export function epos(): Plugin {
  return {
    name: 'epos',
    enforce: 'pre',
    resolveId(source) {
      return libs[source] ?? null
    },
  }
}

export default epos
