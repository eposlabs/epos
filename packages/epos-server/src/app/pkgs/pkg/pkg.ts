import type { AsyncSubscription, Event } from '@parcel/watcher'
import type { Manifest } from 'epos-types'

export class Pkg extends $gl.Unit {
  manifest: Manifest | null = null
  private dir: string
  private manifestPath: string
  private watcher: AsyncSubscription | null = null
  private parser = new $gl.PkgParser(this)

  static async create(parent: $gl.Unit, manifestPath: string) {
    const pkg = new Pkg(parent, manifestPath)
    await pkg.setup()
    return pkg
  }

  constructor(parent: $gl.Unit, manifestPath: string) {
    super(parent)
    this.dir = this.$.libs.path.dirname(manifestPath)
    this.manifestPath = manifestPath

    const q = this.$.utils.queue(this)
    this.onChanges = q(this.onChanges)
  }

  async read(path: string) {
    // epos.json? -> Return manifest
    if (path === 'epos.json') {
      return {
        content: JSON.stringify(this.manifest, null, 2),
        type: 'application/json',
      }
    }

    // File not used? -> Return null
    path = this.resolve(path)
    if (!this.uses(path)) return null

    // Read file
    const content = await this.$.utils.readFile(path)
    if (!content) return null

    // Return file
    return {
      content: content,
      type: this.$.utils.getMimeType(path),
    }
  }

  async cleanup() {
    if (!this.watcher) throw this.never
    await this.watcher.unsubscribe()

    if (!this.manifest) return
    const x = this.$.libs.chalk.red('✘')
    console.log(`${x} ${this.manifest.name}`)
  }

  private async setup() {
    await this.update()
    this.watcher = await this.$.utils.watch(this.dir, this.onChanges)
  }

  private async update(trigger?: string) {
    try {
      const manifest = await this.readManifest()
      const v = this.$.libs.chalk.green('✔')
      const suffix = trigger ? ` ${this.$.libs.chalk.dim(trigger)}` : ''
      console.log(`${v} ${manifest.name}${suffix}`)
      this.$.host.broadcast({ name: manifest.name })
      this.manifest = manifest
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const x = this.$.libs.chalk.red('✘')
      const left = this.$.libs.chalk.red('[')
      const right = this.$.libs.chalk.red(']')
      const ERROR = this.$.libs.chalk.bgRed.whiteBright(`${left}ERROR${right}`)
      const path = this.$.libs.chalk.underline(this.manifestPath)
      const pointer = this.$.libs.chalk.red('└')
      console.log(`${x} ${ERROR} ${path}`)
      console.log(pointer, message)
      this.manifest = null
    }
  }

  private async readManifest() {
    // Read and parse epos.json
    const text = await this.$.libs.fs.readFile(this.manifestPath, 'utf-8')
    const json = this.$.libs.stripJsonComments(text)
    const data = JSON.parse(json)
    const manifest = await this.parser.parseManifest(data, this.dir)

    // Check for duplicate package names
    for (const pkg of this.$.pkgs.list) {
      if (pkg === this) continue
      if (!pkg.manifest) continue
      if (pkg.manifest.name !== manifest.name) continue
      throw new Error(`Package with name '${manifest.name}' already exists`)
    }

    return manifest
  }

  private async onChanges(events: Event[]) {
    if (!this.manifest) {
      await this.update()
      return
    }

    for (const event of events) {
      if (event.type === 'update' && event.path === this.manifestPath) {
        await this.update(event.path)
        return
      }

      if (this.uses(event.path)) {
        await this.update(event.path)
        return
      }
    }
  }

  private uses(path: string) {
    if (!this.manifest) return false

    path = this.resolve(path)

    for (const asset of this.manifest.assets) {
      if (path !== this.resolve(asset)) continue
      return true
    }

    for (const bundle of this.manifest.bundles) {
      for (const src of bundle.src) {
        if (path !== this.resolve(src)) continue
        return true
      }
    }

    return false
  }

  private resolve(path: string) {
    return this.$.libs.path.resolve(this.dir, path)
  }
}
