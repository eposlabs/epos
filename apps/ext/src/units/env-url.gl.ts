import type { ProjectMode } from 'epos'

export class EnvUrl extends gl.Unit {
  offscreen() {
    return '/epos/offscreen.html'
  }

  system(params: { type: 'permission' }) {
    return `/epos/system.html?${this.toSearchParams(params)}`
  }

  view(params: { locus: 'popup' | 'sidePanel'; tabId: number }) {
    return `/epos/view.html?${this.toSearchParams(params)}`
  }

  project(params: {
    id: string
    locus: 'popup' | 'sidePanel' | 'background'
    tabId?: number
    mode: ProjectMode
  }) {
    return `/epos/project.html?${this.toSearchParams(params)}`
  }

  private toSearchParams(params: Record<string, unknown>) {
    const entries = Object.entries(params).map(([key, value]) => [key, String(value)])
    return new URLSearchParams(entries).toString()
  }
}
