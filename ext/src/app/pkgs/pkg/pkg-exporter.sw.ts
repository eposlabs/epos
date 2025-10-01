import type { BundleNoAssets } from './pkg.sw'

export class PkgExporter extends $sw.Unit {
  private $pkg = this.up($sw.Pkg)!

  async export() {
    const zip = new this.$.libs.Zip()

    const engineFiles = [
      'cs.js',
      'ex-mini.js',
      'ex.js',
      'os.js',
      'sw.js',
      'vw.css',
      'vw.js',
      'view.html',
      'frame.html',
      'offscreen.html',
    ]

    if (this.$pkg.name === 'devkit') {
      engineFiles.push('ex.dev.js', 'ex-mini.dev.js')
    }

    for (const path of engineFiles) {
      const blob = await fetch(`/${path}`).then(r => r.blob())
      zip.file(path, blob)
    }

    const bundle: BundleNoAssets = {
      dev: false,
      spec: this.$pkg.spec,
      sources: this.$pkg.sources,
    }
    zip.file('project.json', JSON.stringify(bundle, null, 2))

    const assets: Record<string, Blob> = {}
    const paths = await this.$.idb.keys(this.$pkg.name, ':assets')
    for (const path of paths) {
      const blob = await this.$.idb.get<Blob>(this.$pkg.name, ':assets', path)
      if (!blob) throw this.never
      assets[path] = blob
      zip.file(`assets/${path}`, blob)
    }

    const icon = bundle.spec.icon ? assets[bundle.spec.icon] : await fetch('/icon.png').then(r => r.blob())
    const icon128 = await this.$.utils.convertImage(icon, {
      type: 'image/png',
      quality: 1,
      cover: true,
      size: 128,
    })
    zip.file('icon.png', icon128)

    const urlFilters = new Set<string>()
    for (const target of this.$pkg.targets) {
      for (let pattern of target.matches) {
        if (pattern.startsWith('!')) continue
        if (pattern.startsWith('frame:')) pattern = pattern.replace('frame:', '')
        if (pattern === '<popup>') continue
        if (pattern === '<sidePanel>') continue
        if (pattern === '<background>') continue
        if (pattern === '<hub>') pattern = `${this.$.env.url.web}/@${this.$pkg.name}/*`
        urlFilters.add(pattern)
      }
    }
    if (urlFilters.has('*://*/*')) {
      urlFilters.clear()
      urlFilters.add('*://*/*')
    }

    const engineManifest = await fetch('/manifest.json').then(r => r.json())

    const manifest = {
      ...engineManifest,
      name: this.$pkg.spec.title ?? this.$pkg.spec.name,
      action: { default_title: this.$pkg.spec.title ?? this.$pkg.spec.name },
      ...(this.$pkg.spec.manifest ?? {}),
    }

    zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    return await zip.generateAsync({ type: 'blob' })
  }
}
