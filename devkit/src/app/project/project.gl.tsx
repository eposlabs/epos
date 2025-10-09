// TODO: handle when adding project with the same name
// import type { Bundle } from '@ext/app/projects/project/project.sw'
import { parseEposSpec, type Spec } from 'epos-spec-parser'

export class Project extends gl.Unit {
  id = this.$.utils.id()
  handleId: string
  name: string | null = null
  spec: Spec | null = null
  lastUpdatedAt: number | null = null

  declare private initialized: boolean
  declare private handle: FileSystemDirectoryHandle | null
  declare private fileObservers: Set<FileSystemObserver>
  declare private globalObserver: FileSystemObserver | null
  declare private timeout: number | undefined
  declare private engine: any
  declare private state: { error: string | null }

  constructor(parent: gl.Unit, handleId: string) {
    super(parent)
    this.handleId = handleId
  }

  async init() {
    this.initialized = false
    this.handle = null
    this.fileObservers = new Set()
    this.globalObserver = null
    this.timeout = undefined
    this.engine = (epos as any).engine
    this.state = epos.state.local({ error: null })

    // Project's handle was removed from IDB? -> Remove project itself
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('devkit', 'handles', this.handleId)
    if (!handle) {
      this.remove()
      return
    }

    // Check handle permission
    // TODO: better handle different browser settings
    const status = await handle.queryPermission({ mode: 'read' })
    if (status !== 'granted') {
      this.state.error = 'Enable file access in the browser'
      return
    }

    this.handle = handle
    this.engine = (epos as any).engine
    this.globalObserver = this.createGlobalObserver()
    this.start()
    this.initialized = true
  }

  cleanup() {
    if (!this.initialized) return
    this.stop()
    if (this.globalObserver) {
      this.globalObserver.disconnect()
      this.globalObserver = null
    }
  }

  async remove() {
    await this.engine.bus.send('projects.remove', this.name)
    this.$.projects.splice(this.$.projects.indexOf(this), 1)
  }

  // ---------------------------------------------------------------------------
  // WATCHER
  // ---------------------------------------------------------------------------

  private async start() {
    this.state.error = null

    // Read epos.json spec
    const [spec, specError] = await this.$.utils.safe(() => this.readSpec())
    if (specError) {
      this.state.error = specError.message
      return
    }

    // Name has been changed? -> Remove project from epos extension
    if (this.name !== spec.name) {
      await this.engine.bus.send('projects.remove', this.name)
    }

    // Update spec and name
    this.spec = spec
    this.name = spec.name ?? null

    // Create file observers for all used paths
    const paths = this.getUsedFilePathsFromSpec()
    for (const path of paths) {
      const [observer, error] = await this.$.utils.safe(() => this.createFileObserver(path))
      if (observer) {
        this.fileObservers.add(observer)
      } else {
        this.stop()
        this.state.error = error.message
      }
    }

    // Update project
    this.update()
  }

  private stop() {
    for (const fileObserver of this.fileObservers) fileObserver.disconnect()
    this.fileObservers.clear()
  }

  private async restart() {
    this.stop()
    await this.start()
  }

  private createGlobalObserver() {
    if (!this.handle) throw this.never()

    const globalObserver = new FileSystemObserver(records => {
      for (const record of records) {
        if (record.type === 'modified') {
          // this.log(record.type, record.relativePathComponents.join('/'))
        }
      }

      const specChanged = records.some(record => record.relativePathComponents.join('/') === 'epos.json')
      if (this.state.error || specChanged) {
        async: this.restart()
        return
      }
    })

    globalObserver.observe(this.handle, { recursive: true })
    return globalObserver
  }

  private async createFileObserver(path: string) {
    const [fileHandle] = await this.$.utils.safe(() => this.getFileHandleByPath(path))
    if (!fileHandle) throw new Error(`File not found: ${path}`)

    // TODO: check if content was modified

    const fileObserver = new FileSystemObserver(async records => {
      for (const record of records) {
        // File was removed? -> Stop and show error
        if (record.type === 'disappeared') {
          this.stop()
          this.state.error = `File not found: ${path}`
          break
        }

        // File was modified? -> Update project
        // this.log('modified', path)
        this.update()
      }
    })

    fileObserver.observe(fileHandle)
    return fileObserver
  }

  // ---------------------------------------------------------------------------
  // UPDATE / EXPORT
  // ---------------------------------------------------------------------------

