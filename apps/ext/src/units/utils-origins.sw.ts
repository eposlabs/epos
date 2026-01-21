export class UtilsOrigins extends sw.Unit {
  normalize(origins: string[]) {
    return this.$.utils.unique(origins.map(this.normalizeOrigin, this))
  }

  matches(origin: string, testOrigin: string) {
    // Normalize origins
    origin = this.normalizeOrigin(origin)
    testOrigin = this.normalizeOrigin(testOrigin)

    // Handle `<all_urls>`
    if (origin === '<all_urls>') return true
    if (testOrigin === '<all_urls>') return false

    // Create pattern matcher from `origin`
    const matcher = this.$.libs.matchPattern(origin).assertValid()

    // Create URL variants from `testOrigin`:
    // - Treat `*:` protocol as both `http:` and `https:`
    // - Remove path
    const variants = (() => {
      const url = URL.parse(testOrigin.replaceAll('*', 'wildcard--'))
      if (!url) throw new Error(`Invalid origin: '${testOrigin}'`)
      const protocol = url.protocol.replaceAll('wildcard--', '*')
      const host = url.host.replaceAll('wildcard--', '*')
      if (protocol === '*:') return [`http://${host}/`, `https://${host}/`]
      return [`${protocol}//${host}/`]
    })()

    return variants.every(variant => matcher.match(variant))
  }

  private normalizeOrigin(origin: string) {
    if (origin === '<all_urls>') return '<all_urls>'
    const url = URL.parse(origin.replaceAll('*', 'wildcard--'))
    if (!url) throw new Error(`Invalid origin: '${origin}'`)
    const protocol = url.protocol.replaceAll('wildcard--', '*')
    const host = url.host.replaceAll('wildcard--', '*')
    return `${protocol}//${host}/*`
  }
}
