export class Dev extends $gl.Unit {
  static async create(parent: $gl.Unit) {
    const dev = new Dev(parent)
    await dev.init()
    return dev
  }

  async init() {
    if (!import.meta.env.DEV) return
  }
}
