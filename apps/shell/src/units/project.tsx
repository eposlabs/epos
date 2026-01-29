import type { Assets, Manifest, ProjectBase, Sources, Spec } from 'epos'

export class Project extends gl.Unit {
  spec: Spec
  manifest: Manifest
  debug: boolean
  enabled: boolean

  specText: string | null = null
  assetsInfo: Record<string, { size: number }> = {}
  sourcesInfo: Record<string, { size: number }> = {}
  ui = new gl.ProjectUi(this)

  get $projects() {
    return this.closest(gl.Projects)!
  }

  get state() {
    return {
      initialized: false,
      updating: false,
      error: null as Error | null,
      handle: null as FileSystemDirectoryHandle | null,
      observers: [] as FileSystemObserver[],
      activeTab: 'spec' as 'spec' | 'manifest' | 'assets' | 'sources',
      showExportDialog: false,
    }
  }

  get selected() {
    return this.$projects.selectedProjectId === this.id
  }

  get paths() {
    const assetPaths = this.spec.assets
    const resourcePaths = this.spec.targets.flatMap(target => target.resources.map(resource => resource.path))
    return ['epos.json', ...assetPaths, ...resourcePaths]
  }

  constructor(parent: gl.Unit, params: ProjectBase) {
    super(parent)
    this.id = params.id
    this.spec = params.spec
    this.manifest = params.manifest
    this.debug = params.debug
    this.enabled = params.enabled
    console.warn('!', this.$)
  }

  update(updates: Omit<ProjectBase, 'id'>) {
    this.spec = updates.spec
    this.manifest = updates.manifest
    this.debug = updates.debug
    this.enabled = updates.enabled
  }

  async attach() {
    this.hydrate = this.$.utils.enqueue(this.hydrate)
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('epos-shell', 'handles', this.id)
    if (handle) await this.setHandle(handle)
    this.state.initialized = true
  }

  async detach() {
    await this.setHandle(null)
  }

  select() {
    this.$projects.selectedProjectId = this.id
  }

  async toggleEnabled() {
    await epos.projects.update(this.id, { enabled: !this.enabled })
  }

  async toggleDebug() {
    await epos.projects.update(this.id, { debug: !this.debug })
  }

  async remove() {
    await epos.projects.remove(this.id)
  }

  async connectDir() {
    const [handle] = await this.$.utils.safe(() => showDirectoryPicker({ mode: 'read' }))
    if (!handle) return
    await this.setHandle(handle)
  }

  async disconnectDir() {
    await this.setHandle(null)
  }

  private async setHandle(handle: FileSystemDirectoryHandle | null) {
    if (handle) {
      await this.$.idb.set('epos-shell', 'handles', this.id, handle)
      this.state.handle = handle
      await this.hydrate()
      this.observe()
    } else {
      await this.$.idb.delete('epos-shell', 'handles', this.id)
      this.state.handle = null
      this.unobserve()
    }
  }

  private async observe() {
    if (!this.state.handle) return
    if (this.state.observers.length > 0) return

    // Use micro delay to batch multiple changes
    let timer = -1

    for (const path of this.paths) {
      const handle = await this.getFileHandle(path)

      const observer = new FileSystemObserver(() => {
        clearTimeout(timer)
        timer = setTimeout(() => this.hydrate())
      })

      observer.observe(handle)
      this.state.observers.push(observer)
    }
  }

  private unobserve() {
    if (this.state.observers.length === 0) return
    for (const observer of this.state.observers) observer.disconnect()
    this.state.observers = []
  }

  private async hydrate() {
    try {
      this.state.error = null
      this.state.updating = true

      // Read epos.json
      const [specText, readError] = await this.$.utils.safe(() => this.readFileAsText('epos.json'))
      if (readError) throw new Error('Failed to read epos.json', { cause: readError })
      this.specText = specText

      // Parse epos.json
      const [spec, parseError] = this.$.utils.safeSync(() => this.$.libs.parseSpecJson(specText))
      if (parseError) throw new Error('Failed to parse epos.json', { cause: parseError })

      // Read assets
      this.assetsInfo = {}
      const assets: Assets = {}
      for (const path of spec.assets) {
        const file = await this.readFile(path)
        assets[path] = file
        this.assetsInfo[path] = { size: file.size }
      }

      // Read sources
      this.sourcesInfo = {}
      const sources: Sources = {}
      for (const target of spec.targets) {
        for (const resource of target.resources) {
          if (sources[resource.path]) continue
          const file = await this.readFileAsText(resource.path)
          sources[resource.path] = file
          this.sourcesInfo[resource.path] = { size: file.length }
        }
      }

      // Update project
      await epos.projects.update(this.id, { spec, sources, assets })
    } catch (e) {
      this.state.error = this.$.utils.is.error(e) ? e : new Error(String(e))
    } finally {
      this.state.updating = false
    }
  }

  private async readFile(path: string) {
    const handle = await this.getFileHandle(path)
    return await handle.getFile()
  }

  private async readFileAsText(path: string) {
    const file = await this.readFile(path)
    return await file.text()
  }

  private async getFileHandle(path: string) {
    const parts = path.split('/')
    const dirs = parts.slice(0, -1)
    const name = parts.at(-1)
    if (!name) throw this.never()

    // Get dir handle
    if (!this.state.handle) throw new Error('Project directory is not connected')
    let dirHandle = this.state.handle
    for (const dir of dirs) {
      const [nextDirHandle] = await this.$.utils.safe(() => dirHandle.getDirectoryHandle(dir))
      if (!nextDirHandle) throw new Error(`File not found: ${path}`)
      dirHandle = nextDirHandle
    }

    // Get file handle
    const [fileHandle] = await this.$.utils.safe(() => dirHandle.getFileHandle(name))
    if (!fileHandle) throw new Error(`File not found: ${path}`)

    return fileHandle
  }

  async export() {
    const files = await epos.projects.export(this.id)
    const zip = await this.$.utils.zip(files)
    const url = URL.createObjectURL(zip)
    const filename = `${this.spec.slug}-${this.spec.version}.zip`
    await epos.browser.downloads.download({ url, filename })
    URL.revokeObjectURL(url)
  }

  hasUnminifiedSources(): boolean {
    // Check if sources look unminified (have readable structure)
    // Conservative approach: assume sources are unminified if they're readable
    return Object.keys(this.sourcesInfo).length > 0
  }

  View() {
    return <this.ui.View />
  }

  SidebarView() {
    return <this.ui.SidebarView />
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {
    1(this: any) {
      this.fs = {}
      this.handleId = null
    },
    2(this: any) {
      delete this.handleId
      this.handle = null
    },
    4(this: any) {
      delete this.handle
      this.handle = null
    },
    6() {
      this.specText = null
    },
    7() {
      this.assetsInfo = {}
    },
    8() {
      this.sourcesInfo = {}
    },
    9(this: any) {
      this.exporter = {}
    },
    10(this: any) {
      delete this.exporter
    },
    11(this: any) {
      delete this.mode
      this.debug = false
    },
    12(this: any) {
      this.manifest = null
    },
    13() {},
    14() {
      this.ui = new gl.ProjectUi(this)
    },
  }
}