  private async update() {
    // TODO: track what actually changed
    this.lastUpdatedAt = Date.now()

    self.clearTimeout(this.timeout)
    this.timeout = self.setTimeout(async () => {
      if (!this.spec) return

      const staticFiles: Record<string, Blob> = {}
      for (const path of this.spec.static) {
        staticFiles[path] = await this.readFileAsBlob(path)
      }

      const sources: Record<string, string> = {}
      for (const target of this.spec.targets) {
        for (const path of target.load) {
          if (sources[path]) continue
          sources[path] = await this.readFileAsText(path)
        }
      }

      const bundle /* Bundle */ = {
        dev: true,
        spec: this.spec,
        sources: sources,
        staticFiles: staticFiles,
      }

      await this.engine.bus.send('projects.install', bundle)
    }, 100)
  }

  async export() {
    const blob = await this.engine.bus.send('projects.export', this.name)
    const url = URL.createObjectURL(blob)
    await epos.browser.downloads.download({ url, filename: `${this.name}.zip` })
    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private async readFileAsBlob(path: string) {
    const handle = await this.getFileHandleByPath(path)
    const file = await handle.getFile()
    return new Blob([file], { type: file.type })
  }

  private async readFileAsText(path: string) {
    const blob = await this.readFileAsBlob(path)
    return await blob.text()
  }

  private getUsedFilePathsFromSpec() {
    if (!this.spec) throw this.never('epos.json is not loaded')
    const paths = new Set<string>()
    this.spec.static.forEach(path => paths.add(path))
    this.spec.targets.forEach(target => target.load.forEach(path => paths.add(path)))
    return [...paths]
  }

  private async readSpec() {
    const rootDirHandle = this.handle
    if (!rootDirHandle) throw this.never()

    const [specHandle] = await this.$.utils.safe(() => rootDirHandle.getFileHandle('epos.json'))
    if (!specHandle) throw new Error('epos.json not found')

    const [specFile, fileError] = await this.$.utils.safe(() => specHandle.getFile())
    if (fileError) throw new Error(`Failed to read epos.json: ${fileError.message}`)

    const [specJson, jsonError] = await this.$.utils.safe(() => specFile.text())
    if (jsonError) throw new Error(`Failed to read epos.json content: ${jsonError.message}`)

    const [spec, specError] = this.$.utils.safeSync(() => parseEposSpec(specJson))
    if (specError) throw new Error(`Failed to parse epos.json: ${specError.message}`)

    return spec
  }

  private async getFileHandleByPath(path: string) {
    if (!this.handle) throw this.never()

    const pathParts = path.split('/')
    const dirs = pathParts.slice(0, -1)
    const fileName = pathParts.at(-1)
    if (!fileName) throw new Error(`File not found: ${path}`)

    let dirHandle: FileSystemDirectoryHandle = this.handle
    for (const dir of dirs) {
      const [nextDirHandle] = await this.$.utils.safe(dirHandle.getDirectoryHandle(dir))
      if (!nextDirHandle) throw new Error(`File not found: ${path}`)
      dirHandle = nextDirHandle
    }

    const [fileHandle] = await this.$.utils.safe(dirHandle.getFileHandle(fileName))
    if (!fileHandle) throw new Error(`File not found: ${path}`)

    return fileHandle
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  ui() {
    return (
      <div class="flex flex-col bg-white p-4 dark:bg-black">
        <div class="flex items-center justify-between gap-4">
          {/* Name */}
          <div class="text-nowrap">
            {this.state.error ? '🚫' : '✅'} {this.name ?? 'unknown'}
          </div>

          {/* Right controls */}
          <div class="flex items-baseline gap-3">
            {/* Time of the last update */}
            {this.lastUpdatedAt && (
              <div class="mr-3 text-xs text-gray-400">
                Updated at {new Date(this.lastUpdatedAt).toString().split(' ')[4]}
              </div>
            )}

            {/* Export button */}
            {!this.state.error && (
              <div onClick={this.export} class="group relative flex cursor-pointer">
                {/* <div class="absolute inset-0 bg-current opacity-10 blur-[4px] transition not-group-hover:opacity-0 dark:opacity-20" /> */}
                <div class="">[</div>
                <div class="relative">EXPORT</div>
                <div class="">]</div>
              </div>
            )}

            {/* Remove button */}
            <div onClick={this.remove} class="group relative cursor-pointer">
              {/* <div class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-red-500 opacity-50 blur-xs not-group-hover:opacity-0 dark:opacity-80" /> */}
              <span class="">[</span>
              <span class="relative">REMOVE</span>
              <span class="">]</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {this.state.error && (
          <div class="mt-4 bg-red-100 p-2.5 px-3 text-pretty text-gray-800 dark:bg-red-900 dark:text-white">
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
      this.lastUpdatedAt = null
    },
  }
}
