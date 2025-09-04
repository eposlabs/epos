import { createLog } from '@eposlabs/utils'
import * as mobx from 'mobx'
import * as yjs from 'yjs'

type MobxReactLite = typeof import('mobx-react-lite') | null
type React = typeof import('react') | null
type ReactDom = typeof import('react-dom') | null
type ReactDomClient = typeof import('react-dom/client') | null
type ReactJsxRuntime = typeof import('react/jsx-runtime') | null

const mobxReactLite: MobxReactLite = BUNDLE === 'ex' ? require('mobx-react-lite') : null
const react: React = BUNDLE === 'ex' ? require('react') : null
const reactDom: ReactDom = BUNDLE === 'ex' ? require('react-dom') : null
const reactDomClient: ReactDomClient = BUNDLE === 'ex' ? require('react-dom/client') : null
const reactJsxRuntime: ReactJsxRuntime = BUNDLE === 'ex' ? require('react/jsx-runtime') : null

mobx.configure({ enforceActions: 'never' })

export class Libs extends $ex.Unit {
  createLog = createLog
  mobx = mobx
  mobxReactLite = mobxReactLite
  react = react
  reactDom = reactDom
  reactDomClient = reactDomClient
  reactJsxRuntime = reactJsxRuntime
  yjs = yjs
}
