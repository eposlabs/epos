/// <reference types="rolldown-vite/client" />
import type { Epos } from 'epos'
import type { Config } from 'epos-spec'
import type * as types from 'dropcap/types'

declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
  type Url = string

  type ProjectDef = {
    name: string
    shadowCss: string
    config: Config
    fn: (epos: Epos) => void
  }

  var BUNDLE: 'cs' | 'ex' | 'ex-mini' | 'os' | 'sm' | 'sw' | 'vw'

  /** App instance for `cs`, `os`, `sw` and `vw`. */
  var $: any

  /** App instance for `ex`, dev-only. */
  var $epos: any

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
    eject: any
  }
}
