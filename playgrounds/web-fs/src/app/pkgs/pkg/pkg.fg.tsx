export class Pkg extends $fg.Unit {
  name: string
  granted = false
  records: any[] = []
  error: string | null = null
  manifest: Obj | null = null
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
    // TODO: need to check prefix, if folder is added, for example, then only folder event is triggered,
    // and we need to update all included files
    const observer = new FileSystemObserver((records: any) => {
      for (const record of records) {
        const data = JSON.parse(JSON.stringify(record))
        const path = record.relativePathComponents.join('/')
        const movedFromPath = record.relativePathMovedFrom?.join('/')
        this.records.push({ ...data })
        $: (self as any).record = record
        if (path === 'epos.json' || movedFromPath === 'epos.json') {
          async: this.updateManifest()
        }
      }
    })
    observer.observe(this.handle, { recursive: true })

    this.updateManifest()
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
      this.manifest = JSON.parse(json)
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
      return
    }

    this.error = null
  }

  ui() {
    return (
      <div class="flex flex-col gap-4">
        {this.error && <div class="bg-red-300">{this.error}</div>}

        {this.manifest && !this.error && (
          <pre class="bg-blue-200">{JSON.stringify(this.manifest, null, 2)}</pre>
        )}

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
