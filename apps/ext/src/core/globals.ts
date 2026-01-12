/// <reference types="rolldown-vite/client" />
import type * as types from 'dropcap/types'
import type { Epos, Mode, Spec } from 'epos'

declare global {
  var DEV: boolean
  var PROD: boolean
  var BUNDLE: 'cs' | 'ex' | 'ex-mini' | 'os' | 'sm' | 'sw' | 'vw'

  // App instance for `cs`, `os`, `sw` and `vw`
  var $: any

  // App instance for `ex`, dev-only
  var $epos: any

  // Global methods for `sw`
  var install: any
  var remove: any

  type Obj<T = unknown> = types.Obj<T>
  type Arr<T = unknown> = types.Arr<T>
  type Cls<T = unknown> = types.Cls<T>
  type Fn<T = unknown> = types.Fn<T>
  type AsyncFn<T = unknown> = types.AsyncFn<T>
  type Url = string

  type PartialEpos = Omit<Epos, 'projects' | 'engine'> & {
    projects?: Epos['projects']
    engine?: Epos['engine']
  }

  type ProjectDef = {
    id: string
    mode: Mode
    spec: Spec
    shadowCss: string
    fn: (epos: PartialEpos) => void
  }

  interface Node {
    epos?: boolean
  }

  // Global variables injected to pages and frames
  interface Window {
    __eposIsTop?: boolean
    __eposTabId?: number | null
    __eposElement?: Element
    __eposTabBusToken?: string | null
    __eposProjectDefs?: ProjectDef[]
    __eposOriginalGlobals?: Record<string, unknown>
  }
}
