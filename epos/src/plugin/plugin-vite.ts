import path from 'path'

import type { Plugin } from 'vite'

export function epos(): Plugin {
  return {
    name: 'epos',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'react') {
        return path.resolve(import.meta.dirname, './lib/lib-react.js')
      }
      if (source === 'react/jsx-runtime') {
        return path.resolve(import.meta.dirname, './lib/lib-react-jsx-runtime.js')
      }
      if (source === 'react-dom') {
        return path.resolve(import.meta.dirname, './lib/lib-react-dom.js')
      }
      if (source === 'react-dom/client') {
        return path.resolve(import.meta.dirname, './lib/lib-react-dom-client.js')
      }
      if (source === 'mobx') {
        return path.resolve(import.meta.dirname, './lib/lib-mobx.js')
      }
      if (source === 'mobx-react') {
        return path.resolve(import.meta.dirname, './lib/lib-mobx-react.js')
      }
      return null
    },
  }
}

export default epos
