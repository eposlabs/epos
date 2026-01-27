import type { Rpc } from 'epos'
import type { Entry } from './project.sw'

export type Attrs = Record<string, string | number>
export type Frame = { id: string; url: string }

export class Project extends os.Unit {
  id: Entry['id']
  debug: Entry['debug']
  spec: Entry['spec']
  hash: Entry['hash']
  sw: Rpc<sw.Project>

  constructor(parent: os.Unit, params: Pick<Entry, 'id' | 'debug' | 'spec' | 'hash'>) {
    super(parent)
    this.id = params.id
    this.debug = params.debug
    this.spec = params.spec
    this.hash = params.hash
    this.sw = this.$.bus.use<sw.Project>(`Project[${this.id}][sw]`)
    this.$.bus.register(`Project[${this.id}][os]`, this)
    if (this.hash) this.createBackground()
  }

  update(updates: Pick<Entry, 'debug' | 'spec' | 'hash'>) {
    const hash1 = this.hash
    const hash2 = updates.hash
    const slug1 = this.spec.slug
    const slug2 = updates.spec.slug

    this.debug = updates.debug
    this.spec = updates.spec
    this.hash = updates.hash

    // Hash changed? -> Update background
    if (hash1 !== hash2) {
      if (!hash2) {
        this.removeBackground()
      } else if (this.hasBackground()) {
        // Slug changed? -> Recreate background instead of just reloading.
        // Why? Changing iframe's `name` does not change it in the context dropdown.
        // Why not always recreate? If user has the context selected, recreating will unselect the context.
        this.reloadBackground(slug1 !== slug2)
      } else {
        this.createBackground()
      }
    }
  }

  dispose() {
    this.$.bus.unregister(`Project[${this.id}][os]`)
    this.removeAllFrames()
    this.removeBackground()
  }

  // MARK: Background
  // ============================================================================

  private createBackground(silent = false) {
    // Already exists? -> Ignore
    if (this.hasBackground()) return

    // Create background iframe
    const iframe = document.createElement('iframe')
    iframe.name = this.spec.slug
    iframe.setAttribute('data-type', 'background')
    iframe.setAttribute('data-project-id', this.id)
    iframe.src = this.getBackgroundUrl()
    document.body.append(iframe)

    // Log info
    if (silent) return
    const title = `<background> started`
    const subtitle = `Listed in the context dropdown as '${this.spec.slug}'`
    this.info({ title, subtitle })
  }

  private reloadBackground(force = false) {
    if (force) {
      this.removeBackground(true)
      this.createBackground(true)
    } else {
      // No background iframe? -> Ignore
      const iframe = this.getBackground()
      if (!iframe) return

      // Reload iframe
      iframe.src = this.getBackgroundUrl()
    }

    // Log info
    const title = `<background> restarted`
    this.info({ title })
  }

  private removeBackground(silent = false) {
    // No background iframe? -> Ignore
    const iframe = this.getBackground()
    if (!iframe) return

    // Remove iframe
    iframe.remove()

    // Log info
    if (silent) return
    const title = `<background> stopped`
    this.info({ title })
  }

  private hasBackground() {
    return !!this.getBackground()
  }

  private getBackground() {
    const selector = `iframe[data-type="background"][data-project-id="${this.id}"]`
    return document.querySelector<HTMLIFrameElement>(selector)
  }

  private getBackgroundUrl() {
    return this.$.env.url.project({ id: this.id, locus: 'background', debug: this.debug })
  }

  // MARK: Frames
  // ============================================================================

  getFrames(): Frame[] {
    const selector = `iframe[data-type="frame"][data-project-id="${this.id}"]`
    const iframes = [...document.querySelectorAll<HTMLIFrameElement>(selector)]

    return iframes.map(iframe => {
      const frameId = iframe.getAttribute('data-frame-id')
      if (!frameId) throw this.never()
      return { id: frameId, url: iframe.src }
    })
  }

  async createFrame(url: string, attrs: Attrs = {}) {
    const id = this.generateFrameId(url)

    // Remove `X-Frame-Options` header for the iframe's domain
    const ruleId = await this.sw.addSystemRule({
      condition: {
        // Allow for the whole domain to support redirects (example.com -> www.example.com)
        requestDomains: [new URL(url).hostname],
        resourceTypes: ['sub_frame'],
      },
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{ header: 'X-Frame-Options', operation: 'remove' }],
      },
    })
    if (!ruleId) throw this.never()

    // Prepare iframe attributes
    attrs = {
      'name': `${this.spec.slug}:${id}`,
      'data-type': 'frame',
      'data-project-id': this.id,
      'data-frame-id': id,
      'data-net-rule-id': ruleId,
      'src': url,
      ...attrs,
      'width': screen.availWidth,
      'height': screen.availHeight,
      'referrerpolicy': 'unsafe-url',
      'allow': `fullscreen; geolocation; microphone; camera; clipboard-read; clipboard-write; autoplay; payment; usb; accelerometer; gyroscope; magnetometer; midi; encrypted-media; picture-in-picture; display-capture; screen-wake-lock; gamepad; xr-spatial-tracking`,
      'sandbox': `allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation`,
    }

    // Create iframe
    const iframe = document.createElement('iframe')
    Object.entries(attrs).forEach(([key, value]) => iframe.setAttribute(key, String(value)))
    document.body.append(iframe)

    // Log info
    const title = `Frame created: ${url}`
    const subtitle = `Listed in the context dropdown as '${this.spec.slug}:${id}'`
    this.info({ title, subtitle })

    return id
  }

  removeFrame(id: string) {
    // No iframe? -> Ignore
    const selector = `iframe[data-type="frame"][data-project-id="${this.id}"][data-frame-id="${id}"]`
    const iframe = document.querySelector<HTMLIFrameElement>(selector)
    if (!iframe) return

    // Remove network rule
    const ruleId = Number(iframe.getAttribute('data-net-rule-id'))
    void this.sw.removeSystemRule(ruleId)

    // Remove iframe
    iframe.remove()

    // Log info
    const title = `Frame removed: ${iframe.src}`
    this.info({ title })
  }

  private removeAllFrames() {
    const selector = `iframe[data-type="frame"][data-project-id="${this.id}"]`
    const iframes = document.querySelectorAll<HTMLIFrameElement>(selector)

    for (const iframe of iframes) {
      const frameId = iframe.getAttribute('data-frame-id')
      if (!frameId) throw this.never()
      this.removeFrame(frameId)
    }
  }

  private generateFrameId(url: string): string {
    let id: string
    let index = 1
    const frames = this.getFrames()
    const hostnameParts = new URL(url).hostname.split('.')
    const domain = hostnameParts.length === 1 ? hostnameParts[0] : hostnameParts.at(-2)
    if (!domain) throw this.never()

    while (true) {
      id = `${domain}${index > 1 ? `-${index}` : ''}`
      const exists = frames.find(frame => frame.id === id)
      if (!exists) return id
      index += 1
    }
  }

  // MARK: Helpers
  // ============================================================================

  private info(params: { title: string; subtitle?: string }) {
    if (!this.debug) return
    this.$.utils.info({
      ...params,
      color: this.$.utils.colorHash(this.id),
      label: this.spec.slug,
      timestamp: true,
    })
  }
}
