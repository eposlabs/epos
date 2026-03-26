import type { Locus } from 'epos/spec'

export class EnvUrl extends gl.Unit {
  offscreen() {
    return '/offscreen.html'
  }

  permission() {
    return '/permission.html'
  }

  view(params: {
    locus: StrictExtract<Locus, 'page' | 'popup' | 'sidePanel'>
    id?: string // project id, used for `page` locus
    tabId?: number // not required for `page`
    windowId?: number // not required for `page`
  }) {
    if (params.locus === 'page' && (params.tabId || params.windowId)) throw this.never()
    if (params.locus !== 'page' && (!params.tabId || !params.windowId)) throw this.never()
    return `/view.html?${this.toSearchParams(params)}`
  }

  project(params: { id: string; locus: Locus; debug: boolean; tabId?: number; windowId?: number }) {
    if (params.locus === 'background' && (params.tabId || params.windowId)) throw this.never()
    if (params.locus !== 'background' && (!params.tabId || !params.windowId)) throw this.never()
    return `/project.html?${this.toSearchParams(params)}`
  }

  private toSearchParams(params: Record<string, unknown>) {
    const entries = Object.entries(params)
      .filter(([, value]) => this.$.utils.is.present(value) && value !== false)
      .map(([key, value]) => [key, String(value)])
    return new URLSearchParams(entries).toString()
  }
}
