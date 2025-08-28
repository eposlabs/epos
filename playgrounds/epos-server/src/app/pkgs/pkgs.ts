export class Pkgs extends $gl.Unit {
  map: { [path: string]: $gl.Pkg } = {}
  private MAX_FILES = 10_000

  constructor(parent: $gl.Unit) {
    super(parent)

    const q = this.$.utils.queue(this)
    this.createPkg = q(this.createPkg)
    this.removePkg = q(this.removePkg)
  }

  get list() {
    return Object.values(this.map)
  }

  get(name: string) {
    return Object.values(this.map).find(pkg => pkg.manifest?.name === name) ?? null
  }

  async setup() {
    await this.scan()
    await this.watch()
  }

  private async scan() {
    const ignore = ['**/node_modules/**']
    const stream = this.$.libs.globbyStream(this.$.root, { ignore })

    let count = 0
    for await (const path of stream) {
      if (typeof path !== 'string') continue

      // Manifest found? -> Create pkg
      if (this.isManifest(path)) {
        await this.createPkg(path)
      }

      // Check for too many files in root directory
      count += 1
      if (count > this.MAX_FILES) {
        console.error(`Too many files in ${this.$.root}. Select another directory.`)
        process.exit(1)
      }
    }
  }

  private async watch() {
    await this.$.utils.watch(this.$.root, async events => {
      for (const event of events) {
        // Skip non-manifest changes
        if (!this.isManifest(event.path)) continue

        // Create pkg when manifest is created
        if (event.type === 'create') {
          await this.createPkg(event.path)
        }

        // Remove pkg when manifest is deleted
        else if (event.type === 'delete') {
          await this.removePkg(event.path)
        }
      }
    })
  }

  private createPkg = async (manifestPath: string) => {
    if (this.map[manifestPath]) return
    this.map[manifestPath] = await $gl.Pkg.create(this, manifestPath)
  }

  private removePkg = async (manifestPath: string) => {
    if (!this.map[manifestPath]) return
    await this.map[manifestPath].cleanup()
    delete this.map[manifestPath]
  }

  private isManifest(path: string) {
    return this.$.libs.path.basename(path) === 'epos.json'
  }
}
