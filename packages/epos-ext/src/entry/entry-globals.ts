import 'dropcap/types'

declare global {
  type Subset<TSet, TSub extends TSet> = TSub

  type EposExContext = {
    element: HTMLElement
    globals: Record<string, unknown>
    tabId: number | null
    busToken: string | null
    pkgDefs: Array<{
      name: string
      icon: string | null
      title: string | null
      shadowCss: string
      fn: (epos: Obj) => void
    }>
  }

  interface Node {
    epos?: boolean
    moveBefore(movedNode: Node, referenceNode: Node | null): void
  }

  var EX_MINI: boolean

  /** App instance for CS, OS, SW and VW */
  var $: unknown | undefined

  /** App instance for EX, dev-only */
  var $epos: unknown | undefined

  /** Global shared context for EX */
  var __epos: EposExContext

  /** Ready flag for CS */
  var __eposCsReady$: PromiseWithResolvers<{ busToken: string }> | undefined

  /** Global methods for SW */
  var add: any
  var remove: any
  var zip: any
}
