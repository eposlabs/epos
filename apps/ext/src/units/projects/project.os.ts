import type { Info } from './project.sw'

export type Attrs = Record<string, string | number>
export type Frame = { name: string; url: string }

export class Project extends os.Unit {
  id: Info['id']
  spec: Info['spec']
  mode: Info['mode']
  hash: Info['hash']
  bus: ReturnType<gl.Bus['create']>

  constructor(parent: os.Unit, info: Pick<Info, 'id' | 'spec' | 'mode' | 'hash'>) {
    super(parent)
    this.id = info.id
    this.spec = info.spec
    this.mode = info.mode
    this.hash = info.hash
    this.bus = this.$.bus.create(`Project[${this.id}]`)
    if (this.hash) this.startBackground()

    this.bus.on('getFrames', this.getFrames, this)
    this.bus.on('openFrame', this.openFrame, this)
    this.bus.on('closeFrame', this.closeFrame, this)
  }

  update(info: Pick<Info, 'spec' | 'mode' | 'hash'>) {
    // Hash changed? -> Reload Background frame
    if (this.hash !== info.hash) {
      if (!this.hasBackground()) {
        this.startBackground()
      } else {
        this.restartBackground()
      }
    }

    this.spec = info.spec
    this.mode = info.mode
    this.hash = info.hash
  }

  dispose() {
    this.bus.dispose()
    this.closeAllFrames()
    this.removeBackground()
  }

  // ---------------------------------------------------------------------------
  // BACKGROUND MANAGEMENT
  // ---------------------------------------------------------------------------

  private startBackground() {
    // Already exists? -> Ignore
    if (this.hasBackground()) return

    // Create iframe
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

  private restartBackground() {
    // No iframe? -> Ignore
    const iframe = this.getBackground()
    if (!iframe) return

    // Reload iframe
    iframe.src = this.getBackgroundUrl()

    // Log info
    this.info({ title: `<background> restarted` })
  }

  private removeBackground() {
    // No iframe? -> Ignore
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
      const name = iframe.getAttribute('data-frame-name')
      if (!name) throw this.never()
      return { name, url: iframe.src }
    })
  }

  private async openFrame(name: string, url: string, attrs?: Attrs) {
    // Frame already exists? -> Close it
    const exists = this.hasFrame(name)
    if (exists) this.closeFrame(name, true)

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
      'name': `${this.spec.name}:${name}`,
      'data-type': 'frame',
      'data-project-id': this.id,
      'data-frame-name': name,
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
    const namePrefix = this.getNamePrefix(name)
    if (exists) {
      const title = `${namePrefix}frame reloaded ${url}`
      this.info({ title })
    } else {
      const title = `${namePrefix}frame opened ${url}`
      const subtitle = `listed in the context dropdown as '${this.spec.name}:${name}'`
      this.info({ title, subtitle })
    }
  }

  private closeFrame(name: string, noInfo = false) {
    // No iframe? -> Ignore
    const selector = `iframe[data-type="frame"][data-project-id="${this.id}"][data-frame-name="${name}"]`
    const iframe = document.querySelector<HTMLIFrameElement>(selector)
    if (!iframe) return

    // Remove network rule
    const ruleId = Number(iframe.getAttribute('data-net-rule-id'))
    void this.$.bus.send<sw.Net['removeRule']>('Net.removeRule', ruleId)

    // Remove iframe
    iframe.remove()

    // Log info
    if (noInfo) return
    const namePrefix = this.getNamePrefix(name)
    this.info({ title: `${namePrefix}frame closed` })
  }

  private closeAllFrames() {
    const selector = `iframe[data-type="frame"][data-project-id="${this.id}"]`
    const iframes = document.querySelectorAll<HTMLIFrameElement>(selector)

    for (const iframe of iframes) {
      const name = iframe.getAttribute('data-frame-name')
      if (!name) throw this.never()
      this.closeFrame(name)
    }
  }

  private hasFrame(name: string) {
    const selector = `iframe[data-type="frame"][data-project-id="${this.id}"][data-frame-name="${name}"]`
    return !!document.querySelector<HTMLIFrameElement>(selector)
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

  private getNamePrefix(name: string) {
    if (name === '[frame]') return ''
    return `'${name}' `
  }
}
