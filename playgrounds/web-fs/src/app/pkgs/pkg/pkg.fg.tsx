import type { Manifest, Popup } from 'epos-types'

export type Src = { [path: string]: string }
export type Assets = { [path: string]: Blob }
export type Fragment = { name: string; hash: string; popup: Popup }

export type PkgData = {
  name: string
  dev: boolean
  src: Src
  manifest: Manifest
  assets?: Assets
}

export class Pkg extends $fg.Unit {
  name: string
  granted = false
  records: any[] = []
  error: string | null = null
  manifest: Manifest | null = null
  parser = new $fg.PkgParser()

  declare handle: FileSystemDirectoryHandle

  static async create($: $fg.App) {
    const promise = self.showDirectoryPicker({ mode: 'readwrite' })
    const [handle, error] = await $.utils.safe(promise)
    if (error) return null

    const pkg = new Pkg(handle.name)
    await $.idb.set(handle.name, handle)
    return pkg
  }

  constructor(name: string) {
    super()
    this.name = name
  }

  async init() {
    this.handle = await this.$.idb.get(this.name)
    const status = await this.handle.queryPermission({ mode: 'readwrite' })
    this.granted = status === 'granted'
    if (this.granted) this.start()
  }

  async request() {
    const status = await this.handle.requestPermission({ mode: 'readwrite' })
    this.granted = status === 'granted'
    if (status === 'denied') alert('Enable in browser')
    if (this.granted) this.start()
  }

  remove() {
    const pkgs = this.up($fg.Pkgs)!
    const index = pkgs.list.indexOf(this)
    if (index === -1) return
    pkgs.list.splice(index, 1)
  }

  async start() {
    // TODO: we need observe only required files/folders. This is much faster then observing the whole directory.
    const observer = new FileSystemObserver(async (records: any) => {
      for (const record of records) {
        const data = JSON.parse(JSON.stringify(record))
        const path = ['dist', ...record.relativePathComponents].join('/')
        const movedFromPath = record.relativePathMovedFrom?.join('/')
        this.records.push({ ...data })
        $: (self as any).record = record
        if (this.uses(path) || path === 'epos.json') {
          await this.updateManifest()
          // location.reload()
        }
      }
    })
    observer.observe(await this.handle.getDirectoryHandle('dist'), { recursive: true })

    {
      try {
        const fh = await this.handle.getFileHandle('epos.json')
        const observer = new FileSystemObserver(async (records: any) => {
          for (const record of records) {
            this.log(record)
          }
        })
        observer.observe(fh)
      } catch (error) {
        console.warn(error)
      }
    }

    // TODO: experiment what happens when observing file handle

    // TODO: need to check prefix, if folder is added, for example, then only folder event is triggered,
    // and we need to update all included files
    // const observer = new FileSystemObserver(async (records: any) => {
    //   for (const record of records) {
    //     const data = JSON.parse(JSON.stringify(record))
    //     const path = record.relativePathComponents.join('/')
    //     const movedFromPath = record.relativePathMovedFrom?.join('/')
    //     this.records.push({ ...data })
    //     $: (self as any).record = record
    //     if (this.uses(path) || path === 'epos.json') {
    //       await this.updateManifest()
    //       location.reload()
    //     }
    //   }
    // })
    // observer.observe(this.handle, { recursive: true })

    this.updateManifest()
  }

  uses(path: string) {
    if (!this.manifest) return false

    for (const asset of this.manifest.assets) {
      if (path !== asset) continue
      return true
    }

    for (const bundle of this.manifest.bundles) {
      for (const src of bundle.src) {
        if (path !== src) continue
        return true
      }
    }

    return false
  }

  async updateManifest() {
    const [h, error] = await this.$.utils.safe(this.handle.getFileHandle('epos.json'))
    if (error) {
      this.error = error instanceof Error ? error.message : String(error)
      return
    }

    const file = await h.getFile()
    const json = await file.text()
    try {
      this.manifest = await this.parser.parseManifest(JSON.parse(json), '')
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
      return
    }

    this.error = null

    const data = await this.updateData()
    await epos.engine.bus.send('pkgs.install', data)
  }

  async updateData() {
    const manifest = this.manifest
    if (!manifest) return

    const dev = true

    // Prepare path resolver
    const resolve = (path: string) => path

    // Fetch all assets
    const assets: { [path: string]: Blob } = {}
    for (const path of manifest.assets) {
      if (assets[path]) continue
      const [blob, error] = await this.$.utils.safe(this.readFile(path))
      if (error) throw new Error(`Failed to read ${path}`)
      assets[path] = blob
    }

    // Fetch all src
    const src: { [path: string]: string } = {}
    for (const bundle of manifest.bundles) {
      for (const path of bundle.src) {
        const [blob, error] = await this.$.utils.safe(this.readFile(path))
        if (error) throw new Error(`Failed to read ${path}`)
        src[path] = (await blob.text()).trim()
      }
    }

    return {
      name: this.name,
      dev,
      src,
      assets,
      manifest: JSON.parse(JSON.stringify(this.manifest)),
    }
  }

  async readFile(path: string) {
    const parts = path.split('/')
    const name = parts.pop()
    if (!name) throw new Error('invalid path')
    const dirs = parts

    let dirHandle = this.handle
    for (const dir of dirs) {
      dirHandle = await dirHandle.getDirectoryHandle(dir)
    }

    const fh = await dirHandle.getFileHandle(name)
    const file = await fh.getFile()
    return new Blob([file], { type: file.type })
  }

  ui() {
    return (
      <div class="flex flex-col gap-4">
        <div class="flex justify-between">
          <div class="flex gap-1">
            {this.granted && <div>✅</div>}
            <div>[{this.name}]</div>
          </div>

          <div class="flex gap-3">
            {!this.granted && (
              <button onClick={() => this.request()} class="bg-amber-300">
                GET ACCESS
              </button>
            )}
            <button onClick={() => this.remove()} class="bg-amber-300">
              REMOVE
            </button>
          </div>
        </div>

        {this.error && <div class="bg-red-300">{this.error}</div>}

        {this.manifest && !this.error && (
          <pre class="bg-blue-200">{JSON.stringify(this.manifest, null, 2)}</pre>
        )}

        <button onClick={() => (this.records = [])} class="bg-amber-300">
          CLEAR RECORDS
        </button>
        <div class="flex flex-col gap-1">
          {this.records.map((record, i) => (
            <div key={i}>{JSON.stringify(record, null, 2)}</div>
          ))}
        </div>
      </div>
    )
  }

  static v = {
    6(this: any) {
      this.parser = new $fg.PkgParser()
    },
    5(this: any) {
      this.manifest = null
    },
    4(this: any) {
      this.error = null
    },
    3(this: any) {
      this.records = []
    },
    2(this: any) {
      this.granted = false
      delete this.status
    },
    1(this: any) {
      this.status = 'denied'
    },
  }
}
