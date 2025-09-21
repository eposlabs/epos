// TODO: handle when adding pkg with the same name
import { parseManifest } from '@eposlabs/epos-manifest-parser'

import type { Manifest } from '@eposlabs/epos-manifest-parser'

export class Pkg extends $gl.Unit {
  id = crypto.randomUUID()
  status: null | 'prompt' | 'denied' | 'granted' = null
  name: string | null = null
  error: string | null = null
  manifest: Manifest | null = null
  declare private handle: FileSystemDirectoryHandle
  declare private globalObserver: any
  declare private fileObservers: Set<any>

  static async create(parent: $gl.Unit) {
    const $ = parent.$
    const [handle, error] = await $.utils.safe(() => self.showDirectoryPicker({ mode: 'readwrite' }))
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
    this.status = await this.handle.queryPermission({ mode: 'readwrite' })
    this.setupGlobalObserver()
    this.startFileObservers()
    // await this.readManifestAndSetupFileObservers()
  }

  cleanup() {
    console.warn('stop', this.fileObservers)
    this.stopFileObservers()
    if (this.globalObserver) {
      this.globalObserver.disconnect()
      this.globalObserver = null
    }
  }

  async requestAccess() {
    // this.status = await this.handle.requestPermission({ mode: 'readwrite' })
    // if (this.status === 'granted') {
    //   await this.startWatchers()
    // }
  }

  // Called when DELETE is clicked. Intentionally left empty.
  async remove() {
    await (epos as any).engine.bus.send('pack.remove', this.name)
    this.$.pkgs.splice(this.$.pkgs.indexOf(this), 1)
  }

  private setupGlobalObserver() {
    this.globalObserver = new FileSystemObserver(async (records: any[]) => {
      for (const record of records) {
        const path = record.relativePathComponents.join('/')
        // this.log(`[global] ${record.type}`, path)
        if (path === 'epos.json' || this.error) {
          this.startFileObservers()
        }
      }
    })

    this.globalObserver.observe(this.handle, { recursive: true })
  }

  private async startFileObservers() {
    this.stopFileObservers()

    const [manifest, manifestError] = await this.$.utils.safe(() => this.readManifest())
    if (manifestError) {
      this.error = manifestError.message
      return
    }

    this.manifest = manifest
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
    const [handle, error] = await this.$.utils.safe(() => this.getFileHandleDeep(path))
    if (error) throw new Error(`Required file not found: ${path}`)

    const observer = new FileSystemObserver(async (records: any[]) => {
      for (const record of records) {
        if (path === 'epos.json') {
          this.stopFileObservers()
          this.startFileObservers()
          this.install()
          return
        }

        if (record.type === 'disappeared') {
          this.stopFileObservers()
          this.error = `Required file was deleted: ${path}`
          return
        }

        // this.log(`[file] ${record.type}`, path)
        this.install()
      }
    })
    observer.observe(handle)
    return observer
  }

  private async readFile(path: string) {
    const handle = await this.getFileHandleDeep(path)
    const file = await handle.getFile()
    return new Blob([file], { type: file.type })
  }

  private getUsedManifestPaths() {
    if (!this.manifest) throw new Error('Manifest not loaded')
    const paths = new Set<string>(['epos.json'])
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

  private async getFileHandleDeep(path: string) {
    const parts = path.split('/')
    if (parts.length === 0) throw new Error('empty path')
    const dirs = parts.slice(0, -1)
    const fileName = parts.at(-1)
    if (!fileName) throw new Error('invalid file path')

    let dir: FileSystemDirectoryHandle = this.handle
    for (const dirName of dirs) {
      dir = await dir.getDirectoryHandle(dirName)
    }

    const fileHandle = await dir.getFileHandle(fileName)
    return fileHandle
  }

  private async install() {
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

    const pack = {
      spec: {
        dev: true,
        name: this.manifest.name,
        sources: sources,
        manifest: this.manifest,
      },
      assets: assets,
    }

    await (epos as any).engine.bus.send('pack.install', pack)
  }

  async export() {
    const blob = await (epos as any).engine.bus.send('pack.export', this.name)
    const url = URL.createObjectURL(blob)
    await epos.browser.downloads.download({ url, filename: `${this.name}.zip` })
    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  ui() {
    return (
      <div
        class={[
          'w-[320px]',
          'rounded-xl border bg-white/80 shadow-sm backdrop-blur',
          'border-gray-200',
          'p-4',
          'relative', // added to enable absolute positioning for the DELETE button
          'dark:border-gray-800 dark:bg-gray-900/60',
        ]}
      >
        <button
          class={[
            'absolute top-2 right-2',
            'bg-red-600/20 px-2 py-1 text-xs font-semibold text-red-600 uppercase',
            'rounded hover:text-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none',
          ]}
          onClick={this.remove}
        >
          REMOVE
        </button>

        <div class="flex items-start justify-between">
          <div class="min-w-0">
            <div class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Package</div>
            <div class="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
              {this.name ?? 'Unknown package'}
            </div>
          </div>

          {this.status === 'denied' && (
            <button
              class={[
                'ml-3 inline-flex items-center rounded-md',
                'bg-blue-600 px-3 py-1.5 text-sm font-medium text-white',
                'hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
              ]}
              onClick={this.requestAccess}
            >
              Request access
            </button>
          )}
        </div>

        <div>
          <button onClick={this.export} class="bg-amber-200">
            EXPORT
          </button>
        </div>

        <div class="mt-3">
          {this.error ? (
            <div
              class={[
                'rounded-md border p-3 text-sm',
                'border-red-200 bg-red-50 text-red-700',
                'dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300',
              ]}
            >
              {this.error}
            </div>
          ) : (
            <div
              class={[
                'rounded-md border p-3 text-sm',
                'border-emerald-200 bg-emerald-50 text-emerald-700',
                'dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300',
              ]}
            >
              ✅ Connected
            </div>
          )}
        </div>

        {/* Optional: manifest preview for debugging
        {this.manifest && (
          <pre class="mt-3 max-h-48 overflow-auto rounded-md border border-gray-200 p-2 text-xs dark:border-gray-800">
            {JSON.stringify(this.manifest, null, 2)}
          </pre>
        )} */}
      </div>
    )
  }
}
