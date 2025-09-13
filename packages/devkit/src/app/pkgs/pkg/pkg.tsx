export class Pkg extends $gl.Unit {
  id: string

  constructor() {
    super()
    this.id = this.$.utils.uuid()
  }

  static async create($: $gl.App) {
    const [handle, error] = await $.utils.safe(() => self.showDirectoryPicker({ mode: 'readwrite' }))
    if (error) return null

    const pkg = new Pkg()
    await $.idb.set('pkgs', 'handles', pkg.id, handle)
    return pkg
  }
}
