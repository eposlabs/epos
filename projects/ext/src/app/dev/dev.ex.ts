export class Dev extends $ex.Unit {
  async init() {
    if (!import.meta.env.DEV) return
  }
}
