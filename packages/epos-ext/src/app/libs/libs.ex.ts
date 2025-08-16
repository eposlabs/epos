import { createLog } from 'dropcap/utils'
import * as mobx from 'mobx'
import * as nanoid from 'nanoid'
import * as yjs from 'yjs'

type MobxReactLite = typeof import('mobx-react-lite') | null
type React = typeof import('react') | null
type ReactDom = typeof import('react-dom') | null
type ReactDomClient = typeof import('react-dom/client') | null
type ReactJsxRuntime = typeof import('react/jsx-runtime') | null

const mobxReactLite: MobxReactLite = EX_MINI ? null : require('mobx-react-lite')
const react: React = EX_MINI ? null : require('react')
const reactDom: ReactDom = EX_MINI ? null : require('react-dom')
const reactDomClient: ReactDomClient = EX_MINI ? null : require('react-dom/client')
const reactJsxRuntime: ReactJsxRuntime = EX_MINI ? null : require('react/jsx-runtime')

mobx.configure({ enforceActions: 'never' })

export class Libs extends $ex.Unit {
  createLog = createLog
  mobx = mobx
  mobxReactLite = mobxReactLite
  nanoid = nanoid
  react = react
  reactDom = reactDom
  reactDomClient = reactDomClient
  reactJsxRuntime = reactJsxRuntime
  yjs = yjs
}
