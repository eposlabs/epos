// TODO: handle when adding pkg with the same name
import { parseManifest } from '@eposlabs/epos-manifest-parser'
import type { Manifest } from '@eposlabs/epos-manifest-parser'

const engine = (epos as any).engine

export class Pkg extends $gl.Unit {
  id = crypto.randomUUID()
  status: null | 'prompt' | 'denied' | 'granted' = null
  name: string | null = null
  error: string | null = null
  manifest: Manifest | null = null
  time: string | null = null
  declare private timeout: number | undefined
  declare private handle: FileSystemDirectoryHandle
  declare private globalObserver: any
  declare private fileObservers: Set<any>

  static async create(parent: $gl.Unit) {
    const $ = parent.$
    const [handle, error] = await $.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (error) return null

    const pkg = new Pkg(parent)
    await $.idb.set('pkg', 'handles', pkg.id, handle)

    return pkg
  }

  async init() {
    // Handle was removed from IDB? -> Remove package
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('pkg', 'handles', this.id)
    if (!handle) {
      console.error('handle not found for', this.name)
      // this.$.pkgs.splice(this.$.pkgs.indexOf(this), 1)
      return
    }

    this.handle = handle
    this.globalObserver = null
    this.fileObservers = new Set()
    this.status = await this.handle.queryPermission({ mode: 'read' })
    this.setupGlobalObserver()
    this.restartFileObservers()
  }

  cleanup() {
    this.stopFileObservers()
    if (this.globalObserver) {
      this.globalObserver.disconnect()
      this.globalObserver = null
    }
  }

  async remove() {
    await engine.bus.send('pack.remove', this.name)
    this.$.pkgs.splice(this.$.pkgs.indexOf(this), 1)
  }

  private setupGlobalObserver() {
    this.globalObserver = new FileSystemObserver(async (records: any[]) => {
      // this.log(`[global] ${record.type}`, path)
      this.restartFileObservers()
      return

      if (this.error) {
        this.restartFileObservers()
        return
      }

      for (const record of records) {
        const path = record.relativePathComponents.join('/')
        if (path === 'epos.json') {
          this.restartFileObservers()
          break
        }
      }
    })

    this.globalObserver.observe(this.handle, { recursive: true })
  }

  private async restartFileObservers() {
    this.stopFileObservers()

    const [manifest, manifestError] = await this.$.utils.safe(() => this.readManifest())
    if (manifestError) {
      this.error = manifestError.message
      return
    }

    this.manifest = manifest
    if (this.name !== manifest.name) await engine.bus.send('pack.remove', this.name)
    this.name = manifest.name ?? null

    const paths = this.getUsedManifestPaths()
    for (const path of paths) {
      const [observer, error] = await this.$.utils.safe(() => this.setupFileObserver(path))
      if (error) {
        this.error = error.message
        this.stopFileObservers()
        return
      }
      this.fileObservers.add(observer)
    }

    this.error = null
    this.install()
  }

  private stopFileObservers() {
    for (const observer of this.fileObservers) observer.disconnect()
    this.fileObservers.clear()
  }

  private async setupFileObserver(path: string) {
    const [handle, error] = await this.$.utils.safe(() => this.getFileHandleByPath(path))
    if (error) throw new Error(`File not found: ${path}`)

    const observer = new FileSystemObserver(async (records: any[]) => {
      for (const record of records) {
        if (path === 'epos.json') continue

        if (record.type === 'disappeared') {
          this.stopFileObservers()
          this.error = `File was deleted: ${path}`
          break
        }

        this.install()
      }
    })
    observer.observe(handle)
    return observer
  }

  private async readFile(path: string) {
    const handle = await this.getFileHandleByPath(path)
    const file = await handle.getFile()
    return new Blob([file], { type: file.type })
  }

  private getUsedManifestPaths() {
    if (!this.manifest) throw new Error('Manifest not loaded')
    const paths = new Set<string>()
    this.manifest.assets.forEach(path => paths.add(path))
    this.manifest.targets.forEach(target => target.load.forEach(path => paths.add(path)))
    return [...paths]
  }

  private async readManifest() {
    const [handle, handleError] = await this.$.utils.safe(() => this.handle.getFileHandle('epos.json'))
    if (handleError) throw new Error('epos.json not found')

    const [file, fileError] = await this.$.utils.safe(() => handle.getFile())
    if (fileError) throw new Error(`Failed to read epos.json: ${fileError.message}`)

    const [json, jsonError] = await this.$.utils.safe(() => file.text())
    if (jsonError) throw new Error(`Failed to read epos.json content: ${jsonError.message}`)

    const [manifest, manifestError] = this.$.utils.safe.sync(() => parseManifest(json))
    if (manifestError) throw new Error(`Failed to parse manifest: ${manifestError.message}`)

    return manifest
  }

  private async getFileHandleByPath(path: string) {
    const parts = path.split('/')
    if (parts.length === 0) throw new Error(`File not found: ${path}`)

    const dirs = parts.slice(0, -1)
    const fileName = parts.at(-1)
    if (!fileName) throw new Error(`File not found: ${path}`)

    let dir: FileSystemDirectoryHandle = this.handle
    for (const dirName of dirs) {
      dir = await dir.getDirectoryHandle(dirName)
    }

    const fileHandle = await dir.getFileHandle(fileName)
    return fileHandle
  }

  private async install() {
    this.time = new Date().toString().split(' ')[4]
    self.clearTimeout(this.timeout)

    this.timeout = self.setTimeout(async () => {
      if (!this.manifest) return

      const assets: Record<string, Blob> = {}
      for (const path of this.manifest.assets) {
        assets[path] = await this.readFile(path)
      }

      const sources: Record<string, string> = {}
      for (const target of this.manifest.targets) {
        for (const path of target.load) {
          if (sources[path]) continue
          const blob = await this.readFile(path)
          sources[path] = await blob.text()
        }
      }

      const spec = {
        dev: true,
        name: this.manifest.name,
        sources: sources,
        manifest: this.manifest,
      }

      await engine.bus.send('pack.install', { spec, assets })
    }, 50)
  }

  async export() {
    const blob = await engine.bus.send('pack.export', this.name)
    const url = URL.createObjectURL(blob)
    await epos.browser.downloads.download({ url, filename: `${this.name}.zip` })
    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  ui() {
    return (
      <div class="group flex flex-col bg-white p-4 dark:bg-black">
        <div class="flex items-center justify-between">
          <div class="">
            {this.error ? '🚫' : '✅'} {this.name ?? 'unknown'}
            {this.time && <span class="ml-3 text-xs text-gray-500">{this.time}</span>}
          </div>
          <div class="flex gap-2">
            {!this.error && (
              <div
                onClick={this.export}
                class="cursor-default px-1 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                [export]
              </div>
            )}
            <div
              onClick={this.remove}
              class="cursor-default px-1 py-0.5 hover:bg-red-200 dark:hover:bg-red-800"
            >
              [remove]
            </div>
          </div>
        </div>
        {this.error && (
          <div class="mt-4 bg-red-100 p-2.5 px-3 text-pretty text-gray-800 dark:bg-red-900 dark:text-white">
            {this.error}
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static versioner: any = {
    12() {
      this.time = null
      delete this.lastChanges
      delete this.lastChange
    },
  }
}
