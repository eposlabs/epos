import { createLog } from 'eposlabs/utils'
import * as mobx from 'mobx'
import * as yjs from 'yjs'

export type MobxReactLite = typeof import('mobx-react-lite')
export type React = typeof import('react')
export type ReactDom = typeof import('react-dom')
export type ReactDomClient = typeof import('react-dom/client')
export type ReactJsxRuntime = typeof import('react/jsx-runtime')

const mobxReactLite: MobxReactLite = BUNDLE === 'ex-mini' ? null : require('mobx-react-lite')
const react: React = BUNDLE === 'ex-mini' ? null : require('react')
const reactDom: ReactDom = BUNDLE === 'ex-mini' ? null : require('react-dom')
const reactDomClient: ReactDomClient = BUNDLE === 'ex-mini' ? null : require('react-dom/client')
const reactJsxRuntime: ReactJsxRuntime = BUNDLE === 'ex-mini' ? null : require('react/jsx-runtime')

export class Libs extends ex.Unit {
  createLog = createLog
  mobx = mobx
  mobxReactLite = mobxReactLite
  react = react
  reactDom = reactDom
  reactDomClient = reactDomClient
  reactJsxRuntime = reactJsxRuntime
  yjs = yjs

  constructor(parent: ex.Unit) {
    super(parent)

    // Configure MobX
    mobx.configure({ enforceActions: 'never' })

    // Allow several Yjs copies (allows several epos-based apps on the same page).
    // Use `self.self` instead of `self`, because `self` might be a Proxy (see `project-path-globals.sw.js`).
    Object.defineProperty(self.self, '__ $YJS$ __', {
      value: false,
      writable: false,
      configurable: true,
    })
  }
}
