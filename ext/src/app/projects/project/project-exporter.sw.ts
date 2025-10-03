import type { BundleNoStatic } from './project.sw'

export class ProjectExporter extends sw.Unit {
  private $project = this.up(sw.Project)!

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

    if (this.$project.name === 'devkit') {
      engineFiles.push('ex.dev.js', 'ex-mini.dev.js')
    }

    for (const path of engineFiles) {
      const blob = await fetch(`/${path}`).then(r => r.blob())
      zip.file(path, blob)
    }

    const bundle: BundleNoStatic = {
      dev: false,
      spec: this.$project.spec,
      sources: this.$project.sources,
    }
    zip.file('project.json', JSON.stringify(bundle, null, 2))

    const staticFiles: Record<string, Blob> = {}
    const paths = await this.$.idb.keys(this.$project.name, ':static')
    for (const path of paths) {
      const blob = await this.$.idb.get<Blob>(this.$project.name, ':static', path)
      if (!blob) throw this.never
      staticFiles[path] = blob
      zip.file(`static/${path}`, blob)
    }

    const icon = bundle.spec.icon
      ? staticFiles[bundle.spec.icon]
      : await fetch('/icon.png').then(r => r.blob())
    const icon128 = await this.$.utils.convertImage(icon, {
      type: 'image/png',
      quality: 1,
      cover: true,
      size: 128,
    })
    zip.file('icon.png', icon128)

    const urlFilters = new Set<string>()
    for (const target of this.$project.targets) {
      for (let pattern of target.matches) {
        if (pattern.startsWith('!')) continue
        if (pattern.startsWith('frame:')) pattern = pattern.replace('frame:', '')
        if (pattern === '<popup>') continue
        if (pattern === '<sidePanel>') continue
        if (pattern === '<background>') continue
        if (pattern === '<hub>') pattern = `${this.$.env.url.web}/@${this.$project.name}/*`
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
      name: this.$project.spec.title ?? this.$project.spec.name,
      version: this.$project.spec.version,
      action: { default_title: this.$project.spec.title ?? this.$project.spec.name },
      ...(this.$project.spec.manifest ?? {}),
    }

    zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    return await zip.generateAsync({ type: 'blob' })
  }
}
