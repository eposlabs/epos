export class Dev extends $cs.Unit {
  async init() {
    if (!import.meta.env.DEV) return
  }
}
