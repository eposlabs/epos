import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const mapping: Record<string, string> = {
  'react': resolve(import.meta.dirname, './libs/libs-react.ts'),
  'react/jsx-runtime': resolve(import.meta.dirname, './libs/libs-react-jsx-runtime.ts'),
  'react-dom': resolve(import.meta.dirname, './libs/libs-react-dom.ts'),
  'react-dom/client': resolve(import.meta.dirname, './libs/libs-react-dom-client.ts'),
  'mobx': resolve(import.meta.dirname, './libs/libs-mobx.ts'),
  'mobx-react-lite': resolve(import.meta.dirname, './libs/libs-mobx-react-lite.ts'),
}

export function epos(): Plugin {
  return {
    name: 'epos',
    enforce: 'pre',
    resolveId: source => mapping[source] ?? null,
  }
}

export default epos
