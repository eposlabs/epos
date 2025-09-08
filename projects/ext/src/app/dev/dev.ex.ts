export class Dev extends $ex.Unit {
  static async create(parent: $ex.Unit) {
    const dev = new Dev(parent)
    await dev.init()
    return dev
  }

  async init() {
    if (!import.meta.env.DEV) return
  }
}
