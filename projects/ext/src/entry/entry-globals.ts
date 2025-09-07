import '@eposlabs/utils/globals'
import type { CsReadyData } from '../app/app.cs'

type PkgDef = {
  name: string
  icon: string | null
  title: string | null
  shadowCss: string
  fn: (epos: Obj) => void
}

declare global {
  var BUNDLE: 'cs' | 'ex' | 'ex-mini' | 'os' | 'sm' | 'sw' | 'vw'

  // Global variables injected to [ex]
  var __eposIsTop: boolean
  var __eposGlobals: Record<string, unknown>
  var __eposElement: HTMLElement
  var __eposTabId: number | null
  var __eposBusToken: string | null
  var __eposPkgDefs: PkgDef[]
  var __eposInjected: boolean

  // Ready flag for [cs]
  var __eposCsReady$: PromiseWithResolvers<CsReadyData> | undefined

  // App instance for [cs], [os], [sw] and [vw]
  var $: any

  // App instance for [ex], dev-only
  var $epos: any

  // Global methods for [sw]
  var add: any
  var remove: any
  var eject: any

  interface Node {
    epos?: boolean
  }
}
