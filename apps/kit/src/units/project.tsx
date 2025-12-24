import type { Bundle } from 'epos'
import type { Spec } from 'epos-spec'

export class Project extends gl.Unit {
  id = this.$.utils.id()
  handleId: string
  name: string | null = null
  spec: Spec | null = null
  updatedAt: number | null = null
  fs = new gl.ProjectFs(this)

  /** Root project dir handle. */
  declare handle: FileSystemDirectoryHandle | null
  declare private observer: FileSystemObserver | null
  declare private updateTimer: number | undefined
  declare state: { error: string | null }
  declare bundle: Bundle | null

  constructor(parent: gl.Unit, handleId: string) {
    super(parent)
    this.handleId = handleId
  }

  async init() {
    this.bundle = null
    this.handle = null
    this.observer = null
    this.updateTimer = undefined
    this.state = epos.state.local({ error: null })

    // Perform updates in a queue
    const q = new this.$.utils.Queue()
    this.update = q.wrap(this.update, this)

    // Project's handle was removed from IDB? -> Remove project itself
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('kit', 'handles', this.handleId)
    if (!handle) {
      this.remove()
      return
    }

    // Check handle permission
    // TODO: handle different browser settings
    const status = await handle.queryPermission({ mode: 'read' })
    if (status !== 'granted') {
      this.state.error = 'Enable file access in the browser'
      return
    }

    this.handle = handle
    this.startObserver()
    await this.update()
  }

