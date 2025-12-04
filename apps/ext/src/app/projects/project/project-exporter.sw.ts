import type { BundleNoAssets } from './project.sw'

export class ProjectExporter extends sw.Unit {
  private $project = this.closest(sw.Project)!

  async export(dev = false) {
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

    if (dev) {
      engineFiles.push('ex.dev.js', 'ex-mini.dev.js')
    }

    for (const path of engineFiles) {
      const blob = await fetch(`/${path}`).then(r => r.blob())
      zip.file(path, blob)
    }

    const bundle: BundleNoAssets = {
      dev: dev,
      spec: this.$project.spec,
      sources: this.$project.sources,
    }
    zip.file('project.json', JSON.stringify(bundle, null, 2))

    const assets: Record<string, Blob> = {}
    const paths = await this.$.idb.keys(this.$project.name, ':assets')
    for (const path of paths) {
      const blob = await this.$.idb.get<Blob>(this.$project.name, ':assets', path)
      if (!blob) throw this.never()
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
    for (const target of this.$project.targets) {
      for (let pattern of target.matches) {
        if (pattern.startsWith('!')) continue
        if (pattern.startsWith('frame:')) pattern = pattern.replace('frame:', '')
        if (pattern === '<popup>') continue
        if (pattern === '<sidePanel>') continue
        if (pattern === '<background>') continue
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
      description: this.$project.spec.description ?? '',
      version: this.$project.spec.version,
      action: { default_title: this.$project.spec.title ?? this.$project.spec.name },
      ...(this.$project.spec.manifest ?? {}),
    }

    const mandatoryPermissions = [
      'alarms',
      'declarativeNetRequest',
      'offscreen',
      'scripting',
      'tabs',
      'unlimitedStorage',
      'webNavigation',
    ]

    const permissions = new Set<string>(manifest.permissions ?? [])
    for (const perm of mandatoryPermissions) permissions.add(perm)
    manifest.permissions = [...permissions].sort()

    zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    return await zip.generateAsync({ type: 'blob' })
  }
}
