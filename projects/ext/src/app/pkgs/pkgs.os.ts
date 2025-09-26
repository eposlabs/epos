import type { Rule } from '../net/net.sw'

export class Pkgs extends $os.Unit {
  map: { [name: string]: $os.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  static async create(parent: $os.Unit) {
    const pkgs = new Pkgs(parent)
    await pkgs.init()
    return pkgs
  }

  private async init() {
    await this.initWatcher()
    this.initPkgFrames()
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      // Update packages
      for (const meta of Object.values(data.execution)) {
        const pkg = this.map[meta.name]
        if (!pkg) continue
        pkg.update(meta)
      }

      // Add packages
      for (const name of delta.added) {
        const meta = data.execution[name]
        if (!meta) throw this.never
        this.map[name] = new $os.Pkg(this, meta)
      }

      // Remove packages
      for (const name of delta.removed) {
        const pkg = this.map[name]
        if (!pkg) throw this.never
        pkg.removeFrame()
        delete this.map[name]
      }
    })
  }

  private initPkgFrames() {
    this.$.bus.on('pkgs.createPkgFrame', this.createPkgFrame, this)
    this.$.bus.on('pkgs.removePkgFrame', this.removePkgFrame, this)
    this.$.bus.on('pkgs.removeAllPkgFrames', this.removeAllPkgFrames, this)
    this.$.bus.on('pkgs.getPkgFrames', this.getPkgFrames, this)
  }

  private async createPkgFrame(
    pkgName: string,
    frameName: string,
    url: string,
    attrs: Record<string, unknown> = {},
  ) {
    await this.removePkgFrame(pkgName, frameName)

    const ruleId = await this.$.bus.send('net.addSessionRule', {
      condition: {
        requestDomains: [new URL(url).host],
        resourceTypes: ['sub_frame'],
      },
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{ header: 'X-Frame-Options', operation: 'remove' }],
      },
    } satisfies Rule)

    attrs = {
      'width': screen.availWidth,
      'height': screen.availHeight,
      'referrerpolicy': 'unsafe-url',
      'allow': `fullscreen; geolocation; microphone; camera; clipboard-read; clipboard-write; autoplay; payment; usb; accelerometer; gyroscope; magnetometer; midi; encrypted-media; picture-in-picture; display-capture; screen-wake-lock; gamepad; xr-spatial-tracking`,
      'sandbox': `allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation`,
      ...attrs,
      'name': `${pkgName}:${frameName}`,
      'data-name': frameName,
      'data-package': pkgName,
      'data-rule-id': ruleId,
      'src': url,
    }

    const frame = document.createElement('iframe')
    for (const name in attrs) frame.setAttribute(name, String(attrs[name]))
    document.body.append(frame)
  }

  private async removePkgFrame(pkgName: string, frameName: string) {
    const frame = document.querySelector(`iframe[data-package="${pkgName}"][data-name="${frameName}"]`)
    if (!frame) return
    const ruleId = Number(frame.getAttribute('data-rule-id'))
    await this.$.bus.send('net.removeSessionRule', ruleId)
    frame.remove()
  }

  private async removeAllPkgFrames(pkgName: string) {
    const frames = this.getPkgFrames(pkgName)
    for (const frame of frames) await this.removePkgFrame(pkgName, frame.name)
  }

  private getPkgFrames(pkgName: string) {
    const frames = document.querySelectorAll<HTMLIFrameElement>(`iframe[data-package="${pkgName}"]`)
    return [...frames].map(frame => ({ name: frame.getAttribute('data-name')!, url: frame.src }))
  }
}
