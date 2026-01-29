import * as mobx from 'mobx'
import * as yjs from 'yjs'

export type MobxReactLite = typeof import('mobx-react-lite')
export type React = typeof import('react')
export type ReactDom = typeof import('react-dom')
export type ReactDomClient = typeof import('react-dom/client')
export type ReactJsxRuntime = typeof import('react/jsx-runtime')

const mobxReactLite: MobxReactLite = EX_MINI ? null : require('mobx-react-lite')
const react: React = EX_MINI ? null : require('react')
const reactDom: ReactDom = EX_MINI ? null : require('react-dom')
const reactDomClient: ReactDomClient = EX_MINI ? null : require('react-dom/client')
const reactJsxRuntime: ReactJsxRuntime = EX_MINI ? null : require('react/jsx-runtime')
export class Libs extends ex.Unit {
  mobx = mobx
  mobxReactLite = mobxReactLite
  react = react
  reactDom = reactDom
  reactDomClient = reactDomClient
  reactJsxRuntime = reactJsxRuntime
  yjs = yjs

  constructor(parent: ex.Unit) {
    super(parent)
    mobx.configure({ enforceActions: 'never' })
  }
}
