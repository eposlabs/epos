import type { Info } from './project.sw'

export type Attrs = Record<string, string | number>
export type Frame = { name: string; url: string }

export class Project extends os.Unit {
  id: Info['id']
  name: Info['name']
  mode: Info['mode']
  hash: Info['hash']
  bus: ReturnType<gl.Bus['create']>

  /** Prefix used for frame names. */
  private get prefix() {
    return `${this.id}:`
  }

  constructor(parent: os.Unit, info: Pick<Info, 'id' | 'name' | 'mode' | 'hash'>) {
    super(parent)
    this.id = info.id
    this.name = info.name
    this.mode = info.mode
    this.hash = info.hash
    this.bus = this.$.bus.create(`Project[${this.id}]`)
    if (this.hash) this.startBackground()

    this.bus.on('getFrames', this.getFrames, this)
    this.bus.on('openFrame', this.openFrame, this)
    this.bus.on('closeFrame', this.closeFrame, this)
  }

  update(info: Pick<Info, 'name' | 'mode' | 'hash'>) {
    // Hash changed? -> Reload <background> frame
    if (this.hash !== info.hash) {
      if (!this.hasBackground()) {
        this.startBackground()
      } else {
        this.restartBackground()
      }
    }

    this.name = info.name
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
    iframe.name = this.id
    iframe.src = this.getBackgroundUrl()
    document.body.append(iframe)

    // Log info
    const message = `Started <background> process`
    const details = `Select '${this.id}' from the DevTools context dropdown to switch to it`
    this.info(message, details)
  }

  private restartBackground() {
    // No iframe? -> Ignore
    const iframe = this.getBackground()
    if (!iframe) return

    // Reload iframe
    iframe.src = this.getBackgroundUrl()

    // Log info
    this.info(`Restarted <background> process`)
  }

  private removeBackground() {
    // No iframe? -> Ignore
    const iframe = this.getBackground()
    if (!iframe) return

    // Remove iframe
    iframe.remove()

    // Log info
    this.info(`Stopped <background> process`)
  }

  private hasBackground() {
    return !!this.getBackground()
  }

  private getBackground() {
    return document.querySelector<HTMLIFrameElement>(`iframe[name="${this.id}"]`)
  }

  private getBackgroundUrl() {
    return this.$.env.url.project({ id: this.id, locus: 'background', mode: this.mode })
  }

  // ---------------------------------------------------------------------------
  // FRAMES MANAGEMENT
  // ---------------------------------------------------------------------------

  private getFrames(): Frame[] {
    const iframes = [...document.querySelectorAll<HTMLIFrameElement>(`iframe[name^="${this.prefix}"]`)]

    return iframes.map(iframe => ({
      name: iframe.name.replace(this.prefix, ''),
      url: iframe.src,
    }))
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
      'name': `${this.prefix}${name}`,
      'src': url,
      'data-net-rule-id': ruleId,
      'width': screen.availWidth,
      'height': screen.availHeight,
      'referrerpolicy': 'unsafe-url',
      'allow': `fullscreen; geolocation; microphone; camera; clipboard-read; clipboard-write; autoplay; payment; usb; accelerometer; gyroscope; magnetometer; midi; encrypted-media; picture-in-picture; display-capture; screen-wake-lock; gamepad; xr-spatial-tracking`,
      'sandbox': `allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation`,
      ...this.$.utils.without(attrs ?? {}, ['name', 'src', 'data-net-rule-id']),
    }

    // Create iframe
    const iframe = document.createElement('iframe')
    Object.entries(attrs).forEach(([key, value]) => iframe.setAttribute(key, String(value)))
    document.body.append(iframe)

    // Log info
    const nameSuffix = this.getNameSuffix(name)
    const message = !exists ? `Opened${nameSuffix} frame ${url}` : `Reopened${nameSuffix} frame ${url}`
    this.info(message)
  }

  private closeFrame(name: string, noInfo = false) {
    // No iframe? -> Ignore
    const iframe = document.querySelector<HTMLIFrameElement>(`iframe[name="${this.prefix}${name}"]`)
    if (!iframe) return

    // Remove network rule
    const ruleId = Number(iframe.getAttribute('data-net-rule-id'))
    void this.$.bus.send<sw.Net['removeRule']>('Net.removeRule', ruleId)

    // Remove iframe
    iframe.remove()

    // Log info
    if (noInfo) return
    const nameSuffix = this.getNameSuffix(name)
    this.info(`Closed${nameSuffix} frame`)
  }

  private closeAllFrames() {
    const iframes = document.querySelectorAll<HTMLIFrameElement>(`iframe[name^="${this.prefix}"]`)

    for (const iframe of iframes) {
      const name = iframe.name.replace(this.prefix, '')
      this.closeFrame(name)
    }
  }

  private hasFrame(name: string) {
    return !!document.querySelector<HTMLIFrameElement>(`iframe[name="${this.prefix}${name}"]`)
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private info(message: string, details?: string) {
    if (this.mode !== 'development') return
    this.$.utils.info(message, { label: this.name, timestamp: true, details })
  }

  private getNameSuffix(name: string) {
    if (name === '<frame>') return ''
    return ` '${name}'`
  }
}
