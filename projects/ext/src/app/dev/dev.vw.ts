export class Dev extends $vw.Unit {
  async init() {
    if (!import.meta.env.DEV) return
  }
}
