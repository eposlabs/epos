export class EnvUrl extends gl.Unit {
  offscreen() {
    return '/offscreen.html'
  }

  system(params: { type: 'permission' }) {
    return `/system.html?${this.toSearchParams(params)}`
  }

  view(params: { locus: 'popup' | 'sidePanel'; tabId: number; windowId: number }) {
    return `/view.html?${this.toSearchParams(params)}`
  }

  project(params: {
    id: string
    locus: 'popup' | 'sidePanel' | 'background'
    tabId?: number
    windowId?: number
    debug: boolean
  }) {
    return `/project.html?${this.toSearchParams(params)}`
  }

  private toSearchParams(params: Record<string, unknown>) {
    const entries = Object.entries(params).map(([key, value]) => [key, String(value)])
    return new URLSearchParams(entries).toString()
  }
}
