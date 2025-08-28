import type { PkgData } from './pkg.sw'

export class PkgExporter extends $sw.Unit {
  private $pkg = this.up($sw.Pkg)!

  async export() {
    const zip = new this.$.libs.Zip()

    const engineFiles = [
      'vw.css',
      'cs.js',
      'ex-mini.js',
      'ex.js',
      'os.js',
      'sw.js',
      'vw.js',
      'frame.html',
      'offscreen.html',
      'view.html',
    ]

    for (const path of engineFiles) {
      const blob = await fetch(`/${path}`).then(r => r.blob())
      zip.file(path, blob)
    }

    const pkg = await this.$.idb.get<PkgData>(this.$pkg.name, ':pkg', ':default')
    if (!pkg) throw this.never
    pkg.dev = false
    zip.file('pkg.json', JSON.stringify(pkg, null, 2))

    const assets: Record<string, Blob> = {}
    const paths = await this.$.idb.keys(this.$pkg.name, ':assets')
    for (const path of paths) {
      const blob = await this.$.idb.get<Blob>(this.$pkg.name, ':assets', path)
      if (!blob) throw this.never
      assets[path] = blob
      zip.file(`assets/${path}`, blob)
    }

    const icon = pkg.manifest.icon ? assets[pkg.manifest.icon] : await fetch('/icon.png').then(r => r.blob())
    const icon128 = await this.$.utils.convertImage(icon, {
      type: 'image/png',
      quality: 1,
      cover: true,
      size: 128,
    })
    zip.file('icon.png', icon128)

    const manifest = await fetch('/manifest.json').then(r => r.json())
    const runItems = this.$pkg.bundles.flatMap(bundle => bundle.run)
    const hasPanel = runItems.includes('<panel>')
    const hub = this.$.env.url.hub(false)

    const urls = runItems
      .map(run => {
        if (['<popup>', '<panel>', '<background>'].includes(run)) return null
        if (run.startsWith('<hub>')) return run.replace('<hub>', `${hub}/${pkg.name}`)
        return run
      })
      .filter(this.$.is.present)
      .filter(this.$.utils.unique.filter)

    const totalManifest = {
      ...manifest,
      name: pkg.manifest.title ?? pkg.manifest.name,
      action: {
        default_title: pkg.manifest.title ?? pkg.manifest.name,
      },
      // host_permissions: [...urls].sort(),
      // permissions: [
      //   'alarms',
      //   'declarativeNetRequest',
      //   'offscreen',
      //   'scripting',
      //   hasPanel ? 'sidePanel' : null,
      //   'tabs',
      //   'unlimitedStorage',
      //   'webNavigation',
      // ].filter(Boolean),
    }

    zip.file('manifest.json', JSON.stringify(totalManifest, null, 2))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = await this.$.bus.send<string>('utils.createObjectUrl', blob)
    await this.$.browser.downloads.download({ url, filename: `${this.$pkg.name}.zip` })
    await this.$.bus.send('utils.revokeObjectUrl', url)
  }
}
