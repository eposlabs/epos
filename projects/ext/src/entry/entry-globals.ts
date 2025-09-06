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
  type EposVar = {
    element: HTMLElement
    globals: Record<string, unknown>
    tabId: number | null
    busToken: string | null
    defs: PkgDef[]
  }

  interface Node {
    epos?: boolean
    moveBefore(movedNode: Node, referenceNode: Node | null): void
  }

  var esbuildRequire: typeof require

  // Global constants injected via vite.config.ts
  var BUNDLE: 'cs' | 'ex' | 'ex-mini' | 'os' | 'sm' | 'sw' | 'vw'
  var EX_MINI: boolean

  // App instance for CS, OS, SW and VW
  var $: any

  // App instance for EX, dev-only
  var $epos: any

  // Global epos variable for EX
  var __epos: EposVar

  // Ready flag for CS
  var __eposCsReady$: PromiseWithResolvers<CsReadyData> | undefined

  // Global methods for SW
  var add: any
  var remove: any
  var eject: any
}