  dispose() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }

  async export(asDev = false) {
    console.log(`📦 [${this.name}] Export`, { asDev })
    const blob = await this.createZip(asDev)
    console.warn({ blob })
    const url = URL.createObjectURL(blob)
    await epos.browser.downloads.download({ url, filename: `${this.name}.zip` })
    URL.revokeObjectURL(url)
  }

  async remove() {
    if (this.name) await epos.installer.remove(this.name)
    this.$.projects.splice(this.$.projects.indexOf(this), 1)
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  private updateWithDelay() {
    self.clearTimeout(this.updateTimer)
    this.updateTimer = self.setTimeout(() => this.update(), 50)
  }

  private async update() {
    try {
      this.state.error = null
      const startedAt = Date.now()
      const spec = await this.readSpec()

      // Name has been changed? -> Remove project from epos extension
      if (spec.name && this.name && this.name !== spec.name) {
        await epos.installer.remove(this.name)
      }

      // Update spec and name
      this.spec = spec
      this.name = spec.name ?? null

      // Read assets
      const assets: Record<string, Blob> = {}
      for (const path of this.spec.assets) {
        assets[path] = await this.fs.readFile(path)
      }

      // Read sources
      const sources: Record<string, string> = {}
      for (const target of this.spec.targets) {
        for (const resource of target.resources) {
          if (sources[resource.path]) continue
          sources[resource.path] = await this.fs.readFileAsText(resource.path)
        }
      }

      // Prepare & install bundle
      const bundle: Bundle = { mode: 'development', spec: this.spec, sources, assets }
      this.bundle = bundle
      await epos.installer.install(bundle)

      // Done
      this.updatedAt = Date.now()
      const time = this.updatedAt - startedAt
      console.log(
        `✅ [${this.name}] Updated in ${time}ms %c| ${this.getTimeString(this.updatedAt)}`,
        'color: gray',
      )
    } catch (e) {
      this.state.error = this.$.utils.is.error(e) ? e.message : String(e)
      this.updatedAt = Date.now()
      console.error(`⛔ [${this.name}] Failed to update`, e)
    }
  }

  // ---------------------------------------------------------------------------
  // OBSERVER
  // ---------------------------------------------------------------------------

  private startObserver() {
    this.observer = new FileSystemObserver(records => {
      if (this.state.error) {
        this.updateWithDelay()
        return
      }

      for (const record of records) {
        const path = record.relativePathComponents.join('/')
        if (this.usesPath(path)) {
          this.updateWithDelay()
          return
        }
      }
    })

    if (!this.handle) throw this.never()
    this.observer.observe(this.handle, { recursive: true })
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private async readSpec() {
    const [specHandle] = await this.$.utils.safe(() => this.fs.getFileHandle('epos.json'))
    if (!specHandle) throw new Error('epos.json not found')

    const [specFile, fileError] = await this.$.utils.safe(() => specHandle.getFile())
    if (fileError) throw new Error(`Failed to read epos.json: ${fileError.message}`)

    const [specJson, jsonError] = await this.$.utils.safe(() => specFile.text())
    if (jsonError) throw new Error(`Failed to read epos.json: ${jsonError.message}`)

    const [spec, specError] = this.$.utils.safeSync(() => this.$.libs.parseSpec(specJson))
    if (specError) throw new Error(`Failed to parse epos.json: ${specError.message}`)

    return spec
  }

  usesPath(path: string) {
    if (path === 'epos.json') return true
    if (!this.spec) return false

    for (const assetPath of this.spec.assets) {
      if (path === assetPath) return true
    }

    for (const target of this.spec.targets) {
      for (const resource of target.resources) {
        if (path === resource.path) return true
      }
    }

    return false
  }

  private getTimeString(time: number) {
    const hhmmss = new Date(time).toString().split(' ')[4]
    const ms = new Date(time).getMilliseconds().toString().padStart(3, '0')
    return `${hhmmss}:${ms}`
  }

  /** Create standalone extension ZIP file out of the project. */
  private async createZip(asDev = false) {
    const bundle = this.bundle
    if (!bundle) throw new Error('Project is not loaded yet')
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
      'system.html',
      'project.html',
      'offscreen.html',
      ...(asDev ? ['ex-mini.dev.js', 'ex.dev.js'] : []),
    ]

    for (const path of engineFiles) {
      const blob = await fetch(epos.browser.runtime.getURL(`/${path}`)).then(r => r.blob())
      zip.file(path, blob)
    }

    zip.file(
      'project.json',
      JSON.stringify(
        {
          env: asDev ? 'development' : 'production',
          spec: bundle.spec,
          sources: bundle.sources,
        },
        null,
        2,
      ),
    )

    const assets = bundle.assets
    for (const path in assets) {
      const blob = assets[path]
      if (!blob) throw this.never()
      zip.file(`assets/${path}`, blob)
    }

    const icon = bundle.spec.icon
      ? assets[bundle.spec.icon]
      : await fetch(epos.browser.runtime.getURL('/icon.png')).then(r => r.blob())
    if (!icon) throw this.never()
    zip.file('icon.png', icon)

    const matchPatterns = new Set<string>()
    for (const target of bundle.spec.targets) {
      for (let match of target.matches) {
        if (match.context === 'locus') continue
        matchPatterns.add(match.value)
      }
    }

    if (matchPatterns.has('<all_urls>')) {
      matchPatterns.clear()
      matchPatterns.add('<all_urls>')
    }

    const engineManifestText = await fetch(epos.browser.runtime.getURL('/manifest.json')).then(r => r.text())
    const engineManifestJson = this.$.libs.stripJsonComments(engineManifestText)
    const [engineManifest, error] = this.$.utils.safeSync(() => JSON.parse(engineManifestJson))
    if (error) throw error

    const manifest = {
      ...engineManifest,
      name: bundle.spec.title ?? bundle.spec.name,
      version: bundle.spec.version,
      description: bundle.spec.description ?? '',
      action: { default_title: bundle.spec.title ?? bundle.spec.name },
      host_permissions: [...matchPatterns],
      // ...(bundle.spec.manifest ?? {}),
    }

    console.log(JSON.stringify(manifest, null, 2))

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

    // zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    // return await zip.generateAsync({ type: 'blob' })
  }

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View() {
    return (
      <div className="flex flex-col bg-white p-4 dark:bg-black">
        <div className="flex items-center justify-between gap-4">
          {/* Name */}
          <div className="text-nowrap">
            {this.state.error ? '🚫' : '✅'} {this.name ?? 'unknown'}
          </div>

          {/* Right controls */}
          <div className="flex items-baseline gap-3">
            {this.updatedAt && (
              <div className="mr-2 text-xs text-gray-400">
                Updated at {this.getTimeString(this.updatedAt)}
              </div>
            )}
            {!this.state.error && <this.$.ui.Button label="EXPORT" onClick={e => this.export(e.shiftKey)} />}
            <this.$.ui.Button label="UPDATE" onClick={this.update} />
            <this.$.ui.Button label="REMOVE" onClick={this.remove} />
          </div>
        </div>

        {/* Error */}
        {this.state.error && (
          <div className="mt-4 bg-red-100 p-2.5 px-3 text-pretty text-gray-800 dark:bg-red-900 dark:text-white">
            {this.state.error}
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static versioner: any = {
    1() {
      delete this.time
      this.updatedAt = null
    },
    2() {
      this.watcher = {}
    },
    3() {
      delete this.watcher
    },
    4() {
      this.updating = false
    },
    5() {
      delete this.updating
    },
    6() {
      this.fs = new gl.ProjectFs(this)
    },
    7() {
      this.updatedAt = this.lastUpdatedAt
      delete this.lastUpdatedAt
    },
  }
}
