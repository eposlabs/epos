/// <reference types="rolldown-vite/client" />
import type * as types from 'dropcap/types'
import type { Epos, ProjectMode, ProjectSpec } from 'epos'

declare global {
  var DEV: boolean
  var PROD: boolean
  var BUNDLE: 'cs' | 'ex' | 'ex-mini' | 'os' | 'sm' | 'sw' | 'vw'

  // App instance for `cs`, `os`, `sw` and `vw`
  var $: any

  // App instance for `ex`, dev-only
  var $epos: any

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
    mode: ProjectMode
    spec: ProjectSpec
    shadowCss: string
    fn: (epos: PartialEpos) => void
  }

  interface ImportMetaEnv {
    readonly REBUNDLE_PORT: number
  }

  interface Node {
    epos?: boolean
  }

  interface Window {
    // Global variables injected to pages and frames
    __eposIsTop?: boolean
    __eposTabId?: number | null
    __eposElement?: Element
    __eposTabBusToken?: string | null
    __eposProjectDefs?: ProjectDef[]
    __eposOriginalGlobals?: Record<string, unknown>

    // Global methods for `sw`
    install: any
    remove: any
  }
}
