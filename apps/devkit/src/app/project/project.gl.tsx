import { parseEposSpec, type Spec } from 'epos-spec-parser'

export type Bundle = {
  dev: boolean
  spec: Spec
  sources: Record<string, string>
  assets: Record<string, Blob>
}

export class Project extends gl.Unit {
  id = this.$.utils.id()
  handleId: string
  name: string | null = null
  spec: Spec | null = null
  updatedAt: number | null = null
  fs = new gl.ProjectFs(this)

  /** Root project dir handle. */
  declare handle: FileSystemDirectoryHandle | null
  declare private engine: any
  declare private updateTimer: number | undefined
  declare state: { error: string | null }

  constructor(parent: gl.Unit, handleId: string) {
    super(parent)
    this.handleId = handleId
  }

  async init() {
    this.handle = null
    this.engine = (epos as any).engine
    this.updateTimer = undefined
    this.state = epos.state.local({ error: null })

    const q = new this.$.utils.Queue()
    this.update = q.wrap(this.update, this)

    // Project's handle was removed from IDB? -> Remove project itself
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('devkit', 'handles', this.handleId)
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
    this.fs.startObserver()
  }

  updateWithDelay() {
    self.clearTimeout(this.updateTimer)
    this.updateTimer = self.setTimeout(() => this.update(), 50)
  }

  async export(dev = false) {
    console.log(`📦 [${this.name}] Export`, { dev })
    const blob = await this.engine.bus.send('projects.export', this.name, dev)
    const url = URL.createObjectURL(blob)
    await epos.browser.downloads.download({ url, filename: `${this.name}.zip` })
    URL.revokeObjectURL(url)
  }

  async remove() {
    await this.engine.bus.send('projects.remove', this.name)
    this.$.projects.splice(this.$.projects.indexOf(this), 1)
  }

  private async update() {
    try {
      this.state.error = null
      const startedAt = Date.now()
      const spec = await this.readSpec()

      // Name has been changed? -> Remove project from epos extension
      if (spec.name && this.name !== spec.name) {
        await this.engine.bus.send('projects.remove', this.name)
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
        for (const path of target.load) {
          if (sources[path]) continue
          sources[path] = await this.fs.readFileAsText(path)
        }
      }

      // Prepare & install bundle
      const bundle: Bundle = { dev: true, spec: this.spec, sources, assets }
      await this.engine.bus.send('projects.install', bundle)

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
  // HELPERS
  // ---------------------------------------------------------------------------

  private async readSpec() {
    const [specHandle] = await this.$.utils.safe(() => this.fs.getFileHandle('epos.json'))
    if (!specHandle) throw new Error('epos.json not found')

    const [specFile, fileError] = await this.$.utils.safe(() => specHandle.getFile())
    if (fileError) throw new Error(`Failed to read epos.json: ${fileError.message}`)

    const [specJson, jsonError] = await this.$.utils.safe(() => specFile.text())
    if (jsonError) throw new Error(`Failed to read epos.json: ${jsonError.message}`)

    const [spec, specError] = this.$.utils.safeSync(() => parseEposSpec(specJson))
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
      for (const loadPath of target.load) {
        if (path === loadPath) return true
      }
    }

    return false
  }

  private getTimeString(time: number) {
    const hhmmss = new Date(time).toString().split(' ')[4]
    const ms = new Date(time).getMilliseconds().toString().padStart(3, '0')
    return `${hhmmss}:${ms}`
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
              <div className="mr-3 text-xs text-gray-400">
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
