export class Dev extends $os.Unit {
  async init() {
    if (!import.meta.env.DEV) return
  }
}
