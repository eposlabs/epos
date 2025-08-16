import path from 'path'

import type { Plugin } from 'esbuild'

export function epos(): Plugin {
  return {
    name: 'epos',
    setup(build) {
      build.onResolve({ filter: /^react$/ }, () => ({
        path: path.resolve(import.meta.dirname, './lib/lib-react.js'),
      }))
      build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
        path: path.resolve(import.meta.dirname, './lib/lib-react-jsx-runtime.js'),
      }))
      build.onResolve({ filter: /^react-dom$/ }, () => ({
        path: path.resolve(import.meta.dirname, './lib/lib-react-dom.js'),
      }))
      build.onResolve({ filter: /^react-dom\/client$/ }, () => ({
        path: path.resolve(import.meta.dirname, './lib/lib-react-dom-client.js'),
      }))
      build.onResolve({ filter: /^mobx$/ }, () => ({
        path: path.resolve(import.meta.dirname, './lib/lib-mobx.js'),
      }))
      build.onResolve({ filter: /^mobx-react$/ }, () => ({
        path: path.resolve(import.meta.dirname, './lib/lib-mobx-react.js'),
      }))
    },
  }
}

export default epos
