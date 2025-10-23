import { resolve } from 'node:path'
import type { Plugin } from 'vite'

export class EposVite {
  private libs: Record<string, string> = {
    'react': resolve(import.meta.dirname, './libs/libs-react.js'),
    'react/jsx-runtime': resolve(import.meta.dirname, './libs/libs-react-jsx-runtime.js'),
    'react-dom': resolve(import.meta.dirname, './libs/libs-react-dom.js'),
    'react-dom/client': resolve(import.meta.dirname, './libs/libs-react-dom-client.js'),
    'mobx': resolve(import.meta.dirname, './libs/libs-mobx.js'),
    'mobx-react-lite': resolve(import.meta.dirname, './libs/libs-mobx-react-lite.js'),
  }

  get plugin(): Plugin {
    return {
      name: 'epos',
      enforce: 'pre',
      resolveId: this.onResolveId,
    }
  }

  private onResolveId = (source: string) => {
    return this.libs[source] ?? null
  }
}

export function epos() {
  return new EposVite().plugin
}

export default epos
