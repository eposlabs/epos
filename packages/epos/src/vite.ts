import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const libs: Record<string, string> = {
  'react': resolve(import.meta.dirname, './libs/react.js'),
  'react/jsx-runtime': resolve(import.meta.dirname, './libs/react-jsx-runtime.js'),
  'react-dom': resolve(import.meta.dirname, './libs/react-dom.js'),
  'react-dom/client': resolve(import.meta.dirname, './libs/react-dom-client.js'),
  'mobx': resolve(import.meta.dirname, './libs/mobx.js'),
  'mobx-react-lite': resolve(import.meta.dirname, './libs/mobx-react-lite.js'),
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
