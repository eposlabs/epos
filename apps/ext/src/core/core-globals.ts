/// <reference types="rolldown-vite/client" />
import type * as types from '@eposlabs/utils/types'
import type { CsReadyData } from '../app/app.cs'

declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
}

type ProjectDef = {
  name: string
  icon: string | null
  title: string | null
  shadowCss: string
  fn: (epos: Obj) => void
}

declare global {
  interface ImportMetaEnv {
    readonly REBUNDLE_PORT: number
  }

  var BUNDLE: 'cs' | 'ex' | 'ex-mini' | 'os' | 'sm' | 'sw' | 'vw'

  // Global variables injected to `ex`
  var __eposIsTop: boolean
  var __eposOriginalGlobals: Record<string, unknown>
  var __eposElement: HTMLElement
  var __eposTabId: number | null
  var __eposBusToken: string | null
  var __eposProjectDefs: ProjectDef[]
  var __eposInjected: boolean

  // Ready flag for `cs`
  var __eposCsReady$: PromiseWithResolvers<CsReadyData>

  // App instance for `cs`, `os`, `sw` and `vw`
  var $: any

  // App instance for `ex`, dev-only
  var $epos: any

  // Global methods for `sw`
  var add: any
  var remove: any
  var eject: any
  var install: any

  interface Node {
    epos?: boolean
  }
}
