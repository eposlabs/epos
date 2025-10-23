import { createLog } from '@eposlabs/utils'
import * as mobx from 'mobx'
import * as yjs from 'yjs'

type mobxReactLite = typeof import('mobx-react-lite') | null
type react = typeof import('react') | null
type reactDom = typeof import('react-dom') | null
type reactDomClient = typeof import('react-dom/client') | null
type reactJsxRuntime = typeof import('react/jsx-runtime') | null

const mobxReactLite: mobxReactLite = BUNDLE === 'ex' ? require('mobx-react-lite') : null
const react: react = BUNDLE === 'ex' ? require('react') : null
const reactDom: reactDom = BUNDLE === 'ex' ? require('react-dom') : null
const reactDomClient: reactDomClient = BUNDLE === 'ex' ? require('react-dom/client') : null
const reactJsxRuntime: reactJsxRuntime = BUNDLE === 'ex' ? require('react/jsx-runtime') : null

mobx.configure({ enforceActions: 'never' })

export class Libs extends ex.Unit {
  createLog = createLog
  mobx = mobx
  mobxReactLite = mobxReactLite
  react = react
  reactDom = reactDom
  reactDomClient = reactDomClient
  reactJsxRuntime = reactJsxRuntime
  yjs = yjs
}
