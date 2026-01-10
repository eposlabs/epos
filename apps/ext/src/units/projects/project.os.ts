import type { ProjectInfo } from './project.sw'

export type Attrs = Record<string, string | number>
export type Frame = { id: string; url: string }

export class Project extends os.Unit {
  id: ProjectInfo['id']
  mode: ProjectInfo['mode']
  spec: ProjectInfo['spec']
  hash: ProjectInfo['hash']
  bus: ReturnType<gl.Bus['use']>

  constructor(parent: os.Unit, params: Pick<ProjectInfo, 'id' | 'mode' | 'spec' | 'hash'>) {
    super(parent)
    this.id = params.id
    this.mode = params.mode
    this.spec = params.spec
    this.hash = params.hash
    this.bus = this.$.bus.use(`Project[${this.id}]`)
    if (this.hash) this.createBackground()

    this.bus.on('getFrames', this.getFrames, this)
    this.bus.on('createFrame', this.createFrame, this)
    this.bus.on('removeFrame', this.removeFrame, this)
  }

  update(updates: Pick<ProjectInfo, 'mode' | 'spec' | 'hash'>) {
    // Hash changed? -> Reload Background frame
    if (this.hash !== updates.hash) {
      if (!this.hasBackground()) {
        this.createBackground()
      } else {
        this.reloadBackground()
      }
    }

    this.mode = updates.mode
    this.spec = updates.spec
    this.hash = updates.hash
  }

  dispose() {
    this.bus.off()
    this.removeAllFrames()
    this.removeBackground()
  }

  // ---------------------------------------------------------------------------
  // BACKGROUND MANAGEMENT
  // ---------------------------------------------------------------------------

  private createBackground() {
    // Already exists? -> Ignore
    if (this.hasBackground()) return

    // Create background iframe
    const iframe = document.createElement('iframe')
    iframe.name = this.spec.name
    iframe.setAttribute('data-type', 'background')
    iframe.setAttribute('data-project-id', this.id)
    iframe.src = this.getBackgroundUrl()
    document.body.append(iframe)

    // Log info
    const title = `<background> started`
    const subtitle = `listed in the context dropdown as '${this.spec.name}'`
    this.info({ title, subtitle })
  }

  private reloadBackground() {
    // No background iframe? -> Ignore
    const iframe = this.getBackground()
    if (!iframe) return

    // Reload iframe
    iframe.src = this.getBackgroundUrl()

    // Log info
    this.info({ title: `<background> restarted` })
  }

  private removeBackground() {
    // No background iframe? -> Ignore
    const iframe = this.getBackground()
    if (!iframe) return

    // Remove iframe
    iframe.remove()

    // Log info
    this.info({ title: `<background> stopped` })
  }

  private hasBackground() {
    return !!this.getBackground()
  }

  private getBackground() {
    const selector = `iframe[data-type="background"][data-project-id="${this.id}"]`
    return document.querySelector<HTMLIFrameElement>(selector)
  }

  private getBackgroundUrl() {
    return this.$.env.url.project({ id: this.id, locus: 'background', mode: this.mode })
  }

  // ---------------------------------------------------------------------------
  // FRAMES MANAGEMENT
  // ---------------------------------------------------------------------------

  private getFrames(): Frame[] {
    const selector = `iframe[data-type="frame"][data-project-id="${this.id}"]`
    const iframes = [...document.querySelectorAll<HTMLIFrameElement>(selector)]

    return iframes.map(iframe => {
      const frameId = iframe.getAttribute('data-frame-id')
      if (!frameId) throw this.never()
      return { id: frameId, url: iframe.src }
    })
  }

  private async createFrame(url: string, attrs: Attrs = {}) {
    const id = this.generateFrameId(url)

    // Remove `X-Frame-Options` header for the iframe's url
    const ruleId = await this.$.bus.send<sw.Net['addRule']>('Net.addRule', {
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
      'name': `${this.spec.name}:${id}`,
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
    const title = `Frame created: '${id}' ${url}`
    const subtitle = `Listed in the context dropdown as '${this.spec.name}:${id}'`
    this.info({ title, subtitle })

    return id
  }

  private removeFrame(id: string) {
    // No iframe? -> Ignore
    const selector = `iframe[data-type="frame"][data-project-id="${this.id}"][data-frame-id="${id}"]`
    const iframe = document.querySelector<HTMLIFrameElement>(selector)
    if (!iframe) return

    // Remove network rule
    const ruleId = Number(iframe.getAttribute('data-net-rule-id'))
    void this.$.bus.send<sw.Net['removeRule']>('Net.removeRule', ruleId)

    // Remove iframe
    iframe.remove()

    // Log info
    const title = `Frame removed: '${id}'`
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
    if (url) return this.$.utils.id()
    // const frames = this.getFrames()
    // while (true) {
    //   const domain = new URL(url).host.split('.').at(-2)
    //   const exists = this.hasFrame(domain!)
    // }
    return this.$.utils.id()
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private info(params: { title: string; subtitle?: string }) {
    if (this.mode !== 'development') return
    this.$.utils.info({
      ...params,
      color: this.$.utils.colorHash(this.id),
      label: this.spec.name,
      timestamp: true,
    })
  }
}
