import type { ProjectFull } from 'epos'

export class ProjectExporter extends gl.Unit {
  get $project() {
    return this.closest(gl.Project)!
  }

  private async prepareEngineFiles(project: ProjectFull) {
    // const data = await epos.projects.export(project.id)

    const engineFiles = [
      '/cs.js',
      '/ex-mini.prod.js',
      '/ex.prod.js',
      '/os.js',
      '/sw.js',
      '/vw.css',
      '/vw.js',
      '/view.html',
      '/system.html',
      '/project.html',
      '/offscreen.html',
      ...(project.mode === 'development' ? ['/ex-mini.dev.js', '/ex.dev.js'] : []),
    ]
    // :
    for (const path of engineFiles) {
      const blob = await fetch(epos.browser.runtime.getURL(path)).then(res => res.blob())
      files[path] = blob
    }
  }

  async export(asDev = false) {
    const project = await epos.projects.get(this.$project.id, { sources: true, assets: true })
    if (!project) throw this.never()

    const files: Record<string, Blob> = {}

    const engineFiles = this.prepareEngineFiles(project)

    // Add engine files
    const engineFiles = [
      '/cs.js',
      '/ex-mini.prod.js',
      '/ex.prod.js',
      '/os.js',
      '/sw.js',
      '/vw.css',
      '/vw.js',
      '/view.html',
      '/system.html',
      '/project.html',
      '/offscreen.html',
      ...(asDev ? ['/ex-mini.dev.js', '/ex.dev.js'] : []),
    ]
    // :
    for (const path of engineFiles) {
      const blob = await fetch(epos.browser.runtime.getURL(path)).then(res => res.blob())
      files[path] = blob
    }

    // Add `project.json`
    const projectJsonData = {
      env: asDev ? 'development' : 'production',
      spec: project.spec,
      sources: project.sources,
    }
    // :
    const projectJson = JSON.stringify(projectJsonData, null, 2)
    files['project.json'] = new Blob([projectJson], { type: 'application/json' })

    // Add assets
    for (const [path, blob] of Object.entries(project.assets)) {
      files[`assets/${path}`] = blob
    }

    // Add icon
    const icon = project.spec.icon
      ? project.assets[project.spec.icon]
      : await fetch(epos.browser.runtime.getURL('/icon.png')).then(res => res.blob())
    if (!icon) throw this.never()
    files['icon.png'] = icon

    const matchPatterns = new Set<string>()
    for (const target of project.spec.targets) {
      for (const match of target.matches) {
        if (match.context === 'locus') continue
        matchPatterns.add(match.value)
      }
    }

    if (matchPatterns.has('<all_urls>')) {
      matchPatterns.clear()
      matchPatterns.add('<all_urls>')
    }

    const engineManifestText = await fetch(epos.browser.runtime.getURL('/manifest.json')).then(res => res.text())
    const engineManifestJson = this.$.libs.stripJsonComments(engineManifestText)
    const [engineManifest, error] = this.$.utils.safeSync(() => JSON.parse(engineManifestJson))
    if (error) throw error
    const manifest = {
      ...engineManifest,
      name: project.spec.name,
      version: project.spec.version,
      description: project.spec.description ?? '',
      action: { default_title: project.spec.name },
      host_permissions: [...matchPatterns],
      // ...(bundle.spec.manifest ?? {}),
    }

    // const mandatoryPermissions = [
    //   'alarms',
    //   'declarativeNetRequest',
    //   'offscreen',
    //   'scripting',
    //   'tabs',
    //   'unlimitedStorage',
    //   'webNavigation',
    // ]
    // const permissions = new Set<string>(manifest.permissions ?? [])
    // for (const perm of mandatoryPermissions) permissions.add(perm)
    // manifest.permissions = [...permissions].sort()

    files['manifest.json'] = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })

    return await this.generateZip(files)

    // const blob = await this.generateZip({
    //   '/hello.txt': new Blob(['Hello, world!'], { type: 'text/plain' }),
    // })
    // const link = document.createElement('a')
    // link.href = URL.createObjectURL(blob)
    // link.download = 'my_archive.zip'
    // link.click()
    // URL.revokeObjectURL(link.href)

    // console.log(`📦 [${this.name}] Export`, { asDev })
    // const blob = await this.zip(asDev)
    // const url = URL.createObjectURL(blob as any as Blob)
    // await epos.browser.downloads.download({ url, filename: `${this.name}.zip` })
    // URL.revokeObjectURL(url)
  }

  private async generateZip(files: Record<string, Blob>) {
    const data: Record<string, Uint8Array> = {}

    for (const [path, content] of Object.entries(files)) {
      const arrayBuffer = await content.arrayBuffer()
      data[path] = new Uint8Array(arrayBuffer)
    }

    return await new Promise<Blob>((resolve, reject) => {
      this.$.libs.fflate.zip(data, (error, output) => {
        if (error) {
          reject(error)
        } else {
          const blob = new Blob([output as BlobPart], { type: 'application/zip' })
          resolve(blob)
        }
      })
    })
  }
}
